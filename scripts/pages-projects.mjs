import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { escapeHtml } from './pages-catalog.mjs';

// Add another published project by pointing its catalogUrl to its version catalog.
export function projectsFor(base) {
  return [
    {
      slug: 'myoffice', name: 'MyOffice', initials: 'MO',
      description: 'Gestão pessoal e empresarial. Explora a evolução do sistema.',
      repository: 'neillhidden/MyOffice', catalogUrl: `${base}versoes/`,
      available: true,
    },
    {
      slug: 'bancada', name: 'BANCADA.az', initials: 'BA',
      description: 'O teu segundo projeto, reunido na mesma central de versões.',
      repository: 'neillhidden/BANCADA.az', catalogUrl: `${base}projetos/bancada/`,
      available: false,
    },
  ];
}

const style = `
:root{color-scheme:light dark;--bg:#f8fafc;--surface:#fff;--text:#0f172a;--muted:#475569;--border:#e2e8f0;--accent:#4338ca;--tint:#eef2ff}
@media(prefers-color-scheme:dark){:root{--bg:#0d0d0f;--surface:#18181b;--text:#f5f5f5;--muted:#a1a1aa;--border:#303036;--accent:#a5b4fc;--tint:#242238}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:16px/1.6 system-ui,sans-serif}main{max-width:1040px;margin:auto;padding:48px 24px}a{color:var(--accent)}a:focus-visible,input:focus-visible{outline:3px solid var(--accent);outline-offset:4px}header{margin-bottom:32px}.eyebrow{color:var(--accent);font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}h1{font-size:clamp(28px,5vw,40px);line-height:1.2;margin:12px 0}h2{margin:0;font-size:23px}p{color:var(--muted);margin:12px 0}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}.card{display:flex;flex-direction:column;padding:28px;border:1px solid var(--border);border-radius:18px;background:var(--surface)}.identity{display:flex;align-items:center;gap:14px}.icon{display:grid;place-items:center;width:50px;height:50px;flex-shrink:0;background:var(--tint);color:var(--accent);border-radius:12px;font-weight:700}.status{display:block;font-size:13px;color:var(--muted)}.actions{display:flex;align-items:center;gap:18px;flex-wrap:wrap;margin-top:auto;padding-top:20px;font-size:14px}.primary{display:inline-block;border-radius:9px;padding:10px 15px;text-decoration:none;background:var(--text);color:var(--bg);font-weight:600}.note{margin-top:28px;font-size:14px}.empty{max-width:680px;margin-top:30px}.back{font-size:14px}.repo{overflow-wrap:anywhere}@media(max-width:650px){main{padding:28px 18px}.grid{grid-template-columns:1fr}.card{padding:22px}}
`;
const page = (title, body) => `<!doctype html><html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="Escolhe um projeto e consulta as suas versões e alterações."><title>${escapeHtml(title)} — Projetos e versões</title><style>${style}</style></head><body><main>${body}</main></body></html>`;

export async function writeProjects(directory, base) {
  const projects = projectsFor(base);
  const cards = projects.map(project => `<article class="card"><div class="identity"><span class="icon" aria-hidden="true">${escapeHtml(project.initials)}</span><div><h2>${escapeHtml(project.name)}</h2><span class="status">${project.available ? 'Versões disponíveis' : 'Ainda sem versões publicadas'}</span></div></div><p>${escapeHtml(project.description)}</p><div class="actions"><a class="primary" href="${escapeHtml(project.catalogUrl)}" aria-label="Escolher projeto ${escapeHtml(project.name)}">Escolher projeto</a><a href="https://github.com/${project.repository}" target="_blank" rel="noopener noreferrer">Ver no GitHub</a></div></article>`).join('');
  const hub = page('Meus projetos', `<header><span class="eyebrow">A tua central de versões</span><h1>Meus projetos</h1><p>Escolhe um projeto para consultar os commits e abrir as versões disponíveis.</p></header><section class="grid" aria-label="Projetos">${cards}</section><p class="note">Explorar uma versão antiga mantém o site principal no seu endereço habitual.</p>`);
  await mkdir(path.join(directory, 'projetos'), { recursive: true });
  await writeFile(path.join(directory, 'projetos/index.html'), hub);
  for (const project of projects.filter(project => !project.available)) {
    const empty = page(project.name, `<a class="back" href="${escapeHtml(base)}projetos/">← Todos os projetos</a><header><span class="eyebrow">Histórico de versões</span><h1>${escapeHtml(project.name)}</h1></header><section class="card empty"><h2>Ainda não há versões disponíveis</h2><p>Este projeto ainda não tem código publicado no seu repositório. Assim que o código e a publicação de versões estiverem preparados, poderás escolher os commits e abrir as versões a partir desta central.</p><div class="actions"><a class="primary" href="https://github.com/${project.repository}" target="_blank" rel="noopener noreferrer">Abrir repositório</a><a href="${escapeHtml(base)}projetos/">Escolher outro projeto</a></div></section>`);
    await mkdir(path.join(directory, 'projetos', project.slug), { recursive: true });
    await writeFile(path.join(directory, 'projetos', project.slug, 'index.html'), empty);
  }
}
