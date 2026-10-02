/*
 * Capa de datos. Es el ÚNICO archivo que sabe dónde se guardan los datos: el resto de la página
 * solo usa Store.data.
 * ETAPA DEMO: todo se guarda en el navegador de esta computadora (localStorage, con la clave que
 * está en constantes.js). Los datos son inventados. Cuando la clienta contrate el servicio, este
 * archivo pasa a guardar cada registro como un documento en Firestore.
 * Las contraseñas de los clientes NUNCA se guardan en claro: se cifran antes (ver boveda.js).
 */
const CLI_TIPOS_DEF=['Persona física','Empresa','Asociación civil','Otro'];
const EMP_TIPOS_DEF=['Ind. y Comercio','Pequeña empresa','Unipersonal'];
// Listas de registros (cada elemento tiene su propio id).
const COLS_LISTA=['clientes','dj','tareas','debitos','notes','cal','sueldos','honCli','honMov','gastos','cuotas','impuestos'];
// Datos sensibles: se guardan solo cifrados, nunca en claro.
const CREDS=['passBps','passGub','codGub'];
// La nota adhesiva con la que arranca la demostración (la recibe la clienta al entrar).
const NOTA_BIENVENIDA='🌿 ¡Bienvenida, Gabriela!\n\nEsta página está hecha para vos. Probá todo con confianza: los datos son de ejemplo.\n\n— Equipo Wydan';
const PANEL_DEF=()=>({venc:true,tareas:true,estado:false,vistas:true,gastos:false,vencimientos:false,notas:true,calendario:true,kpis:['tareasPend','tareasVenc'],order:PANEL_ORDER_DEF.slice(),widths:Object.assign({},PANEL_WIDTHS_DEF)});

// Texto estable de un objeto (claves ordenadas): sirve para saber si algo cambió.
function canon(v){
  if(Array.isArray(v))return '['+v.map(canon).join(',')+']';
  if(v&&typeof v==='object')return '{'+Object.keys(v).sort().filter(k=>v[k]!==undefined).map(k=>JSON.stringify(k)+':'+canon(v[k])).join(',')+'}';
  return JSON.stringify(v===undefined?null:v);
}

