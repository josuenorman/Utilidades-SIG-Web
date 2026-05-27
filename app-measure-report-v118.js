// v1.18 - Herramientas reales de medición en mapa y reporte imprimible.
(function(){
  const VERSION='1.18';
  const $=id=>document.getElementById(id);
  let measureMode='none';
  let vertices=[];
  let originalMapUp=null;
  const esc2=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');

  function injectStyle(){
    if($('measure118style'))return;
    const s=document.createElement('style');
    s.id='measure118style';
    s.textContent=`
      .measure-buttons{display:flex;gap:7px;flex-wrap:wrap;margin:8px 0}.measure-buttons .btn.active{background:#dc2626!important;color:white!important}.measure-result strong{color:#0f4c81}.measure-hint{font-size:11px;color:#64748b;margin-top:5px;line-height:1.3}.measure-vertex{position:absolute;transform:translate(-50%,-50%);width:13px;height:13px;border-radius:999px;background:#dc2626;border:2px solid #fff;z-index:7;box-shadow:0 3px 8px #0005}.measure-label{position:absolute;transform:translate(-50%,-110%);background:#dc2626;color:#fff;border-radius:999px;padding:3px 7px;font-size:11px;font-weight:800;z-index:8;box-shadow:0 4px 10px #0004;white-space:nowrap}.measure-svg{position:absolute;inset:0;z-index:6;pointer-events:none}.map.measure-distance{cursor:crosshair!important}.map.measure-area{cursor:cell!important}.print-summary{display:none}@media print{body{background:white!important}.hero,.manual-card,#gisModule,.map-tools,.advanced-tools .toolbox:first-child,.table-head .btns,.project-panel{display:none!important}.app{padding:0!important}.wrap{max-width:none!important}.map-card,.table-card{box-shadow:none!important;border:1px solid #999!important;page-break-inside:avoid}.map{height:150mm!important;min-height:150mm!important}.print-summary{display:block!important;margin:0 0 8px 0;padding:8px;border:1px solid #999;border-radius:8px;font-size:11px}.tablewrap{max-height:none!important;overflow:visible!important}table{font-size:8px!important}th,td{padding:3px!important}td input,td select{border:0!important;padding:0!important;font-size:8px!important;appearance:none!important}.legend,.mapinfo,.credit{font-size:8px!important}.zoom{display:none!important}}
    `;
    document.head.appendChild(s);
  }

  function header(){
    document.title='Utilidades SIG Web v'+VERSION;
    const p=document.querySelector('.hero-title p');
    if(p)p.textContent='v'+VERSION+' · Medición con regla/área en mapa, simbología, filtros y reporte imprimible con mapa + tabla.';
  }

  function replaceMeasureBox(){
    const boxes=[...document.querySelectorAll('.toolbox')];
    const box=boxes.find(b=>(b.querySelector('h3')?.textContent||'').includes('Medición'));
    if(!box)return;
    box.innerHTML=`
      <h3>📏 Medición y reporte</h3>
      <div class="measure-buttons">
        <button id="distBtn" class="btn out" onclick="startDistanceMeasure()">📏 Regla</button>
        <button id="areaBtn" class="btn out" onclick="startAreaMeasure()">⬟ Área</button>
        <button class="btn out" onclick="clearMapMeasure()">Limpiar</button>
        <button class="btn green" onclick="printMapReport()">🖨 Imprimir mapa + tabla</button>
      </div>
      <div id="measureResult" class="measure-result">Activa Regla o Área y haz clic en el mapa para dibujar.</div>
      <div class="measure-hint">Regla: dos o más clics sobre el mapa. Área: tres o más clics para formar polígono. Usa Limpiar para iniciar otra medición.</div>`;
  }

  function setMode(mode){
    measureMode=mode;vertices=[];
    $('distBtn')?.classList.toggle('active',mode==='distance');
    $('areaBtn')?.classList.toggle('active',mode==='area');
    $('map')?.classList.toggle('measure-distance',mode==='distance');
    $('map')?.classList.toggle('measure-area',mode==='area');
    updateResult();drawMap();
    msg(mode==='distance'?'Regla activa: haz clic en el mapa para medir distancia.':mode==='area'?'Área activa: haz clic en el mapa para dibujar polígono.':'Medición limpia.');
  }
  window.startDistanceMeasure=()=>setMode('distance');
  window.startAreaMeasure=()=>setMode('area');
  window.clearMapMeasure=function(){measureMode='none';vertices=[];$('distBtn')?.classList.remove('active');$('areaBtn')?.classList.remove('active');$('map')?.classList.remove('measure-distance','measure-area');updateResult();drawMap();msg('Medición limpiada.')};

  function eventLatLon(e){
    const el=$('map'),r=el.getBoundingClientRect(),w=el.clientWidth||900,h=el.clientHeight||540,s=256;
    const tlx=tx(view.lon,view.z)*s-w/2,tly=ty(view.lat,view.z)*s-h/2;
    const wx=(tlx+e.clientX-r.left)/s,wy=(tly+e.clientY-r.top)/s;
    return{lat:latFrom(wy,view.z),lon:lonFrom(wx,view.z)};
  }
  function hav(a,b){const R=6371,la1=rad(+a.lat),la2=rad(+b.lat),dlat=rad(+b.lat-+a.lat),dlon=rad(+b.lon-+a.lon);const h=Math.sin(dlat/2)**2+Math.cos(la1)*Math.cos(la2)*Math.sin(dlon/2)**2;return 2*R*Math.asin(Math.sqrt(h))}
  function lengthKm(){let d=0;for(let i=1;i<vertices.length;i++)d+=hav(vertices[i-1],vertices[i]);return d}
  function areaKm2(){if(vertices.length<3)return 0;const R=6371,lat0=rad(vertices.reduce((s,p)=>s+p.lat,0)/vertices.length);const xy=vertices.map(p=>({x:R*rad(p.lon)*Math.cos(lat0),y:R*rad(p.lat)}));let s=0;for(let i=0;i<xy.length;i++){let j=(i+1)%xy.length;s+=xy[i].x*xy[j].y-xy[j].x*xy[i].y}return Math.abs(s)/2}
  function updateResult(){
    const el=$('measureResult');if(!el)return;
    if(measureMode==='none'&&!vertices.length){el.textContent='Activa Regla o Área y haz clic en el mapa para dibujar.';return}
    if(measureMode==='distance')el.innerHTML=`<strong>Regla:</strong> ${vertices.length} punto(s) · Distancia: ${lengthKm().toFixed(3)} km`;
    else if(measureMode==='area')el.innerHTML=`<strong>Área:</strong> ${vertices.length} vértice(s) · Perímetro: ${lengthKm().toFixed(3)} km · Área: ${areaKm2().toFixed(3)} km² / ${(areaKm2()*100).toFixed(2)} ha`;
  }

  function installMapMeasure(){
    const map=$('map');if(!map||map.dataset.measure118)return;
    originalMapUp=map.onmouseup;
    map.onmouseup=function(e){
      if(measureMode==='distance'||measureMode==='area'){
        e.preventDefault();e.stopPropagation();
        vertices.push(eventLatLon(e));updateResult();drawMap();return;
      }
      if(typeof originalMapUp==='function')originalMapUp.call(map,e);
    };
    map.dataset.measure118='1';
  }

  const oldDraw=drawMap;
  drawMap=function(){
    oldDraw();
    const map=$('map');if(!map||!vertices.length)return;
    const w=map.clientWidth||900,h=map.clientHeight||540,s=256,tlx=tx(view.lon,view.z)*s-w/2,tly=ty(view.lat,view.z)*s-h/2;
    const pts=vertices.map(p=>({x:tx(p.lon,view.z)*s-tlx,y:ty(p.lat,view.z)*s-tly}));
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('class','measure-svg');svg.setAttribute('width','100%');svg.setAttribute('height','100%');
    if(pts.length>1){const poly=document.createElementNS('http://www.w3.org/2000/svg',measureMode==='area'&&pts.length>2?'polygon':'polyline');poly.setAttribute('points',pts.map(p=>`${p.x},${p.y}`).join(' '));poly.setAttribute('fill',measureMode==='area'&&pts.length>2?'rgba(20,184,166,.20)':'none');poly.setAttribute('stroke','#dc2626');poly.setAttribute('stroke-width','3');poly.setAttribute('stroke-linecap','round');poly.setAttribute('stroke-linejoin','round');svg.appendChild(poly)}
    map.appendChild(svg);
    pts.forEach((p,i)=>{const v=document.createElement('div');v.className='measure-vertex';v.style.left=p.x+'px';v.style.top=p.y+'px';map.appendChild(v);const lab=document.createElement('div');lab.className='measure-label';lab.style.left=p.x+'px';lab.style.top=p.y+'px';lab.textContent=i+1;map.appendChild(lab)});
  };

  window.printMapReport=function(){
    const old=document.querySelector('.print-summary');old?.remove();
    const pts=filtered();const div=document.createElement('div');div.className='print-summary';
    div.innerHTML=`<h2 style="margin:0 0 4px">Reporte / croquis SIG</h2><b>Proyecto:</b> ${esc2(pr().name)} &nbsp; <b>Fecha:</b> ${new Date().toLocaleString()} &nbsp; <b>Puntos filtrados:</b> ${pts.length}<br><b>Medición:</b> ${$('measureResult')?.textContent||'Sin medición activa'}<br><b>Nota:</b> El reporte imprime el mapa visible y la tabla filtrada.`;
    document.querySelector('.map-card')?.prepend(div);
    setTimeout(()=>window.print(),200);
  };

  function init(){injectStyle();header();replaceMeasureBox();installMapMeasure();updateResult();msg('v1.18: regla, área e impresión de mapa + tabla disponibles.')}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,600));else setTimeout(init,600);
})();