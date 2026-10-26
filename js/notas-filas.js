/*
 * Notas debajo de cada fila (20/10/2026, pedido de la clienta): en Empresas, Empresas Rurales, Serv. Profesionales y en
 * «Vencimientos por asociación». Un renglón verde suave, más chico que la fila, donde se lee la nota y se
 * edita ahí mismo (se toca, se escribe y se guarda al salir del campo; Esc cancela).
 * Se guarda en la propia fila: row.nota (texto).
 */
/* ===== NOTAS DE CADA FILA ===== */
function notaFilas(t){ return t==='asoc'?asocVencRows():((Store.data.grids[t]||{}).rows||[]); }
// El renglón de la nota. t = 'empresas' | 'rurales' | 'asoc'; cols = cuántas columnas tiene la tabla.
function notaFila(t,row,cols){
  var n=(row.nota||'').trim();
  return '<tr class="nf"><td colspan="'+cols+'"><div class="nf-box'+(n?'':' vacia')+'" onclick="notaEditar(\''+t+'\',\''+row.id+'\',this)" title="Tocá para '+(n?'editar':'escribir')+' la nota">'
    +'<span class="nf-ico">📝</span><span class="nf-t">'+(n?esc(n).replace(/\n/g,'<br>'):'Tocá para agregar una nota…')+'</span>'
    +(n?'<span class="nf-ed">✎ Editar</span>':'')+'</div></td></tr>';
}
function notaEditar(t,rid,box){
  if(box.querySelector('textarea'))return;
  var row=notaFilas(t).find(function(x){return x.id===rid;}); if(!row)return;
  box.classList.remove('vacia'); box.classList.add('editando');
  box.innerHTML='<span class="nf-ico">📝</span><textarea class="nf-in" rows="2" placeholder="Escribí la nota…">'+esc(row.nota||'')+'</textarea>'
    +'<span class="nf-ayuda">Se guarda solo · Esc para cancelar</span>';
  var ta=box.querySelector('textarea'), cancelado=false;
  var ajustar=function(){ ta.style.height='auto'; ta.style.height=Math.max(38,ta.scrollHeight)+'px'; };
  ta.addEventListener('input',ajustar);
  ta.addEventListener('keydown',function(e){ if(e.key==='Escape'){ cancelado=true; ta.blur(); } });
  ta.addEventListener('blur',function(){ if(!cancelado)notaGuardar(t,rid,ta.value); else notaRedibujar(t); });
  ajustar(); ta.focus(); ta.setSelectionRange(ta.value.length,ta.value.length);
}
function notaGuardar(t,rid,v){
  var row=notaFilas(t).find(function(x){return x.id===rid;}); if(!row)return;
  v=(v||'').trim(); var antes=(row.nota||'').trim();
  if(v)row.nota=v; else delete row.nota;
  if(v!==antes){ Store.save(); toast(v?'Nota guardada':'Nota borrada'); }
  notaRedibujar(t);
}
function notaRedibujar(t){ if(t==='asoc')renderAsocVenc(); else renderGrid(t); }

/* Ejemplos (inventados). */
var NOTAS_EJ={
  empresas:['Pidió que le avisemos 15 días antes del vencimiento del BPS. El contador anterior no lo renovaba a tiempo.','',
    'Renovar el certificado de DGI urgente: lo piden para la licitación de la Intendencia. Llamar a Carlos.',
    'El INAC se tramita con el despachante: falta que nos manden la planilla de faena de setiembre.'],
  rurales:['La DJ de DICOSE se presenta con el escribano en junio. Pedir el detalle del stock.','',
    'Cambió de banco: actualizar la cuenta para el débito del BPS rural.'],
  sprof:['Factura electrónica: renovar el certificado digital antes de fin de mes.','',
    'Pidió pasar a cuota mensual fija desde enero.'],
  asoc:['El BPS venció: la presidenta firma el lunes. Llevar el formulario impreso.','Comisión nueva electa en agosto: actualizar los datos en el RUPE.'],
};
function sembrarNotas(t,rows){ (rows||[]).forEach(function(r,i){ var n=NOTAS_EJ[t][i%NOTAS_EJ[t].length]; if(n&&!r.nota)r.nota=n; }); }
