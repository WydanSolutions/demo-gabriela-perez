/*
 * Vencimientos de certificados (pedido de la clienta, 17/10/2026).
 * - EMPRESAS: cada empresa tiene una fecha de vencimiento por certificado (DJ, BPS, DGI, MTOP APPLUS…).
 *   Se ven como columnas en la vista mensual de Empresas, y en la anual con el selector «Meses | Certificados».
 * - ASOC. CIVILES: un cuadro aparte, «Vencimientos por asociación» (DGI, BPS, RUPE, Comisiones).
 * El vencimiento es UNA fecha por empresa (no una por mes): cuando se renueva, se cambia la fecha.
 * Las listas de certificados se pueden editar (⚙ Certificados): cada uno tiene un id, así renombrarlo no pierde las fechas.
 * Todas las fechas salen en el Calendario (pastilla «Certificados» para mostrarlas u ocultarlas).
 * Datos: Store.data.certEmp / certAsoc = [{id,n}] (las listas) · grids.empresas.rows[].certs = {id:'AAAA-MM-DD'}
 *        · Store.data.asocVenc = [{id, asociacion, clienteId, certs:{id:'AAAA-MM-DD'}}].
 */
/* ===== CERTIFICADOS ===== */
const CERT_EMP_DEF=['DJ','BPS','DGI','MTOP APPLUS','MTOP CIRCULACIÓN','BSE AT','BSE VEHÍCULOS','INAC','FE'];
const CERT_ASOC_DEF=['DGI','BPS','RUPE','Comisiones'];
const CERT_AVISO_DIAS=30;   // «por vencer»: vence en 30 días o menos

function certSlug(n){ return String(n||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'')||('c'+Date.now()); }
function certDef(lista){ return lista.map(function(n){ return {id:certSlug(n),n:n}; }); }
// La lista de certificados de cada lado ('emp' = Empresas, 'asoc' = Asoc. civiles).
function certLista(t){
  var k=t==='asoc'?'certAsoc':'certEmp';
  if(!Array.isArray(Store.data[k]))Store.data[k]=certDef(t==='asoc'?CERT_ASOC_DEF:CERT_EMP_DEF);
  return Store.data[k];
}
function asocVencRows(){ if(!Array.isArray(Store.data.asocVenc))Store.data.asocVenc=[]; return Store.data.asocVenc; }

// Estado de una fecha: vencido (rojo) · pronto (ámbar, 30 días o menos) · ok.
function certEstado(iso){ if(!iso)return ''; var d=daysTo(iso); if(d===null)return ''; return d<0?'venc':(d<=CERT_AVISO_DIAS?'pronto':'ok'); }
function certTip(iso){ if(!iso)return 'Sin fecha cargada'; var d=daysTo(iso); return d<0?('Venció hace '+(-d)+' día'+(d===-1?'':'s')):(d===0?'Vence hoy':('Vence en '+d+' día'+(d===1?'':'s'))); }
// La celda de una fecha (se edita en la tabla).
function certCelda(t,rid,c,iso){
  var est=certEstado(iso);
  return '<td class="cert-td'+(est?' cert-'+est:'')+(iso?'':' cert-vacio')+'" data-tip="'+esc(c.n+' · '+certTip(iso))+'"><input class="cell-in cert-in" type="date"'+DR
    +' value="'+esc(iso||'')+'" onchange="if(dateOk(this))certSet(\''+t+'\',\''+rid+'\',\''+c.id+'\',this.value)"></td>';
}
function certHead(t){ return certLista(t).map(function(c){ return '<th class="cert-th">'+esc(c.n)+'</th>'; }).join(''); }
function certCeldasFila(t,row){ var cs=row.certs||{}; return certLista(t).map(function(c){ return certCelda(t,row.id,c,cs[c.id]); }).join(''); }
// Cuántos vencidos y por vencer hay (para el aviso arriba de la tabla).
function certResumen(t,rows){
  var v=0,p=0; rows.forEach(function(r){ certLista(t).forEach(function(c){ var e=certEstado((r.certs||{})[c.id]); if(e==='venc')v++; else if(e==='pronto')p++; }); });
  if(!v&&!p)return '<div class="cert-resumen ok">✓ Ningún certificado vencido ni por vencer en los próximos '+CERT_AVISO_DIAS+' días.</div>';
  return '<div class="cert-resumen">'+(v?'<span class="cert-chip venc">'+v+' vencido'+(v===1?'':'s')+'</span>':'')
    +(p?'<span class="cert-chip pronto">'+p+' por vencer (30 días)</span>':'')+'<span class="muted-cell">Pasá el mouse por una fecha para ver cuántos días faltan.</span></div>';
}

function certSet(t,rid,cid,v){
  var row=t==='asoc'?asocVencRows().find(function(x){return x.id===rid;}):gridRow('empresas',rid);
  if(!row)return; row.certs=row.certs||{};
  if(v)row.certs[cid]=v; else delete row.certs[cid];
  Store.save(); certRefrescar(t);
}
function certRefrescar(t){ if(t==='asoc'){ renderAsocVenc(); } else renderGrid('empresas'); }

