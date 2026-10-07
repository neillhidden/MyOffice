import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { escapeHtml, PROJECTS_HUB_URL } from './pages-catalog.mjs';

// Keep old bookmarks working; the project selector now belongs to MeusProjetos.
export async function writeProjects(directory) {
  for (const [subdirectory, target] of [['projetos', PROJECTS_HUB_URL], ['projetos/bancada', `${PROJECTS_HUB_URL}bancada/`]]) {
    const destination = path.join(directory, subdirectory);
    await mkdir(destination, { recursive: true });
    await writeFile(path.join(destination, 'index.html'), `<!doctype html><html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=${escapeHtml(target)}"><link rel="canonical" href="${escapeHtml(target)}"><title>Central de projetos</title></head><body><p>A central de projetos mudou de endereço.</p><a href="${escapeHtml(target)}">Abrir MeusProjetos</a></body></html>`);
  }
}
