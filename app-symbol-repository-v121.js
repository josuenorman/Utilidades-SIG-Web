// v1.21 - Repositorio editable de simbología para gestión del riesgo e infraestructura.
(function(){
  const VERSION='1.21';
  const STORE='sig-symbol-library-v121';
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');

  const BASE=[
    ['pluviometro','🌧️','Pluviómetro','#2563eb','SAT comunitario'],['limnimetro','🌊','Limnímetro / regla limnimétrica','#0891b2','SAT comunitario'],['punto_monitoreo','📍','Punto de monitoreo','#0ea5e9','SAT comunitario'],['radio','📡','Radio comunicación','#7c3aed','SAT comunitario'],['alerta','🔔','Punto de alerta','#f97316','SAT comunitario'],['brigada','🧑‍🤝‍🧑','Brigada comunitaria','#16a34a','SAT comunitario'],
    ['sitio_critico','⚠️','Sitio crítico','#ea580c','Gestión del riesgo'],['evacuacion','🚩','Punto de evacuación','#dc2626','Gestión del riesgo'],['albergue','🏠','Albergue','#9333ea','Gestión del riesgo'],['zona_peligro','🔴','Zona de peligro','#b91c1c','Gestión del riesgo'],['zona_precaucion','🟡','Zona de precaución','#eab308','Gestión del riesgo'],['zona_segura','🟢','Zona segura','#22c55e','Gestión del riesgo'],['emergencia','🆘','Punto de emergencia','#e11d48','Gestión del riesgo'],
    ['comunidad','🏘️','Comunidad','#16a34a','Infraestructura y territorio'],['vivienda','🏡','Vivienda','#84cc16','Infraestructura y territorio'],['escuela','🏫','Escuela','#0284c7','Infraestructura y territorio'],['salud','🏥','Centro de salud','#14b8a6','Infraestructura y territorio'],['puente','🌉','Puente','#64748b','Infraestructura y territorio'],['camino','🛣️','Camino / acceso','#78716c','Infraestructura y territorio'],['agua','🚰','Sistema de agua / pozo','#06b6d4','Infraestructura y territorio'],['energia','⚡','Energía eléctrica','#facc15','Infraestructura y territorio'],['edificio_publico','🏢','Edificio público','#475569','Infraestructura y territorio'],['iglesia','⛪','Iglesia / referencia','#a855f7','Infraestructura y territorio'],['otro','📌','Otro','#475569','General']
  ].map(([id,icon,label,color,group])=>({id,icon,label,color,group}));

  function loadSymbols(){try{return JSON.parse(localStorage.getItem(STORE))||BASE}catch{return BASE}}
  function saveSymbols(a){localStorage.setItem(STORE,JSON.stringify(a))}
  function symbols(){return loadSymbols()}
  function sym(id){return symbols().find(s=>s.id===id)||symbols().find(s=>s.id==='otro')||BASE.at(-1)}
  function opts(sel){return symbols().map(s=>`<option value="${s.id}" ${s.id===sel?'selected':''}>${s.icon} ${s.label}</option>`).join('')}

  function injectStyle(){
    if($('symbol121style'))return;
    const st=document.createElement('style');st.id='symbol121style';st.textContent=`
      .symbol-repo{border:1px solid #d9e2ec;background:#fbfdff;border-radius:16px;padding:12px;margin-top:10px}.symbol-repo h3{margin:0 0 8px;color:#0f4c81;font-size:15px}.symbol-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(185px,1fr));gap:7px;max-height:220px;overflow:auto;padding-right:3px}.symbol-item{display:flex;align-items:center;gap:8px;border:1px solid #e2e8f0;background:white;border-radius:12px;padding:7px}.symbol-dot{width:28px;height:28px;border-radius:999px;display:flex;align-items:center;justify-content:center;color:white;border:2px solid #fff;box-shadow:0 4px 10px #0f172a25;flex:0 0 auto}.symbol-item b{font-size:12px;display:block}.symbol-item span{font-size:10px;color:#64748b}.symbol-form{display:grid;grid-template-columns:90px 1fr 90px 1fr auto;gap:7px;margin-top:10px}.symbol-form input,.symbol-form select{padding:7px 8px;font-size:12px}.symbol-select{min-width:175px}.marker.cat{width:30px!important;height:30px!important;font-size:16px!important}.legend-row{font-size:11px}.legend-dot{display:inline-flex!important;align-items:center;justify-content:center;color:white;font-size:10px}.symbol-mini{display:inline-flex;align-items:center;gap:5px}.symbol-color-input{width:42px!important;min-width:42px!important;padding:2px!important}.tablewrap table th,.tablewrap table td{vertical-align:middle}@media(max-width:900px){.symbol-form{grid-template-columns:1fr 1fr}.symbol-form button{grid-column:1/-1}}
    `;document.head.appendChild(st);
  }
  function header(){document.title='Utilidades SIG Web v'+VERSION;const p=document.querySelector('.hero-title p');if(p)p.textContent='v'+VERSION+' · Repositorio editable de simbología para gestión del riesgo, SAT comunitario e infraestructura.'}

  function ensureManualSymbol(){
    const card=document.querySelector('.manual-card');if(!card||$('pointCategory'))return;
    const notes=$('notes');const sel=document.createElement('select');sel.id='pointCategory';sel.className='symbol-select';sel.innerHTML=opts('otro');sel.title='Simbología del punto';notes?.insertAdjacentElement('afterend',sel);
  }

  function ensureRepoPanel(){
    const gis=$('gisModule');if(!gis||$('symbolRepo'))return;
    const box=document.createElement('div');box.id='symbolRepo';box.className='symbol-repo';
    box.innerHTML=`<h3>🎨 Repositorio de simbología</h3><p class="module-note">Biblioteca editable para gestión del riesgo, SAT comunitario e infraestructura. Puedes definir ícono y color del círculo.</p><div id="symbolGrid" class="symbol-grid"></div><div class="symbol-form"><input id="newSymIcon" placeholder="Ícono" value="📍"><input id="newSymLabel" placeholder="Nombre de categoría"><input id="newSymColor" type="color" value="#0f4c81"><select id="newSymGroup"><option>SAT comunitario</option><option>Gestión del riesgo</option><option>Infraestructura y territorio</option><option>General</option></select><button class="btn" onclick="addSymbolCategory()">Agregar</button></div><div class="module-actions"><button class="btn out" onclick="resetSymbolLibrary()">Restaurar base</button></div>`;
    gis.appendChild(box);renderSymbolGrid();
  }
  function renderSymbolGrid(){
    const grid=$('symbolGrid');if(!grid)return;
    grid.innerHTML=symbols().map(s=>`<div class="symbol-item"><div class="symbol-dot" style="background:${s.color}">${s.icon}</div><div><b>${esc(s.label)}</b><span>${esc(s.group)}</span></div></div>`).join('');
  }
  window.addSymbolCategory=function(){
    const icon=($('newSymIcon')?.value||'📍').trim(),label=($('newSymLabel')?.value||'').trim(),color=$('newSymColor')?.value||'#0f4c81',group=$('newSymGroup')?.value||'General';
    if(!label)return msg('Escribe el nombre de la nueva categoría.');
    const id=label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'')||('cat_'+Date.now());
    const arr=symbols().filter(s=>s.id!==id);arr.push({id,icon,label,color,group});saveSymbols(arr);$('newSymLabel').value='';refreshSymbolsUI();msg('Categoría de simbología agregada: '+label);
  };
  window.resetSymbolLibrary=function(){saveSymbols(BASE);refreshSymbolsUI();msg('Repositorio de simbología restaurado a la biblioteca base.')};
  function refreshSymbolsUI(){renderSymbolGrid();document.querySelectorAll('select[data-symbol-select="1"],#pointCategory,#filterCategory').forEach(sel=>{const old=sel.value;sel.innerHTML=(sel.id==='filterCategory'?'<option value="">Todas las categorías</option>':'')+opts(old);sel.value=old});renderTable();drawMap()}

  function getFilters(p){
    const q=(($('pointFilter')?.value||'')+'').toLowerCase(),n=(($('filterName')?.value||'')+'').toLowerCase(),cat=$('filterCategory')?.value||'',src=$('filterSource')?.value||'',zone=$('filterZone')?.value||'';
    if(q&&!JSON.stringify(p).toLowerCase().includes(q))return false;if(n&&!(p.name||'').toLowerCase().includes(n))return false;if(cat&&(p.category||'otro')!==cat)return false;if(src&&(p.source||'')!==src)return false;if(zone&&String(p.zone||'')!==zone)return false;return true;
  }
  filtered=function(){return pr().points.filter(getFilters)};

  const oldAddPoint=addPoint;addPoint=function(o,recenter=false){o.category=o.category||$('pointCategory')?.value||'otro';oldAddPoint(o,recenter)};
  const oldAddMany=addMany;addMany=function(arr){oldAddMany(arr.map(o=>({...o,category:o.category||'otro'})))};

  function updateFilterOptions(){const f=$('filterCategory');if(f){const old=f.value;f.innerHTML='<option value="">Todas las categorías</option>'+opts(old);f.value=old}const s=$('filterSource');if(s){const cur=s.value,src=[...new Set(pr().points.map(p=>p.source).filter(Boolean))].sort();s.innerHTML='<option value="">Todas las fuentes</option>'+src.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');s.value=src.includes(cur)?cur:''}}

  renderTable=function(){
    updateFilterOptions();let pts=filtered(),body=$('tbody');if(!body)return;
    const head=document.querySelector('thead tr');if(head)head.innerHTML='<th>Medir</th><th>N°</th><th>Nombre</th><th>Simbología</th><th>Fuente</th><th>Lat</th><th>Lon</th><th>Este</th><th>Norte</th><th>Zona</th><th>Hem</th><th>Notas</th><th>Zoom</th><th></th>';
    body.innerHTML=pts.map(p=>{let s=sym(p.category);return `<tr class="${p.id===selectedPointId?'selected':''}" onclick="zoomToPoint('${p.id}',17)"><td><input class="measure-check" type="checkbox" onclick="event.stopPropagation()" onchange="toggleMeasure&&toggleMeasure('${p.id}',this.checked)"></td><td><b>${pointNo(p)}</b></td><td><input onclick="event.stopPropagation()" value="${esc(p.name)}" oninput="edit('${p.id}','name',this.value)"></td><td><span class="symbol-mini"><span class="symbol-dot" style="background:${s.color}">${s.icon}</span><select data-symbol-select="1" class="symbol-select" onclick="event.stopPropagation()" onchange="edit('${p.id}','category',this.value);renderTable()">${opts(p.category||'otro')}</select></span></td><td><input onclick="event.stopPropagation()" value="${esc(p.source)}" oninput="edit('${p.id}','source',this.value)"></td><td><input onclick="event.stopPropagation()" value="${fix(p.lat,7)}" oninput="edit('${p.id}','lat',this.value)"></td><td><input onclick="event.stopPropagation()" value="${fix(p.lon,7)}" oninput="edit('${p.id}','lon',this.value)"></td><td><input onclick="event.stopPropagation()" value="${fix(p.easting,2)}" oninput="edit('${p.id}','easting',this.value)"></td><td><input onclick="event.stopPropagation()" value="${fix(p.northing,2)}" oninput="edit('${p.id}','northing',this.value)"></td><td><input onclick="event.stopPropagation()" value="${esc(p.zone)}" oninput="edit('${p.id}','zone',this.value)"></td><td><input onclick="event.stopPropagation()" value="${esc(p.hemisphere||'N')}" oninput="edit('${p.id}','hemisphere',this.value)"></td><td><input onclick="event.stopPropagation()" value="${esc(p.notes)}" oninput="edit('${p.id}','notes',this.value)"></td><td><button onclick="event.stopPropagation();zoomToPoint('${p.id}',18)">🔎</button></td><td><button onclick="event.stopPropagation();del('${p.id}')">🗑️</button></td></tr>`}).join('')||'<tr><td colspan="14" class="emptyrow">No hay coordenadas guardadas.</td></tr>';drawMap();
  };

  drawMap=function(){
    let el=$('map');if(!el)return;let pts=filtered().filter(p=>Number.isFinite(+p.lat)&&Number.isFinite(+p.lon)),base=$('base')?.value||'osm',m=maps[base]||maps.osm,w=el.clientWidth||900,h=el.clientHeight||540,ts=256,cx=tx(view.lon,view.z)*ts,cy=ty(view.lat,view.z)*ts,tlx=cx-w/2,tly=cy-h/2,max=2**view.z,html='';
    for(let x=Math.floor(tlx/ts);x<=Math.floor((tlx+w)/ts);x++)for(let y=Math.floor(tly/ts);y<=Math.floor((tly+h)/ts);y++)if(y>=0&&y<max){let xx=((x%max)+max)%max;html+=`<img class="tile" src="${tileUrl(m.u,view.z,xx,y)}" style="left:${x*ts-tlx}px;top:${y*ts-tly}px">`;if(m.o)html+=`<img class="tile labeltile" src="${tileUrl(m.o,view.z,xx,y)}" style="left:${x*ts-tlx}px;top:${y*ts-tly}px">`}
    pts.forEach(p=>{let x=tx(+p.lon,view.z)*ts-tlx,y=ty(+p.lat,view.z)*ts-tly,lab=esc(labelValue(p)),s=sym(p.category);html+=`<div class="marker cat ${p.id===selectedPointId?'selected':''}" style="left:${x}px;top:${y}px;background:${s.color}"><span>${s.icon}</span></div>`;if(lab)html+=`<div class="point-label" style="left:${x}px;top:${y}px">${lab}</div>`});
    let used=[...new Set(pts.map(p=>p.category||'otro'))];html+=`<div class="mapinfo"><b>${captureMode?'Modo captura activo':'Modo navegación'}</b><br>${m.n} · zoom ${view.z}</div><div class="zoom"><button onclick="event.stopPropagation();view.z=Math.min(18,view.z+1);drawMap()">+</button><button onclick="event.stopPropagation();view.z=Math.max(3,view.z-1);drawMap()">−</button><button onclick="event.stopPropagation();overview()">⌂</button></div><div class="legend"><b>Simbología</b>${used.map(k=>{let s=sym(k);return `<div class="legend-row"><span class="legend-dot" style="background:${s.color}">${s.icon}</span> ${esc(s.label)}</div>`}).join('')}</div><div class="credit">${m.n}</div>`;el.innerHTML=html;
  };

  makeCsv=function(arr){let h=['numero','nombre','categoria','icono','color','fuente','latitud','longitud','este_utm','norte_utm','zona','hemisferio','notas'];return[h,...arr.map(p=>{let s=sym(p.category);return[pointNo(p),p.name,s.label,s.icon,s.color,p.source,fix(p.lat,8),fix(p.lon,8),fix(p.easting,2),fix(p.northing,2),p.zone,p.hemisphere,p.notes||'']})].map(r=>r.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',')).join('\n')};
  exportGeoJSON=function(){let gj={type:'FeatureCollection',name:pr().name,features:pr().points.filter(p=>Number.isFinite(+p.lat)&&Number.isFinite(+p.lon)).map(p=>{let s=sym(p.category);return{type:'Feature',properties:{numero:pointNo(p),nombre:p.name||'',categoria:s.label,icono:s.icon,color:s.color,fuente:p.source||'',este_utm:p.easting||'',norte_utm:p.northing||'',zona:p.zone||'',hemisferio:p.hemisphere||'',notas:p.notes||''},geometry:{type:'Point',coordinates:[+p.lon,+p.lat]}}})};download(pr().name.replaceAll(' ','_')+'.geojson',new Blob([JSON.stringify(gj,null,2)],{type:'application/geo+json'}));msg('GeoJSON exportado con simbología.')};

  function init(){injectStyle();header();ensureManualSymbol();ensureRepoPanel();refreshSymbolsUI();msg('v1.21: repositorio editable de simbología agregado.')}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,900));else setTimeout(init,900);
})();