/* ===== ⚙ Editar la lista de certificados ===== */
function certConfig(t){
  curForm={form:'noop'};
  $('#modal-title').textContent='Certificados · '+(t==='asoc'?'Asoc. civiles':'Empresas'); $('#modal-del').style.display='none';
  $('#modal-body').innerHTML='<p class="muted-cell" style="font-size:12.5px;margin-bottom:10px">Cambiá el nombre de un certificado, ordenalos o sacá el que no uses. Las fechas ya cargadas no se pierden al renombrar.</p>'
    +certLista(t).map(function(c,i,a){ return '<div class="colrow"><input value="'+esc(c.n)+'" onchange="certRenombrar(\''+t+'\','+i+',this.value)">'
      +'<button class="btn-ghost" title="Subir" '+(i===0?'disabled':'')+' onclick="certMover(\''+t+'\','+i+',-1)">↑</button>'
      +'<button class="btn-ghost" title="Bajar" '+(i===a.length-1?'disabled':'')+' onclick="certMover(\''+t+'\','+i+',1)">↓</button>'
      +'<button class="btn-ghost" title="Sacar" style="color:var(--red)" onclick="certSacar(\''+t+'\','+i+')">🗑</button></div>'; }).join('')
    +'<button class="btn btn-sm" style="margin-top:10px" onclick="certAgregar(\''+t+'\')">+ Agregar certificado</button>';
  $('#modal-cancel').style.display='none';
  $('#modal .modal-foot .btn-primary').textContent='Listo';
  $('#modal').classList.add('open');
}
function certRenombrar(t,i,v){ v=(v||'').trim(); if(!v){ toast('El nombre no puede quedar vacío'); certConfig(t); return; } certLista(t)[i].n=v; Store.save(); certRefrescar(t); }
function certMover(t,i,d){ var l=certLista(t), j=i+d; if(j<0||j>=l.length)return; var x=l[i]; l[i]=l[j]; l[j]=x; Store.save(); certRefrescar(t); certConfig(t); }
function certSacar(t,i){
  var c=certLista(t)[i]; if(!confirm('¿Sacar «'+c.n+'» de la lista? Se borran también sus fechas.'))return;
  certLista(t).splice(i,1);
  (t==='asoc'?asocVencRows():Store.data.grids.empresas.rows).forEach(function(r){ if(r.certs)delete r.certs[c.id]; });
  Store.save(); certRefrescar(t); certConfig(t);
}
function certAgregar(t){
  pedirTexto('Certificado nuevo','Nombre (ej: Habilitación de bomberos)','','Agregar',function(n){
    var id=certSlug(n); if(certLista(t).some(function(c){return c.id===id;}))id+='_'+Date.now();
    certLista(t).push({id:id,n:n}); Store.save(); certRefrescar(t); certConfig(t); toast('Certificado agregado');
  });
}

/* ===== ASOC. CIVILES: «Vencimientos por asociación» (debajo de los débitos) ===== */
function renderAsocVenc(){
  var el=document.getElementById('asoc-venc'); if(!el)return;
  var rows=asocVencRows().slice().sort(function(a,b){ return (cliNameOr(a.clienteId)||a.asociacion||'').localeCompare(cliNameOr(b.clienteId)||b.asociacion||''); });
  var n=certLista('asoc').length;
  var body=rows.length?rows.map(function(r){
    return '<tr><td><div class="name-cell">'+cliInput(cliNameOr(r.clienteId)||r.asociacion,'asocVencSetCli(\''+r.id+'\',this.value)','Asociación…')
      +(r.clienteId?'<button class="go-cli" title="Ver la ficha del cliente" onclick="goCli(\''+r.clienteId+'\')">↗</button>':'')+'</div></td>'
      +certCeldasFila('asoc',r)
      +'<td><div class="row-act"><button class="btn-ghost" title="Quitar" style="color:var(--red)" onclick="asocVencBorrar(\''+r.id+'\')">🗑</button></div></td></tr>';
  }).join(''):emptyRow(n+2,'Todavía no hay asociaciones. Tocá «+ Asociación».');
  el.innerHTML='<div class="view-head" style="margin-top:28px"><div><h2 style="font-size:20px">Vencimientos por asociación</h2>'
    +'<div class="sub">Certificados de cada asociación: en rojo los vencidos, en ámbar los que vencen en 30 días o menos. Salen en el Calendario.</div></div>'
    +'<span style="display:flex;gap:8px"><button class="btn btn-sm" onclick="certConfig(\'asoc\')">⚙ Certificados</button>'
    +'<button class="btn btn-sm btn-primary" onclick="asocVencNueva()">+ Asociación</button></span></div>'
    +certResumen('asoc',rows)
    +'<div class="table-wrap"><table class="t-ficha"><thead><tr><th>Asociación</th>'+certHead('asoc')+'<th></th></tr></thead><tbody>'+body+'</tbody></table></div>';
}
function asocVencNueva(){
  pedirTexto('Asociación nueva','Nombre de la asociación civil','','Agregar',function(n){
    var cid=ensureCli(n,'Asociación civil');
    if(asocVencRows().some(function(r){return r.clienteId===cid;})){ toast('Esa asociación ya está en la lista'); return; }
    asocVencRows().push({id:'av'+Date.now(),asociacion:n,clienteId:cid,certs:{}}); Store.save(); renderAsocVenc(); toast('Asociación agregada');
  });
}
function asocVencSetCli(id,nombre){ var r=asocVencRows().find(function(x){return x.id===id;}); if(!r)return; nombre=(nombre||'').trim(); if(!nombre){ renderAsocVenc(); return; } r.asociacion=nombre; r.clienteId=ensureCli(nombre,'Asociación civil'); Store.save(); renderAsocVenc(); }
function asocVencBorrar(id){ if(!confirm('¿Quitar esta asociación y sus vencimientos?'))return; Store.data.asocVenc=asocVencRows().filter(function(x){return x.id!==id;}); Store.save(); renderAsocVenc(); }
// Se dibuja junto con la pestaña de Asoc. civiles.
var _renderDebitosBase=renderDebitos;
renderDebitos=function(){ _renderDebitosBase(); var v=document.getElementById('view-debitos'); if(v&&!document.getElementById('asoc-venc'))v.insertAdjacentHTML('beforeend','<div id="asoc-venc"></div>'); renderAsocVenc(); };