const Store={
  data:null,

  load(){
    // Si hay algo guardado en este navegador, se usa. Pero si quedó vacío (o ilegible), se rehacen
    // los datos de ejemplo: una demostración siempre tiene que tener información para mostrar.
    try{
      const r=localStorage.getItem(KEY);
      if(r){
        const d=JSON.parse(r);
        const tieneAlgo=['clientes','dj','tareas','gastos','sueldos','honCli'].some(function(k){ return Array.isArray(d[k])&&d[k].length; });
        if(tieneAlgo){ this.data=d; this._fix(); Boveda.setConfig(this.data.boveda||null); return; }
      }
    }catch(e){ console.error('No se pudieron leer los datos guardados en este navegador',e); }
    try{ this.data=seed(); }
    catch(e){ console.error('No se pudieron armar los datos de ejemplo',e); this.data={}; }
    this._fix(); Boveda.setConfig(null);
  },

  // Guarda en el navegador. Las credenciales se sacan del texto guardado: solo quedan cifradas, en "_sec".
  _escribir(){
    try{ localStorage.setItem(KEY,JSON.stringify(this.data,function(k,v){ return CREDS.indexOf(k)>=0?undefined:v; })); }
    catch(e){ console.error('No se pudo guardar',e); }
  },
  save(){
    if(this.data&&typeof syncCliList==='function')syncCliList(); // la lista para autocompletar clientes, siempre al día
    this._escribir();
    if(Boveda.clave)this._flush();
  },
  // Cifra las credenciales que hayan cambiado y vuelve a guardar.
  async _flush(){
    try{ await Boveda.cifrarPendientes(this.data.clientes); }catch(e){ console.error(e); }
    this._escribir();
  },

  // Completa lo que falte (datos guardados por una versión anterior, o una base recién creada).
  _fix(){
    const d=this.data;
    COLS_LISTA.forEach(k=>{ if(!Array.isArray(d[k]))d[k]=[]; });
    if(!d.grids)d.grids=emptyGrids();
    ['empresas','sprof'].forEach(g=>{ if(!d.grids[g])d.grids[g]={rows:[]}; });
    if(!Array.isArray(d.sldSubs)||!d.sldSubs.length)d.sldSubs=defaultSubs();
    if(!Array.isArray(d.sldHidden))d.sldHidden=[];
    if(!d.sldColsCfg||typeof d.sldColsCfg!=='object')d.sldColsCfg={};
    if(!Array.isArray(d.empTipos))d.empTipos=EMP_TIPOS_DEF.slice();
    if(!Array.isArray(d.gastoCats)||!d.gastoCats.length)d.gastoCats=GASTO_CATS_DEF.slice();
    if(!Array.isArray(d.cliTipos)){ d.cliTipos=CLI_TIPOS_DEF.slice(); d.clientes.forEach(c=>{ if(c.tipo&&d.cliTipos.indexOf(c.tipo)<0)d.cliTipos.push(c.tipo); }); }
    if(!d.panel)d.panel=PANEL_DEF();
    if(!d.gcal)d.gcal={url:'',auto:true,last:0};
    if(typeof vencCfg==='function')vencCfg(); // deja lista la configuración de vencimientos
    // DEMOSTRACIÓN: si una sección quedó sin ejemplos (por ejemplo, porque esta persona abrió el demo
    // con una versión anterior, cuando Gastos todavía no existía), se vuelven a cargar.
    d.gastos.forEach(function(g){ if(g.conIva){ if(!g.ivaModo)g.ivaModo='incluido'; if(!g.ivaDed)g.ivaDed=100; } });
    if(MODO_DEMO&&!d.gastos.length&&typeof seedGastos==='function'){ d.gastos=seedGastos(); d.cuotas=seedCuotas(d.gastos); }
    if(MODO_DEMO&&!d.impuestos.length&&typeof seedImpuestos==='function')d.impuestos=seedImpuestos();
    // Lo mismo con DJ INAC, DJ Rural DICOSA y Asoc. Civiles (se sumaron el 02/10/2026).
    if(MODO_DEMO){
      const ej=seedNuevas(), sumar=function(cids){ cids.forEach(function(id){ if(!d.clientes.some(function(c){return c.id===id;})){ const c=ej.clientes.find(function(x){return x.id===id;}); if(c)d.clientes.push(c); } }); };
      ['inac','dicosa'].forEach(function(f){ if(!d.dj.some(function(x){return x.folder===f;})){ const nuevas=ej.dj.filter(function(x){return x.folder===f;}); sumar(nuevas.map(function(x){return x.clienteId;})); d.dj=d.dj.concat(nuevas); } });
      if(!d.debitos.length){ sumar(ej.debitos.map(function(x){return x.clienteId;})); d.debitos=ej.debitos; }
      // Grillas sin ningún mes marcado y calendario sin eventos: se completan con ejemplos (02/10/2026).
      if(['empresas','sprof'].every(function(g){ return d.grids[g].rows.every(function(r){ return !Object.keys(r.cells||{}).length; }); }))sembrarCeldas(d.grids);
      if(!d.cal.length)d.cal=eventosEjemplo();
    }
    if(d.cliTipos.indexOf('Asociación civil')<0)d.cliTipos.push('Asociación civil');
    // La nota de bienvenida se fue mejorando: si en este navegador quedó una versión anterior, se
    // actualiza sola. Solo toca esa nota, nunca una escrita por la clienta.
    var bv=d.notes.find(function(n){ return n.id==='n1'; });
    var esNuestra=bv&&(/^Esta es una demostración/.test(bv.text||'')||/—\s*Equipo Wydan\s*$/.test(bv.text||''));
    if(esNuestra&&bv.text!==NOTA_BIENVENIDA)bv.text=NOTA_BIENVENIDA;
    // Cada declaración pertenece a un año y puede tener un tipo.
    d.dj.forEach(x=>{ if(!x.anio)x.anio=x.venc?+x.venc.slice(0,4):new Date().getFullYear(); if(x.tipoDj===undefined)x.tipoDj=''; });
    // Vincular por nombre las filas de Empresas / Serv. Profesionales / Sueldos con la ficha del cliente.
    ['empresas','sprof'].forEach(g=>{ (d.grids[g]&&d.grids[g].rows||[]).forEach(r=>{ if(!r.clienteId){ const c=d.clientes.find(x=>(x.nombre||'').trim().toLowerCase()===(r.nombre||'').trim().toLowerCase()); if(c)r.clienteId=c.id; } }); });
    (d.sueldos||[]).forEach(r=>{ if(!r.clienteId&&r.empresa){ const c=d.clientes.find(x=>(x.nombre||'').trim().toLowerCase()===r.empresa.trim().toLowerCase()); if(c)r.clienteId=c.id; } });
  },

  all(c){ return this.data[c]||[]; },
  get(c,id){ return this.all(c).find(x=>x.id===id); },
  upsert(c,o){ if(!o.id){ o.id=c[0]+Date.now()+Math.floor(Math.random()*999); o._t=Date.now(); this.data[c].push(o); } else { const i=this.data[c].findIndex(x=>x.id===o.id); if(i>=0)this.data[c][i]=o; } this.save(); return o; },
  remove(c,id){ this.data[c]=this.all(c).filter(x=>x.id!==id); this.save(); }
};

