const http=require('node:http');
const {readFile,stat}=require('node:fs/promises');
const fs=require('node:fs');
const {resolve,relative,isAbsolute,extname,sep,dirname,join}=require('node:path');
const {spawn}=require('node:child_process');
const {isSea}=require('node:sea');
const {DatabaseSync,backup}=require('node:sqlite');
const {randomUUID}=require('node:crypto');
const folder=isSea()?dirname(process.execPath):__dirname;
const root=resolve(folder,'site'),dataDir=resolve(process.env.MYOFFICE_DATA_DIR||join(folder,'.data'));
const port=Number(process.env.MYOFFICE_PORT||4742),dbFile=join(dataDir,'myoffice.sqlite');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.wasm':'application/wasm','.gz':'application/gzip','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.json':'application/json'};
const owns=key=>typeof key==='string'&&key.startsWith('myoffice')&&key.length<=300;
async function main(){
 fs.mkdirSync(dataDir,{recursive:true});
 if(process.argv.includes('--restaurar')){
  const supplied=process.argv[process.argv.indexOf('--restaurar')+1];
  if(!supplied)throw new Error('Indica o ficheiro SQLite a restaurar.');
  const source=resolve(supplied);if(source===dbFile)throw new Error('Escolhe uma cópia de segurança diferente da base atual.');
  const running=await new Promise(done=>{const socket=require('node:net').connect(port,'127.0.0.1');socket.on('connect',()=>{socket.destroy();done(true);});socket.on('error',()=>done(false));});
  if(running)throw new Error('Fecha primeiro a janela do MyOffice antes de restaurar.');
  const temporary=dbFile+'.restauro-'+randomUUID();const incoming=new DatabaseSync(source,{readOnly:true});
  try{if(incoming.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')throw new Error('A cópia SQLite não está íntegra.');const rows=incoming.prepare('SELECT key,value FROM app_storage').all();const meta=incoming.prepare('SELECT revision,database_id FROM app_metadata WHERE id=1').get();if(!meta||!Number.isSafeInteger(meta.revision)||meta.revision<0||typeof meta.database_id!=='string'||rows.some(row=>!owns(row.key)||typeof row.value!=='string'))throw new Error('Esta cópia não pertence à base local do MyOffice.');await backup(incoming,temporary);}finally{incoming.close();}
  if(fs.existsSync(dbFile)){
   const original=new DatabaseSync(dbFile);const backupDir=join(dataDir,'backups');fs.mkdirSync(backupDir,{recursive:true});
   try{await backup(original,join(backupDir,`antes-restauro-${Date.now()}.sqlite`));}finally{original.close();}
  }
  for(const suffix of ['-wal','-shm']){try{fs.unlinkSync(dbFile+suffix);}catch(error){if(error.code!=='ENOENT')throw error;}}
  fs.renameSync(temporary,dbFile);console.log('Base restaurada. A base anterior foi preservada na pasta .data/backups. Inicia novamente o MyOffice.');if(process.parentPort)process.exit(0);return;
 }
 const db=new DatabaseSync(dbFile);db.exec("PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS app_storage(key TEXT PRIMARY KEY,value TEXT NOT NULL); CREATE TABLE IF NOT EXISTS app_metadata(id INTEGER PRIMARY KEY CHECK(id=1),revision INTEGER NOT NULL,database_id TEXT NOT NULL);");
 db.prepare('INSERT OR IGNORE INTO app_metadata VALUES(1,0,?)').run(randomUUID());
 const snapshot=()=>({ ...db.prepare('SELECT revision,database_id AS databaseId FROM app_metadata WHERE id=1').get(),values:Object.fromEntries(db.prepare('SELECT key,value FROM app_storage').all().map(row=>[row.key,row.value]))});
 const send=(res,code,value)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));};
 const server=http.createServer(async(req,res)=>{
  try{
   const host=req.headers.host;if(![`localhost:${port}`,`127.0.0.1:${port}`].includes(host)){send(res,403,{error:'Endereço local não autorizado.'});return;}
   if(req.headers.origin&&![`http://localhost:${port}`,`http://127.0.0.1:${port}`].includes(req.headers.origin)){send(res,403,{error:'Origem não autorizada.'});return;}
   const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
   if(pathname==='/api/local-storage'){
    if(req.method==='GET'){send(res,200,snapshot());return;}
    if(req.method!=='POST'||!String(req.headers['content-type']||'').startsWith('application/json')){send(res,405,{error:'Pedido inválido.'});return;}
    let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>32*1024*1024){send(res,413,{error:'Dados demasiado grandes.'});return;}}
    let body;try{body=JSON.parse(raw);}catch{send(res,400,{error:'Dados inválidos.'});return;}
    db.exec('BEGIN IMMEDIATE');
    try{
     const revision=db.prepare('SELECT revision FROM app_metadata WHERE id=1').get().revision;
     if(body.revision!==revision){db.exec('ROLLBACK');send(res,409,{error:'Os dados mudaram noutra janela. Recarrega antes de continuar.'});return;}
     if(body.initial){
      if(revision!==0||db.prepare('SELECT count(*) AS n FROM app_storage').get().n!==0||typeof body.initial!=='object'||Array.isArray(body.initial))throw new Error('A importação inicial já foi realizada.');
      for(const [key,value] of Object.entries(body.initial)){if(!owns(key)||typeof value!=='string')throw new Error('Dados iniciais inválidos.');db.prepare('INSERT INTO app_storage VALUES(?,?)').run(key,value);}
     }else{
      if(!owns(body.key)||(body.value!==null&&typeof body.value!=='string'))throw new Error('Chave ou valor inválido.');
      if(body.value===null)db.prepare('DELETE FROM app_storage WHERE key=?').run(body.key);else db.prepare('INSERT INTO app_storage VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(body.key,body.value);
     }
     db.prepare('UPDATE app_metadata SET revision=revision+1 WHERE id=1').run();db.exec('COMMIT');send(res,200,body.initial?snapshot():{revision:revision+1});
    }catch(error){try{db.exec('ROLLBACK');}catch{}send(res,400,{error:error.message});}return;
   }
   if(pathname==='/api/backup'&&req.method==='GET'){
    const backupDir=join(dataDir,'backups');fs.mkdirSync(backupDir,{recursive:true});const file=join(backupDir,`myoffice-${Date.now()}-${randomUUID()}.sqlite`);
    await backup(db,file);const bytes=await readFile(file);
    res.writeHead(200,{'Content-Type':'application/octet-stream','Content-Disposition':'attachment; filename="myoffice-backup.sqlite"','Cache-Control':'no-store'});res.end(bytes);return;
   }
   if(pathname==='/local-storage.js'){res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-cache'});res.end(await readFile(join(folder,'local-storage.js')));return;}
   if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
   let file=resolve(root,'.'+pathname);const rel=relative(root,file);
   if(rel==='..'||rel.startsWith('..'+sep)||isAbsolute(rel)){res.writeHead(403);res.end();return;}
   try{if((await stat(file)).isDirectory())file=resolve(file,'index.html');}catch{if(extname(pathname)){res.writeHead(404);res.end();return;}file=resolve(root,'index.html');}
   let bytes=await readFile(file);
   if(extname(file)==='.html'){
    let html=bytes.toString();html=html.replace(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/,(_,src)=>`<script src="/local-storage.js"></script><script type="module">if(window.__MYOFFICE_DB_READY__)import(${JSON.stringify(src)});</script>`);
    html=html.replace('</body>','<aside style="position:fixed;bottom:8px;right:8px;z-index:9999;background:#fff;border:1px solid #cbd5e1;border-radius:8px;padding:6px 10px;font:12px system-ui;color:#334155"><span id="local-db-status">Base local</span> · <a href="/api/backup" style="color:#4338ca">Backup SQLite</a></aside></body>');bytes=Buffer.from(html);
   }
   res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:bytes);
  }catch(error){console.error(error.message);if(!res.headersSent)send(res,500,{error:'Não foi possível concluir. Os dados existentes foram preservados.'});else res.end();}
 });
 server.on('error',error=>{console.error(error.code==='EADDRINUSE'?'O MyOffice já pode estar aberto. Visita http://localhost:'+port+' ou fecha a janela anterior.':error.message);db.close();if(process.parentPort)process.exit(1);process.exitCode=1;});
 server.listen(port,'127.0.0.1',()=>{
  process.parentPort?.postMessage({kind:'ready',port,dbFile});console.log('MyOffice com SQLite pronto: http://localhost:'+port+'\nMantém esta janela aberta. Para parar: Ctrl+C.\nBase: '+dbFile);
  if(process.platform==='win32'&&!process.parentPort&&!process.argv.includes('--sem-navegador')){const child=spawn('explorer.exe',['http://localhost:'+port+''],{stdio:'ignore'});child.on('error',()=>console.log('Abre o endereço acima no navegador.'));child.unref();}
 });
 const stop=()=>server.close(()=>{db.close();process.exit(0);});process.parentPort?.on('message',event=>{if(event.data?.kind==='stop')stop();});process.on('SIGINT',stop);process.on('SIGTERM',stop);
}
main().catch(error=>{console.error(error.message);if(process.parentPort)process.exit(1);process.exitCode=1;});
