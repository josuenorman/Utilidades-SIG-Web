// v1.30 - Función extra oculta: capas Shapefile punto/línea/polígono con simbología y exportación GeoJSON.
(function(){
  const VERSION='1.30';
  const $=id=>document.getElementById(id);
  let extraLayers=[];
  const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');

  function css(){
    if($('extra130style'))return;
    const s=document.createElement('style');
    s.id='extra130style';
    s.textContent=`
      #zStatus,#calcZBtn,#manualElevM,.z-manual-wrap{display:none!important}
      .extra-panel{margin-top:10px;border:1px solid #d9e2ec;border-radius:16px;background:#fff;overflow:hidden}.extra-toggle{width:100%;border:0;background:linear-gradient(135deg,#eef6fb,#e8faf6);color:#0f4c81;padding:11px 13px;font-weight:900;text-align:left;display:flex;justify-content:space-between;cursor:pointer}.extra-body{display:none;padding:12px;border-top:1px solid #d9e2ec}.extra-panel.open .extra-body{display:block}.extra-grid{display:grid;grid-template-columns:1.2fr .8fr .8fr .9fr;gap:8px;align-items:end}.extra-grid input,.extra-grid select{padding:8px}.extra-list{margin-top:10px;display:grid;gap:7px}.extra-layer{display:grid;grid-template-columns:1fr auto auto auto;gap:8px;align-items:center;border:1px solid #e2e8f0;border-radius:12px;background:#fbfdff;padding:8px}.extra-dot{width:18px;height:18px;border-radius:999px;display:inline-block;border:2px solid white;box-shadow:0 2px 8px #0f172a33}.extra-name{font-weight:900;color:#0f172a}.extra-meta{font-size:11px;color:#64748b}.extra-line{position:absolute;height:0;border-top:3px solid;transform-origin:0 0;z-index:3;pointer-events:none}.extra-poly{position:absolute;z-index:2;pointer-events:none}.extra-point{position:absolute;transform:translate(-50%,-50%);width:18px;height:18px;border-radius:999px;border:2px solid #fff;z-index:4;box-shadow:0 4px 12px #0f172a55;pointer-events:none}.extra-help{font-size:11px;color:#64748b;margin-top:6px;line-height:1.35}@media(max-width:900px){.extra-grid,.extra-layer{grid-template-columns:1fr}}
    `;
    document.head.appendChild(s);
  }

  function header(){
    document.title='Utilidades SIG Web v'+VERSION;
    const p=document.querySelector('.hero-title p');
    if(p)p.textContent='v'+VERSION+' · Capas extra Shapefile de puntos, líneas y polígonos con simbología y exportación GeoJSON.';
  }

  function panel(){
    const gis=$('gisModule');
    if(!gis||$('extraLayersPanel'))return;
    const div=document.createElement('div');
    div.id='extraLayersPanel';
    div.className='extra-panel';
    div.innerHTML=`<button class="extra-toggle" onclick="toggleExtraLayersPanel()"><span>🧩 Funciones extra: capas Shapefile</span><span>⌄</span></button><div class="extra-body"><div class="extra-grid"><label>Shapefile ZIP punto/línea/polígono<input id="extraShp" type="file" accept=".zip"></label><label>Nombre de capa<input id="extraName" placeholder="Ej. Zonas críticas"></label><label>Color<input id="extraColor" type="color" value="#dc2626"></label><label>Tipo visual<select id="extraStyle"><option value="auto">Automático</option><option value="point">Punto</option><option value="line">Línea</option><option value="polygon">Polígono</option></select></label></div><div class="module-actions"><button class="btn" onclick="loadExtraShapefile()">Cargar capa</button><button class="btn green" onclick="exportExtraLayersGeoJSON()">Exportar capas GeoJSON</button><button class="btn out" onclick="clearExtraLayers()">Limpiar capas</button></div><div class="extra-help">Esta función extra no reemplaza la tabla principal. Sirve para visualizar capas de apoyo, cambiar color y exportarlas como GeoJSON.</div><div id="extraLayersList" class="extra-list"></div></div>`;
    gis.appendChild(div);
  }
  window.toggleExtraLayersPanel=function(){const p=$('extraLayersPanel');if(p)p.classList.toggle('open')};

  function geomType(f){return f?.geometry?.type||'Unknown'}
  function layerType(features){const t=geomType(features[0]||{});if(t.includes('Point'))return'point';if(t.includes('Line'))return'line';if(t.includes('Polygon'))return'polygon';return'auto'}
  function featureCoords(f){return f.geometry?.coordinates||[]}
  function firstCoord(g){const c=g.coordinates;if(!c)return null;if(g.type==='Point')return c;if(g.type==='MultiPoint'||g.type==='LineString')return c[0];if(g.type==='MultiLineString'||g.type==='Polygon')return c[0]?.[0];if(g.type==='MultiPolygon')return c[0]?.[0]?.[0];return null}
  function validLonLat(c){return Array.isArray(c)&&Math.abs(c[0])<=180&&Math.abs(c[1])<=90}

  window.loadExtraShapefile=async function(){
    const file=$('extraShp')?.files?.[0];
    if(!file)return msg('Selecciona un Shapefile ZIP.');
    try{
      await loadScript('https://cdn.jsdelivr.net/npm/shpjs@latest/dist/shp.min.js');
      const gj=await shp(await file.arrayBuffer());
      let features=(gj.type==='FeatureCollection'?gj.features:(Array.isArray(gj)?gj.flatMap(g=>g.features||[]):[])).filter(f=>f.geometry&&validLonLat(firstCoord(f.geometry)));
      if(!features.length)return msg('No se detectaron geometrías válidas en WGS84.');
      const type=$('extraStyle')?.value==='auto'?layerType(features):$('extraStyle')?.value;
      const layer={id:'ly_'+Date.now(),name:$('extraName')?.value||file.name.replace(/\.zip$/i,''),color:$('extraColor')?.value||'#dc2626',type,features};
      extraLayers.push(layer);
      renderExtraList();drawMap();msg('Capa cargada: '+layer.name+' ('+features.length+' entidad(es)).');
    }catch(e){msg('No se pudo cargar la capa Shapefile. Verifica que el ZIP incluya .shp, .shx, .dbf y .prj.');}
  };
  window.clearExtraLayers=function(){extraLayers=[];renderExtraList();drawMap();msg('Capas extra limpiadas.')};
  window.removeExtraLayer=function(id){extraLayers=extraLayers.filter(l=>l.id!==id);renderExtraList();drawMap()};
  window.changeExtraColor=function(id,color){const l=extraLayers.find(x=>x.id===id);if(l){l.color=color;renderExtraList();drawMap()}};

  function renderExtraList(){
    const box=$('extraLayersList');if(!box)return;
    box.innerHTML=extraLayers.map(l=>`<div class="extra-layer"><div><span class="extra-dot" style="background:${l.color}"></span> <span class="extra-name">${esc(l.name)}</span><div class="extra-meta">${l.type} · ${l.features.length} entidad(es)</div></div><input type="color" value="${l.color}" onchange="changeExtraColor('${l.id}',this.value)"><button class="btn out" onclick="removeExtraLayer('${l.id}')">Quitar</button></div>`).join('')||'<div class="extra-help">No hay capas extra cargadas.</div>';
  }

  function projectCoord(c){
    const map=$('map'),w=map.clientWidth||900,h=map.clientHeight||540,s=256,tlx=tx(view.lon,view.z)*s-w/2,tly=ty(view.lat,view.z)*s-h/2;
    return{x:tx(c[0],view.z)*s-tlx,y:ty(c[1],view.z)*s-tly};
  }
  function lineSeg(a,b,color){const dx=b.x-a.x,dy=b.y-a.y,len=Math.sqrt(dx*dx+dy*dy),ang=Math.atan2(dy,dx)*180/Math.PI;return`<div class="extra-line" style="left:${a.x}px;top:${a.y}px;width:${len}px;transform:rotate(${ang}deg);border-color:${color}"></div>`}
  function renderGeom(f,l){
    const g=f.geometry;if(!g)return'';let html='';
    const drawLine=coords=>{for(let i=1;i<coords.length;i++){if(validLonLat(coords[i-1])&&validLonLat(coords[i]))html+=lineSeg(projectCoord(coords[i-1]),projectCoord(coords[i]),l.color)}};
    const drawPoint=c=>{if(validLonLat(c)){const p=projectCoord(c);html+=`<div class="extra-point" style="left:${p.x}px;top:${p.y}px;background:${l.color}"></div>`}}
    const drawPoly=ring=>{const pts=ring.filter(validLonLat).map(projectCoord);if(pts.length>2){html+=`<svg class="extra-poly" width="100%" height="100%" style="inset:0"><polygon points="${pts.map(p=>p.x+','+p.y).join(' ')}" fill="${l.color}33" stroke="${l.color}" stroke-width="2"></polygon></svg>`}}
    if(g.type==='Point')drawPoint(g.coordinates);
    if(g.type==='MultiPoint')g.coordinates.forEach(drawPoint);
    if(g.type==='LineString')drawLine(g.coordinates);
    if(g.type==='MultiLineString')g.coordinates.forEach(drawLine);
    if(g.type==='Polygon')drawPoly(g.coordinates[0]||[]);
    if(g.type==='MultiPolygon')g.coordinates.forEach(poly=>drawPoly(poly[0]||[]));
    return html;
  }
  const oldDraw=drawMap;
  drawMap=function(){oldDraw();const map=$('map');if(!map||!extraLayers.length)return;let html='';extraLayers.forEach(l=>l.features.forEach(f=>html+=renderGeom(f,l)));map.insertAdjacentHTML('beforeend',html)};

  window.exportExtraLayersGeoJSON=function(){
    if(!extraLayers.length)return msg('No hay capas extra para exportar.');
    const features=[];
    extraLayers.forEach(l=>l.features.forEach(f=>features.push({...f,properties:{...(f.properties||{}),_capa:l.name,_tipo:l.type,_color:l.color}})));
    const gj={type:'FeatureCollection',name:'capas_extra_utilidades_sig',features};
    download('capas_extra_utilidades_sig.geojson',new Blob([JSON.stringify(gj,null,2)],{type:'application/geo+json'}));
    msg('Capas extra exportadas como GeoJSON.');
  };

  function init(){css();header();panel();renderExtraList();msg('v1.30: cálculo Z retirado y función extra de capas Shapefile activada.');}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,3200));else setTimeout(init,3200);
})();