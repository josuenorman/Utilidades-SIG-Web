// v1.28 - Z/elevación manual y cálculo automático con OpenTopoData SRTM 30 m.
(function(){
  const VERSION='1.28';
  const $=id=>document.getElementById(id);
  const API_DATASET='srtm30m';
  const API_NAME='OpenTopoData / SRTM 30 m';
  const API_URL='https://api.opentopodata.org/v1/'+API_DATASET;
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');

  function css(){
    if($('elev128style'))return;
    const s=document.createElement('style');
    s.id='elev128style';
    s.textContent=`
      .z-manual-wrap{display:grid;grid-template-columns:1fr;gap:6px;margin:7px 0}.z-manual-wrap input{padding:8px 10px}.z-toolbar{display:flex;gap:7px;flex-wrap:wrap;align-items:center;margin-top:6px}.z-note{font-size:11px;color:#64748b;margin-top:5px;line-height:1.3}.z-status{font-size:11px;color:#0f766e;font-weight:800;margin-top:5px}.z-head{background:#fff7ed!important;color:#9a3412!important}.z-source{min-width:190px!important}
    `;
    document.head.appendChild(s);
  }

  function header(){
    document.title='Utilidades SIG Web v'+VERSION;
    const p=document.querySelector('.hero-title p');
    if(p)p.textContent='v'+VERSION+' · Z manual y cálculo automático de elevación con OpenTopoData / SRTM 30 m.';
  }

  function attrsOf(p){p.attrs=p.attrs&&typeof p.attrs==='object'?p.attrs:{};return p.attrs}
  function setElevation(p,z,source){
    if(!p)return;
    const n=Number(z);
    if(Number.isFinite(n)){
      p.elev_m=Number(n.toFixed(1));
      attrsOf(p).elev_m=p.elev_m;
      attrsOf(p).z_fuente=source||'Manual';
    }
  }

  function addManualZInput(){
    if($('manualElevM'))return;
    const notes=$('notes');
    if(!notes)return;
    const div=document.createElement('div');
    div.className='z-manual-wrap';
    div.innerHTML='<input id="manualElevM" type="number" step="0.1" placeholder="Z / elevación manual en metros (opcional)">';
    notes.insertAdjacentElement('afterend',div);
  }

  const oldAddPoint=addPoint;
  addPoint=function(o,recenter=false){
    const z=$('manualElevM')?.value;
    if(z!==undefined&&z!==null&&String(z).trim()!=='') setElevation(o,z,'Manual');
    oldAddPoint(o,recenter);
    if($('manualElevM'))$('manualElevM').value='';
  };

  function addElevationButton(){
    const head=document.querySelector('.table-head .btns');
    if(head&&!$('calcZBtn')){
      const b=document.createElement('button');
      b.id='calcZBtn';
      b.className='btn out';
      b.onclick=()=>calculateZFromOpenTopoData();
      b.textContent='⛰️ Calcular Z';
      head.prepend(b);
    }
    const card=document.querySelector('.table-card');
    if(card&&!$('zStatus')){
      const div=document.createElement('div');
      div.id='zStatus';
      div.className='z-status';
      div.innerHTML='Fuente Z disponible: '+API_NAME+'. Máx. 100 puntos por solicitud, 1 solicitud/segundo.';
      card.querySelector('.table-head')?.insertAdjacentElement('afterend',div);
    }
  }

  async function queryElev(batch){
    const loc=batch.map(p=>`${Number(p.lat).toFixed(7)},${Number(p.lon).toFixed(7)}`).join('|');
    const res=await fetch(API_URL+'?locations='+encodeURIComponent(loc));
    if(!res.ok)throw new Error('HTTP '+res.status);
    const data=await res.json();
    if(data.status&&data.status!=='OK')throw new Error(data.status);
    return data.results||[];
  }

  window.calculateZFromOpenTopoData=async function(){
    const pts=filtered().filter(p=>Number.isFinite(+p.lat)&&Number.isFinite(+p.lon));
    if(!pts.length)return msg('No hay puntos válidos para calcular Z.');
    const status=$('zStatus');
    let done=0, ok=0;
    try{
      for(let i=0;i<pts.length;i+=100){
        const batch=pts.slice(i,i+100);
        if(status)status.textContent=`Consultando ${API_NAME}: ${done}/${pts.length} puntos...`;
        const results=await queryElev(batch);
        results.forEach((r,j)=>{
          const p=batch[j];
          if(p&&r&&Number.isFinite(+r.elevation)){setElevation(p,+r.elevation,API_NAME);ok++;}
        });
        done+=batch.length;
        save();
        if(typeof renderTable==='function')renderTable();
        if(i+100<pts.length)await wait(1100);
      }
      if(status)status.textContent=`Z calculada para ${ok}/${pts.length} punto(s). Fuente: ${API_NAME}.`;
      msg('Elevación Z agregada a la tabla como elev_m y z_fuente.');
    }catch(e){
      if(status)status.textContent='No se pudo completar la consulta Z. Revisa internet o intenta con menos puntos.';
      msg('No se pudo consultar OpenTopoData en este momento.');
    }
  };

  function patchExports(){
    const oldCsv=makeCsv;
    makeCsv=function(arr){
      try{
        let txt=oldCsv(arr);
        if(txt.includes('elev_m')&&txt.includes('z_fuente'))return txt;
        return txt;
      }catch{return oldCsv(arr)}
    };
  }

  function decorateTableHeader(){
    const head=document.querySelector('thead tr');
    if(!head)return;
    [...head.children].forEach(th=>{
      const t=(th.textContent||'').trim().toLowerCase();
      if(t==='elev_m'||t==='z_fuente')th.classList.add('z-head');
    });
  }
  const oldRender=renderTable;
  renderTable=function(){oldRender();decorateTableHeader();addElevationButton()};

  function init(){
    css();header();addManualZInput();addElevationButton();patchExports();
    if(typeof renderTable==='function')renderTable();
    msg('v1.28: Z manual y cálculo automático con OpenTopoData disponibles.');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,2500));else setTimeout(init,2500);
})();