(function(){
  window.POINT_CATEGORIES=[
    {id:'pluviometro',label:'Pluviómetro',emoji:'🌧️',color:'#1d4ed8'},
    {id:'limnimetro',label:'Limnímetro',emoji:'📏',color:'#38bdf8'},
    {id:'comunidad',label:'Comunidad',emoji:'🏘️',color:'#f97316'},
    {id:'evacuacion',label:'Punto de evacuación',emoji:'🚩',color:'#dc2626'},
    {id:'infraestructura',label:'Infraestructura crítica',emoji:'⚠️',color:'#eab308'},
    {id:'referencia',label:'Punto de referencia',emoji:'📌',color:'#6b7280'},
    {id:'otro',label:'Otro',emoji:'❓',color:'#111827'}
  ];
  window.initSymbology=function(ctx){
    const pts=ctx.getPoints();let changed=false;
    pts.forEach(p=>{if(!p.category){p.category='otro';changed=true}});
    if(changed)ctx.saveProjects();
    ctx.renderTable();ctx.drawMap();
  };
  window.addEventListener('load',()=>window.SIG_APP&&window.initSymbology(window.SIG_APP()));
})();
