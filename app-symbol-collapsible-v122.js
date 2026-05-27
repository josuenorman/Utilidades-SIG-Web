// v1.22 - Repositorio de simbología plegable/desplegable.
(function(){
  const VERSION='1.22';
  const $=id=>document.getElementById(id);
  let open=false;

  function css(){
    if($('symbol122style'))return;
    const s=document.createElement('style');
    s.id='symbol122style';
    s.textContent=`
      .symbol-repo{padding:0!important;overflow:hidden!important;background:#fff!important;border:1px solid #d9e2ec!important}
      .symbol-repo-toggle{width:100%;border:0;background:linear-gradient(135deg,#eef6fb,#e8faf6);color:#0f4c81;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 13px;font-weight:900;cursor:pointer;text-align:left}
      .symbol-repo-toggle:hover{background:linear-gradient(135deg,#e0f2fe,#ccfbf1)}
      .symbol-repo-title{display:flex;align-items:center;gap:8px}.symbol-repo-title small{display:block;font-size:10px;font-weight:500;color:#64748b;margin-top:1px}.symbol-chevron{font-size:16px;transition:transform .18s ease}.symbol-repo.open .symbol-chevron{transform:rotate(180deg)}
      .symbol-repo-body{display:none;padding:12px;border-top:1px solid #d9e2ec}.symbol-repo.open .symbol-repo-body{display:block}
    `;
    document.head.appendChild(s);
  }

  function makeCollapsible(){
    const repo=$('symbolRepo');
    if(!repo||repo.dataset.collapsible122)return;
    const children=[...repo.childNodes];
    const body=document.createElement('div');
    body.className='symbol-repo-body';
    children.forEach(n=>body.appendChild(n));

    const btn=document.createElement('button');
    btn.type='button';
    btn.className='symbol-repo-toggle';
    btn.innerHTML=`<span class="symbol-repo-title">🎨 <span>Repositorio de simbología<small>Gestión del riesgo · SAT comunitario · Infraestructura</small></span></span><span class="symbol-chevron">⌄</span>`;
    btn.onclick=()=>{
      open=!open;
      repo.classList.toggle('open',open);
      btn.querySelector('.symbol-chevron').textContent=open?'⌃':'⌄';
    };

    repo.innerHTML='';
    repo.appendChild(btn);
    repo.appendChild(body);
    repo.classList.toggle('open',open);
    repo.dataset.collapsible122='1';
  }

  function header(){
    document.title='Utilidades SIG Web v'+VERSION;
    const p=document.querySelector('.hero-title p');
    if(p)p.textContent='v'+VERSION+' · Repositorio de simbología plegable, editable y orientado a gestión del riesgo e infraestructura.';
  }

  function init(){
    css();header();makeCollapsible();
    msg('v1.22: repositorio de simbología ahora es plegable/desplegable.');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,1200));else setTimeout(init,1200);
})();