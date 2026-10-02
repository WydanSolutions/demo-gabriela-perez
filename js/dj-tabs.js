/*
 * Secciones: DJ INAC y DJ Rural DICOSA (pestañas propias, arriba en el menú).
 * Son declaraciones como las demás (colección dj): por eso aparecen solas en el Calendario y en el Panel.
 * La tabla es la misma de Declaraciones (djTablaHtml, en declaraciones.js), con el N° de declaración
 * y las columnas propias de cada una (DJ_TABS, en constantes.js): en INAC, los kilos de carne.
 */
/* ===== DJ CON PESTAÑA PROPIA ===== */
var djTabEstado={}; // por pestaña: año elegido, búsqueda y filtro de estado
function djTabSt(id){ if(!djTabEstado[id])djTabEstado[id]={anio:null,q:'',est:''}; return djTabEstado[id]; }
function djTabYear(id){ return djTabSt(id).anio||anioActivo(); }
function djTabSetAnio(y){ djTabSt(CUR).anio=y; renderDjTab(CUR); }
function djTabFiltered(id){ var s=djTabSt(id); return djFiltrar(id,djTabYear(id),s.q,s.est,''); }

function renderDjTab(id){
  var t=DJ_TABS.find(function(x){return x.id===id;}), s=djTabSt(id), y=djTabYear(id);
  var lista=Store.all('dj').filter(function(d){return d.folder===id&&d.anio===y;});
  var pend=lista.filter(function(d){return d.estado!=='Presentada';}).length;
  var h='<div class="view-head"><div><h2>'+t.ico+' '+t.name+' <span style="color:var(--muted);font-weight:400">'+y+'</span></h2>'
    +'<div class="sub">'+t.sub+' · '+lista.length+' en el año, '+pend+' sin presentar</div></div>'
    +'<span style="display:flex;gap:8px;align-items:center">'+yearSelect(y,'djTabSetAnio')+expBtns('djtab',id)
    +'<button class="btn btn-primary" onclick="openForm(\'dj\')">+ Nueva</button></span></div>';
  h+='<div class="toolbar"><div class="search"><input placeholder="Buscar cliente, N° o nota…" value="'+esc(s.q)+'" oninput="djTabSt(\''+id+'\').q=this.value;renderDjTabTabla(\''+id+'\')"></div>'
    +'<select class="filt" onchange="djTabSt(\''+id+'\').est=this.value;renderDjTabTabla(\''+id+'\')"><option value="">Todos los estados</option>'
    +['Pendiente','En proceso','Presentada'].map(function(e){return '<option'+(e===s.est?' selected':'')+'>'+e+'</option>';}).join('')+'</select></div>';
  h+='<div class="table-wrap" id="djtab-'+id+'"></div>';
  $('#view-'+id).innerHTML=h; renderDjTabTabla(id);
}
function renderDjTabTabla(id){
  var s=djTabSt(id), el=document.getElementById('djtab-'+id); if(!el)return;
  el.innerHTML=djTablaHtml(djTabFiltered(id),id,(s.q||s.est)?'Ninguna declaración coincide con el filtro.':'Todavía no hay declaraciones para '+djTabYear(id)+'. Tocá «+ Nueva» para agregar la primera.');
}
