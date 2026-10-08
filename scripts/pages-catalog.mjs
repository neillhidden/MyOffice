import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const PROJECTS_HUB_URL = 'https://neillhidden.github.io/MeusProjetos/';

export const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

/** Each preview has its own storage; neither the main site nor other previews is reset. */
export function previewStorageScript(sha) {
  if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error('Invalid commit SHA');
  return `<script>
(() => {
  const original = window.localStorage;
  const prefix = 'myoffice_preview_${sha}:';
  const keys = () => Array.from({length: original.length}, (_, i) => original.key(i)).filter(key => key && key.startsWith(prefix)).map(key => key.slice(prefix.length));
  const methods = {
    getItem: key => original.getItem(prefix + String(key)),
    setItem: (key, value) => original.setItem(prefix + String(key), String(value)),
    removeItem: key => original.removeItem(prefix + String(key)),
    clear: () => keys().forEach(key => original.removeItem(prefix + key)),
    key: index => keys()[index] ?? null,
  };
  const storage = new Proxy({}, {
    get: (_, key) => key === 'length' ? keys().length : Object.hasOwn(methods, key) ? methods[key] : typeof key === 'string' ? methods.getItem(key) : undefined,
    set: (_, key, value) => { methods.setItem(key, value); return true; },
    deleteProperty: (_, key) => { methods.removeItem(key); return true; },
    ownKeys: keys,
    getOwnPropertyDescriptor: (_, key) => keys().includes(key) ? {configurable: true, enumerable: true, writable: true, value: methods.getItem(key)} : undefined,
  });
  Object.defineProperty(window, 'localStorage', {configurable: true, value: storage});
})();
</script>`;
}

export function navigationLink(base, sha) {
  const isPreview = Boolean(sha);
  const href = isPreview ? `${base}versoes/` : PROJECTS_HUB_URL;
  const label = isPreview ? `Versão ${sha.slice(0, 7)} · Voltar às versões` : 'Projetos e versões';
  return `<a aria-label="${escapeHtml(label)}" href="${escapeHtml(href)}" style="position:fixed;bottom:12px;right:12px;z-index:40;background:#0f172a;color:white;padding:10px 14px;border-radius:10px;border:1px solid #64748b;font:13px system-ui;text-decoration:none;box-shadow:0 2px 8px #0003">${escapeHtml(label)}</a>`;
}

export async function preparePreview(directory, sha, base) {
  const filename = path.join(directory, 'index.html');
  let html = await readFile(filename, 'utf8');
  // Insert before module scripts, which may access localStorage during initialization.
  html = html.replace(/<head[^>]*>/i, (head) => head + previewStorageScript(sha));
  html = html.replace('</body>', navigationLink(base, sha) + '</body>');
  await writeFile(filename, html);
}

export async function writeCatalog(directory, entries, currentSha, base, repository) {
  const versions = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const cards = versions.map((entry) => {
    if (!/^[a-f0-9]{40}$/.test(entry.sha)) throw new Error('Invalid archive manifest SHA');
    return `<article><div><strong>${escapeHtml(entry.title)}</strong><p><code>${entry.sha.slice(0, 7)}</code> · ${escapeHtml(new Date(entry.date).toLocaleString('pt-PT', { timeZone: 'Africa/Lagos' }))}${entry.sha === currentSha ? ' · Versão atual' : ''}</p></div><div class="actions">${entry.status === 'ready' ? `<a class="primary" href="${entry.sha}/">Abrir versão</a>` : '<span>Pré-visualização indisponível</span>'}<a href="https://github.com/${escapeHtml(repository)}/commit/${entry.sha}" target="_blank" rel="noopener noreferrer">Ver alterações</a></div></article>`;
  }).join('\n');
  const html = `<!doctype html><html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Versões — MyOffice</title><style>
  :root{color-scheme:light dark;--bg:#f8fafc;--surface:#fff;--text:#0f172a;--muted:#475569;--border:#e2e8f0}@media(prefers-color-scheme:dark){:root{--bg:#0d0d0f;--surface:#18181b;--text:#f5f5f5;--muted:#a1a1aa;--border:#303036}}
  *{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:15px/1.6 system-ui,sans-serif}main{max-width:1000px;margin:auto;padding:32px 20px}header{margin-bottom:24px}h1{margin:8px 0}p{color:var(--muted)}a{color:inherit}input{width:100%;padding:12px;font:inherit;border:1px solid var(--border);border-radius:10px;background:var(--surface);color:var(--text)}article{display:flex;justify-content:space-between;align-items:center;gap:20px;padding:20px;margin:12px 0;border:1px solid var(--border);border-radius:14px;background:var(--surface)}article[hidden]{display:none}article strong{overflow-wrap:anywhere}article p{margin:5px 0;font-size:13px}.actions{display:flex;align-items:center;gap:14px;flex-shrink:0;font-size:13px}.primary{display:inline-block;background:var(--text);color:var(--bg);padding:9px 12px;border-radius:9px;text-decoration:none}@media(max-width:650px){article{align-items:flex-start;flex-direction:column}.actions{flex-wrap:wrap}}
  </style></head><body><main><header><a href="${PROJECTS_HUB_URL}">← Todos os projetos</a> · <a href="${escapeHtml(base)}">Abrir site principal</a><h1>Versões do MyOffice</h1><p>Escolhe uma versão para explorar. O site principal continua atualizado no mesmo endereço.</p><p>As versões de teste usam dados próprios neste navegador e não alteram os dados do site principal. O código antigo mantém o comportamento e as limitações daquela época.</p><label for="search">Pesquisar por descrição, data ou código</label><input id="search" type="search" placeholder="Pesquisar versões…"><p id="count" aria-live="polite">${versions.length} versões registadas</p></header><section aria-label="Versões guardadas">${cards}</section></main><script>
  const search=document.getElementById('search');const cards=Array.from(document.querySelectorAll('article'));search.addEventListener('input',()=>{let count=0;for(const card of cards){card.hidden=!card.textContent.toLocaleLowerCase('pt').includes(search.value.toLocaleLowerCase('pt'));if(!card.hidden)count++;}document.getElementById('count').textContent=count+' versões encontradas';});
  </script></body></html>`;
  await mkdir(path.join(directory, 'versoes'), { recursive: true });
  await writeFile(path.join(directory, 'versoes/index.html'), html);
  await writeFile(path.join(directory, 'versions.json'), JSON.stringify({ currentSha, entries: versions }, null, 2));
}