function emptyGrids(){ return {empresas:{rows:[]},sprof:{rows:[]},sueldos:{rows:[]}}; }

/* ===== DATOS DE EJEMPLO PARA LA DEMOSTRACIÓN — TODOS INVENTADOS ===== */
function seed(){
  const yy=new Date().getFullYear(), mm=new Date().getMonth()+1;
  const d=(m,day)=>yy+'-'+String(m).padStart(2,'0')+'-'+String(day).padStart(2,'0');
  const cl=[
    {id:'c1',nombre:'Silveira, Valentina',tipo:'Persona física',rut:'',ci:'4.987.321-5',bps:'',fnac:'1988-07-04',whatsapp:'099445566',correo:'valentina@ejemplo.com',direccion:'',fosmetal:'',otros:'',notas:''},
    {id:'c2',nombre:'Panadería La Espiga SRL',tipo:'Empresa',rut:'21 777888 0013',ci:'',bps:'8451207',fnac:'',whatsapp:'092334455',correo:'laespiga@ejemplo.com',direccion:'Sarandí 742',fosmetal:'',otros:'',notas:''},
    {id:'c3',nombre:'Transportes del Norte SA',tipo:'Empresa',rut:'21 334455 0017',bps:'7719044',notas:''},
    {id:'c4',nombre:'Estancia Los Ceibos',tipo:'Empresa',rut:'',bps:'',notas:''},
    {id:'c5',nombre:'Almacén Doña Nelly',tipo:'Empresa',rut:'',bps:'',notas:''},
    {id:'c6',nombre:'Techera, Rodrigo',tipo:'Persona física',ci:'3.112.998-0',notas:''},
  ];
  const dj=[
    {id:'d1',folder:'sp',anio:yy,nroDj:'11-2026-0457',tipoDj:'',clienteId:'c1',hecho:false,presentada:'',importe:'',medio:'',fechaPago:'',estado:'Pendiente',venc:d(mm,26),notas:''},
    {id:'d2',folder:'iyc_cede',anio:yy,nroDj:'11-2026-0983',tipoDj:'',clienteId:'c2',hecho:false,presentada:'',importe:'',medio:'',fechaPago:'',estado:'En proceso',venc:d(mm,20),notas:''},
    {id:'d3',folder:'iyc_nocede',anio:yy,tipoDj:'',clienteId:'c3',hecho:false,presentada:'',importe:'',medio:'',fechaPago:'',estado:'Pendiente',venc:d(mm,15),notas:''},
    {id:'d4',folder:'rural',anio:yy,nroDj:'11-2026-0312',tipoDj:'',clienteId:'c4',hecho:true,presentada:d(mm,8),importe:'',medio:'',fechaPago:'',estado:'Presentada',venc:d(mm,10),notas:''},
    {id:'d5',folder:'iass',anio:yy,tipoDj:'',clienteId:'c6',hecho:false,presentada:'',importe:'',medio:'',fechaPago:'',estado:'Pendiente',venc:d(mm+1,5),notas:''},
  ];
  const tareas=[
    {id:'t1',tarea:'Certificado único DGI',clienteId:'c2',etiqueta:'DGI',urgencia:'Alta',plazo:d(mm,12),estado:'Pendiente',info:'Lo piden para una licitación.',hecho:false},
    {id:'t2',tarea:'Flujo de fondos',clienteId:'c1',etiqueta:'Banco',urgencia:'Media',plazo:d(mm,18),estado:'En proceso',info:'Para el préstamo.',hecho:false},
    {id:'t3',tarea:'Certificado común BPS',clienteId:'c3',etiqueta:'BPS',urgencia:'Media',plazo:d(Math.min(mm+1,12),8),estado:'Pendiente',info:'Para presentar en el banco.',hecho:false},
    {id:'t4',tarea:'Estado de situación patrimonial',clienteId:'c9',etiqueta:'Banco',urgencia:'Baja',plazo:d(Math.min(mm+1,12),20),estado:'Pendiente',info:'Lo pide el banco para renovar la línea de crédito.',hecho:false},
    {id:'t5',tarea:'Inscripción en DGI',clienteId:'c8',etiqueta:'Cliente nuevo',urgencia:'Alta',plazo:d(mm,2),estado:'Hecha',info:'Alta de la carnicería.',hecho:true},
  ];
  const grids={
    empresas:{rows:[{id:'e1',nombre:'Panadería La Espiga SRL',clienteId:'c2',tipo:'CEDE',cells:{}},{id:'e2',nombre:'Almacén Doña Nelly',clienteId:'c5',tipo:'No CEDE',cells:{}},{id:'e3',nombre:'Transportes del Norte SA',clienteId:'c3',tipo:'CEDE',cells:{}},{id:'e4',nombre:'Carnicería El Novillo',clienteId:'c8',tipo:'No CEDE',cells:{}}]},
    sprof:{rows:[{id:'s1',nombre:'Techera, Rodrigo',clienteId:'c6',tipo:'',cells:{}},{id:'s2',nombre:'Silveira, Valentina',clienteId:'c1',tipo:'',cells:{}}]},
    sueldos:{rows:[]},
  };
  sembrarCeldas(grids);
  const gastos=seedGastos();
  const notes=[{id:'n1',text:NOTA_BIENVENIDA,color:'#fff3bf',date:''}];
  const h=seedHon();
  const ej=seedNuevas();
  return {clientes:cl.concat(ej.clientes),dj:dj.concat(ej.dj),debitos:ej.debitos,tareas,grids,cal:eventosEjemplo(),notes:notes,gastos:gastos,cuotas:seedCuotas(gastos),impuestos:seedImpuestos(),gastoCats:GASTO_CATS_DEF.slice(),sueldos:seedSueldos(),sldSubs:defaultSubs(),sldHidden:[],empTipos:EMP_TIPOS_DEF.slice(),cliTipos:CLI_TIPOS_DEF.slice(),honCli:h.cli,honMov:h.mov,gcal:{url:'',auto:true,last:0},panel:PANEL_DEF()};
}

