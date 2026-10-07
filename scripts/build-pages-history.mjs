import { execFileSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { navigationLink, preparePreview, writeCatalog } from './pages-catalog.mjs';
import { writeProjects } from './pages-projects.mjs';

const root = process.cwd();
const base = process.env.MYOFFICE_BASE_PATH || '/MyOffice/';
if (!/^\/(?:[A-Za-z0-9_-]+\/)*$/.test(base)) throw new Error('Invalid site base path');
const output = path.resolve(process.env.PAGES_OUTPUT_DIR || 'pages-site');
const archiveDir = path.resolve(process.env.PAGES_ARCHIVE_DIR || 'pages-history');
if ([root, path.join(root, 'dist')].includes(output) || output === archiveDir) throw new Error('Use separate output and archive directories');
const bun = process.env.BUN_BIN || 'bun';
const repository = process.env.GITHUB_REPOSITORY || 'neillhidden/MyOffice';
if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) throw new Error('Invalid repository');
const run = (program, args, options = {}) => execFileSync(program, args, { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...options });
const current = run('git', ['rev-parse', 'HEAD']).trim();
const history = run('git', ['log', '--reverse', '--format=%H%x09%cI%x09%s', 'HEAD']).trim().split('\n').filter(Boolean).map((line) => {
  const [sha, date, ...title] = line.split('\t');
  return { sha, date, title: title.join('\t') };
});
let previous = [];
try { previous = JSON.parse(await readFile(path.join(archiveDir, 'versions.json'), 'utf8')).entries; }
catch (error) { if (error.code !== 'ENOENT') throw error; }
if (!Array.isArray(previous) || previous.some((entry) => !/^[a-f0-9]{40}$/.test(entry.sha))) throw new Error('Invalid existing manifest');
for (const entry of previous) {
  if (entry.status === 'ready') await readFile(path.join(archiveDir, 'versoes', entry.sha, 'index.html'), 'utf8');
}
const entries = new Map(previous.map((entry) => [entry.sha, entry]));
await mkdir(output, { recursive: true });
// Output directories are disposable generated artifacts, never a source checkout.
await cp(path.join(root, 'dist'), output, { recursive: true });
try { await cp(path.join(archiveDir, 'versoes'), path.join(output, 'versoes'), { recursive: true }); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
for (const commit of history) {
  if (entries.has(commit.sha)) continue;
  let workspace;
  try {
    workspace = await mkdtemp(path.join(os.tmpdir(), 'myoffice-version-'));
    const source = execFileSync('git', ['archive', commit.sha], { cwd: root, maxBuffer: 64 * 1024 * 1024 });
    execFileSync('tar', ['-xf', '-', '-C', workspace], { input: source });
    let manifest;
    try { manifest = JSON.parse(await readFile(path.join(workspace, 'package.json'), 'utf8')); }
    catch (error) { if (error.code === 'ENOENT') { entries.set(commit.sha, { ...commit, status: 'unavailable', reason: 'Este commit ainda não contém a aplicação.' }); continue; } throw error; }
    if (!manifest.scripts?.build?.includes('vite')) throw new Error('Este commit não contém um build Vite suportado.');
    const env = { ...process.env, MYOFFICE_BASE_PATH: `${base}versoes/${commit.sha}/` };
    run(bun, ['install', '--frozen-lockfile'], { cwd: workspace, env });
    run('npm', ['run', 'build', '--', `--base=${base}versoes/${commit.sha}/`], { cwd: workspace, env });
    const destination = path.join(output, 'versoes', commit.sha);
    await cp(path.join(workspace, 'dist'), destination, { recursive: true });
    await preparePreview(destination, commit.sha, base);
    entries.set(commit.sha, { ...commit, status: 'ready' });
    console.log(`Versão ${commit.sha.slice(0, 7)} preparada`);
  } catch (error) {
    entries.set(commit.sha, { ...commit, status: 'unavailable', reason: 'Não foi possível compilar esta versão com o ambiente atual.' });
    console.error(`Versão ${commit.sha.slice(0, 7)} indisponível: ${String(error.stderr || error.message).slice(-800)}`);
    if (commit.sha === current) throw error; // Never publish a broken current release.
  } finally { if (workspace) await rm(workspace, { recursive: true, force: true }); }
}
await writeCatalog(output, [...entries.values()], current, base, repository);
await writeProjects(output, base);
const index = path.join(output, 'index.html');
await writeFile(index, (await readFile(index, 'utf8')).replace('</body>', navigationLink(base) + '</body>'));
await mkdir(archiveDir, { recursive: true });
await cp(path.join(output, 'versoes'), path.join(archiveDir, 'versoes'), { recursive: true });
await cp(path.join(output, 'versions.json'), path.join(archiveDir, 'versions.json'));
console.log(`Catálogo: ${[...entries.values()].filter((entry) => entry.status === 'ready').length} versões executáveis / ${entries.size} commits`);
