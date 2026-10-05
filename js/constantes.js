/*
 * Constantes generales: clave de guardado, logo, meses y carpetas de declaraciones.
 */
const KEY='sgp_gestion';
const LOGO=new URL('img/logo.png', location.href).href;        // logo completo: ingreso y exportaciones
const MONOGRAMA=new URL('img/monograma-claro.png', location.href).href; // monograma claro (G blanca, P dorada): encabezado y panel, sobre el azul
const MESES=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Set','Oct','Nov','Dic'];
const MESES_L=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Setiembre','Octubre','Noviembre','Diciembre'];
const DOW=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
// Panel: cómo se ve la primera vez (y al tocar "Volver al orden por defecto"). Anchos en columnas de 12.
const PANEL_ORDER_DEF=['kpis','vencimientos','estado','calendario','tareas','notas','vistas'];
const PANEL_WIDTHS_DEF={kpis:12,vencimientos:12,calendario:4,tareas:8,notas:8};
const FOLDERS=[
  {id:'sp',name:'Servicios Personales',ico:'🧾',color:'#0f2447'},
  {id:'iyc_cede',name:'Ind. y Comercio · CEDE',ico:'🏢',color:'#2f6fb0'},
  {id:'iyc_nocede',name:'Ind. y Comercio · No CEDE',ico:'🏬',color:'#2e7d52'},
  {id:'rural',name:'Primaria Rural',ico:'🌾',color:'#6c8f1f'},
  {id:'iass',name:'IASS / IRPF',ico:'📄',color:'#b7651b'},
  // (DICOSE = División de Contralor de Semovientes, MGAP. El id 'dicosa' queda así para no tocar lo ya guardado.)
  // "extra" = columnas propias de esa carpeta, además de las de siempre (en INAC, los kilos de carne).
  {id:'inac',name:'DJ INAC',ico:'🐄',color:'#8a3b2e',extra:[{k:'kilos',l:'Kilos de carne',ph:'kg',cls:'num'}]},
  {id:'dicosa',name:'DJ Rural DICOSE',ico:'🐑',color:'#7a5a2e'},
];
