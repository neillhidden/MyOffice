const fs=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
const crypto=require('node:crypto');
const {spawnSync,spawn}=require('node:child_process');
const {Readable}=require('node:stream');
const {pipeline}=require('node:stream/promises');
const {createWriteStream}=require('node:fs');
const VERSION='44.7.0';
const RUNTIME_HASH='eee30dc8fa1f5ea95490e59f44e46ea68dd24c6e93d22facf70fe5c2d4c2665c';
const EXE_HASH='2529b494f4123f152bce346051f7bd855ef95006424a561953cf17c49a3d1ba8';
const url=`https://github.com/electron/electron/releases/download/v${VERSION}/electron-v${VERSION}-win32-x64.zip`;
const psLiteral=value=>"'"+String(value).replace(/'/g,"''")+"'";
async function hashFile(file){const hash=crypto.createHash('sha256');for await(const chunk of require('node:fs').createReadStream(file))hash.update(chunk);return hash.digest('hex');}
function powershell(script){const result=spawnSync(path.join(process.env.SystemRoot||'C:\\Windows','System32','WindowsPowerShell','v1.0','powershell.exe'),['-NoProfile','-NonInteractive','-Command',"$ErrorActionPreference='Stop';"+script],{encoding:'utf8',windowsHide:true});if(result.error)throw result.error;if(result.status!==0)throw new Error(result.stderr||'Não foi possível concluir o passo de instalação.');return result.stdout;}
async function verifyApplication(root){const manifest=JSON.parse(await fs.readFile(path.join(root,'SHA256-APP.json'),'utf8'));for(const [name,expected] of Object.entries(manifest)){const file=path.resolve(root,name);const relative=path.relative(root,file);if(relative.startsWith('..')||path.isAbsolute(relative))throw new Error('Manifesto inválido.');if(await hashFile(file)!==expected)throw new Error('Um ficheiro da aplicação foi alterado ou está incompleto: '+name);}}
async function main(){
 if(process.platform!=='win32')throw new Error('Este instalador destina-se ao Windows 10/11 x64.');
 if(process.arch!=='x64')throw new Error('Usa o Node.js de 64 bits (x64) para este pacote.');
 if(Number(process.versions.node.split('.')[0])<24)throw new Error('Instala primeiro o Node.js 24 oficial.');
 const source=path.join(__dirname,'app');await verifyApplication(source);
 const active=await new Promise(resolve=>{const socket=require('node:net').connect(4742,'127.0.0.1');socket.once('connect',()=>{socket.destroy();resolve(true);});socket.once('error',()=>resolve(false));});
 if(active)throw new Error('Fecha primeiro o MyOffice Electron antes de instalar ou atualizar.');
 const programs=path.join(process.env.LOCALAPPDATA||path.join(os.homedir(),'AppData','Local'),'Programs');await fs.mkdir(programs,{recursive:true});
 const target=path.join(programs,'MyOffice');const stage=path.join(programs,'.myoffice-instalar-'+crypto.randomUUID());const previous=path.join(programs,'MyOffice-anterior-'+Date.now());
 await fs.mkdir(stage);let renamedPrevious=false,installed=false;
 try{
  console.log('A descarregar Electron oficial (cerca de 158 MB). Não é necessário instalar ferramentas de programação.');
  const download=path.join(stage,'electron.zip');const response=await fetch(url);if(!response.ok||!response.body)throw new Error('Falha no download do Electron: HTTP '+response.status);
  await pipeline(Readable.fromWeb(response.body),createWriteStream(download));
  if(await hashFile(download)!==RUNTIME_HASH)throw new Error('O download não passou na verificação SHA-256. Não será executado.');
  const runtime=path.join(stage,'runtime');powershell(`Expand-Archive -LiteralPath ${psLiteral(download)} -DestinationPath ${psLiteral(runtime)}`);
  if(await hashFile(path.join(runtime,'electron.exe'))!==EXE_HASH)throw new Error('O executável não corresponde ao Electron oficial.');
  await fs.rename(path.join(runtime,'electron.exe'),path.join(runtime,'MyOffice.exe'));
  await fs.cp(source,path.join(runtime,'resources','app'),{recursive:true});
  await verifyApplication(path.join(runtime,'resources','app'));
  try{await fs.access(target);await fs.rename(target,previous);renamedPrevious=true;}catch(error){if(error.code!=='ENOENT')throw error;}
  try{await fs.rename(runtime,target);installed=true;}catch(error){if(renamedPrevious)await fs.rename(previous,target);throw error;}
  const exe=path.join(target,'MyOffice.exe'),icon=path.join(target,'resources','app','icon.ico');
  const shortcutScript=`$shell=New-Object -ComObject WScript.Shell;$locations=@([Environment]::GetFolderPath('Desktop'),(Join-Path ([Environment]::GetFolderPath('StartMenu')) 'Programs'));foreach($dir in $locations){New-Item -ItemType Directory -Path $dir -Force | Out-Null;$link=$shell.CreateShortcut((Join-Path $dir 'MyOffice.lnk'));$link.TargetPath=${psLiteral(exe)};$link.WorkingDirectory=${psLiteral(target)};$link.IconLocation=${psLiteral(icon)};$link.Description='MyOffice Home e Business';$link.Save()}`;
  powershell(shortcutScript);
  console.log('Instalação concluída: '+target+'\nOs dados ficam separados em %APPDATA%\\MyOffice\\dados.\nFoi criado o atalho MyOffice no Ambiente de Trabalho.');
  if(renamedPrevious)console.log('A aplicação anterior foi conservada em '+previous+'. Podes removê-la depois de verificar esta versão; os dados ficam noutra pasta.');
  console.log('Se o Controlo Inteligente bloquear o executável, não desatives a proteção: esta distribuição Electron não tem assinatura digital.');
  const child=spawn(exe,[],{detached:true,stdio:'ignore'});child.on('error',error=>console.error('A instalação foi concluída, mas não foi possível abrir: '+error.message));child.unref();
 }finally{await fs.rm(stage,{recursive:true,force:true});if(!installed&&renamedPrevious)console.log('A instalação não foi concluída; verifica a pasta da aplicação anterior.');}
}
module.exports={psLiteral,hashFile,verifyApplication,VERSION,RUNTIME_HASH,EXE_HASH};
if(require.main===module)main().catch(error=>{console.error('Não foi possível concluir: '+error.message);process.exitCode=1;});
