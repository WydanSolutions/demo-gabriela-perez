/*
 * Sección: Asociaciones civiles · Débitos (copiada tal cual de la página de la Cra. Milena López).
 * "Pago" = el débito ya se pagó en la plataforma. Se puede filtrar por fecha de pago.
 */
/* ===== ASOC CIVILES · DÉBITOS ===== */
var deQ='', deF='', deDesde='', deHasta='';
function renderDebitos(){
  let h='<div class="view-head"><div><h2>Asoc. Civiles · Débitos</h2><div class="sub">Pagos de débitos en plataformas de tarjetas</div></div><span style="display:flex;gap:8px">'+expBtns('debitos')+'<button class="btn btn-primary" onclick="openForm(\'debito\')">+ Nuevo</button></span></div>';
  h+='<div class="toolbar"><div class="search"><input placeholder="Buscar asociación o plataforma…" value="'+esc(deQ)+'" oninput="deQ=this.value;renderDebTable()"></div>'
    +'<select class="filt" onchange="deF=this.value;renderDebTable()"><option value="">Todos</option><option value="1"'+(deF==='1'?' selected':'')+'>Pago</option><option value="0"'+(deF==='0'?' selected':'')+'>Pendiente</option></select>'
    +'<span class="chkline">Pago desde <input type="date"'+DR+' class="date-f" value="'+deDesde+'" onchange="if(dateOk(this)){deDesde=this.value;renderDebTable();}"></span>'
    +'<span class="chkline">hasta <input type="date"'+DR+' class="date-f" value="'+deHasta+'" onchange="if(dateOk(this)){deHasta=this.value;renderDebTable();}"></span>'
    +'<button class="btn btn-sm" onclick="deDesde=\'\';deHasta=\'\';renderDebitos()">✕ Quitar fechas</button>'
    +'</div><div class="table-wrap" id="de-table"></div>';
  $('#view-debitos').innerHTML=h;renderDebTable();
}
function debFiltered(){const q=deQ.toLowerCase();return Store.all('debitos').filter(b=>{if(deF==='1'&&!b.cargado)return false;if(deF==='0'&&b.cargado)return false;if(deDesde&&(!b.fecha||b.fecha<deDesde))return false;if(deHasta&&(!b.fecha||b.fecha>deHasta))return false;const nom=(cliNameOr(b.clienteId)||b.asociacion||'').toLowerCase();if(q&&!(nom.includes(q)||(b.plataforma||'').toLowerCase().includes(q)))return false;return true;});}
function renderDebTable(){
  const rows=debFiltered();
  const body=rows.length?rows.map(b=>'<tr>'
    +'<td><div class="name-cell">'+cliInput(cliNameOr(b.clienteId)||b.asociacion,'debSetCli(\''+b.id+'\',this.value)','Asociación…')+(b.clienteId?'<button class="go-cli" title="Ver la ficha del cliente" onclick="goCli(\''+b.clienteId+'\')">↗</button>':'')+'</div></td>'
    +'<td>'+cellIn('debitos',b.id,'plataforma',b.plataforma,{list:'dl-plat'})+'</td>'
    +'<td>'+cellIn('debitos',b.id,'periodo',b.periodo,{ph:'Ej: Set 2026'})+'</td>'
    +'<td>'+cellIn('debitos',b.id,'importe',b.importe,{cls:'num',ph:'$'})+'</td>'
    +'<td><span class="pill clk '+(b.cargado?'st-done':'st-pend')+'" onclick="toggleCargado(\''+b.id+'\')">'+(b.cargado?'✓ Pago':'Pendiente')+'</span></td>'
    +'<td>'+(b.cargado?cellIn('debitos',b.id,'fecha',b.fecha,{type:'date'}):'<span class="muted-cell">—</span>')+'</td>'
    +'<td>'+cellIn('debitos',b.id,'notas',b.notas,{ph:'+ nota'})+'</td>'
    +'<td>'+actions('debito',b.id)+'</td></tr>').join('') : emptyRow(8,(deQ||deF||deDesde||deHasta)?'Ningún débito coincide con el filtro.':'Sin registros de débitos.');
  $('#de-table').innerHTML='<table style="min-width:980px"><thead><tr><th>Asociación</th><th>Plataforma</th><th>Período</th><th>Importe</th><th>Estado</th><th>Fecha de pago</th><th>Notas</th><th></th></tr></thead><tbody>'+body+'</tbody></table>';
}
function debSetCli(id,nombre){const b=Store.get('debitos',id);if(!b)return;b.asociacion=(nombre||'').trim();b.clienteId=ensureCli(nombre,'Asociación civil');Store.upsert('debitos',b);renderDebTable();}
function toggleCargado(id){const b=Store.get('debitos',id);b.cargado=!b.cargado;b.fecha=b.cargado?today():'';Store.upsert('debitos',b);renderDebTable();}
