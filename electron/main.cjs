const {app,BrowserWindow,Menu,dialog,shell,utilityProcess}=require('electron');
const fs=require('node:fs/promises');
const path=require('node:path');
const {randomUUID}=require('node:crypto');
app.setName('MyOffice');
app.setPath('userData',process.env.MYOFFICE_ELECTRON_DATA||path.join(app.getPath('appData'),'MyOffice'));
const dataDir=path.join(app.getPath('userData'),'dados');
const port=Number(process.env.MYOFFICE_PORT||4742);
const origin=`http://localhost:${port}`;
let window,backend,quitting=false,busy=false,stopping=false;
const locked=app.requestSingleInstanceLock();
if(!locked)app.quit();
function launchBackend(args=[]){
 return new Promise((resolve,reject)=>{
  const child=utilityProcess.fork(path.join(__dirname,'backend.cjs'),args,{env:{...process.env,MYOFFICE_DATA_DIR:dataDir,MYOFFICE_PORT:String(port)},stdio:'pipe',serviceName:'MyOffice SQLite'});
  let output='',settled=false;
  const timer=setTimeout(()=>{if(!settled){settled=true;child.kill();reject(new Error('A base local demorou demasiado a iniciar.'));}},20000);
  child.stdout?.on('data',bytes=>{output+=bytes.toString();});child.stderr?.on('data',bytes=>{output+=bytes.toString();});
  child.on('message',message=>{if(message.kind==='ready'&&!settled){settled=true;clearTimeout(timer);backend=child;resolve(child);}});
  child.on('exit',code=>{
   clearTimeout(timer);
   if(!settled){settled=true;args.includes('--restaurar')&&code===0?resolve(null):reject(new Error(output||'Não foi possível iniciar a base local.'));}
   else if(child===backend&&!stopping&&!quitting){backend=null;dialog.showErrorBox('Base local encerrada','A base local foi encerrada. Fecha e volta a abrir o MyOffice.');}
  });
 });
}
async function stopBackend(){
 const child=backend;if(!child)return;stopping=true;
 await new Promise(resolve=>{const timer=setTimeout(()=>{child.kill();resolve();},5000);child.once('exit',()=>{clearTimeout(timer);resolve();});child.postMessage({kind:'stop'});});
 backend=null;stopping=false;
}
async function nativeBackup(){
 if(busy||!backend)return;busy=true;
 try{
  const result=await dialog.showSaveDialog(window,{title:'Guardar backup Home e Business',defaultPath:path.join(app.getPath('documents'),`MyOffice-backup-${new Date().toISOString().slice(0,10)}.sqlite`),filters:[{name:'Base SQLite',extensions:['sqlite']}]});
  if(result.canceled)return;
  const response=await fetch(origin+'/api/backup');if(!response.ok)throw new Error('A base local não conseguiu criar o backup.');
  const temporary=result.filePath+'.tmp-'+randomUUID();await fs.writeFile(temporary,Buffer.from(await response.arrayBuffer()));await fs.rename(temporary,result.filePath);
  await dialog.showMessageBox(window,{type:'info',message:'Backup guardado.',detail:result.filePath});
 }catch(error){dialog.showErrorBox('Erro no backup',error.message);}finally{busy=false;}
}
async function restoreDatabase(importing=false){
 if(busy)return;busy=true;
 try{
  const chosen=await dialog.showOpenDialog(window,{title:importing?'Importar a base da versão anterior':'Restaurar backup',properties:['openFile'],filters:[{name:'Base SQLite',extensions:['sqlite','db']}]});
  if(chosen.canceled)return;
  const confirm=await dialog.showMessageBox(window,{type:'warning',message:'Substituir os dados atuais pelos desta base?',detail:'Fecha a versão anterior antes de continuar. Home e Business serão substituídos; uma cópia da base atual será preservada na pasta de backups.',buttons:['Cancelar','Importar e substituir'],defaultId:0,cancelId:0});
  if(confirm.response!==1)return;
  await window.webContents.executeJavaScript('document.body.inert=true');
  await stopBackend();
  let restoreError;
  try{await launchBackend(['--restaurar',chosen.filePaths[0]]);}catch(error){restoreError=error;}
  await launchBackend(['--sem-navegador']);
  await window.loadURL(origin);
  if(restoreError)throw restoreError;
  await dialog.showMessageBox(window,{type:'info',message:'Base importada.',detail:'O estado anterior foi preservado na pasta de backups.'});
 }catch(error){dialog.showErrorBox('Não foi possível importar',error.message);}finally{busy=false;if(window&&!window.isDestroyed())window.webContents.executeJavaScript('document.body.inert=false').catch(()=>{});}
}
async function shortcut(){
 if(process.platform!=='win32'){await dialog.showMessageBox(window,{message:'O atalho automático está disponível no Windows.'});return;}
 const shortcutPath=path.join(app.getPath('desktop'),'MyOffice.lnk');
 const written=shell.writeShortcutLink(shortcutPath,'create',{target:process.execPath,cwd:path.dirname(process.execPath),description:'MyOffice Home e Business',icon:path.join(__dirname,'icon.ico'),iconIndex:0});
 if(!written)throw new Error('Não foi possível criar o atalho.');
 await dialog.showMessageBox(window,{message:'Atalho MyOffice criado no Ambiente de Trabalho.'});
}
const safeExternal=url=>{try{const protocol=new URL(url).protocol;if(['https:','http:','mailto:'].includes(protocol))shell.openExternal(url);}catch{}};
function createWindow(){
 window=new BrowserWindow({title:'MyOffice',width:1366,height:900,minWidth:390,minHeight:600,backgroundColor:'#f1f5f9',icon:path.join(__dirname,'icon.png'),show:false,webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true,webSecurity:true}});
 window.once('ready-to-show',()=>window.show());
 window.webContents.on('will-navigate',(event,url)=>{if(new URL(url).origin!==origin){event.preventDefault();safeExternal(url);}});
 window.webContents.setWindowOpenHandler(({url})=>{safeExternal(url);return{action:'deny'};});
 window.webContents.session.setPermissionRequestHandler((contents,permission,callback)=>callback(permission==='clipboard-sanitized-write'&&contents.getURL().startsWith(origin+'/')));
 window.webContents.session.on('will-download',(event,item)=>{item.setSaveDialogOptions({title:'Guardar ficheiro do MyOffice',defaultPath:path.join(app.getPath('downloads'),path.basename(item.getFilename()))});});
 window.on('close',event=>{if(busy&&!quitting){event.preventDefault();dialog.showMessageBox(window,{message:'Aguarda pela conclusão da operação da base de dados.'});}});
 Menu.setApplicationMenu(Menu.buildFromTemplate([
  {label:'Ficheiro',submenu:[{label:'Criar backup SQLite…',click:nativeBackup},{label:'Restaurar backup…',click:()=>restoreDatabase(false)},{label:'Importar base da versão anterior…',click:()=>restoreDatabase(true)},{type:'separator'},{label:'Abrir pasta dos dados',click:()=>shell.openPath(dataDir)},{label:'Criar atalho no Ambiente de Trabalho',click:()=>shortcut().catch(error=>dialog.showErrorBox('Erro no atalho',error.message))},{type:'separator'},{label:'Sair',role:'quit'}]},
  {label:'Editar',submenu:[{role:'undo',label:'Desfazer'},{role:'redo',label:'Refazer'},{type:'separator'},{role:'cut',label:'Cortar'},{role:'copy',label:'Copiar'},{role:'paste',label:'Colar'},{role:'selectAll',label:'Selecionar tudo'}]},
  {label:'Ver',submenu:[{role:'reload',label:'Recarregar'},{role:'resetZoom',label:'Tamanho normal'},{role:'zoomIn',label:'Aumentar'},{role:'zoomOut',label:'Diminuir'},{role:'togglefullscreen',label:'Ecrã inteiro'}]},
  {label:'Ajuda',submenu:[{label:'Instruções',click:()=>shell.openPath(path.join(__dirname,'LEIA-PRIMEIRO.txt'))},{label:'Obter atualizações',click:()=>shell.openExternal('https://github.com/neillhidden/MyOffice/tree/distribuicao-windows')},{label:'Sobre o MyOffice',click:()=>dialog.showMessageBox(window,{message:'MyOffice Desktop 1.0.0',detail:'Home + Business · Electron · SQLite local\nAtualizações manuais. A base de dados permanece na pasta de dados do utilizador.'})}]}
 ]));
 return window.loadURL(origin);
}
app.on('second-instance',()=>{if(window){if(window.isMinimized())window.restore();window.show();window.focus();}});
app.on('window-all-closed',()=>app.quit());
app.on('before-quit',event=>{if(!quitting){event.preventDefault();if(busy)return;quitting=true;stopBackend().finally(()=>app.exit(0));}});
if(locked)app.whenReady().then(async()=>{await fs.mkdir(dataDir,{recursive:true});await launchBackend(['--sem-navegador']);await createWindow();}).catch(error=>{dialog.showErrorBox('Não foi possível abrir o MyOffice',error.message);quitting=true;stopBackend().finally(()=>app.exit(1));});
