// v1.26 - Tabla con todos los campos importados de CSV/Excel/Shapefile.
(function(){
  const VERSION='1.26';
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
  const core=['id','name','source','inputType','lat','lon','easting','northing','zone','hemisphere','notes','category','symbolColor'];
  const cleanKey=k=>String(k||'campo').trim()||'campo';

  function css(){
    if($('attrs126style'))return;
    const s=document.createElement('style');s.id='attrs126style';s.textContent=`
      .attrs-info{margin-top:8px;border:1px solid #d9e2ec;background:#fbfdff;border-radius:14px;padding:9px 10px;font-size:12px;color:#475569}.attrs-info b{color:#0f4c81}.attrs-table-extra th.attr-head{background:#eef6fb!important;color:#0f4c81!important}.attrs-table-extra td.attr-cell input{min-width:130px}.coord-head{background:#ecfdf5!important;color:#065f46!important}.attrs-count{display:inline-flex;margin-left:6px;border-radius:999px;background:#e8faf6;color:#0f766e;padding:2px 7px;font-size:11px;font-weight:800}
    `;document.head.appendChild(s);
  }
  function header(){document.title='Utilidades SIG Web v'+VERSION;const p=document.querySelector('.hero-title p');if(p)p.textContent='v'+VERSION+' · Tabla conserva todos los campos importados y mantiene columnas de coordenadas imprescindibles.'}
  function attrsOf(p){return p.attrs&&typeof p.attrs==='object'?p.attrs:{}}
  function attrKeys(arr=filtered()){const set=new Set();arr.forEach(p=>Object.keys(attrsOf(p)).forEach(k=>set.add(k)));return [...set].filter(k=>!core.includes(k)).sort((a,b)=>a.localeCompare(b))}
  function rowAttrs(r,src){let o={};Object.keys(r||{}).forEach(k=>o[cleanKey(k)]=r[k]);o.__origen=src;return o}
  function get(id,row){let k=$(id)?.value||'';return k?row[k]:''}

  const previousImport=importPreviewRows;
  importPreviewRows=function(){
    if(!previewRows.length)return msg('Primero carga un CSV o Excel.');
    let pts=previewRows.map((r,i)=>{
      let name=get('fmName',r)||r.Nombre||r.nombre||r.Name||r.name||'Importado '+(i+1),notes=get('fmNotes',r)||'',x=num(get('fmX',r)),y=num(get('fmY',r));
      if(x===null||y===null)return null;
      let attrs=rowAttrs(r,'CSV/Excel');
      try{
        if(($('coordSystem')?.value||'geo')==='geo')return{name,lat:y,lon:x,...ll2utm(y,x),source:'CSV/Excel',notes,attrs};
        let z=num(get('fmZone',r))||+($('defaultZone')?.value||16),h=$('defaultHem')?.value||'N',ll=utm2ll(x,y,z,h);
        return{name,lat:ll.lat,lon:ll.lon,easting:x,northing:y,zone:z,hemisphere:h,source:'CSV/Excel',notes,attrs};
      }catch{return null}
    }).filter(Boolean);
    if(!pts.length)return msg('No se detectaron coordenadas válidas. Revisa X/Y y sistema de coordenadas.');
    addMany(pts);msg(pts.length+' punto(s) importado(s) con todos los campos originales.');
  };

  handleShapeZip=async function(file){
    if(!file)return;
    try{
      await loadScript('https://cdn.jsdelivr.net/npm/shpjs@latest/dist/shp.min.js');
      let gj=await shp(await file.arrayBuffer()),features=(gj.type==='FeatureCollection'?gj.features:(Array.isArray(gj)?gj.flatMap(g=>g.features||[]):[])),pts=[];
      features.forEach((f,i)=>{
        let g=f.geometry,c=null;if(!g)return;
        if(g.type==='Point')c=g.coordinates;if(g.type==='MultiPoint')c=g.coordinates?.[0];if(!c&&g.type==='LineString')c=g.coordinates?.[0];if(!c&&g.type==='Polygon')c=g.coordinates?.[0]?.[0];
        if(c&&Math.abs(c[1])<=90&&Math.abs(c[0])<=180){let props=f.properties||{},attrs=rowAttrs(props,'Shapefile');attrs.__geometria=g.type;pts.push({name:props.name||props.Nombre||props.NOMBRE||props.nom||props.NOM||'SHP '+(i+1),lat:c[1],lon:c[0],...ll2utm(c[1],c[0]),source:'Shapefile',notes:'Atributos importados desde Shapefile',attrs})}
      });
      if(!pts.length)return msg('No se detectaron geometrías válidas en WGS84.');
      addMany(pts);msg(pts.length+' geometría(s) importada(s) con todos sus campos originales.');
    }catch{msg('No se pudo leer el Shapefile ZIP.')}
  };

  window.editAttr=function(id,key,value){let p=pr().points.find(x=>x.id===id);if(!p)return;p.attrs=p.attrs||{};p.attrs[key]=value;save()};

  const oldRender=renderTable;
  renderTable=function(){
    let pts=filtered(),keys=attrKeys(pts),body=$('tbody');if(!body)return;
    let head=document.querySelector('thead tr');
    if(head)head.innerHTML='<th>N°</th><th>Nombre</th><th>Simbología</th><th>Fuente</th><th class="coord-head">Lat</th><th class="coord-head">Lon</th><th class="coord-head">Este</th><th class="coord-head">Norte</th><th class="coord-head">Zona</th><th class="coord-head">Hem</th><th>Notas</th>'+keys.map(k=>`<th class="attr-head">${esc(k)}</th>`).join('')+'<th>Zoom</th><th></th>';
    body.innerHTML=pts.map(p=>{let s=(typeof sym==='function'?sym(p.category):null)||{icon:'📍',color:'#475569',label:p.category||'Otro'};let optsHtml=(typeof opts==='function'?opts(p.category||'otro'):'<option>Otro</option>');return`<tr class="${p.id===selectedPointId?'selected':''}" onclick="zoomToPoint('${p.id}',17)"><td><b>${pointNo(p)}</b></td><td><input onclick="event.stopPropagation()" value="${esc(p.name)}" oninput="edit('${p.id}','name',this.value)"></td><td><span class="symbol-mini"><span class="symbol-dot" style="background:${s.color}">${s.icon}</span><select class="symbol-select" onclick="event.stopPropagation()" onchange="edit('${p.id}','category',this.value);renderTable()">${optsHtml}</select></span></td><td><input onclick="event.stopPropagation()" value="${esc(p.source)}" oninput="edit('${p.id}','source',this.value)"></td><td><input onclick="event.stopPropagation()" value="${fix(p.lat,7)}" oninput="edit('${p.id}','lat',this.value)"></td><td><input onclick="event.stopPropagation()" value="${fix(p.lon,7)}" oninput="edit('${p.id}','lon',this.value)"></td><td><input onclick="event.stopPropagation()" value="${fix(p.easting,2)}" oninput="edit('${p.id}','easting',this.value)"></td><td><input onclick="event.stopPropagation()" value="${fix(p.northing,2)}" oninput="edit('${p.id}','northing',this.value)"></td><td><input onclick="event.stopPropagation()" value="${esc(p.zone)}" oninput="edit('${p.id}','zone',this.value)"></td><td><input onclick="event.stopPropagation()" value="${esc(p.hemisphere||'N')}" oninput="edit('${p.id}','hemisphere',this.value)"></td><td><input onclick="event.stopPropagation()" value="${esc(p.notes)}" oninput="edit('${p.id}','notes',this.value)"></td>${keys.map(k=>`<td class="attr-cell"><input onclick="event.stopPropagation()" value="${esc(attrsOf(p)[k]??'')}" oninput="editAttr('${p.id}','${esc(k)}',this.value)"></td>`).join('')}<td><button onclick="event.stopPropagation();zoomToPoint('${p.id}',18)">🔎</button></td><td><button onclick="event.stopPropagation();del('${p.id}')">🗑️</button></td></tr>`}).join('')||'<tr><td colspan="12" class="emptyrow">No hay coordenadas guardadas.</td></tr>';
    updateInfo(keys.length);drawMap();
  };

  function updateInfo(n){
    let card=document.querySelector('.table-card');if(!card)return;let info=$('attrsInfo');
    if(!info){info=document.createElement('div');info.id='attrsInfo';info.className='attrs-info';card.querySelector('.table-head')?.insertAdjacentElement('afterend',info)}
    info.innerHTML=`<b>Tabla completa:</b> las columnas verdes son las coordenadas imprescindibles para ubicación/conversión. <span class="attrs-count">${n} campos importados adicionales</span>`;
  }

  makeCsv=function(arr){let keys=attrKeys(arr),h=['numero','nombre','categoria','fuente','latitud','longitud','este_utm','norte_utm','zona','hemisferio','notas',...keys];let rows=arr.map(p=>[pointNo(p),p.name,p.category||'',p.source,fix(p.lat,8),fix(p.lon,8),fix(p.easting,2),fix(p.northing,2),p.zone,p.hemisphere,p.notes||'',...keys.map(k=>attrsOf(p)[k]??'')]);return[h,...rows].map(r=>r.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',')).join('\n')};
  exportGeoJSON=function(){let gj={type:'FeatureCollection',name:pr().name,features:pr().points.filter(p=>Number.isFinite(+p.lat)&&Number.isFinite(+p.lon)).map(p=>({type:'Feature',properties:{numero:pointNo(p),nombre:p.name||'',categoria:p.category||'',fuente:p.source||'',este_utm:p.easting||'',norte_utm:p.northing||'',zona:p.zone||'',hemisferio:p.hemisphere||'',notas:p.notes||'',...(attrsOf(p)||{})},geometry:{type:'Point',coordinates:[+p.lon,+p.lat]}}))};download(pr().name.replaceAll(' ','_')+'.geojson',new Blob([JSON.stringify(gj,null,2)],{type:'application/geo+json'}));msg('GeoJSON exportado con todos los atributos.');};

  function init(){css();header();renderTable();msg('v1.26: tabla completa con todos los campos importados activa.')}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,1800));else setTimeout(init,1800);
})();