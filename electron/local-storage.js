(() => {
  const local = window.localStorage, proto = Storage.prototype;
  const nativeSet = proto.setItem, nativeRemove = proto.removeItem, nativeClear = proto.clear;
  const owns = key => String(key).startsWith('myoffice');
  let revision = 0, ready = false;
  function status(message, failed = false) {
    const show = () => { const el = document.querySelector('#local-db-status'); if(el){el.textContent = message;el.style.color=failed?'#b91c1c':'#334155';} };
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',show,{once:true});else show();
  }
  function request(method, body) {
    const xhr = new XMLHttpRequest();
    xhr.open(method, '/api/local-storage', false);
    if(body)xhr.setRequestHeader('Content-Type','application/json');
    xhr.send(body?JSON.stringify(body):null);
    let response;try{response=JSON.parse(xhr.responseText);}catch{throw new Error('A base local não respondeu. Mantém o MyOffice.exe aberto.');}
    if(xhr.status!==200)throw new Error(response.error||'Não foi possível guardar na base local.');
    return response;
  }
  try {
    let state = request('GET');
    const cached = {};
    for(let i=0;i<local.length;i++){const key=local.key(i);if(owns(key))cached[key]=local.getItem(key);}
    if(state.revision===0 && Object.keys(state.values).length===0 && Object.keys(cached).length) {
      state=request('POST',{revision:0,initial:cached});
    }
    const keys=[];for(let i=0;i<local.length;i++){const key=local.key(i);if(owns(key))keys.push(key);}
    for(const key of keys)nativeRemove.call(local,key);
    for(const [key,value] of Object.entries(state.values))nativeSet.call(local,key,value);
    revision=state.revision;ready=true;
    proto.setItem=function(key,value){
      if(this!==local || !owns(key))return nativeSet.call(this,key,value);
      key=String(key);value=String(value);const before=local.getItem(key);
      if(before===value)return;
      try{
        const saved=request('POST',{revision,key,value});revision=saved.revision;
        try{nativeSet.call(local,key,value);}catch(error){revision=request('POST',{revision,key,value:before}).revision;throw error;}
        status('Base local: guardado');
      }catch(error){status(error.message,true);throw error;}
    };
    proto.removeItem=function(key){
      if(this!==local || !owns(key))return nativeRemove.call(this,key);
      key=String(key);const before=local.getItem(key);
      if(before===null)return;
      try{
        revision=request('POST',{revision,key,value:null}).revision;
        try{nativeRemove.call(local,key);}catch(error){revision=request('POST',{revision,key,value:before}).revision;throw error;}
        status('Base local: guardado');
      }catch(error){status(error.message,true);throw error;}
    };
    proto.clear=function(){
      if(this!==local)return nativeClear.call(this);
      const keys=[];for(let i=0;i<local.length;i++){const key=local.key(i);if(owns(key))keys.push(key);}
      for(const key of keys)this.removeItem(key);
    };
    window.__MYOFFICE_DB_READY__=true;status('Base local: guardado');
  }catch(error){window.__MYOFFICE_DB_READY__=false;status(error.message,true);document.addEventListener('DOMContentLoaded',()=>{document.querySelector('#root').textContent='Não foi possível abrir a base local. Os dados originais foram preservados. Fecha outras janelas do sistema e inicia novamente o MyOffice.exe.';},{once:true});}
})();
