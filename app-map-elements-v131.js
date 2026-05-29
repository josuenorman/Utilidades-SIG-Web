// v1.31 - Leyenda para capas extra + norte gráfico + escala automática para reporte.
(function(){
  const VERSION='1.31';
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');

  function css(){
    if($('mapElements131style'))return;
    const s=document.createElement('style');
    s.id='mapElements131style';
    s.textContent=`
      .north-arrow{position:absolute;right:14px;top:72px;z-index:16;background:rgba(255,255,255,.95);border:1px solid #d9e2ec;border-radius:12px;width:44px;height:56px;display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 7px 18px rgba(15,23,42,.18);font-weight:900;color:#0f172a;pointer-events:none}.north-arrow .arrow{font-size:25px;line-height:21px}.north-arrow .n{font-size:12px;letter-spacing:.04em}
      .scale-bar{position:absolute;left:14px;bottom:42px;z-index:16;background:rgba(255,255,255,.95);border:1px solid #d9e2ec;border-radius:10px;padding:6px 8px;box-shadow:0 7px 18px rgba(15,23,42,.18);font-size:11px;font-weight:900;color:#0f172a;pointer-events:none}.scale-line{height:7px;border-left:2px solid #111827;border-right:2px solid #111827;border-bottom:3px solid #111827;margin-bottom:3px}.legend .extra-legend-title{border-top:1px solid #d9e2ec;margin-top:6px;padding-top:5px;font-weight:900}.legend-line{display:inline-block;width:18px;height:0;border-top:3px solid;margin-right:5px;vertical-align:middle}.legend-poly{display:inline-block;width:14px;height:10px;border:2px solid;margin-right:5px;vertical-align:middle;opacity:.8}.legend-point-extra{display:inline-block;width:12px;height:12px;border-radius:999px;margin-right:6px;border:2px solid white;box-shadow:0 1px 5px #0f172a44;vertical-align:middle}
      @media print{.north-arrow,.scale-bar{display:flex!important}.legend{display:block!important}.scale-bar{bottom:12px!important}}
    `;
    document.head.appendChild(s);
  }

  function header(){
    document.title='Utilidades SIG Web v'+VERSION;
    const p=document.querySelector('.hero-title p');
    if(p)p.textContent='v'+VERSION+' · Capas extra en simbología, norte gráfico y escala automática para impresión.';
  }

  function metersPerPixel(){
    const lat=(typeof view!=='undefined'?view.lat:12)*Math.PI/180;
    const z=(typeof view!=='undefined'?view.z:8);
    return 156543.03392*Math.cos(lat)/Math.pow(2,z);
  }
  function niceDistance(m){
    const candidates=[1,2,5,10,20,50,100,200,500,1000,2000,5000,10000,20000,50000,100000,200000,500000];
    let best=candidates[0];
    for(const c of candidates){if(c<=m)best=c;else break}
    return best;
  }
  function scaleHTML(){
    const mpp=metersPerPixel();
    const targetPx=110;
    const dist=niceDistance(mpp*targetPx);
    const px=Math.max(45,Math.round(dist/mpp));
    const label=dist>=1000?(dist/1000)+' km':dist+' m';
    return `<div class="scale-bar"><div class="scale-line" style="width:${px}px"></div><div>${label}</div></div>`;
  }

  function extraLegendHTML(){
    const layers=(window.extraLayers||[]);
    if(!layers.length)return '';
    return `<div class="extra-legend-title">Capas extra</div>`+layers.map(l=>{
      let sw=`<span class="legend-point-extra" style="background:${l.color}"></span>`;
      if(l.type==='line')sw=`<span class="legend-line" style="border-color:${l.color}"></span>`;
      if(l.type==='polygon')sw=`<span class="legend-poly" style="border-color:${l.color};background:${l.color}33"></span>`;
      return `<div class="legend-row">${sw}${esc(l.name)}</div>`;
    }).join('');
  }

  function addMapElements(){
    const map=$('map');if(!map)return;
    if(!map.querySelector('.north-arrow'))map.insertAdjacentHTML('beforeend','<div class="north-arrow"><div class="arrow">▲</div><div class="n">N</div></div>');
    if(!map.querySelector('.scale-bar'))map.insertAdjacentHTML('beforeend',scaleHTML());
    const legend=map.querySelector('.legend');
    if(legend&&!legend.querySelector('.extra-legend-title'))legend.insertAdjacentHTML('beforeend',extraLegendHTML());
  }

  const oldDraw=drawMap;
  drawMap=function(){oldDraw();addMapElements()};

  function patchExtraLayerGlobal(){
    if(typeof extraLayers!=='undefined'&&!window.extraLayers)window.extraLayers=extraLayers;
  }

  function init(){
    css();header();patchExtraLayerGlobal();drawMap();
    msg('v1.31: capas extra integradas a simbología, norte y escala agregados al mapa.');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,3600));else setTimeout(init,3600);
})();