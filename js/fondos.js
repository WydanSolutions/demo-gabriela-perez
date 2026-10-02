/*
 * Fondo de la pantalla de ingreso (propio del demo de S. Gabriela Pérez).
 * Suma la sección «Fondo de la pantalla de ingreso» a ⋯ → Apariencia, sin tocar apariencia.js.
 * 'actual' = el de siempre (azul liso). Los estilos están en css/gabriela.css (data-fondo en #login).
 */
const FONDOS=[
  {id:'actual',nombre:'Azul clásico',desc:'El de siempre: azul liso, sin adornos'},
  {id:'dividida',nombre:'Pantalla dividida',desc:'A la izquierda tu marca y una frase; a la derecha el ingreso'},
  {id:'resplandor',nombre:'Resplandor dorado',desc:'El monograma arriba y un brillo dorado suave'},
  {id:'arcos',nombre:'Arcos dorados',desc:'Círculos dorados finos alrededor del ingreso'},
  {id:'agua',nombre:'Marca de agua',desc:'El monograma gigante, muy suave, de fondo'},
];
function fondoActual(){ var f=Store.data&&Store.data.fondoLogin; return FONDOS.some(function(o){return o.id===f;})?f:'actual'; }
function aplicarFondo(){ var l=$('#login'), f=fondoActual(); if(!l)return; if(f==='actual')l.removeAttribute('data-fondo'); else l.setAttribute('data-fondo',f); }
function setFondo(id){ Store.data.fondoLogin=id; Store.save(); aplicarFondo(); apariencia(); }
// Muestra la pantalla de ingreso para ver cómo quedó (después se entra con la contraseña de siempre).
function verFondo(){ closeModal(); mostrarLogin(); }

// Apariencia de siempre + la sección de fondos abajo.
var _aparienciaBase=apariencia;
apariencia=function(){
  _aparienciaBase();
  var fAct=fondoActual();
  $('#modal-body').insertAdjacentHTML('beforeend',
    '<hr class="ac-sep"><div class="ac-t">Fondo de la pantalla de ingreso</div>'
    +'<p class="muted-cell" style="font-size:12.5px;margin-bottom:12px">Es lo primero que ves al abrir la página.</p>'
    +'<div class="ac-list">'+FONDOS.map(function(f){ return apOpcion(f,f.id===fAct,'setFondo','<span class="fl-sw '+f.id+'"></span>'); }).join('')+'</div>'
    +'<button class="ac-ver" onclick="verFondo()">Ver cómo queda →</button>');
};
// Al abrir la página, con los datos ya cargados (app.js corre antes que este evento).
document.addEventListener('DOMContentLoaded',aplicarFondo);