// Ejemplos de DJ INAC, DJ Rural DICOSA y Asoc. Civiles (también se usan para completar el demo de quien
// lo abrió antes de que existieran estas secciones). Todos inventados.
function seedNuevas(){
  const yy=new Date().getFullYear(), mm=new Date().getMonth()+1, m2=Math.min(mm+1,12);
  const d=(m,day)=>yy+'-'+String(m).padStart(2,'0')+'-'+String(day).padStart(2,'0');
  const dj0={hecho:false,presentada:'',importe:'',medio:'',fechaPago:'',estado:'Pendiente',notas:''};
  return {
    clientes:[
      {id:'c7',nombre:'Asoc. Civil Club Social Unión',tipo:'Asociación civil',rut:'',bps:'',notas:''},
      {id:'c8',nombre:'Carnicería El Novillo',tipo:'Empresa',rut:'',bps:'',notas:''},
      {id:'c9',nombre:'Rodríguez, Martín',tipo:'Persona física',ci:'',notas:'Productor rural'},
    ],
    dj:[
      Object.assign({},dj0,{id:'x1',folder:'inac',anio:yy,clienteId:'c8',nroDj:'214785',tipoDj:'Mensual',kilos:'12.450',venc:d(mm,25)}),
      Object.assign({},dj0,{id:'x2',folder:'inac',anio:yy,clienteId:'c4',nroDj:'214612',tipoDj:'Mensual',kilos:'8.930',venc:d(mm,10),hecho:true,presentada:d(mm,9),estado:'Presentada'}),
      Object.assign({},dj0,{id:'x3',folder:'dicosa',anio:yy,clienteId:'c4',nroDj:'07-1234-5678',tipoDj:'Anual',venc:d(mm,5),hecho:true,presentada:d(mm,3),estado:'Presentada'}),
      Object.assign({},dj0,{id:'x4',folder:'dicosa',anio:yy,clienteId:'c9',nroDj:'',tipoDj:'Anual',venc:d(m2,12),estado:'En proceso'}),
    ],
    debitos:[
      {id:'b1',asociacion:'Asoc. Civil Club Social Unión',clienteId:'c7',plataforma:'Visa',periodo:MESES[mm-1]+' '+yy,importe:'4.200',cargado:false,fecha:'',notas:''},
      {id:'b2',asociacion:'Asoc. Civil Club Social Unión',clienteId:'c7',plataforma:'OCA',periodo:MESES[mm-1]+' '+yy,importe:'1.850',cargado:true,fecha:d(mm,3),notas:''},
    ],
  };
}

