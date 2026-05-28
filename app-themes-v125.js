// v1.25 - Selector de temas visuales para la aplicación.
(function(){
  const STORE='sig-app-theme-v125';
  const $=id=>document.getElementById(id);
  const themes={
    azul:{label:'Azul institucional',bg:'#f4f7fb',hero:'linear-gradient(135deg,#0f4c81,#126782 55%,#14b8a6)',primary:'#0f4c81',accent:'#14b8a6',card:'#ffffff',text:'#1f2937'},
    oscuro:{label:'Oscuro elegante',bg:'#0f172a',hero:'linear-gradient(135deg,#020617,#1e293b 60%,#0f766e)',primary:'#1e293b',accent:'#14b8a6',card:'#111827',text:'#e5e7eb'},
    verde:{label:'Verde territorio',bg:'#f0fdf4',hero:'linear-gradient(135deg,#14532d,#15803d 55%,#65a30d)',primary:'#166534',accent:'#84cc16',card:'#ffffff',text:'#1f2937'}
  };
  function css(){
    if($('theme125style'))return;
    const s=document.createElement('style');s.id='theme125style';s.textContent=`
      .theme-control{display:flex;align-items:center;gap:6px;margin-top:8px}.theme-control select{border:1px solid rgba(255,255,255,.35);background:rgba(255,255,255,.14);color:white;border-radius:999px;padding:6px 10px;font-size:12px;font-weight:800}.theme-control option{color:#0f172a;background:white}
      body.theme-azul,body.theme-verde{background:var(--theme-bg)!important;color:var(--theme-text)!important}body.theme-oscuro{background:var(--theme-bg)!important;color:var(--theme-text)!important}body.theme-oscuro .card,body.theme-oscuro .module-card,body.theme-oscuro .module-box,body.theme-oscuro .table-card,body.theme-oscuro .map-card,body.theme-oscuro .manual-card{background:#111827!important;border-color:#334155!important;color:#e5e7eb!important}body.theme-oscuro input,body.theme-oscuro select,body.theme-oscuro textarea{background:#0f172a!important;color:#e5e7eb!important;border-color:#475569!important}body.theme-oscuro table,body.theme-oscuro th{background:#111827!important;color:#e5e7eb!important}body.theme-oscuro tr:hover{background:#1e293b!important}body.theme-oscuro .legend,body.theme-oscuro .measure-map-menu{background:rgba(15,23,42,.94)!important;color:#e5e7eb!important;border-color:#334155!important}.hero{background:var(--theme-hero)!important}.btn{background:var(--theme-primary)!important}.btn.green{background:var(--theme-accent)!important}
    `;document.head.appendChild(s);
  }
  function apply(name){const t=themes[name]||themes.azul;document.body.classList.remove('theme-azul','theme-oscuro','theme-verde');document.body.classList.add('theme-'+name);document.documentElement.style.setProperty('--theme-bg',t.bg);document.documentElement.style.setProperty('--theme-hero',t.hero);document.documentElement.style.setProperty('--theme-primary',t.primary);document.documentElement.style.setProperty('--theme-accent',t.accent);document.documentElement.style.setProperty('--theme-card',t.card);document.documentElement.style.setProperty('--theme-text',t.text);localStorage.setItem(STORE,name)}
  function addControl(){const title=document.querySelector('.hero-title');if(!title||$('themeSelect'))return;const div=document.createElement('div');div.className='theme-control';div.innerHTML=`<span>🎨 Tema:</span><select id="themeSelect"><option value="azul">Azul institucional</option><option value="oscuro">Oscuro elegante</option><option value="verde">Verde territorio</option></select>`;title.appendChild(div);const sel=$('themeSelect');sel.value=localStorage.getItem(STORE)||'azul';sel.onchange=()=>apply(sel.value);apply(sel.value)}
  function init(){css();addControl()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,1500));else setTimeout(init,1500);
})();