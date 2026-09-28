/*
 * Apariencia (se abre desde ⋯ arriba a la derecha): color de acento de la página y fondo de la pantalla de ingreso.
 * Los colores están definidos en :root (css/estilos.css); acá solo se elige cuál se usa.
 */
const ACENTOS=[
  {id:'dorado',nombre:'Dorado arena',desc:'Clásico y sobrio, en la línea del logo'},
  {id:'frambuesa',nombre:'Frambuesa',desc:'Más contrastado, se ve de lejos'},
];
function acentoActual(){ return (Store.data&&Store.data.acento==='frambuesa')?'frambuesa':'dorado'; }
// Se aplica al arrancar y cada vez que se cambia.
function aplicarAcento(){ document.documentElement.setAttribute('data-acento',acentoActual()); }
function setAcento(id){ Store.data.acento=id; Store.save(); aplicarAcento(); apariencia(); renderView(CUR); }

// Fondo de la pantalla de ingreso. 'actual' = el de siempre (azul liso). Los estilos están en estilos.css (data-fondo).
const FONDOS=[
  {id:'actual',nombre:'Azul clásico',desc:'El de siempre: azul liso, sin adornos'},
  {id:'dividida',nombre:'Pantalla dividida',desc:'A la izquierda tu marca y una frase; a la derecha el ingreso'},
  {id:'resplandor',nombre:'Resplandor dorado',desc:'El monograma arriba y un brillo dorado suave'},
  {id:'arcos',nombre:'Arcos dorados',desc:'Círculos dorados finos alrededor del ingreso'},
  {id:'agua',nombre:'Marca de agua',desc:'El monograma gigante, muy suave, de fondo'},
];
function fondoActual(){ var f=Store.data&&Store.data.fondoLogin; return FONDOS.some(function(o){return o.id===f;})?f:'actual'; }
function aplicarFondo(){ var l=$('#login'), f=fondoActual(); if(f==='actual')l.removeAttribute('data-fondo'); else l.setAttribute('data-fondo',f); }
function setFondo(id){ Store.data.fondoLogin=id; Store.save(); aplicarFondo(); apariencia(); }
// Muestra la pantalla de ingreso para ver cómo quedó (después se entra con la contraseña de siempre).
function verFondo(){ closeModal(); mostrarLogin(); }

function apOpcion(o,activo,fn,muestra){
  return '<button class="ac-opt'+(activo?' active':'')+'" onclick="'+fn+'(\''+o.id+'\')">'+muestra
    +'<span><span class="ac-n">'+o.nombre+'</span><span class="ac-d">'+o.desc+'</span></span>'
    +(activo?'<span class="ac-ok">✓</span>':'')+'</button>';
}
function apariencia(){
  curForm={form:'noop'};
  $('#modal-title').textContent='Apariencia'; $('#modal-del').style.display='none';
  const aAct=acentoActual(), fAct=fondoActual();
  const acentos=ACENTOS.map(function(a){ return apOpcion(a,a.id===aAct,'setAcento','<span class="ac-sw" style="background:var(--ac-'+a.id+')"></span>'); }).join('');
  $('#modal-body').innerHTML='<div class="ac-t">Color de acento</div>'
    +'<p class="muted-cell" style="font-size:12.5px;margin-bottom:12px">El azul del logo es el color principal. Esto cambia los detalles: la pestaña abierta, los contadores y los avisos.</p>'
    +'<div class="ac-list">'+acentos+'</div>'
    +'<hr class="ac-sep"><div class="ac-t">Fondo de la pantalla de ingreso</div>'
    +'<p class="muted-cell" style="font-size:12.5px;margin-bottom:12px">Es lo primero que ves al abrir la página.</p>'
    +'<div class="ac-list">'+FONDOS.map(function(f){ return apOpcion(f,f.id===fAct,'setFondo','<span class="fl-sw '+f.id+'"></span>'); }).join('')+'</div>'
    +'<button class="ac-ver" onclick="verFondo()">Ver cómo queda →</button>';
  // Los cambios se aplican al tocarlos, así que alcanza con un botón para cerrar.
  $('#modal-cancel').style.display='none';
  $('#modal .modal-foot .btn-primary').textContent='Listo';
  $('#modal').classList.add('open');
}
