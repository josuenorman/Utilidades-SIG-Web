// v1.20 - Menú de medición compacto dentro del mapa e impresión separada en barra del mapa.
(function(){
  const VERSION='1.20';
  const $=id=>document.getElementById(id);
  let mode='none';
  let verts=[];
  let down=null;
  const safe=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');

  function css(){
    if($('measure119style'))return;
    const s=document.createElement('style');s.id='measure119style';s.textContent=`
      .measure-map-menu{position:absolute;left:12px;top:12px;z-index:15;background:rgba(255,255,255,.96);border:1px solid #d9e2ec;border-radius:12px;padding:5px;box-shadow:0 8px 20px rgba(15,23,42,.16);display:flex;gap:4px;align-items:center;max-width:max-content}
      .measure-map-menu button{border:1px solid #d9e2ec;background:white;color:#0f4c81;border-radius:9px;padding:6px 8px;font-size:11px;font-weight:800;cursor:pointer;line-height:1}.measure-map-menu button.active{background:#0f4c81;color:#fff;border-color:#0f4c81}.measure-readout{position:absolute;left:12px;top:58px;z-index:15;background:rgba(15,76,129,.92);color:#fff;border-radius:10px;padding:5px 8px;font-size:11px;font-weight:700;box-shadow:0 7px 16px rgba(15,23,42,.18);max-width:calc(100% - 24px);pointer-events:none}
      .measure-svg{position:absolute;inset:0;z-index:13;pointer-events:none}.measure-v{position:absolute;z-index:14;transform:translate(-50%,-50%);width:11px;height:11px;border-radius:999px;background:#dc2626;border:2px solid #fff;box-shadow:0 3px 8px #0006}.measure-num{position:absolute;z-index:14;transform:translate(-50%,-125%);background:#dc2626;color:#fff;border-radius:999px;padding:1px 5px;font-size:10px;font-weight:900;box-shadow:0 4px 10px #0005}.map.measure-mode{cursor:crosshair!important}.print-summary{display:none}.toolbox.measure-hidden{display:none!important}.print-map-btn{white-space:nowrap}.print-map-btn strong{font-weight:900}
      @media print{body{background:white!important}.hero,.manual-card,#gisModule,.map-tools,.advanced-tools,.measure-map-menu,.measure-readout,.zoom,.mapinfo,.credit{display:none!important}.app{padding:0!important}.wrap{max-width:none!important}.map-card,.table-card{box-shadow:none!important;border:1px solid #999!important;page-break-inside:avoid}.map{height:150mm!important;min-height:150mm!important}.print-summary{display:block!important;margin:0 0 8px 0;padding:8px;border:1px solid #999;border-radius:8px;font-size:11px}.tablewrap{max-height:none!important;overflow:visible!important}table{font-size:8px!important}th,td{padding:3px!important}td input,td select{border:0!important;padding:0!important;font-size:8px!important;appearance:none!important}}
    `;document.head.appendChild(s);
  }
  function title(){document.title='Utilidades SIG Web v'+VERSION;const p=document.querySelector('.hero-title p');if(p)p.textContent='v'+VERSION+' · Medición compacta dentro del mapa e impresión de mapa + tabla desde la barra del mapa.'}
  function hideOldMeasureBox(){[...document.querySelectorAll('.toolbox')].forEach(b=>{if((b.querySelector('h3')?.textContent||'').includes('Medición'))b.classList.add('measure-hidden')})}
  function addPrintButton(){
    const tools=document.querySelector('.map-tools');
    if(!tools||$('printMapReportBtn'))return;
    const b=document.createElement('button');
    b.id='printMapReportBtn';
    b.className='btn green print-map-btn';
    b.onclick=()=>printMapTableReport();
    b.innerHTML='🖨 <strong>Reporte</strong>';
    tools.appendChild(b);
  }
  function setMode(m){mode=m;verts=[];if(typeof captureMode!=='undefined')captureMode=false;const b=$('captureBtn');if(b){b.textContent='📌 Capturar punto';b.classList.remove('green')}drawMap();msg(m==='dist'?'Regla activa: haz clic en el mapa para medir distancia.':m==='area'?'Área activa: haz clic en el mapa para dibujar polígono.':'Medición limpiada.')}
  window.mapMeasureDistance=()=>setMode('dist');
  window.mapMeasureArea=()=>setMode('area');
  window.mapMeasureClear=()=>setMode('none');
  function latlonFromEvent(e){const map=$('map'),r=map.getBoundingClientRect(),w=map.clientWidth||900,h=map.clientHeight||540,s=256,tlx=tx(view.lon,view.z)*s-w/2,tly=ty(view.lat,view.z)*s-h/2;return{lat:latFrom((tly+e.clientY-r.top)/s,view.z),lon:lonFrom((tlx+e.clientX-r.left)/s,view.z)}}
  function hav(a,b){const R=6371,la1=rad(+a.lat),la2=rad(+b.lat),dlat=rad(+b.lat-+a.lat),dlon=rad(+b.lon-+a.lon),h=Math.sin(dlat/2)**2+Math.cos(la1)*Math.cos(la2)*Math.sin(dlon/2)**2;return 2*R*Math.asin(Math.sqrt(h))}
  function dist(){let d=0;for(let i=1;i<verts.length;i++)d+=hav(verts[i-1],verts[i]);return d}
  function area(){if(verts.length<3)return 0;const R=6371,lat0=rad(verts.reduce((s,p)=>s+p.lat,0)/verts.length),xy=verts.map(p=>({x:R*rad(p.lon)*Math.cos(lat0),y:R*rad(p.lat)}));let s=0;for(let i=0;i<xy.length;i++){let j=(i+1)%xy.length;s+=xy[i].x*xy[j].y-xy[j].x*xy[i].y}return Math.abs(s)/2}
  function readout(){if(mode==='none')return 'Medición: desactivada';if(mode==='dist')return `Regla: ${verts.length} punto(s) · ${dist().toFixed(3)} km`;return `Área: ${verts.length} vértice(s) · perímetro ${dist().toFixed(3)} km · área ${area().toFixed(3)} km² / ${(area()*100).toFixed(2)} ha`}
  function project(p){const map=$('map'),w=map.clientWidth||900,h=map.clientHeight||540,s=256,tlx=tx(view.lon,view.z)*s-w/2,tly=ty(view.lat,view.z)*s-h/2;return{x:tx(p.lon,view.z)*s-tlx,y:ty(p.lat,view.z)*s-tly}}
  function addOverlay(){const map=$('map');if(!map)return;map.classList.toggle('measure-mode',mode!=='none');const menu=document.createElement('div');menu.className='measure-map-menu';menu.innerHTML=`<button title="Medir distancia" class="${mode==='dist'?'active':''}" onclick="event.stopPropagation();mapMeasureDistance()">📏</button><button title="Calcular área" class="${mode==='area'?'active':''}" onclick="event.stopPropagation();mapMeasureArea()">⬟</button><button title="Limpiar medición" onclick="event.stopPropagation();mapMeasureClear()">✕</button>`;map.appendChild(menu);if(mode!=='none'||verts.length){const out=document.createElement('div');out.className='measure-readout';out.textContent=readout();map.appendChild(out)}if(!verts.length)return;const pts=verts.map(project),svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('class','measure-svg');svg.setAttribute('width','100%');svg.setAttribute('height','100%');if(pts.length>1){const el=document.createElementNS('http://www.w3.org/2000/svg',mode==='area'&&pts.length>2?'polygon':'polyline');el.setAttribute('points',pts.map(p=>`${p.x},${p.y}`).join(' '));el.setAttribute('fill',mode==='area'&&pts.length>2?'rgba(20,184,166,.22)':'none');el.setAttribute('stroke','#dc2626');el.setAttribute('stroke-width','3');el.setAttribute('stroke-linecap','round');el.setAttribute('stroke-linejoin','round');svg.appendChild(el)}map.appendChild(svg);pts.forEach((p,i)=>{let v=document.createElement('div');v.className='measure-v';v.style.left=p.x+'px';v.style.top=p.y+'px';map.appendChild(v);let n=document.createElement('div');n.className='measure-num';n.style.left=p.x+'px';n.style.top=p.y+'px';n.textContent=i+1;map.appendChild(n)})}
  const previousDraw=drawMap;drawMap=function(){previousDraw();addOverlay()};
  function installClickMeasure(){const map=$('map');if(!map||map.dataset.measure119)return;map.addEventListener('mousedown',e=>{down={x:e.clientX,y:e.clientY}},true);map.addEventListener('click',e=>{if(mode==='none')return;if(e.target.closest('.measure-map-menu'))return;const moved=down&&(Math.abs(e.clientX-down.x)+Math.abs(e.clientY-down.y)>6);down=null;if(moved)return;e.preventDefault();e.stopImmediatePropagation();verts.push(latlonFromEvent(e));drawMap()},true);map.dataset.measure119='1'}
  window.printMapTableReport=function(){const old=document.querySelector('.print-summary');old?.remove();const div=document.createElement('div');div.className='print-summary';const pts=filtered();div.innerHTML=`<h2 style="margin:0 0 4px">Reporte / croquis SIG</h2><b>Proyecto:</b> ${safe(pr().name)} &nbsp; <b>Fecha:</b> ${new Date().toLocaleString()} &nbsp; <b>Puntos filtrados:</b> ${pts.length}<br><b>Medición:</b> ${safe(readout())}<br><b>Contenido:</b> Mapa visible y tabla filtrada de puntos.`;document.querySelector('.map-card')?.prepend(div);setTimeout(()=>window.print(),150)};
  function init(){css();title();hideOldMeasureBox();addPrintButton();installClickMeasure();drawMap();msg('v1.20: medición compacta en mapa y reporte separado en barra del mapa.')}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,800));else setTimeout(init,800);
})();