/* ===== EN EL CALENDARIO ===== */
function certCalVisible(){ return Store.data.certCal!==false; }
function certCalToggle(){ Store.data.certCal=!certCalVisible(); Store.save(); renderCal(); }
// Todas las fechas de certificados: [{iso, txt}]
function certEventos(){
  var out=[];
  (Store.data.grids.empresas.rows||[]).forEach(function(r){ var cs=r.certs||{}; certLista('emp').forEach(function(c){ if(cs[c.id])out.push({iso:cs[c.id],txt:(r.nombre||'Empresa')+' · '+c.n+' vence'}); }); });
  asocVencRows().forEach(function(r){ var cs=r.certs||{}; certLista('asoc').forEach(function(c){ if(cs[c.id])out.push({iso:cs[c.id],txt:(cliNameOr(r.clienteId)||r.asociacion||'Asociación')+' · '+c.n+' vence'}); }); });
  return out;
}
var _calEventsMapBase=calEventsMap;
calEventsMap=function(){
  var ev=_calEventsMapBase();
  if(certCalVisible())certEventos().forEach(function(e){ (ev[e.iso]=ev[e.iso]||[]).push({txt:'📜 '+e.txt,cls:'ev-cert'}); });
  return ev;
};
var _calLeyendaVencBase=calLeyendaVenc;
calLeyendaVenc=function(){
  var h=_calLeyendaVencBase(), on=certCalVisible();
  var chip='<button class="vchip'+(on?'':' off')+'" onclick="certCalToggle()" data-tip="Vencimientos de certificados de Empresas y Asoc. civiles"><i style="background:var(--cert)"></i>📜 Certificados</button>';
  return h.replace('<span class="vleyenda-n">',chip+'<span class="vleyenda-n">');
};

/* ===== EJEMPLOS (inventados) ===== */
// Fechas alrededor de hoy: algunas vencidas, otras por vencer y el resto más adelante.
function certFechaEj(dias){ var d=new Date(); d.setDate(d.getDate()+dias); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function sembrarCertEmpresas(rows){
  var plan=[ // días desde hoy por certificado (null = sin cargar), en el orden de CERT_EMP_DEF
    [95,-6,140,null,null,60,null,null,210],        // Panadería: BPS vencido
    [180,22,75,null,null,12,null,null,300],         // Almacén: BPS y BSE AT por vencer
    [120,160,-15,45,190,240,28,null,150],           // Transportes: DGI vencido, BSE vehículos por vencer
    [70,200,110,null,null,90,null,18,260],          // Carnicería: INAC por vencer
  ];
  var ids=certDef(CERT_EMP_DEF).map(function(c){return c.id;});
  (rows||[]).forEach(function(r,i){ var p=plan[i%plan.length]; r.certs={}; ids.forEach(function(id,k){ if(p[k]!==null)r.certs[id]=certFechaEj(p[k]); }); });
}
function asocVencEjemplo(){
  var ids=certDef(CERT_ASOC_DEF).map(function(c){return c.id;});
  var a={}, b={};
  [40,-9,150,25].forEach(function(d,k){ a[ids[k]]=certFechaEj(d); });
  [210,85,14,300].forEach(function(d,k){ b[ids[k]]=certFechaEj(d); });
  return [{id:'av1',asociacion:'Asoc. Civil Club Social Unión',clienteId:'c7',certs:a},
          {id:'av2',asociacion:'Asoc. Civil Comisión de Fomento Barrio Sur',clienteId:'c10',certs:b}];
}
