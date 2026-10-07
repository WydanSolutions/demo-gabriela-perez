/*
 * Gastos · el IVA de las COMPRAS (07/10/2026, mismos arreglos que la página de María Lucía).
 * La tabla de gastos es CAJA (lo que vence o se paga en el mes) y el IVA es DEVENGADO (la fecha de la
 * factura, como lo toma DGI). Son dos criterios distintos y correctos: este archivo los reconcilia.
 */
// IVA de las COMPRAS del mes (el crédito fiscal corresponde a la fecha de la factura, no a la de la cuota).
// Devuelve el IVA de las facturas y cuánto de eso se puede deducir (hay compras que se computan al 50%).
function gstIvaDelMes(y,m){
  var t=0, ded=0;
  Store.all('gastos').forEach(function(g){
    if(gstAnioDe(g)!==y||gstMesDe(g)!==m)return;
    var iva=honNum(g.iva)||0; t+=iva; ded+=gstIvaDeducible(g);
  });
  return {iva:t,ded:ded};
}
// Lo deducible de un gasto: el IVA por su porcentaje (100% o 50%).
function gstIvaDeducible(g){ return Math.round((honNum(g.iva)||0)*(g.ivaDed||100))/100; }
// La celda de IVA en la tabla: el IVA de la factura y, si se computa al 50%, cuánto queda deducible.
function gstCeldaIva(f){
  var g=f.g, iva=honNum(g.iva)||0;
  if(f.tipo==='cuota')return '<span class="muted-cell" data-tip="El IVA se cuenta en el mes de la compra, no en el de la cuota">—</span>';
  if(!g.conIva||!iva)return '<span class="muted-cell">—</span>';
  // La fila puede estar en un mes y su factura en otro (una compra de octubre que vence en noviembre).
  // El IVA cuenta SOLO en el mes de la factura: si no es este, se dice a cuál se fue en vez de
  // mostrar un importe que no suma acá.
  if(gstAnioDe(g)!==gstYear()||gstMesDe(g)!==gstMes){
    var mf=gstMesDe(g), af=gstAnioDe(g);
    return '<span class="gst-iva-otro" data-tip="Factura del '+fDate(g.fecha)+'. El IVA de '+money(iva)
      +' cuenta en '+MESES_L[mf]+' '+af+', no en este mes.">IVA → '+MESES_L[mf].toLowerCase()+(af!==gstYear()?' '+af:'')+'</span>';
  }
  return money(iva)+((g.ivaDed||100)===50?'<span class="gst-ded">50% → '+money(gstIvaDeducible(g))+'</span>':'');
}

/* El detalle del IVA del mes, factura por factura (desplegable debajo de la barra de resultado).
   Una compra facturada en octubre y pagada a crédito desde noviembre no figura en la tabla de octubre,
   aunque su IVA sí cuenta en octubre: acá se ve y se explica. */
function gstIvaDetalle(y,m){
  var enTabla={};
  gstFilasMes(y,m).forEach(function(f){ enTabla[f.g.id]=true; });
  var filas=Store.all('gastos').filter(function(g){
    return gstAnioDe(g)===y&&gstMesDe(g)===m&&(honNum(g.iva)||0)>0;
  }).sort(function(a,b){ return (a.fecha||'').localeCompare(b.fecha||''); });
  if(!filas.length)return '';
  var mitad=filas.some(function(g){ return (g.ivaDed||100)!==100; });
  var fuera=filas.filter(function(g){ return !enTabla[g.id]; }).length;
  var h='<details class="gst-ivadet"><summary>Ver de dónde sale el IVA de '+MESES_L[m].toLowerCase()
    +(fuera?' <span class="gst-ivadet-n">'+fuera+' factura'+(fuera===1?'':'s')+' que no se ve'+(fuera===1?'':'n')+' arriba</span>':'')
    +'</summary><table class="gst-ivatab"><thead><tr><th>Factura</th><th>Fecha</th><th class="num">IVA</th>'
    +(mitad?'<th class="num">Deducible</th>':'')+'<th></th></tr></thead><tbody>';
  var tot=0, totDed=0;
  filas.forEach(function(g){
    var iva=honNum(g.iva)||0, ded=gstIvaDeducible(g); tot+=iva; totDed+=ded;
    h+='<tr'+(enTabla[g.id]?'':' class="gst-ivafuera"')+'><td>'+esc(g.concepto||'(sin concepto)')+'</td>'
      +'<td>'+fDate(g.fecha)+'</td><td class="num">'+money(iva)+'</td>'
      +(mitad?'<td class="num">'+((g.ivaDed||100)===100?money(ded):'<b>'+money(ded)+'</b> <span class="muted-cell">('+(g.ivaDed||100)+'%)</span>')+'</td>':'')
      +'<td class="gst-ivanota">'+(enTabla[g.id]?'':(g.forma==='credito'?'a crédito: se paga en cuotas desde otro mes':'se paga en otro mes'))+'</td></tr>';
  });
  h+='</tbody><tfoot><tr><td colspan="2"><b>Total del mes</b></td><td class="num"><b>'+money(tot)+'</b></td>'
    +(mitad?'<td class="num"><b>'+money(totDed)+'</b></td>':'')+'<td></td></tr></tfoot></table>'
    +'<div class="gst-ivapie">El IVA va siempre al mes de la <b>fecha de la factura</b>, sin importar cómo ni cuándo se pague. '
    +'Por eso puede haber facturas acá que no estén en la lista de arriba, que muestra la plata que sale cada mes.</div></details>';
  return h;
}
