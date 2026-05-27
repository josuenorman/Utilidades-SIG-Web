// v1.17 - Simbología, filtros, mediciones y reporte PDF.
(function(){
  const VERSION='1.17';
  const $=id=>document.getElementById(id);
  const CATS={
    pluviometro:{label:'Pluviómetro',icon:'🌧️',color:'#2563eb'},
    limnimetro:{label:'Limnímetro',icon:'🌊',color:'#0891b2'},
    comunidad:{label:'Comunidad',icon:'🏘️',color:'#16a34a'},
    evacuacion:{label:'Punto de evacuación',icon:'🚩',color:'#dc2626'},
    albergue:{label:'Albergue',icon:'🏠',color:'#9333ea'},
    infraestructura:{label:'Infraestructura',icon:'🏗️',color:'#f59e0b'},
    sitio_critico:{label:'Sitio crítico',icon:'⚠️',color:'#ea580c'},
    otro:{label:'Otro',icon:'📍',color:'#475569'}
  };
  let measureIds=new Set();
  const catOf=p=>CATS[p.category]||CATS.otro;
  const catOptions=sel=>Object.entries(CATS).map(([k,c])=>`<option value="${k}" ${k===sel?'selected':''}>${c.icon} ${c.label}</option>`).join('');
  const clean=v=>String(v??'').toLowerCase();

  function injectStyle(){
    if($('adv117style'))return;
    const s=document.createElement('style');s.id='adv117style';s.textContent=`
      .advanced-tools{display:grid;grid-template-columns:1.1fr .9fr;gap:10px;margin-top:10px}.toolbox{border:1px solid #d9e2ec;background:#fbfdff;border-radius:16px;padding:12px}.toolbox h3{margin:0 0 8px;font-size:15px;color:#0f4c81}.filter-grid{display:grid;grid-template-columns:repeat(4,minmax(120px,1fr));gap:8px}.filter-grid input,.filter-grid select{padding:8px 9px;font-size:12px}.measure-result{background:#e8faf6;border:1px solid #99f6e4;border-radius:12px;padding:8px;font-size:12px;color:#134e4a;line-height:1.35}.marker.cat{width:28px;height:28px;border-radius:999px;display:flex;align-items:center;justify-content:center;color:white;border:2px solid white;box-shadow:0 8px 18px #0f172a40;font-size:15px;padding:0}.marker.cat span{transform:translateY(-1px)}.legend{position:absolute;left:12px;bottom:12px;background:#fffffff2;border-radius:12px;padding:8px 10px;font-size:11px;box-shadow:0 8px 22px #0f172a20;z-index:5;max-width:230px}.legend-row{display:flex;align-items:center;gap:6px;margin:2px 0}.legend-dot{width:13px;height:13px;border-radius:999px;display:inline-block}.cat-select{min-width:135px}.measure-check{width:18px;height:18px}.pdf-note{font-size:11px;color:#64748b;margin-top:5px}@media(max-width:900px){.advanced-tools,.filter-grid{grid-template-columns:1fr}}
    `;document.head.appendChild(s);
  }
  function enhanceHeader(){
    const p=document.querySelector('.hero-title p');if(p)p.textContent='v'+VERSION+' · Utilidades SIG con simbología, filtros, medición, reporte PDF, importación y exportación CSV/GeoJSON.';
    document.title='Utilidades SIG web v'+VERSION;
  }
  function ensureManualCategory(){
    const card=document.querySelector('.manual-card');if(!card||$('pointCategory'))return;
    const notes=$('notes');const sel=document.createElement('select');sel.id='pointCategory';sel.className='cat-select';sel.innerHTML=catOptions('otro');sel.title='Categoría / simbología';
    notes?.insertAdjacentElement('afterend',sel);
  }
  function ensureAdvancedTools(){
    const tableCard=document.querySelector('.table-card');if(!tableCard||$('advancedTools'))return;
    const div=document.createElement('div');div.id='advancedTools';div.className='advanced-tools';
    div.innerHTML=`<div class="toolbox"><h3>🔎 Filtros visibles</h3><div class="filter-grid"><input id="filterName" placeholder="Nombre" oninput="renderTable()"><select id="filterCategory" onchange="renderTable()"><option value="">Todas las categorías</option>${catOptions('')}</select><select id="filterSource" onchange="renderTable()"><option value="">Todas las fuentes</option></select><select id="filterZone" onchange="renderTable()"><option value="">Todas las zonas</option><option value="16">Zona 16</option><option value="17">Zona 17</option></select></div></div><div class="toolbox"><h3>📏 Medición y reporte</h3><div id="measureResult" class="measure-result">Selecciona puntos en la tabla para calcular distancia/área.</div><div class="module-actions"><button class="btn out" onclick="clearMeasureSelection()">Limpiar selección</button><button class="btn green" onclick="exportReportPDF()">Generar croquis PDF</button></div><div class="pdf-note">El PDF incluye resumen del proyecto, mediciones y tabla filtrada. El mapa se intenta capturar automáticamente.</div></div>`;
    tableCard.insertBefore(div,tableCard.querySelector('.tablewrap'));
  }
  function updateSourceOptions(){
    const s=$('filterSource');if(!s)return;const current=s.value;const src=[...new Set(pr().points.map(p=>p.source).filter(Boolean))].sort();s.innerHTML='<option value="">Todas las fuentes</option>'+src.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');s.value=src.includes(current)?current:'';
  }
  function matchesFilters(p){
    const q=clean($('pointFilter')?.value||''),n=clean($('filterName')?.value||''),cat=$('filterCategory')?.value||'',src=$('filterSource')?.value||'',zone=$('filterZone')?.value||'';
    if(q&&!clean(JSON.stringify(p)).includes(q))return false;
    if(n&&!clean(p.name).includes(n))return false;
    if(cat&&(p.category||'otro')!==cat)return false;
    if(src&&(p.source||'')!==src)return false;
    if(zone&&String(p.zone||'')!==zone)return false;
    return true;
  }
  filtered=function(){return pr().points.filter(matchesFilters)};

  const oldAddPoint=addPoint;
  addPoint=function(o,recenter=false){o.category=o.category||$('pointCategory')?.value||'otro';oldAddPoint(o,recenter)};
  const oldAddMany=addMany;
  addMany=function(arr){oldAddMany(arr.map(o=>({...o,category:o.category||'otro'})))};

  function updateMeasure(){
    const pts=pr().points.filter(p=>measureIds.has(p.id)&&Number.isFinite(+p.lat)&&Number.isFinite(+p.lon));
    const el=$('measureResult');if(!el)return;
    if(pts.length<2){el.textContent='Selecciona al menos 2 puntos para calcular distancia. Con 3 o más se calcula área aproximada.';return}
    let d=0;for(let i=1;i<pts.length;i++)d+=hav(pts[i-1],pts[i]);
    let txt=`Puntos seleccionados: ${pts.length} · Distancia acumulada: ${d.toFixed(3)} km`;
    if(pts.length>=3)txt+=` · Área aproximada: ${areaKm2(pts).toFixed(3)} km² (${(areaKm2(pts)*100).toFixed(2)} ha)`;
    el.textContent=txt;
  }
  window.clearMeasureSelection=function(){measureIds.clear();renderTable();msg('Selección de medición limpiada.')};
  window.toggleMeasure=function(id,checked){checked?measureIds.add(id):measureIds.delete(id);updateMeasure();drawMap()};
  function hav(a,b){const R=6371,la1=rad(+a.lat),la2=rad(+b.lat),dlat=rad(+b.lat-+a.lat),dlon=rad(+b.lon-+a.lon);const h=Math.sin(dlat/2)**2+Math.cos(la1)*Math.cos(la2)*Math.sin(dlon/2)**2;return 2*R*Math.asin(Math.sqrt(h))}
  function areaKm2(pts){const R=6371,lat0=rad(pts.reduce((s,p)=>s+ +p.lat,0)/pts.length);const xy=pts.map(p=>({x:R*rad(+p.lon)*Math.cos(lat0),y:R*rad(+p.lat)}));let s=0;for(let i=0;i<xy.length;i++){let j=(i+1)%xy.length;s+=xy[i].x*xy[j].y-xy[j].x*xy[i].y}return Math.abs(s)/2}

  renderTable=function(){updateSourceOptions();let pts=filtered(),body=$('tbody');body.innerHTML=pts.map(p=>{let c=catOf(p);return `<tr class="${p.id===selectedPointId?'selected':''}" onclick="zoomToPoint('${p.id}',17)"><td><input class="measure-check" type="checkbox" onclick="event.stopPropagation()" onchange="toggleMeasure('${p.id}',this.checked)" ${measureIds.has(p.id)?'checked':''}></td><td><b>${pointNo(p)}</b></td><td><input onclick="event.stopPropagation()" value="${esc(p.name)}" oninput="edit('${p.id}','name',this.value)"></td><td><select class="cat-select" onclick="event.stopPropagation()" onchange="edit('${p.id}','category',this.value);renderTable()">${catOptions(p.category||'otro')}</select></td><td><input onclick="event.stopPropagation()" value="${esc(p.source)}" oninput="edit('${p.id}','source',this.value)"></td><td><input onclick="event.stopPropagation()" value="${fix(p.lat,7)}" oninput="edit('${p.id}','lat',this.value)"></td><td><input onclick="event.stopPropagation()" value="${fix(p.lon,7)}" oninput="edit('${p.id}','lon',this.value)"></td><td><input onclick="event.stopPropagation()" value="${fix(p.easting,2)}" oninput="edit('${p.id}','easting',this.value)"></td><td><input onclick="event.stopPropagation()" value="${fix(p.northing,2)}" oninput="edit('${p.id}','northing',this.value)"></td><td><input onclick="event.stopPropagation()" value="${esc(p.zone)}" oninput="edit('${p.id}','zone',this.value)"></td><td><input onclick="event.stopPropagation()" value="${esc(p.hemisphere||'N')}" oninput="edit('${p.id}','hemisphere',this.value)"></td><td><input onclick="event.stopPropagation()" value="${esc(p.notes)}" oninput="edit('${p.id}','notes',this.value)"></td><td><button onclick="event.stopPropagation();zoomToPoint('${p.id}',18)">🔎</button></td><td><button onclick="event.stopPropagation();del('${p.id}')">🗑️</button></td></tr>`}).join('')||'<tr><td colspan="14" class="emptyrow">No hay coordenadas guardadas.</td></tr>';updateMeasure();drawMap()};
  drawMap=function(){let el=$('map');if(!el)return;let pts=filtered().filter(p=>Number.isFinite(+p.lat)&&Number.isFinite(+p.lon)),base=$('base')?.value||'osm',m=maps[base]||maps.osm,w=el.clientWidth||900,h=el.clientHeight||540,s=256,cx=tx(view.lon,view.z)*s,cy=ty(view.lat,view.z)*s,tlx=cx-w/2,tly=cy-h/2,max=2**view.z,html='';for(let x=Math.floor(tlx/s);x<=Math.floor((tlx+w)/s);x++)for(let y=Math.floor(tly/s);y<=Math.floor((tly+h)/s);y++)if(y>=0&&y<max){let xx=((x%max)+max)%max;html+=`<img class="tile" src="${tileUrl(m.u,view.z,xx,y)}" style="left:${x*s-tlx}px;top:${y*s-tly}px">`;if(m.o)html+=`<img class="tile labeltile" src="${tileUrl(m.o,view.z,xx,y)}" style="left:${x*s-tlx}px;top:${y*s-tly}px">`}pts.forEach(p=>{let x=tx(+p.lon,view.z)*s-tlx,y=ty(+p.lat,view.z)*s-tly,lab=esc(labelValue(p)),c=catOf(p);html+=`<div class="marker cat ${p.id===selectedPointId?'selected':''}" style="left:${x}px;top:${y}px;background:${c.color}"><span>${c.icon}</span></div>`;if(lab)html+=`<div class="point-label" style="left:${x}px;top:${y}px">${lab}</div>`});let cats=[...new Set(pts.map(p=>p.category||'otro'))];html+=`<div class="mapinfo"><b>${captureMode?'Modo captura activo':'Modo navegación'}</b><br>${m.n} · zoom ${view.z}</div><div class="zoom"><button onclick="event.stopPropagation();view.z=Math.min(18,view.z+1);drawMap()">+</button><button onclick="event.stopPropagation();view.z=Math.max(3,view.z-1);drawMap()">−</button><button onclick="event.stopPropagation();overview()">⌂</button></div><div class="legend"><b>Simbología</b>${cats.map(k=>{let c=CATS[k]||CATS.otro;return `<div class="legend-row"><span class="legend-dot" style="background:${c.color}"></span>${c.icon} ${c.label}</div>`}).join('')}</div><div class="credit">${m.n}</div>`;el.innerHTML=html};
  makeCsv=function(arr){let h=['numero','nombre','categoria','fuente','latitud','longitud','este_utm','norte_utm','zona','hemisferio','notas'];return[h,...arr.map(p=>[pointNo(p),p.name,catOf(p).label,p.source,fix(p.lat,8),fix(p.lon,8),fix(p.easting,2),fix(p.northing,2),p.zone,p.hemisphere,p.notes||''])].map(r=>r.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',')).join('\n')};
  exportGeoJSON=function(){let gj={type:'FeatureCollection',name:pr().name,features:pr().points.filter(p=>Number.isFinite(+p.lat)&&Number.isFinite(+p.lon)).map(p=>({type:'Feature',properties:{numero:pointNo(p),nombre:p.name||'',categoria:catOf(p).label,fuente:p.source||'',este_utm:p.easting||'',norte_utm:p.northing||'',zona:p.zone||'',hemisferio:p.hemisphere||'',notas:p.notes||''},geometry:{type:'Point',coordinates:[+p.lon,+p.lat]}}))};download(pr().name.replaceAll(' ','_')+'.geojson',new Blob([JSON.stringify(gj,null,2)],{type:'application/geo+json'}));msg('GeoJSON exportado con categorías.')};
  window.exportReportPDF=async function(){try{msg('Generando PDF...');await loadScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js');const {jsPDF}=window.jspdf;let doc=new jsPDF({unit:'mm',format:'a4'}),pts=filtered();doc.setFont('helvetica','bold');doc.setFontSize(16);doc.text('Croquis / reporte de puntos SIG',14,16);doc.setFont('helvetica','normal');doc.setFontSize(10);doc.text('Proyecto: '+pr().name,14,24);doc.text('Fecha: '+new Date().toLocaleString(),14,30);doc.text('Total filtrado: '+pts.length+' puntos',14,36);doc.text(($('measureResult')?.textContent||''),14,42,{maxWidth:180});let y=52;doc.setFont('helvetica','bold');doc.text('Tabla filtrada',14,y);y+=6;doc.setFont('helvetica','normal');pts.slice(0,32).forEach(p=>{doc.text(`${pointNo(p)}. ${p.name||''} | ${catOf(p).label} | ${fix(p.lat,6)}, ${fix(p.lon,6)}`,14,y,{maxWidth:180});y+=6;if(y>280){doc.addPage();y=16}});doc.save(pr().name.replaceAll(' ','_')+'_reporte_SIG.pdf');msg('PDF generado.')}catch(e){msg('No se pudo generar el PDF. Revisa conexión a internet para cargar la librería PDF.')}};
  function fixHeader(){let h=document.querySelector('thead tr');if(h)h.innerHTML='<th>Medir</th><th>N°</th><th>Nombre</th><th>Categoría</th><th>Fuente</th><th>Lat</th><th>Lon</th><th>Este</th><th>Norte</th><th>Zona</th><th>Hem</th><th>Notas</th><th>Zoom</th><th></th>'}
  function init(){injectStyle();enhanceHeader();ensureManualCategory();ensureAdvancedTools();fixHeader();renderTable();drawMap();msg('Versión '+VERSION+': simbología, filtros, mediciones y PDF agregados.')}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,350));else setTimeout(init,350);
})();