// Empresas y Serv. Profesionales con los meses ya trabajados: los anteriores hechos y enviados, el actual a medias.
// (Las celdas se guardan por año: "año-mes", con el mes de 0 a 11.)
function sembrarCeldas(grids){
  const yy=new Date().getFullYear(), mi=new Date().getMonth(), f=(m,day)=>yy+'-'+String(m+1).padStart(2,'0')+'-'+String(day).padStart(2,'0');
  ['empresas','sprof'].forEach(function(g){
    (grids[g].rows||[]).forEach(function(r,i){
      r.cells=r.cells||{};
      for(let m=0;m<mi;m++){
        const c=(i===1&&m===mi-1)?{estado:'pend'}:{estado:'done',fecha:f(m,8+i*3),enviado:true,fechaEnvio:f(m,10+i*3)};
        if(g==='empresas'&&i===3&&m%4===0)c.etiqueta='Cuotas3';
        r.cells[yy+'-'+m]=c;
      }
      // Mes actual: la primera fila ya hecha, la segunda en marcha, el resto sin empezar.
      if(i===0)r.cells[yy+'-'+mi]={estado:'done',fecha:f(mi,1),enviado:false};
      if(i===1)r.cells[yy+'-'+mi]={estado:'pend',comentario:'Falta la planilla de compras'};
    });
  });
}
function eventosEjemplo(){
  const yy=new Date().getFullYear(), mm=new Date().getMonth()+1, dd=new Date().getDate(), m2=Math.min(mm+1,12);
  const d=(m,day)=>yy+'-'+String(m).padStart(2,'0')+'-'+String(day).padStart(2,'0');
  return [
    {id:'ev1',titulo:'Reunión con Panadería La Espiga (balance)',fecha:d(mm,Math.min(dd+2,28))},
    {id:'ev2',titulo:'Capacitación DGI: novedades de IVA',fecha:d(mm,Math.min(dd+6,28))},
    {id:'ev3',titulo:'Visita a Estancia Los Ceibos',fecha:d(m2,4)},
  ];
}
