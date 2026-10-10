const path=require('node:path');
const fs=require('node:fs/promises');
const crypto=require('node:crypto');
const AdmZip=require('adm-zip');
const root=path.resolve(__dirname,'..');
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const expected='eee30dc8fa1f5ea95490e59f44e46ea68dd24c6e93d22facf70fe5c2d4c2665c';
async function main(){
 const archive=process.argv[2];if(!archive)throw new Error('Indica o ZIP oficial electron-v44.7.0-win32-x64.zip. O SHA-256 será verificado.');
 const raw=await fs.readFile(path.resolve(archive));if(digest(raw)!==expected)throw new Error('O ZIP não corresponde ao Electron oficial esperado.');
 const output=path.join(root,'out');await fs.mkdir(output,{recursive:true});
 const staging=path.join(output,'.windows-'+crypto.randomUUID());await fs.mkdir(staging);
 try{
  const zip=new AdmZip(raw);zip.extractAllTo(staging,true);
  const original=await fs.readFile(path.join(staging,'electron.exe'));await fs.rename(path.join(staging,'electron.exe'),path.join(staging,'MyOffice.exe'));
  const app=path.join(staging,'resources','app');await fs.mkdir(app,{recursive:true});
  for(const dir of ['site','database','scripts'])await fs.cp(path.join(root,dir),path.join(app,dir),{recursive:true});
  for(const file of ['main.cjs','backend.cjs','local-storage.js','package.json','package-lock.json','icon.ico','icon.png','LEIA-PRIMEIRO.txt','ESTADO-DA-ENTREGA.md'])await fs.copyFile(path.join(root,file),path.join(app,file));
  await fs.copyFile(path.join(root,'LEIA-PRIMEIRO.txt'),path.join(staging,'LEIA-PRIMEIRO.txt'));
  if(digest(await fs.readFile(path.join(staging,'MyOffice.exe')))!==digest(original))throw new Error('O runtime foi alterado.');
  const result=new AdmZip();result.addLocalFolder(staging,'MyOffice-Electron-Windows');const destination=path.join(output,'MyOffice-Electron-Windows.zip');await result.writeZipPromise(destination);
  const hash=digest(await fs.readFile(destination));await fs.writeFile(destination+'.sha256',hash+'  '+path.basename(destination)+'\n');
  console.log('Windows portátil gerado: '+destination+'\nO executável oficial é não assinado. Arranque Windows ainda não validado.');
 }finally{await fs.rm(staging,{recursive:true,force:true});}
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
