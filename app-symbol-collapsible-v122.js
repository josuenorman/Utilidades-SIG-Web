// v1.24 bootstrap - oculta el repositorio visual y carga simbología ligera ampliada.
(function(){
  const VERSION='1.24';
  const $=id=>document.getElementById(id);

  function css(){
    if($('symbol122style'))return;
    const s=document.createElement('style');
    s.id='symbol122style';
    s.textContent=`#symbolRepo{display:none!important}`;
    document.head.appendChild(s);
  }

  function header(){
    document.title='Utilidades SIG Web v'+VERSION;
    const p=document.querySelector('.hero-title p');
    if(p)p.textContent='v'+VERSION+' · Simbología ampliada y color personalizado por punto.';
  }

  function loadLite(){
    if([...document.scripts].some(s=>s.src.includes('app-symbol-lite-v124.js')))return;
    const s=document.createElement('script');
    s.src='app-symbol-lite-v124.js?v=1';
    document.body.appendChild(s);
  }

  function init(){
    css();header();loadLite();
    msg('v1.24: repositorio visual oculto; simbología ampliada y color personalizado activos.');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,1200));else setTimeout(init,1200);
})();