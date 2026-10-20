// =====================================================================
// ElectroServices - aplicación
// =====================================================================
(() => {
  'use strict';
  const CFG = window.APP_CONFIG || {};
  const EMPRESA = CFG.EMPRESA || 'ElectroServices';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const app = $('#app');

  // ------------------------------------------------------------ formato
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
  const miles = n => String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const clp = n => (n < 0 ? '-$' : '$') + miles(n);
  const parseMoney = s => num(String(s ?? '').replace(/[^\d]/g, ''));
  const pad = n => String(n).padStart(2, '0');
  const isoLocal = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const hoy = () => isoLocal(new Date());
  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const MESES_L = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const fdate = s => { if (!s) return ''; const [y, m, d] = String(s).slice(0, 10).split('-'); return `${+d} ${MESES[+m - 1]} ${y}`; };
  const dias = s => Math.round((new Date(String(s).slice(0, 10) + 'T12:00') - new Date(hoy() + 'T12:00')) / 86400000);
  const cuando = s => { const n = dias(s); if (n === 0) return 'Hoy'; if (n === 1) return 'Mañana'; if (n === -1) return 'Ayer'; if (n < 0) return `Hace ${-n} días`; if (n < 7) return `En ${n} días`; return fdate(s); };
  const sum = (arr, f) => arr.reduce((a, x) => a + num(f(x)), 0);
  const byText = k => (a, b) => String(a[k] || '').localeCompare(String(b[k] || ''), 'es');
  const jornadaTxt = j => num(j) === 1 ? 'Día completo' : num(j) === 0.5 ? 'Medio día' : `${num(j)} días`;
  const diasTxt = n => { n = Math.round(n * 10) / 10; return `${String(n).replace('.', ',')} ${n === 1 ? 'día' : 'días'}`; };

  // ------------------------------------------------------------ IVA
  const IVA_RATE = 0.19;
  const calcIva = neto => { neto = num(neto); const iva = Math.round(neto * IVA_RATE); return { neto, iva, total: neto + iva }; };
  const totalVenta = v => v.con_iva === 'si' ? calcIva(v.monto).total : num(v.monto);
  const ivaInfo = v => {
    if (!v.monto) return '';
    if (v.con_iva !== 'si') return `Total a cobrar: <b>${clp(v.monto)}</b> · sin IVA`;
    const c = calcIva(v.monto);
    return `Neto ${clp(c.neto)} + IVA ${clp(c.iva)} = <b>Total ${clp(c.total)}</b>`;
  };
  const ivaFields = sel => [
    { name: 'con_iva', label: 'IVA', type: 'seg', options: [['no', 'Sin IVA'], ['si', '+ IVA 19%']], value: sel || 'no' },
    { name: 'iva_info', type: 'info', compute: ivaInfo },
  ];

  // ------------------------------------------------------------ catálogos
  const ESTADOS = { cotizado: 'Cotizado', aceptado: 'Aceptado', activo: 'Activo', terminado: 'Terminado', cerrado: 'Cerrado', perdido: 'Perdido' };
  const ESTADO_ORDEN = ['cotizado', 'aceptado', 'activo', 'terminado', 'cerrado', 'perdido'];
  const PROB = { alta: 'Alta', media: 'Media', baja: 'Baja' };
  const CATS = ['Materiales', 'Herramientas', 'Transporte y combustible', 'Subcontrato', 'Arriendo', 'Impuestos (SII)', 'Servicios básicos', 'Otros'];
  const MEDIOS = [['Transferencia', 'Transferencia'], ['Efectivo', 'Efectivo'], ['Otro', 'Otro']];

  // ------------------------------------------------------------ iconos
  const svg = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const I = {
    home: svg('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>'),
    deal: svg('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>'),
    debt: svg('<path d="M7 4v13"/><path d="m3 13 4 4 4-4"/><path d="M17 20V7"/><path d="m13 11 4-4 4 4"/>'),
    people: svg('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8"/><path d="M18 14.8c1.8.7 3 2.4 3.5 5.2"/>'),
    worker: svg('<path d="M4 15a8 8 0 0 1 16 0"/><path d="M2 15h20v3H2z"/><path d="M10 7V4h4v3"/>'),
    back: svg('<path d="M19 12H5"/><path d="m11 18-6-6 6-6"/>'),
    bolt: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 2 4 14h7l-1.5 8L20 10h-7z" fill="currentColor"/></svg>',
    gear: svg('<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>'),
    edit: svg('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>'),
    x: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
    chev: svg('<path d="m9 6 6 6-6 6"/>'),
    phone: svg('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>'),
    wa: svg('<path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"/><path d="M9.5 9.5c.3 2 1.9 3.6 4 4"/>'),
    sms: svg('<path d="M4 5h16v11H9l-5 4z"/>'),
    trash: svg('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
    plus: svg('<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>'),
    minus: svg('<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>'),
    cash: svg('<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6.5 9.5v.01M17.5 14.5v.01"/>'),
    download: svg('<path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/>'),
    cal: svg('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
    check: svg('<path d="m5 12 5 5 9-10"/>'),
    left: svg('<path d="m15 6-6 6 6 6"/>'),
    right: svg('<path d="m9 6 6 6-6 6"/>'),
    alert: svg('<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17v.01"/>'),
  };

  // ------------------------------------------------------------ estado
  let D = null;           // datos crudos
  let C = {};             // índices calculados
  let session = null;
  let loadError = null;
  const stack = [];       // historial de rutas para el botón volver

  function indexar() {
    const by = arr => Object.fromEntries(arr.map(x => [x.id, x]));
    C = {
      cli: by(D.clientes), prov: by(D.proveedores), proy: by(D.proyectos),
      trab: by(D.trabajadores), trx: by(D.transacciones), pagado: {},
      saldoIni: num((D.ajustes.find(a => a.clave === 'saldo_inicial') || {}).valor),
    };
    for (const a of D.abonos) C.pagado[a.transaccion_id] = (C.pagado[a.transaccion_id] || 0) + num(a.monto);
  }
  async function reload() { D = await DB.loadAll(); indexar(); }
  async function refresh() { await reload(); render(); }

  // ------------------------------------------------------------ cálculos
  const pagado = t => C.pagado[t.id] || 0;
  const saldo = t => num(t.monto) - pagado(t);
  const nomCli = id => C.cli[id]?.nombre || 'Sin cliente';
  const nomProv = id => C.prov[id]?.nombre || 'Sin proveedor';
  const contraparte = t => t.tipo === 'venta' ? nomCli(t.cliente_id) : nomProv(t.proveedor_id);

  function caja() {
    let c = C.saldoIni;
    for (const a of D.abonos) { const t = C.trx[a.transaccion_id]; if (t) c += t.tipo === 'venta' ? num(a.monto) : -num(a.monto); }
    for (const p of D.pagos_trabajador) c -= num(p.monto);
    return c;
  }

  function grupos(tipo) {
    const m = new Map();
    for (const t of D.transacciones) {
      if (t.tipo !== tipo) continue;
      const s = saldo(t); if (s <= 0) continue;
      const k = (tipo === 'venta' ? t.cliente_id : t.proveedor_id) || 'none';
      if (!m.has(k)) m.set(k, { key: k, nombre: contraparte(t), total: 0, n: 0, fecha: '', vencida: false, trxs: [] });
      const g = m.get(k);
      g.total += s; g.n++; g.trxs.push(t);
      if (t.fecha > g.fecha) g.fecha = t.fecha;
      if (t.vencimiento && dias(t.vencimiento) < 0) g.vencida = true;
    }
    return [...m.values()].sort((a, b) => b.total - a.total);
  }

  function trabStats(id) {
    const as = D.asistencias.filter(a => a.trabajador_id === id).sort((a, b) => (b.fecha + b.created_at).localeCompare(a.fecha + a.created_at));
    const pg = D.pagos_trabajador.filter(p => p.trabajador_id === id).sort((a, b) => (b.fecha + b.created_at).localeCompare(a.fecha + a.created_at));
    const mes = hoy().slice(0, 7);
    const ganado = sum(as, a => a.valor), pagadoT = sum(pg, p => p.monto);
    return { as, pg, ganado, pagado: pagadoT, debe: ganado - pagadoT, dias: sum(as, a => a.jornada), diasMes: sum(as.filter(a => a.fecha.startsWith(mes)), a => a.jornada) };
  }
  const deudaTrabajadores = () => sum(D.trabajadores, t => Math.max(0, trabStats(t.id).debe));

  function proyStats(p) {
    const ventas = D.transacciones.filter(t => t.proyecto_id === p.id && t.tipo === 'venta');
    const gastos = D.transacciones.filter(t => t.proyecto_id === p.id && t.tipo === 'gasto');
    const as = D.asistencias.filter(a => a.proyecto_id === p.id);
    const vendido = sum(ventas, t => t.monto), cobrado = sum(ventas, pagado);
    const gasto = sum(gastos, t => t.monto), mo = sum(as, a => a.valor);
    const base = vendido || num(p.monto_cotizado);
    return { ventas, gastos, as, vendido, cobrado, porCobrar: vendido - cobrado, gasto, mo, base, utilidad: base - gasto - mo };
  }

  function movimientos() {
    const out = [];
    for (const a of D.abonos) {
      const t = C.trx[a.transaccion_id]; if (!t) continue;
      out.push({ fecha: a.fecha, created: a.created_at || '', monto: t.tipo === 'venta' ? num(a.monto) : -num(a.monto), titulo: t.descripcion, sub: contraparte(t) + (a.medio ? ' · ' + a.medio : ''), go: '#/trx/' + t.id });
    }
    for (const p of D.pagos_trabajador) {
      out.push({ fecha: p.fecha, created: p.created_at || '', monto: -num(p.monto), titulo: 'Pago a ' + (C.trab[p.trabajador_id]?.nombre || 'trabajador'), sub: p.nota || 'Personal', go: '#/trabajador/' + p.trabajador_id });
    }
    return out.sort((a, b) => (b.fecha + b.created).localeCompare(a.fecha + a.created));
  }

  // ------------------------------------------------------------ piezas UI
  const TABS = [
    ['inicio', '#/', 'Inicio', I.home], ['negocios', '#/negocios', 'Negocios', I.deal],
    ['deudas', '#/deudas', 'Deudas', I.debt], ['clientes', '#/clientes', 'Clientes', I.people],
    ['personal', '#/personal', 'Personal', I.worker],
  ];
  const navHtml = active => `<nav class="tabbar">${TABS.map(([k, h, l, ic]) =>
    `<button class="tab ${k === active ? 'on' : ''}" data-go="${h}">${ic}<span>${l}</span></button>`).join('')}</nav>`;

  function shell({ title, sub, back, right = '', body, nav, bar = '' }) {
    return `
      <header class="top">
        ${back ? `<button class="icon-btn" data-act="back" data-fallback="${back}" aria-label="Volver">${I.back}</button>` : `<div class="brand-mark">${I.bolt}</div>`}
        <div class="top-title"><h1>${esc(title)}</h1>${sub ? `<p>${esc(sub)}</p>` : ''}</div>
        ${right}
      </header>
      ${DB.demo ? '<div class="demo-banner">MODO DEMO · datos de prueba, solo en este equipo</div>' : ''}
      <main class="content${nav ? ' has-nav' : ''}${bar ? ' has-bar' : ''}">${body}</main>
      ${bar ? `<div class="bottom-bar${nav ? ' over-nav' : ''}">${bar}</div>` : ''}
      ${nav ? navHtml(nav) : ''}`;
  }

  const badge = e => `<span class="badge st-${e}">${esc(ESTADOS[e] || e)}</span>`;
  const empty = (txt, sub = '') => `<div class="empty"><p>${esc(txt)}</p>${sub ? `<small>${esc(sub)}</small>` : ''}</div>`;
  const ventaGastoBar = (pre = '') => `
    <button class="btn-big green" data-act="venta" ${pre}>${I.plus}<span>Nueva venta</span></button>
    <button class="btn-big red" data-act="gasto" ${pre}>${I.minus}<span>Nuevo gasto</span></button>`;
  const stat = (label, val, cls = '') => `<div class="stat ${cls}"><small>${esc(label)}</small><b>${val}</b></div>`;

  function trxRow(t, opts = {}) {
    const s = saldo(t);
    const estado = s <= 0 ? '<span class="ok">Pagado</span>'
      : pagado(t) > 0 ? `<span class="${t.tipo === 'venta' ? 'pos' : 'neg'}">${t.tipo === 'venta' ? 'Debe' : 'Por pagar'} ${clp(s)}</span>`
        : `<span class="${t.tipo === 'venta' ? 'pos' : 'neg'}">${t.tipo === 'venta' ? 'Debe todo' : 'Por pagar'}</span>`;
    const venc = s > 0 && t.vencimiento ? ` · <span class="${dias(t.vencimiento) < 0 ? 'neg' : ''}">vence ${esc(cuando(t.vencimiento).toLowerCase())}</span>` : '';
    return `<button class="list-item" data-go="#/trx/${t.id}">
      <span class="ico ${t.tipo}">${I.cash}</span>
      <div class="grow"><p class="t">${esc(t.descripcion)}</p>
        <p class="s">${opts.showParty ? esc(contraparte(t)) + ' · ' : ''}${estado} · ${fdate(t.fecha)}${venc}</p></div>
      <p class="amt">${clp(opts.saldo ? s : t.monto)}</p></button>`;
  }

  function proyCard(p) {
    const venc = p.fecha_seguimiento && dias(p.fecha_seguimiento) < 0;
    return `<button class="card deal" data-go="#/negocio/${p.id}">
      <div class="grow">
        <p class="t">${esc(p.nombre)}</p>
        <p class="s">${esc(nomCli(p.cliente_id))}${p.estado === 'cotizado' ? ` · <span class="prob p-${p.probabilidad}">Prob. ${esc((PROB[p.probabilidad] || '').toLowerCase())}</span>` : ''}</p>
        ${p.proxima_accion ? `<p class="s next ${venc ? 'late' : ''}">→ ${esc(p.proxima_accion)}${p.fecha_seguimiento ? ' · ' + esc(cuando(p.fecha_seguimiento)) : ''}</p>` : ''}
      </div>
      <div class="end"><p class="amt">${clp(p.monto_cotizado)}</p>${badge(p.estado)}</div></button>`;
  }

  // ------------------------------------------------------------ vistas
  function vLogin(err = '') {
    return `<div class="login">
      <div class="login-brand"><div class="brand-mark big">${I.bolt}</div><h1>${esc(EMPRESA)}</h1><p>Finanzas y trabajos</p></div>
      <form id="login" class="login-card" autocomplete="on">
        <label>Correo<input name="email" type="email" inputmode="email" autocomplete="username" required></label>
        <label>Contraseña<input name="password" type="password" autocomplete="current-password" required></label>
        <p class="form-err" ${err ? '' : 'hidden'}>${esc(err)}</p>
        <button class="btn-primary" type="submit">Entrar</button>
      </form></div>`;
  }

  function vConfig() {
    return `<div class="login"><div class="login-brand"><div class="brand-mark big">${I.bolt}</div><h1>Falta configurar</h1>
      <p>Edita <b>js/config.js</b> y pon la Project URL de Supabase.</p>
      <p><a class="btn-primary inline" href="?demo=1">Ver modo demo</a></p></div></div>`;
  }

  function vError() {
    const m = humanError(loadError);
    const tablas = /relation|does not exist|schema cache/i.test(loadError?.message || '');
    return `<div class="login"><div class="login-brand"><div class="brand-mark big">${I.alert}</div><h1>No se pudieron cargar los datos</h1>
      <p>${esc(tablas ? 'Falta crear las tablas: ejecuta supabase/schema.sql en Supabase.' : m)}</p>
      <p><button class="btn-primary inline" data-act="retry">Reintentar</button> <button class="btn-ghost inline" data-act="logout">Salir</button></p></div></div>`;
  }

  function vInicio() {
    const dinero = caja();
    const gc = grupos('venta'), gp = grupos('gasto');
    const cob = sum(gc, g => g.total);
    const pagT = deudaTrabajadores();
    const pag = sum(gp, g => g.total) + pagT;
    const trabajos = D.proyectos.filter(p => ['aceptado', 'activo'].includes(p.estado));
    const cotiz = D.proyectos.filter(p => p.estado === 'cotizado');
    const mes = hoy().slice(0, 7);
    const mm = movimientos().filter(m => m.fecha.startsWith(mes));
    const ing = sum(mm.filter(m => m.monto > 0), m => m.monto), egr = -sum(mm.filter(m => m.monto < 0), m => m.monto);
    const ventasIvaMes = D.transacciones.filter(t => t.tipo === 'venta' && t.con_iva && t.fecha.startsWith(mes));
    const ivaMes = sum(ventasIvaMes, t => t.iva);

    const agenda = [];
    for (const p of D.proyectos) {
      if (!p.fecha_seguimiento || ['cerrado', 'perdido'].includes(p.estado)) continue;
      agenda.push({ fecha: p.fecha_seguimiento, t: p.proxima_accion || 'Seguimiento', s: `${p.nombre} · ${nomCli(p.cliente_id)}`, go: '#/negocio/' + p.id });
    }
    for (const t of D.transacciones) {
      if (!t.vencimiento || saldo(t) <= 0 || dias(t.vencimiento) > 7) continue;
      agenda.push({ fecha: t.vencimiento, t: t.tipo === 'venta' ? `Cobrar ${clp(saldo(t))}` : `Pagar ${clp(saldo(t))}`, s: `${t.descripcion} · ${contraparte(t)}`, go: '#/trx/' + t.id });
    }
    agenda.sort((a, b) => a.fecha.localeCompare(b.fecha));

    const body = `
      <section class="hero" data-go="#/movimientos">
        <p class="label">Dinero disponible</p>
        <p class="hero-amt ${dinero < 0 ? 'neg' : ''}">${clp(dinero)}</p>
        <p class="hint">${esc(MESES_L[new Date().getMonth()])}: <span class="pos">+${clp(ing)}</span> · <span class="neg">−${clp(egr)}</span> ${I.chev}</p>
      </section>
      <div class="actions2">${ventaGastoBar()}</div>
      <div class="grid2">
        <button class="tile" data-go="#/deudas/cobrar"><small>Por cobrar</small><b class="pos">${clp(cob)}</b><span>${gc.length} ${gc.length === 1 ? 'cliente' : 'clientes'}</span></button>
        <button class="tile" data-go="#/deudas/pagar"><small>Por pagar</small><b class="neg">${clp(pag)}</b><span>${gp.length + (pagT > 0 ? 1 : 0)} ${gp.length + (pagT > 0 ? 1 : 0) === 1 ? 'pendiente' : 'pendientes'}</span></button>
        <button class="tile" data-go="#/negocios/trabajos"><small>Proyectos en curso</small><b>${trabajos.length}</b><span>${clp(sum(trabajos, p => p.monto_cotizado))}</span></button>
        <button class="tile" data-go="#/negocios/cotizado"><small>Cotizaciones pendientes</small><b>${cotiz.length}</b><span>${clp(sum(cotiz, p => p.monto_cotizado))}</span></button>
      </div>
      ${ivaMes > 0 ? `<section class="iva-card"><div class="grow"><small>IVA de ventas de ${esc(MESES_L[new Date().getMonth()])}</small><b>${clp(ivaMes)}</b></div><span>${ventasIvaMes.length} ${ventasIvaMes.length === 1 ? 'venta' : 'ventas'} con IVA · por pagar al SII</span></section>` : ''}
      <h2 class="sec">Próximas actividades</h2>
      ${agenda.length ? `<div class="list">${agenda.slice(0, 8).map(a => `
        <button class="list-item" data-go="${a.go}">
          <span class="ico when ${dias(a.fecha) < 0 ? 'late' : dias(a.fecha) === 0 ? 'today' : ''}">${I.cal}</span>
          <div class="grow"><p class="t">${esc(a.t)}</p><p class="s">${esc(a.s)}</p></div>
          <p class="when-txt ${dias(a.fecha) < 0 ? 'neg' : ''}">${esc(cuando(a.fecha))}</p></button>`).join('')}</div>`
        : empty('Nada pendiente', 'Las fechas de seguimiento de tus cotizaciones y los vencimientos aparecen aquí.')}
      <button class="link-row" data-go="#/movimientos">Ver movimientos de caja ${I.chev}</button>`;
    return shell({ title: EMPRESA, sub: 'Propietario', right: `<button class="icon-btn" data-go="#/ajustes" aria-label="Ajustes">${I.gear}</button>`, body, nav: 'inicio' });
  }

  const FILTROS = {
    abiertos: ['En curso y cotizados', p => !['cerrado', 'perdido'].includes(p.estado)],
    cotizado: ['Cotizados', p => p.estado === 'cotizado'],
    trabajos: ['Proyectos aceptados y activos', p => ['aceptado', 'activo'].includes(p.estado)],
    terminado: ['Terminados', p => p.estado === 'terminado'],
    cerrado: ['Cerrados', p => p.estado === 'cerrado'],
    perdido: ['Perdidos', p => p.estado === 'perdido'],
    todos: ['Todos', () => true],
  };
  const CHIP_LBL = { abiertos: 'Abiertos', cotizado: 'Cotizados', trabajos: 'Proyectos', terminado: 'Terminados', cerrado: 'Cerrados', perdido: 'Perdidos', todos: 'Todos' };

  function vNegocios(f) {
    f = FILTROS[f] ? f : 'abiertos';
    const list = D.proyectos.filter(FILTROS[f][1]).sort((a, b) =>
      ESTADO_ORDEN.indexOf(a.estado) - ESTADO_ORDEN.indexOf(b.estado) || String(a.fecha_seguimiento || '9999').localeCompare(String(b.fecha_seguimiento || '9999')) || String(b.created_at).localeCompare(String(a.created_at)));
    const body = `
      <div class="chips">${Object.keys(FILTROS).map(k => `<button class="chip ${k === f ? 'on' : ''}" data-go="#/negocios/${k}">${CHIP_LBL[k]}</button>`).join('')}</div>
      <div class="summary"><b>${clp(sum(list, p => p.monto_cotizado))}</b><span>${list.length} ${list.length === 1 ? 'negocio' : 'negocios'} · ${esc(FILTROS[f][0].toLowerCase())}</span></div>
      ${list.length ? `<div class="cards">${list.map(proyCard).join('')}</div>` : empty('No hay negocios aquí', 'Registra una cotización con el botón de abajo.')}`;
    return shell({ title: 'Negocios', sub: 'Cotizaciones y trabajos', body, nav: 'negocios', bar: `<button class="btn-big dark" data-act="nuevo-negocio">${I.plus}<span>Nueva cotización</span></button>` });
  }

  function vNegocio(id) {
    const p = C.proy[id]; if (!p) return vNoExiste('#/negocios');
    const s = proyStats(p);
    const sinVenta = !s.ventas.length;
    const moPorTrab = {};
    for (const a of s.as) { const k = a.trabajador_id; moPorTrab[k] = moPorTrab[k] || { dias: 0, valor: 0 }; moPorTrab[k].dias += num(a.jornada); moPorTrab[k].valor += num(a.valor); }
    const body = `
      <section class="card info">
        <div class="row-between"><div>${badge(p.estado)} ${p.estado === 'cotizado' ? `<span class="prob p-${p.probabilidad}">Prob. ${esc((PROB[p.probabilidad] || '').toLowerCase())}</span>` : ''}</div><small class="muted">Cotizado el ${fdate(p.fecha_cotizacion)}</small></div>
        <p class="big-amt">${clp(p.monto_cotizado)}</p>
        ${p.cliente_id ? `<button class="link-inline" data-go="#/cliente/${p.cliente_id}">${I.people} ${esc(nomCli(p.cliente_id))}</button>` : '<p class="muted">Sin cliente</p>'}
        ${p.descripcion ? `<p class="desc">${esc(p.descripcion)}</p>` : ''}
      </section>
      <h2 class="sec">Estado</h2>
      <div class="chips wrap">${ESTADO_ORDEN.map(e => `<button class="chip st ${p.estado === e ? 'on st-' + e : ''}" data-act="estado" data-id="${p.id}" data-v="${e}">${ESTADOS[e]}</button>`).join('')}</div>
      <h2 class="sec">Seguimiento</h2>
      <section class="card follow ${p.fecha_seguimiento && dias(p.fecha_seguimiento) < 0 ? 'late' : ''}">
        ${p.proxima_accion || p.fecha_seguimiento
          ? `<div class="grow"><p class="t">${esc(p.proxima_accion || 'Seguimiento')}</p><p class="s">${p.fecha_seguimiento ? esc(cuando(p.fecha_seguimiento)) + ' · ' + fdate(p.fecha_seguimiento) : 'Sin fecha'}</p></div>
             <button class="btn-sm" data-act="seg-hecho" data-id="${p.id}">${I.check} Hecho</button>`
          : '<p class="muted grow">Sin próxima acción</p>'}
        <button class="btn-sm ghost" data-act="seguimiento" data-id="${p.id}">${p.proxima_accion ? 'Cambiar' : 'Agregar'}</button>
      </section>
      <h2 class="sec">Números del trabajo</h2>
      <div class="stats">
        ${stat('Vendido', clp(s.vendido))}${stat('Cobrado', clp(s.cobrado), 'pos')}
        ${stat('Por cobrar', clp(s.porCobrar), s.porCobrar > 0 ? 'pos' : '')}${stat('Materiales y gastos', clp(s.gasto), 'neg')}
        ${stat('Mano de obra', clp(s.mo), 'neg')}${stat(sinVenta ? 'Utilidad estimada' : 'Utilidad', clp(s.utilidad), s.utilidad < 0 ? 'neg' : 'pos')}
      </div>
      ${sinVenta ? `<p class="note">Aún no hay ventas en este trabajo. Cuando lo acepten, registra la venta (y el anticipo si te pagaron) para llevar lo cobrado.</p>` : ''}
      <h2 class="sec">Ventas y cobros</h2>
      ${s.ventas.length ? `<div class="list">${s.ventas.map(t => trxRow(t)).join('')}</div>` : empty('Sin ventas registradas')}
      <h2 class="sec">Gastos del trabajo</h2>
      ${s.gastos.length ? `<div class="list">${s.gastos.map(t => trxRow(t, { showParty: true })).join('')}</div>` : empty('Sin gastos registrados')}
      <h2 class="sec">Mano de obra</h2>
      ${Object.keys(moPorTrab).length ? `<div class="list">${Object.entries(moPorTrab).map(([tid, v]) => `
        <button class="list-item" data-go="#/trabajador/${tid}"><span class="ico worker">${I.worker}</span>
          <div class="grow"><p class="t">${esc(C.trab[tid]?.nombre || 'Trabajador')}</p><p class="s">${diasTxt(v.dias)}</p></div>
          <p class="amt">${clp(v.valor)}</p></button>`).join('')}</div>` : empty('Sin asistencia registrada')}
      ${esProyecto(p) ? `<button class="btn-ghost full" data-act="asistencia" data-proyecto="${p.id}">${I.cal} Registrar asistencia aquí</button>`
        : `<p class="note">Para registrar asistencia, primero marca esta cotización como <b>Aceptada</b> o <b>Activa</b> (pasa a ser proyecto).</p>`}`;
    const pre = `data-proyecto="${p.id}" data-cliente="${p.cliente_id || ''}"`;
    return shell({ title: p.nombre, sub: nomCli(p.cliente_id), back: '#/negocios', right: `<button class="icon-btn" data-act="edit-negocio" data-id="${p.id}" aria-label="Editar">${I.edit}</button>`, body, bar: ventaGastoBar(pre) });
  }

  function vDeudas(tab) {
    tab = tab === 'pagar' ? 'pagar' : 'cobrar';
    const gs = grupos(tab === 'cobrar' ? 'venta' : 'gasto');
    const trabs = tab === 'pagar' ? D.trabajadores.map(t => ({ t, d: trabStats(t.id).debe })).filter(x => x.d > 0) : [];
    const total = sum(gs, g => g.total) + sum(trabs, x => x.d);
    const nDeudas = sum(gs, g => g.n);
    const kind = tab === 'cobrar' ? 'c' : 'p';
    const body = `
      <div class="seg-tabs"><button class="${tab === 'cobrar' ? 'on' : ''}" data-go="#/deudas/cobrar">Por cobrar</button><button class="${tab === 'pagar' ? 'on' : ''}" data-go="#/deudas/pagar">Por pagar</button></div>
      <section class="card total-card">
        <div><p class="big-amt ${tab === 'cobrar' ? '' : ''}">${clp(total)}</p><p class="muted">${gs.length + trabs.length} ${tab === 'cobrar' ? (gs.length === 1 ? 'cliente' : 'clientes') : 'por pagar'}</p></div>
        <span class="count ${tab === 'cobrar' ? 'pos' : 'neg'}">${nDeudas}</span>
      </section>
      ${gs.length ? `<div class="cards">${gs.map(g => `
        <button class="card debt" data-go="#/deuda/${kind}/${g.key}">
          <div class="grow"><p class="t">${esc(g.nombre)}</p><p class="amt-l">${clp(g.total)}</p><p class="s">${g.vencida ? '<span class="neg">Tiene deudas vencidas</span> · ' : ''}${fdate(g.fecha)}</p></div>
          <span class="count ${kind === 'c' ? 'pos' : 'neg'}">${g.n}</span>${I.chev}</button>`).join('')}</div>`
        : (trabs.length ? '' : empty(tab === 'cobrar' ? 'Nadie te debe' : 'No tienes deudas', tab === 'cobrar' ? 'Las ventas que queden pendientes de pago aparecen aquí.' : 'Los gastos que queden pendientes aparecen aquí.'))}
      ${trabs.length ? `<h2 class="sec">Trabajadores</h2><div class="cards">${trabs.map(x => `
        <button class="card debt" data-go="#/trabajador/${x.t.id}"><div class="grow"><p class="t">${esc(x.t.nombre)}</p><p class="amt-l">${clp(x.d)}</p><p class="s">Días trabajados sin pagar</p></div>${I.chev}</button>`).join('')}</div>` : ''}`;
    return shell({ title: 'Deudas', sub: EMPRESA, body, nav: 'deudas', bar: ventaGastoBar() });
  }

  function telLimpio(tel) {
    let d = String(tel || '').replace(/\D/g, '');
    if (d.length === 9 && d.startsWith('9')) d = '56' + d;
    if (d.length === 8) d = '569' + d;
    return d;
  }

  function vDeudaGrupo(kind, key, sub) {
    const tipo = kind === 'c' ? 'venta' : 'gasto';
    const g = grupos(tipo).find(x => x.key === key);
    const partyId = key === 'none' ? null : key;
    const nombre = g ? g.nombre : (kind === 'c' ? nomCli(partyId) : nomProv(partyId));
    const todas = D.transacciones.filter(t => t.tipo === tipo && ((kind === 'c' ? t.cliente_id : t.proveedor_id) || 'none') === key);
    const ids = new Set(todas.map(t => t.id));
    const abonos = D.abonos.filter(a => ids.has(a.transaccion_id)).sort((a, b) => (b.fecha + (b.created_at || '')).localeCompare(a.fecha + (a.created_at || '')));
    const tabAbonos = sub === 'abonos';
    const tel = kind === 'c' && partyId ? C.cli[partyId]?.telefono : kind === 'p' && partyId ? C.prov[partyId]?.telefono : '';
    let reminder = '';
    if (kind === 'c' && g) {
      const msg = `Hola ${nombre}, te escribo de ${EMPRESA}. Te recuerdo que tienes un saldo pendiente de ${clp(g.total)}:\n` +
        g.trxs.map(t => `• ${t.descripcion}: ${clp(saldo(t))}`).join('\n') + `\n\n¡Muchas gracias!`;
      const t = telLimpio(tel);
      reminder = `<div class="reminder"><p>Enviar recordatorio</p>
        <a class="round-btn" href="https://wa.me/${t}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">${I.wa}<span>WhatsApp</span></a>
        <a class="round-btn" href="sms:${t ? '+' + t : ''}?&body=${encodeURIComponent(msg)}">${I.sms}<span>SMS</span></a></div>`;
    }
    const base = `#/deuda/${kind}/${key}`;
    const body = `
      <div class="seg-tabs"><button class="${tabAbonos ? '' : 'on'}" data-go="${base}">Deudas</button><button class="${tabAbonos ? 'on' : ''}" data-go="${base}/abonos">${kind === 'c' ? 'Abonos' : 'Pagos'}</button></div>
      <section class="card total-card"><div><p class="big-amt">${clp(g ? g.total : 0)}</p><p class="muted">${g ? 'Saldo pendiente' : 'Sin saldo pendiente'}</p></div><span class="count ${kind === 'c' ? 'pos' : 'neg'}">${g ? g.n : 0}</span></section>
      ${reminder}
      ${tabAbonos
        ? (abonos.length ? `<div class="list">${abonos.map(a => { const t = C.trx[a.transaccion_id]; return `
            <button class="list-item" data-go="#/trx/${t.id}"><span class="ico ok">${I.check}</span>
            <div class="grow"><p class="t">${esc(t.descripcion)}</p><p class="s">${fdate(a.fecha)}${a.medio ? ' · ' + esc(a.medio) : ''}${a.nota ? ' · ' + esc(a.nota) : ''}</p></div>
            <p class="amt pos">${clp(a.monto)}</p></button>`; }).join('')}</div>` : empty('Sin abonos todavía'))
        : (g ? `<div class="list">${g.trxs.sort((a, b) => b.fecha.localeCompare(a.fecha)).map(t => trxRow(t, { saldo: true })).join('')}</div>` : empty('Todo pagado'))}
      ${partyId ? `<button class="link-row" data-go="${kind === 'c' ? '#/cliente/' + partyId : '#/ajustes'}">${kind === 'c' ? 'Ver ficha del cliente' : 'Ver proveedores'} ${I.chev}</button>` : ''}`;
    return shell({ title: nombre, sub: kind === 'c' ? 'Te debe' : 'Le debes', back: kind === 'c' ? '#/deudas/cobrar' : '#/deudas/pagar', body,
      bar: g ? `<button class="btn-big dark" data-act="abono-grupo" data-kind="${kind}" data-key="${key}">${kind === 'c' ? 'Registrar abono' : 'Registrar pago'}</button>` : '' });
  }

  function vTrx(id) {
    const t = C.trx[id]; if (!t) return vNoExiste('#/');
    const esV = t.tipo === 'venta';
    const pg = pagado(t), s = saldo(t), pct = Math.min(100, Math.round(pg / num(t.monto) * 100));
    const abonos = D.abonos.filter(a => a.transaccion_id === id).sort((a, b) => (b.fecha + (b.created_at || '')).localeCompare(a.fecha + (a.created_at || '')));
    const partyId = esV ? t.cliente_id : t.proveedor_id;
    const body = `
      <section class="card info">
        <div class="row-between"><span class="badge ${esV ? 'venta' : 'gasto'}">${esV ? (t.con_iva ? 'Venta con IVA' : 'Venta sin IVA') : 'Gasto'}</span><small class="muted">${fdate(t.fecha)}</small></div>
        <p class="big-amt">${clp(t.monto)}</p>
        ${esV && t.con_iva ? `<p class="muted">Neto ${clp(t.neto ?? t.monto - num(t.iva))} + IVA ${clp(t.iva)}</p>` : ''}
        <div class="progress"><span style="width:${pct}%"></span></div>
        <div class="row-between"><span class="pos">${esV ? 'Cobrado' : 'Pagado'} ${clp(pg)}</span><span class="${s > 0 ? (esV ? 'pos' : 'neg') : 'ok'}">${s > 0 ? (esV ? 'Debe ' : 'Falta ') + clp(s) : 'Pagado completo'}</span></div>
      </section>
      <div class="kv">
        <div><small>${esV ? 'Cliente' : 'Proveedor'}</small>${partyId ? `<button class="link-inline" data-go="${esV ? '#/cliente/' + partyId : '#/deuda/p/' + partyId}">${esc(contraparte(t))}</button>` : `<p>${esc(contraparte(t))}</p>`}</div>
        ${t.proyecto_id ? `<div><small>Trabajo</small><button class="link-inline" data-go="#/negocio/${t.proyecto_id}">${esc(C.proy[t.proyecto_id]?.nombre || '')}</button></div>` : ''}
        ${t.categoria ? `<div><small>Categoría</small><p>${esc(t.categoria)}</p></div>` : ''}
        ${t.vencimiento ? `<div><small>Fecha límite</small><p class="${s > 0 && dias(t.vencimiento) < 0 ? 'neg' : ''}">${fdate(t.vencimiento)}</p></div>` : ''}
      </div>
      <h2 class="sec">${esV ? 'Abonos recibidos' : 'Pagos realizados'}</h2>
      ${abonos.length ? `<div class="list">${abonos.map(a => `
        <div class="list-item"><span class="ico ok">${I.check}</span>
          <div class="grow"><p class="t">${clp(a.monto)}</p><p class="s">${fdate(a.fecha)}${a.medio ? ' · ' + esc(a.medio) : ''}${a.nota ? ' · ' + esc(a.nota) : ''}</p></div>
          <button class="icon-btn sm" data-act="del-abono" data-id="${a.id}" aria-label="Borrar abono">${I.trash}</button></div>`).join('')}</div>` : empty('Sin abonos todavía')}`;
    return shell({ title: t.descripcion, sub: esV ? 'Venta' : 'Gasto', back: '#/', right: `<button class="icon-btn" data-act="edit-trx" data-id="${t.id}" aria-label="Editar">${I.edit}</button>`, body,
      bar: s > 0 ? `<button class="btn-big dark" data-act="abono-trx" data-id="${t.id}">${esV ? 'Registrar abono' : 'Registrar pago'}</button>` : '' });
  }

  function vClientes() {
    const debe = {}; for (const g of grupos('venta')) debe[g.key] = g.total;
    const list = [...D.clientes].sort(byText('nombre'));
    const body = `
      <div class="search"><input type="search" id="buscar" placeholder="Buscar cliente…" autocomplete="off"></div>
      ${list.length ? `<div class="cards" id="lista">${list.map(c => `
        <button class="card person" data-go="#/cliente/${c.id}" data-q="${esc((c.nombre + ' ' + (c.telefono || '')).toLowerCase())}">
          <span class="avatar">${esc((c.nombre || '?').trim().charAt(0).toUpperCase())}</span>
          <div class="grow"><p class="t">${esc(c.nombre)}</p><p class="s">${esc(c.telefono || 'Sin teléfono')}</p></div>
          ${debe[c.id] ? `<div class="end"><small class="muted">Debe</small><p class="amt pos">${clp(debe[c.id])}</p></div>` : ''}${I.chev}</button>`).join('')}</div>`
        : empty('Aún no tienes clientes', 'Agrégalos aquí o directamente al registrar una venta o cotización.')}`;
    return shell({ title: 'Clientes', sub: `${list.length} ${list.length === 1 ? 'cliente' : 'clientes'}`, body, nav: 'clientes', bar: `<button class="btn-big dark" data-act="nuevo-cliente">${I.plus}<span>Nuevo cliente</span></button>` });
  }

  function vCliente(id) {
    const c = C.cli[id]; if (!c) return vNoExiste('#/clientes');
    const ventas = D.transacciones.filter(t => t.tipo === 'venta' && t.cliente_id === id).sort((a, b) => b.fecha.localeCompare(a.fecha));
    const proys = D.proyectos.filter(p => p.cliente_id === id).sort((a, b) => ESTADO_ORDEN.indexOf(a.estado) - ESTADO_ORDEN.indexOf(b.estado));
    const vendido = sum(ventas, t => t.monto), cobrado = sum(ventas, pagado);
    const tel = telLimpio(c.telefono);
    const body = `
      <section class="card info">
        <div class="contact">
          ${c.telefono ? `<a class="round-btn" href="tel:+${tel}">${I.phone}<span>Llamar</span></a><a class="round-btn" href="https://wa.me/${tel}" target="_blank" rel="noopener">${I.wa}<span>WhatsApp</span></a>` : '<p class="muted">Sin teléfono. Agrégalo con el lápiz de arriba.</p>'}
        </div>
        ${c.email || c.direccion || c.notas ? `<div class="kv tight">${c.email ? `<div><small>Correo</small><p>${esc(c.email)}</p></div>` : ''}${c.direccion ? `<div><small>Dirección</small><p>${esc(c.direccion)}</p></div>` : ''}${c.notas ? `<div><small>Notas</small><p>${esc(c.notas)}</p></div>` : ''}</div>` : ''}
      </section>
      <div class="stats three">${stat('Vendido', clp(vendido))}${stat('Cobrado', clp(cobrado), 'pos')}${stat('Debe', clp(vendido - cobrado), vendido - cobrado > 0 ? 'pos' : '')}</div>
      ${vendido - cobrado > 0 ? `<button class="link-row" data-go="#/deuda/c/${id}">Ver deuda y enviar recordatorio ${I.chev}</button>` : ''}
      <h2 class="sec">Trabajos y cotizaciones</h2>
      ${proys.length ? `<div class="cards">${proys.map(proyCard).join('')}</div>` : empty('Sin trabajos')}
      <h2 class="sec">Ventas</h2>
      ${ventas.length ? `<div class="list">${ventas.map(t => trxRow(t)).join('')}</div>` : empty('Sin ventas')}`;
    return shell({ title: c.nombre, sub: 'Cliente', back: '#/clientes', right: `<button class="icon-btn" data-act="edit-cliente" data-id="${id}" aria-label="Editar">${I.edit}</button>`, body,
      bar: `<button class="btn-big dark" data-act="nuevo-negocio" data-cliente="${id}">${I.plus}<span>Cotización</span></button><button class="btn-big green" data-act="venta" data-cliente="${id}">${I.plus}<span>Venta</span></button>` });
  }

  function vPersonal() {
    const hoyS = hoy();
    const lista = [...D.trabajadores].sort((a, b) => (b.activo - a.activo) || byText('nombre')(a, b));
    const st = Object.fromEntries(lista.map(t => [t.id, trabStats(t.id)]));
    const hoyAs = D.asistencias.filter(a => a.fecha === hoyS);
    const totalDebe = sum(lista, t => Math.max(0, st[t.id].debe));
    // Proyectos abiertos: primero los con asistencia más reciente, luego las cotizaciones más nuevas
    const proys = D.proyectos.filter(esProyecto).map(p => {
      const as = D.asistencias.filter(a => a.proyecto_id === p.id);
      const ult = as.reduce((m, a) => a.fecha > m ? a.fecha : m, '');
      const nombres = [...new Set(as.map(a => (C.trab[a.trabajador_id]?.nombre || '').split(' ')[0]).filter(Boolean))];
      const hoyN = [...new Set(as.filter(a => a.fecha === hoyS).map(a => (C.trab[a.trabajador_id]?.nombre || '').split(' ')[0]))];
      return { p, dias: sum(as, a => a.jornada), mo: sum(as, a => a.valor), ult, nombres, hoyN };
    }).sort((a, b) => b.ult.localeCompare(a.ult) || String(b.p.fecha_cotizacion || '').localeCompare(String(a.p.fecha_cotizacion || '')));
    const sinAsignar = D.asistencias.filter(a => !a.proyecto_id || !C.proy[a.proyecto_id]);
    const body = `
      <section class="hero dark-hero">
        <p class="label">Les debes a tus trabajadores</p>
        <p class="hero-amt">${clp(totalDebe)}</p>
        <p class="hint">Hoy: ${hoyAs.length ? esc(hoyAs.map(a => (C.trab[a.trabajador_id]?.nombre || '').split(' ')[0]).join(', ')) : 'nadie registrado'}</p>
      </section>
      <button class="btn-big yellow full" data-act="asistencia">${I.cal}<span>Registrar asistencia</span></button>
      <h2 class="sec">Proyectos</h2>
      ${proys.length ? `<div class="cards">${proys.map(x => `
        <div class="card proj" data-go="#/negocio/${x.p.id}">
          <div class="grow">
            <p class="t">${esc(x.p.nombre)}</p>
            <p class="s">${esc(nomCli(x.p.cliente_id))} · ${badge(x.p.estado)}</p>
            <p class="s">${x.dias ? `${diasTxt(x.dias)} · ${esc(x.nombres.join(', '))}` : 'Sin asistencia aún'}${x.hoyN.length ? ` · <span class="pos">hoy: ${esc(x.hoyN.join(', '))}</span>` : ''}</p>
          </div>
          <div class="end"><p class="amt">${clp(x.mo)}</p><button class="btn-sm" data-act="asistencia" data-proyecto="${x.p.id}">${I.plus} Día</button></div>
        </div>`).join('')}</div>
        ${sinAsignar.length ? `<p class="note">${sinAsignar.length} ${sinAsignar.length === 1 ? 'día registrado' : 'días registrados'} sin proyecto. Puedes asignarlos tocando el día en la ficha del trabajador.</p>` : ''}`
        : `<div class="empty"><p>Aún no hay proyectos</p><small>Una cotización pasa a proyecto cuando la marcas como <b>Aceptada</b> o <b>Activa</b>. Ahí aparece aquí para asignar asistencia.</small>
            <button class="btn-ghost inline" data-go="#/negocios/cotizado">Ver cotizaciones</button></div>`}
      <h2 class="sec">Trabajadores</h2>
      ${lista.length ? `<div class="cards">${lista.map(t => `
        <button class="card person ${t.activo ? '' : 'inactive'}" data-go="#/trabajador/${t.id}">
          <span class="avatar w">${esc((t.nombre || '?').trim().charAt(0).toUpperCase())}</span>
          <div class="grow"><p class="t">${esc(t.nombre)}${t.activo ? '' : ' <small>(inactivo)</small>'}</p><p class="s">${clp(t.valor_dia)} por día · ${diasTxt(st[t.id].diasMes)} este mes</p></div>
          ${st[t.id].debe > 0 ? `<div class="end"><small class="muted">Le debes</small><p class="amt neg">${clp(st[t.id].debe)}</p></div>` : ''}${I.chev}</button>`).join('')}</div>`
        : empty('Aún no tienes trabajadores', 'Agrégalos con su valor por día para calcular la mano de obra.')}`;
    return shell({ title: 'Personal', sub: 'Asistencia y pagos', body, nav: 'personal', bar: `<button class="btn-big dark" data-act="nuevo-trab">${I.plus}<span>Nuevo trabajador</span></button>` });
  }

  function vTrabajador(id) {
    const t = C.trab[id]; if (!t) return vNoExiste('#/personal');
    const s = trabStats(id);
    const body = `
      <div class="stats">
        ${stat('Valor por día', clp(t.valor_dia))}${stat('Días trabajados', diasTxt(s.dias))}
        ${stat('Total ganado', clp(s.ganado))}${stat('Total pagado', clp(s.pagado), 'pos')}
      </div>
      <section class="card total-card ${s.debe > 0 ? 'owe' : ''}"><div><p class="muted">${s.debe >= 0 ? 'Le debes' : 'Le adelantaste'}</p><p class="big-amt ${s.debe > 0 ? 'neg' : ''}">${clp(Math.abs(s.debe))}</p></div>
        <button class="btn-sm" data-act="asistencia" data-trabajador="${id}">${I.cal} Registrar día</button></section>
      <h2 class="sec">Días trabajados</h2>
      ${s.as.length ? `<div class="list">${s.as.map(a => `
        <div class="list-item tap" data-act="edit-asist" data-id="${a.id}"><span class="ico when">${I.cal}</span>
          <div class="grow"><p class="t">${fdate(a.fecha)} · ${num(a.valor) - num(a.extra) !== Math.round(num(t.valor_dia) * num(a.jornada)) ? 'Valor especial' : jornadaTxt(a.jornada)}${num(a.extra) ? ` <span class="pos">+ extra ${clp(a.extra)}</span>` : ''}</p><p class="s">${a.proyecto_id ? esc(C.proy[a.proyecto_id]?.nombre || '') : 'Sin trabajo asignado'}${a.nota ? ' · ' + esc(a.nota) : ''}</p></div>
          <p class="amt">${clp(a.valor)}</p><button class="icon-btn sm" data-act="del-asist" data-id="${a.id}" aria-label="Borrar día">${I.trash}</button></div>`).join('')}</div>
        <p class="note">Toca un día para cambiar su valor o agregar horas extra.</p>` : empty('Sin días registrados')}
      <h2 class="sec">Pagos</h2>
      ${s.pg.length ? `<div class="list">${s.pg.map(p => `
        <div class="list-item"><span class="ico ok">${I.check}</span>
          <div class="grow"><p class="t">${clp(p.monto)}</p><p class="s">${fdate(p.fecha)}${p.nota ? ' · ' + esc(p.nota) : ''}</p></div>
          <button class="icon-btn sm" data-act="del-pago" data-id="${p.id}" aria-label="Borrar pago">${I.trash}</button></div>`).join('')}</div>` : empty('Sin pagos registrados')}`;
    return shell({ title: t.nombre, sub: t.telefono || 'Trabajador', back: '#/personal', right: `<button class="icon-btn" data-act="edit-trab" data-id="${id}" aria-label="Editar">${I.edit}</button>`, body,
      bar: `<button class="btn-big red" data-act="pagar-trab" data-id="${id}">${I.cash}<span>Registrar pago</span></button>` });
  }

  function vMovimientos(mesParam) {
    const now = new Date();
    let y = now.getFullYear(), m = now.getMonth();
    if (/^\d{4}-\d{2}$/.test(mesParam || '')) { y = +mesParam.slice(0, 4); m = +mesParam.slice(5) - 1; }
    const key = `${y}-${pad(m + 1)}`;
    const prev = m === 0 ? `${y - 1}-12` : `${y}-${pad(m)}`;
    const next = m === 11 ? `${y + 1}-01` : `${y}-${pad(m + 2)}`;
    const list = movimientos().filter(x => x.fecha.startsWith(key));
    const ing = sum(list.filter(x => x.monto > 0), x => x.monto), egr = -sum(list.filter(x => x.monto < 0), x => x.monto);
    const body = `
      <div class="month-nav"><button class="icon-btn" data-go="#/movimientos/${prev}">${I.left}</button><b>${MESES_L[m]} ${y}</b><button class="icon-btn" data-go="#/movimientos/${next}">${I.right}</button></div>
      <div class="stats three">${stat('Entró', clp(ing), 'pos')}${stat('Salió', clp(egr), 'neg')}${stat('Resultado', clp(ing - egr), ing - egr < 0 ? 'neg' : 'pos')}</div>
      <p class="note">Aquí está solo el dinero que realmente entró o salió (pagos y abonos). Las deudas aparecen cuando se pagan.</p>
      ${list.length ? `<div class="list">${list.map(x => `
        <button class="list-item" data-go="${x.go}"><span class="ico ${x.monto > 0 ? 'venta' : 'gasto'}">${I.cash}</span>
          <div class="grow"><p class="t">${esc(x.titulo)}</p><p class="s">${fdate(x.fecha)} · ${esc(x.sub)}</p></div>
          <p class="amt ${x.monto > 0 ? 'pos' : 'neg'}">${x.monto > 0 ? '+' : '−'}${clp(Math.abs(x.monto))}</p></button>`).join('')}</div>` : empty('Sin movimientos este mes')}`;
    return shell({ title: 'Movimientos', sub: 'Caja', back: '#/', body });
  }

  function vAjustes() {
    const provs = [...D.proveedores].sort(byText('nombre'));
    const body = `
      <h2 class="sec first">Caja</h2>
      <button class="card setting" data-act="saldo-ini"><div class="grow"><p class="t">Saldo inicial</p><p class="s">El dinero que tenías al empezar a usar la app</p></div><p class="amt">${clp(C.saldoIni)}</p>${I.chev}</button>
      <h2 class="sec">Proveedores</h2>
      ${provs.length ? `<div class="list">${provs.map(p => `
        <button class="list-item" data-act="edit-prov" data-id="${p.id}"><span class="avatar sm">${esc(p.nombre.charAt(0).toUpperCase())}</span>
          <div class="grow"><p class="t">${esc(p.nombre)}</p><p class="s">${esc(p.telefono || '')}</p></div>${I.edit}</button>`).join('')}</div>` : empty('Sin proveedores', 'También se crean al registrar un gasto.')}
      <button class="btn-ghost full" data-act="nuevo-prov">${I.plus} Agregar proveedor</button>
      <h2 class="sec">Respaldo</h2>
      <button class="card setting" data-act="exportar"><span class="ico">${I.download}</span><div class="grow"><p class="t">Exportar a Excel</p><p class="s">Ventas, gastos, abonos y asistencia (.csv)</p></div></button>
      <h2 class="sec">Cuenta</h2>
      <div class="card setting"><div class="grow"><p class="t">${esc(session?.user?.email || '')}</p><p class="s">${esc(EMPRESA)} · versión ${esc(CFG.VERSION || '1.0')}</p></div></div>
      ${DB.demo ? '<button class="btn-ghost full" data-act="demo-reset">Reiniciar datos de prueba</button>' : ''}
      <button class="btn-ghost full danger" data-act="logout">Cerrar sesión</button>`;
    return shell({ title: 'Ajustes', back: '#/', body });
  }

  function vNoExiste(back) {
    return shell({ title: 'No encontrado', back, body: empty('Este registro ya no existe', 'Puede que se haya borrado.') });
  }

  // ------------------------------------------------------------ render / router
  function render() {
    if (loadError) { app.innerHTML = vError(); return; }
    if (!session) { app.innerHTML = vLogin(); return; }
    if (!D) { app.innerHTML = '<div class="splash"><div class="brand-mark big">' + I.bolt + '</div><p>Cargando…</p></div>'; return; }
    const h = location.hash.slice(1) || '/';
    const [a, b, c, d] = h.split('/').filter(Boolean);
    let html;
    switch (a) {
      case 'negocios': html = vNegocios(b); break;
      case 'negocio': html = vNegocio(b); break;
      case 'deudas': html = vDeudas(b); break;
      case 'deuda': html = vDeudaGrupo(b, c, d); break;
      case 'trx': html = vTrx(b); break;
      case 'clientes': html = vClientes(); break;
      case 'cliente': html = vCliente(b); break;
      case 'personal': html = vPersonal(); break;
      case 'trabajador': html = vTrabajador(b); break;
      case 'movimientos': html = vMovimientos(b); break;
      case 'ajustes': html = vAjustes(); break;
      default: html = vInicio();
    }
    const same = stack[stack.length - 1] === h;
    const y = window.scrollY;
    if (!same) {
      if (stack[stack.length - 2] === h) stack.pop(); else stack.push(h);
      if (stack.length > 50) stack.shift();
    }
    app.innerHTML = html;
    window.scrollTo(0, same ? y : 0);
    const q = $('#buscar');
    if (q) q.addEventListener('input', () => {
      const v = q.value.trim().toLowerCase();
      $$('#lista [data-q]').forEach(el => { el.style.display = el.dataset.q.includes(v) ? '' : 'none'; });
    });
  }

  // ------------------------------------------------------------ formularios
  function fieldHtml(f) {
    if (f.type === 'info') return `<div class="field info-field" data-f="${f.name}"><div class="info-box"></div></div>`;
    const id = 'f_' + f.name;
    const val = f.value ?? '';
    let inner;
    switch (f.type) {
      case 'money':
        inner = `<input id="${id}" data-money inputmode="numeric" autocomplete="off" placeholder="$0" value="${val ? clp(val) : ''}" class="${f.big ? 'big' : ''}">`; break;
      case 'date':
        inner = `<input id="${id}" type="date" value="${esc(val)}">`; break;
      case 'textarea':
        inner = `<textarea id="${id}" rows="3" placeholder="${esc(f.placeholder || '')}">${esc(val)}</textarea>`; break;
      case 'select':
        inner = `<select id="${id}">${f.options.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(val) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`; break;
      case 'seg':
        inner = `<div class="seg"><input type="hidden" value="${esc(val)}">${f.options.map(([v, l]) => `<button type="button" data-seg="${esc(v)}" class="${String(v) === String(val) ? 'on' : ''}">${esc(l)}</button>`).join('')}</div>`; break;
      case 'checks':
        inner = `<div class="checks">${f.options.length ? f.options.map(([v, l, s]) => `<label class="check"><input type="checkbox" value="${esc(v)}" ${(val || []).includes(v) ? 'checked' : ''}><span class="box">${I.check}</span><span class="lbl"><b>${esc(l)}</b>${s ? `<small>${esc(s)}</small>` : ''}</span></label>`).join('') : `<p class="muted">${esc(f.empty || 'No hay opciones')}</p>`}</div>`; break;
      default:
        inner = `<input id="${id}" type="${f.type || 'text'}" value="${esc(val)}" placeholder="${esc(f.placeholder || '')}" autocomplete="off" ${f.type === 'tel' ? 'inputmode="tel"' : ''} ${f.type === 'email' ? 'inputmode="email"' : ''}>`;
    }
    return `<div class="field" data-f="${f.name}"><label for="${id}">${esc(f.label)}</label>${inner}${f.help ? `<small class="help">${esc(f.help)}</small>` : ''}</div>`;
  }

  function openForm({ title, fields, submitLabel = 'Guardar', onSubmit, validate, extra = [] }) {
    fields = fields.flat().filter(Boolean);
    const ov = document.createElement('div');
    ov.className = 'sheet-wrap';
    ov.innerHTML = `<div class="sheet-bg"></div>
      <form class="sheet" novalidate>
        <div class="sheet-head"><h2>${esc(title)}</h2><button type="button" class="icon-btn" data-close aria-label="Cerrar">${I.x}</button></div>
        <div class="sheet-body">${fields.map(fieldHtml).join('')}<p class="form-err" hidden></p></div>
        <div class="sheet-foot">${extra.map((x, i) => `<button type="button" class="btn-ghost ${x.cls || ''}" data-extra="${i}">${esc(x.label)}</button>`).join('')}<button class="btn-primary" type="submit">${esc(submitLabel)}</button></div>
      </form>`;
    document.body.appendChild(ov);
    document.body.classList.add('sheet-open');
    requestAnimationFrame(() => ov.classList.add('open'));
    const form = $('form', ov), errEl = $('.form-err', ov), btn = $('button[type=submit]', ov);
    const wrap = n => form.querySelector(`[data-f="${n}"]`);
    const values = () => {
      const v = {};
      for (const f of fields) {
        if (f.type === 'info') continue;
        const w = wrap(f.name);
        if (f.type === 'checks') v[f.name] = $$('input:checked', w).map(i => i.value);
        else if (f.type === 'seg') v[f.name] = $('input', w).value;
        else if (f.type === 'money') v[f.name] = parseMoney($('input', w).value);
        else v[f.name] = ($('input,select,textarea', w).value || '').trim();
      }
      return v;
    };
    const sync = () => {
      const v = values();
      for (const f of fields) {
        if (f.showIf) wrap(f.name).hidden = !f.showIf(v);
        if (f.type === 'info') { const html = f.compute(v); const box = $('.info-box', wrap(f.name)); box.innerHTML = html; wrap(f.name).hidden = !html; }
      }
    };
    form.addEventListener('input', e => {
      if (e.target.hasAttribute('data-money')) { const n = parseMoney(e.target.value); e.target.value = n ? clp(n) : ''; }
      sync();
    });
    form.addEventListener('change', sync);
    form.addEventListener('click', e => {
      const s = e.target.closest('[data-seg]'); if (!s) return;
      const w = s.closest('.seg');
      $$('[data-seg]', w).forEach(b => b.classList.toggle('on', b === s));
      $('input', w).value = s.dataset.seg; sync();
    });
    sync();
    const first = fields.find(f => f.autofocus);
    if (first) setTimeout(() => $('input,textarea', wrap(first.name))?.focus(), 250);

    return new Promise(resolve => {
      let done = false;
      const close = r => {
        if (done) return; done = true;
        ov.classList.remove('open'); document.body.classList.remove('sheet-open');
        setTimeout(() => ov.remove(), 220); resolve(r);
      };
      const showErr = m => { errEl.textContent = m; errEl.hidden = false; errEl.scrollIntoView({ block: 'nearest' }); };
      $('.sheet-bg', ov).onclick = () => close(null);
      $('[data-close]', ov).onclick = () => close(null);
      $$('[data-extra]', ov).forEach(b => b.onclick = async () => {
        try { const r = await extra[+b.dataset.extra].onClick(); if (r !== false) close(null); } catch (ex) { showErr(humanError(ex)); }
      });
      form.onsubmit = async e => {
        e.preventDefault();
        errEl.hidden = true;
        const v = values();
        for (const f of fields) {
          if (f.type === 'info') continue;
          if (wrap(f.name).hidden) { delete v[f.name]; continue; }
          const val = v[f.name];
          const missing = f.type === 'money' ? !(val > 0) : f.type === 'checks' ? !val.length : !val;
          if (f.required && missing) return showErr(f.type === 'checks' ? `Elige al menos uno en "${f.label}"` : `Completa: ${f.label}`);
        }
        const msg = validate && validate(v);
        if (msg) return showErr(msg);
        btn.disabled = true; btn.textContent = 'Guardando…';
        try { await onSubmit(v); close(v); }
        catch (ex) { showErr(humanError(ex)); btn.disabled = false; btn.textContent = submitLabel; }
      };
    });
  }

  function humanError(ex) {
    const m = String(ex?.message || ex || '');
    if (/Invalid login credentials/i.test(m)) return 'Correo o contraseña incorrectos.';
    if (/Email not confirmed/i.test(m)) return 'El correo no está confirmado. Confírmalo en Supabase.';
    if (/Failed to fetch|NetworkError|Load failed|network/i.test(m)) return 'Sin conexión a internet. Revisa la señal e intenta de nuevo.';
    if (/JWT|expired|refresh token/i.test(m)) return 'La sesión expiró. Vuelve a entrar.';
    if (/row-level security|permission denied/i.test(m)) return 'Sin permiso para guardar. Revisa que ejecutaste schema.sql.';
    return m || 'Ocurrió un error.';
  }

  let toastT;
  function toast(msg, kind = '') {
    const el = $('#toast'); el.textContent = msg; el.className = 'show ' + kind;
    clearTimeout(toastT); toastT = setTimeout(() => { el.className = ''; }, 2600);
  }

  // ---------- campos reutilizables
  function clienteFields(sel) {
    const opts = [['', '— Sin cliente —'], ...[...D.clientes].sort(byText('nombre')).map(c => [c.id, c.nombre]), ['__new', '＋ Cliente nuevo…']];
    return [
      { name: 'cliente_id', label: 'Cliente', type: 'select', options: opts, value: sel || '' },
      { name: 'nuevo_cliente', label: 'Nombre del cliente nuevo', type: 'text', required: true, showIf: v => v.cliente_id === '__new' },
      { name: 'nuevo_cliente_tel', label: 'Teléfono del cliente (opcional)', type: 'tel', placeholder: '+56 9 …', showIf: v => v.cliente_id === '__new' },
    ];
  }
  async function resolveCliente(v) {
    if (v.cliente_id === '__new') { const c = await DB.insert('clientes', { nombre: v.nuevo_cliente, telefono: v.nuevo_cliente_tel || null }); return c.id; }
    return v.cliente_id || null;
  }
  function proveedorFields(sel) {
    const opts = [['', '— Sin proveedor —'], ...[...D.proveedores].sort(byText('nombre')).map(c => [c.id, c.nombre]), ['__new', '＋ Proveedor nuevo…']];
    return [
      { name: 'proveedor_id', label: 'Proveedor (a quién se le paga)', type: 'select', options: opts, value: sel || '' },
      { name: 'nuevo_proveedor', label: 'Nombre del proveedor nuevo', type: 'text', required: true, showIf: v => v.proveedor_id === '__new' },
    ];
  }
  async function resolveProveedor(v) {
    if (v.proveedor_id === '__new') { const p = await DB.insert('proveedores', { nombre: v.nuevo_proveedor }); return p.id; }
    return v.proveedor_id || null;
  }
  // Lista cotizaciones y trabajos abiertos (cotizado, aceptado, activo, terminado), los más recientes primero.
  // Proyecto = cotización aceptada (aceptado, activo o terminado). La asistencia solo se asigna a proyectos.
  const ES_PROYECTO = ['aceptado', 'activo', 'terminado'];
  const esProyecto = p => ES_PROYECTO.includes(p.estado);
  function proyectoField(sel, label = 'Cotización o proyecto (opcional)', soloProyectos = false) {
    const lista = D.proyectos.filter(p => (soloProyectos ? esProyecto(p) : !['cerrado', 'perdido'].includes(p.estado)) || p.id === sel)
      .sort((a, b) => (esProyecto(b) - esProyecto(a)) || String(b.fecha_cotizacion || '').localeCompare(String(a.fecha_cotizacion || '')) || byText('nombre')(a, b));
    return { name: 'proyecto_id', label, type: 'select', value: sel || '',
      help: soloProyectos && !D.proyectos.some(esProyecto) ? 'Aún no hay proyectos. Una cotización pasa a proyecto al marcarla como Aceptada o Activa en Negocios.' : '',
      options: [['', '— Ninguno —'], ...lista.map(p => [p.id, `${p.nombre} · ${nomCli(p.cliente_id)}${soloProyectos ? '' : ` (${(ESTADOS[p.estado] || '').toLowerCase()})`}`])] };
  }

  // ---------- ventas y gastos
  async function nuevaTrx(tipo, pre = {}) {
    const esV = tipo === 'venta';
    let cli = pre.cliente_id || '';
    if (esV && !cli && pre.proyecto_id) cli = C.proy[pre.proyecto_id]?.cliente_id || '';
    const r = await openForm({
      title: esV ? 'Nueva venta' : 'Nuevo gasto',
      submitLabel: esV ? 'Guardar venta' : 'Guardar gasto',
      fields: [
        { name: 'monto', label: esV ? 'Monto' : 'Monto total', type: 'money', required: true, big: true, value: pre.monto, autofocus: !pre.monto },
        esV ? ivaFields(pre.con_iva) : null,
        { name: 'descripcion', label: esV ? '¿Qué trabajo o venta fue?' : '¿En qué se gastó?', type: 'text', required: true, value: pre.descripcion || '', placeholder: esV ? 'Ej: Cambio de tablero' : 'Ej: Cables y enchufes' },
        esV ? clienteFields(cli) : proveedorFields(pre.proveedor_id),
        esV ? null : { name: 'categoria', label: 'Categoría', type: 'select', options: CATS.map(c => [c, c]), value: 'Materiales' },
        proyectoField(pre.proyecto_id),
        { name: 'estado', label: esV ? '¿Te pagaron?' : '¿Lo pagaste?', type: 'seg', value: pre.estado || 'pagado',
          options: esV ? [['pagado', 'Pagó todo'], ['parcial', 'Abonó'], ['deuda', 'Me debe']] : [['pagado', 'Pagado'], ['parcial', 'Abono'], ['deuda', 'Lo debo']] },
        { name: 'abono', label: esV ? '¿Cuánto te abonó?' : '¿Cuánto abonaste?', type: 'money', required: true, showIf: v => v.estado === 'parcial' },
        { name: 'medio', label: 'Medio de pago', type: 'seg', options: MEDIOS, value: 'Transferencia', showIf: v => v.estado !== 'deuda' },
        { name: 'vencimiento', label: 'Fecha límite de pago (opcional)', type: 'date', showIf: v => v.estado !== 'pagado' },
        { name: 'fecha', label: 'Fecha', type: 'date', value: hoy(), required: true },
      ],
      validate: v => {
        const total = esV ? totalVenta(v) : v.monto;
        if (v.estado === 'parcial' && v.abono >= total) return `El abono debe ser menor que el total (${clp(total)}). Si pagó todo, elige "` + (esV ? 'Pagó todo' : 'Pagado') + '".';
        if (esV && v.estado !== 'pagado' && !v.cliente_id && !(v.proyecto_id && C.proy[v.proyecto_id]?.cliente_id)) return 'Elige el cliente, así sabes quién te debe.';
      },
      onSubmit: async v => {
        let cliente_id = null, proveedor_id = null;
        if (esV) { cliente_id = await resolveCliente(v); if (!cliente_id && v.proyecto_id) cliente_id = C.proy[v.proyecto_id]?.cliente_id || null; }
        else proveedor_id = await resolveProveedor(v);
        const iv = esV && v.con_iva === 'si' ? calcIva(v.monto) : null;
        const total = iv ? iv.total : v.monto;
        const t = await DB.insert('transacciones', {
          tipo, descripcion: v.descripcion, monto: total, fecha: v.fecha || hoy(), vencimiento: v.vencimiento || null,
          categoria: v.categoria || null, cliente_id, proveedor_id, proyecto_id: v.proyecto_id || null,
          con_iva: !!iv, neto: iv ? iv.neto : null, iva: iv ? iv.iva : 0,
        });
        const pago = v.estado === 'pagado' ? total : v.estado === 'parcial' ? v.abono : 0;
        if (pago > 0) await DB.insert('abonos', { transaccion_id: t.id, monto: pago, fecha: v.fecha || hoy(), medio: v.medio || null });
      },
    });
    if (r) { await refresh(); toast(esV ? 'Venta guardada' : 'Gasto guardado', 'ok'); }
    return r;
  }

  async function editTrx(id) {
    const t = C.trx[id]; const esV = t.tipo === 'venta'; const pg = pagado(t);
    const r = await openForm({
      title: esV ? 'Editar venta' : 'Editar gasto',
      fields: [
        { name: 'monto', label: esV ? 'Monto' : 'Monto total', type: 'money', required: true, big: true, value: esV && t.con_iva ? (t.neto ?? t.monto) : t.monto },
        esV ? ivaFields(t.con_iva ? 'si' : 'no') : null,
        { name: 'descripcion', label: 'Descripción', type: 'text', required: true, value: t.descripcion },
        esV ? clienteFields(t.cliente_id) : proveedorFields(t.proveedor_id),
        esV ? null : { name: 'categoria', label: 'Categoría', type: 'select', options: CATS.map(c => [c, c]), value: t.categoria || 'Otros' },
        proyectoField(t.proyecto_id),
        { name: 'fecha', label: 'Fecha', type: 'date', value: t.fecha, required: true },
        { name: 'vencimiento', label: 'Fecha límite de pago (opcional)', type: 'date', value: t.vencimiento || '' },
      ],
      validate: v => { const total = esV ? totalVenta(v) : v.monto; if (total < pg) return `Ya hay ${clp(pg)} abonado. El total (${clp(total)}) no puede ser menor; borra abonos primero.`; },
      onSubmit: async v => {
        const patch = { monto: v.monto, descripcion: v.descripcion, fecha: v.fecha, vencimiento: v.vencimiento || null, proyecto_id: v.proyecto_id || null };
        if (esV) {
          const iv = v.con_iva === 'si' ? calcIva(v.monto) : null;
          Object.assign(patch, { monto: iv ? iv.total : v.monto, con_iva: !!iv, neto: iv ? iv.neto : null, iva: iv ? iv.iva : 0 });
          patch.cliente_id = await resolveCliente(v);
        } else { patch.proveedor_id = await resolveProveedor(v); patch.categoria = v.categoria; }
        await DB.update('transacciones', id, patch);
      },
      extra: [{ label: 'Eliminar', cls: 'danger', onClick: async () => {
        if (!confirm(`¿Eliminar "${t.descripcion}"? También se borran sus abonos.`)) return false;
        await DB.remove('transacciones', id); await reload(); goBack('#/'); toast('Eliminado'); } }],
    });
    if (r) { await refresh(); toast('Cambios guardados', 'ok'); }
  }

  async function abonoTrx(id) {
    const t = C.trx[id]; const s = saldo(t); const esV = t.tipo === 'venta';
    const r = await openForm({
      title: esV ? 'Registrar abono' : 'Registrar pago',
      submitLabel: 'Guardar',
      fields: [
        { name: 'monto', label: `Monto (${esV ? 'debe' : 'falta'} ${clp(s)})`, type: 'money', required: true, big: true, value: s },
        { name: 'medio', label: 'Medio de pago', type: 'seg', options: MEDIOS, value: 'Transferencia' },
        { name: 'fecha', label: 'Fecha', type: 'date', value: hoy(), required: true },
        { name: 'nota', label: 'Nota (opcional)', type: 'text' },
      ],
      validate: v => { if (v.monto > s) return `El monto supera el saldo pendiente (${clp(s)}).`; },
      onSubmit: v => DB.insert('abonos', { transaccion_id: id, monto: v.monto, fecha: v.fecha, medio: v.medio, nota: v.nota || null }),
    });
    if (r) { await refresh(); toast('Abono guardado', 'ok'); }
  }

  async function abonoGrupo(kind, key) {
    const g = grupos(kind === 'c' ? 'venta' : 'gasto').find(x => x.key === key); if (!g) return;
    const r = await openForm({
      title: kind === 'c' ? `Abono de ${g.nombre}` : `Pago a ${g.nombre}`,
      fields: [
        { name: 'monto', label: `Monto (total pendiente ${clp(g.total)})`, type: 'money', required: true, big: true, value: g.total, help: g.n > 1 ? 'Se descuenta primero de las deudas más antiguas.' : '' },
        { name: 'medio', label: 'Medio de pago', type: 'seg', options: MEDIOS, value: 'Transferencia' },
        { name: 'fecha', label: 'Fecha', type: 'date', value: hoy(), required: true },
        { name: 'nota', label: 'Nota (opcional)', type: 'text' },
      ],
      validate: v => { if (v.monto > g.total) return `El monto supera lo pendiente (${clp(g.total)}).`; },
      onSubmit: async v => {
        let rest = v.monto;
        const trxs = [...g.trxs].sort((a, b) => (a.fecha + (a.created_at || '')).localeCompare(b.fecha + (b.created_at || '')));
        for (const t of trxs) {
          if (rest <= 0) break;
          const p = Math.min(rest, saldo(t));
          await DB.insert('abonos', { transaccion_id: t.id, monto: p, fecha: v.fecha, medio: v.medio, nota: v.nota || null });
          rest -= p;
        }
      },
    });
    if (r) { await refresh(); toast('Abono guardado', 'ok'); }
  }

  // ---------- negocios
  async function formNegocio(p = null, pre = {}) {
    const edit = !!p; p = p || {};
    const r = await openForm({
      title: edit ? 'Editar negocio' : 'Nueva cotización',
      fields: [
        clienteFields(p.cliente_id || pre.cliente_id),
        { name: 'nombre', label: 'Trabajo', type: 'text', required: true, value: p.nombre || '', placeholder: 'Ej: Instalación eléctrica casa', autofocus: !edit },
        { name: 'monto_cotizado', label: 'Monto cotizado', type: 'money', value: p.monto_cotizado },
        { name: 'probabilidad', label: 'Posibilidad de que acepten', type: 'seg', options: [['alta', 'Alta'], ['media', 'Media'], ['baja', 'Baja']], value: p.probabilidad || 'media' },
        edit ? { name: 'estado', label: 'Estado', type: 'select', options: ESTADO_ORDEN.map(e => [e, ESTADOS[e]]), value: p.estado } : null,
        { name: 'fecha_cotizacion', label: 'Fecha de la cotización', type: 'date', value: p.fecha_cotizacion || hoy(), required: true },
        { name: 'proxima_accion', label: 'Próxima acción (opcional)', type: 'text', value: p.proxima_accion || '', placeholder: 'Ej: Llamar para confirmar' },
        { name: 'fecha_seguimiento', label: 'Fecha de seguimiento', type: 'date', value: p.fecha_seguimiento || '' },
        { name: 'descripcion', label: 'Detalle (opcional)', type: 'textarea', value: p.descripcion || '' },
      ],
      validate: v => { if (!v.cliente_id) return 'Elige o crea el cliente.'; },
      onSubmit: async v => {
        const row = {
          cliente_id: await resolveCliente(v), nombre: v.nombre, monto_cotizado: v.monto_cotizado || 0,
          probabilidad: v.probabilidad, fecha_cotizacion: v.fecha_cotizacion, proxima_accion: v.proxima_accion || null,
          fecha_seguimiento: v.fecha_seguimiento || null, descripcion: v.descripcion || null,
        };
        if (edit) { row.estado = v.estado; await DB.update('proyectos', p.id, row); }
        else { const n = await DB.insert('proyectos', row); pre._id = n.id; }
      },
      extra: edit ? [{ label: 'Eliminar', cls: 'danger', onClick: async () => {
        if (!confirm(`¿Eliminar "${p.nombre}"? Sus ventas, gastos y asistencias quedan sin trabajo asignado.`)) return false;
        await DB.remove('proyectos', p.id); await reload(); location.hash = '#/negocios'; toast('Eliminado'); } }] : [],
    });
    if (r) {
      await reload();
      if (!edit && pre._id) location.hash = '#/negocio/' + pre._id; else render();
      toast(edit ? 'Cambios guardados' : 'Cotización guardada', 'ok');
    }
  }

  async function setEstado(id, estado) {
    const p = C.proy[id]; if (!p || p.estado === estado) return;
    await DB.update('proyectos', id, { estado });
    await refresh();
    toast(`Estado: ${ESTADOS[estado]}`, 'ok');
    const tieneVenta = D.transacciones.some(t => t.proyecto_id === id && t.tipo === 'venta');
    if (['aceptado', 'activo'].includes(estado) && !tieneVenta && num(p.monto_cotizado) > 0 &&
      confirm(`¡Bien! ¿Registrar la venta de ${clp(p.monto_cotizado)} a ${nomCli(p.cliente_id)}?\n\nAsí queda en "por cobrar" y puedes anotar el anticipo.`)) {
      await nuevaTrx('venta', { cliente_id: p.cliente_id, proyecto_id: id, monto: num(p.monto_cotizado), descripcion: p.nombre, estado: 'parcial' });
    }
  }

  async function seguimiento(id) {
    const p = C.proy[id];
    const r = await openForm({
      title: 'Próxima acción',
      fields: [
        { name: 'proxima_accion', label: '¿Qué hay que hacer?', type: 'text', required: true, value: p.proxima_accion || '', placeholder: 'Ej: Llamar, enviar cotización, cobrar…', autofocus: true },
        { name: 'fecha_seguimiento', label: '¿Cuándo?', type: 'date', value: p.fecha_seguimiento || hoy(), required: true },
      ],
      onSubmit: v => DB.update('proyectos', id, { proxima_accion: v.proxima_accion, fecha_seguimiento: v.fecha_seguimiento }),
    });
    if (r) { await refresh(); toast('Seguimiento guardado', 'ok'); }
  }

  // ---------- clientes y proveedores
  async function formCliente(c = null) {
    const edit = !!c; c = c || {};
    let nuevoId = null;
    const r = await openForm({
      title: edit ? 'Editar cliente' : 'Nuevo cliente',
      fields: [
        { name: 'nombre', label: 'Nombre', type: 'text', required: true, value: c.nombre || '', autofocus: !edit },
        { name: 'telefono', label: 'Teléfono / WhatsApp', type: 'tel', value: c.telefono || '', placeholder: '+56 9 …' },
        { name: 'email', label: 'Correo', type: 'email', value: c.email || '' },
        { name: 'direccion', label: 'Dirección', type: 'text', value: c.direccion || '' },
        { name: 'notas', label: 'Notas', type: 'textarea', value: c.notas || '' },
      ],
      onSubmit: async v => {
        const row = { nombre: v.nombre, telefono: v.telefono || null, email: v.email || null, direccion: v.direccion || null, notas: v.notas || null };
        if (edit) await DB.update('clientes', c.id, row); else nuevoId = (await DB.insert('clientes', row)).id;
      },
      extra: edit ? [{ label: 'Eliminar', cls: 'danger', onClick: async () => {
        if (!confirm(`¿Eliminar a ${c.nombre}? Sus ventas y trabajos quedan como "Sin cliente".`)) return false;
        await DB.remove('clientes', c.id); await reload(); location.hash = '#/clientes'; toast('Cliente eliminado'); } }] : [],
    });
    if (r) { await reload(); if (nuevoId) location.hash = '#/cliente/' + nuevoId; else render(); toast('Cliente guardado', 'ok'); }
  }

  async function formProveedor(p = null) {
    const edit = !!p; p = p || {};
    const r = await openForm({
      title: edit ? 'Editar proveedor' : 'Nuevo proveedor',
      fields: [
        { name: 'nombre', label: 'Nombre', type: 'text', required: true, value: p.nombre || '', autofocus: !edit },
        { name: 'telefono', label: 'Teléfono', type: 'tel', value: p.telefono || '' },
        { name: 'notas', label: 'Notas', type: 'textarea', value: p.notas || '' },
      ],
      onSubmit: async v => {
        const row = { nombre: v.nombre, telefono: v.telefono || null, notas: v.notas || null };
        if (edit) await DB.update('proveedores', p.id, row); else await DB.insert('proveedores', row);
      },
      extra: edit ? [{ label: 'Eliminar', cls: 'danger', onClick: async () => {
        if (!confirm(`¿Eliminar a ${p.nombre}? Sus gastos quedan como "Sin proveedor".`)) return false;
        await DB.remove('proveedores', p.id); await refresh(); toast('Proveedor eliminado'); } }] : [],
    });
    if (r) { await refresh(); toast('Proveedor guardado', 'ok'); }
  }

  // ---------- personal
  async function formTrabajador(t = null) {
    const edit = !!t; t = t || {};
    let nuevoId = null;
    const r = await openForm({
      title: edit ? 'Editar trabajador' : 'Nuevo trabajador',
      fields: [
        { name: 'nombre', label: 'Nombre', type: 'text', required: true, value: t.nombre || '', autofocus: !edit },
        { name: 'valor_dia', label: 'Valor por día', type: 'money', required: true, value: t.valor_dia, help: 'Medio día se calcula como la mitad.' },
        { name: 'telefono', label: 'Teléfono', type: 'tel', value: t.telefono || '' },
        edit ? { name: 'activo', label: 'Estado', type: 'seg', options: [['1', 'Activo'], ['0', 'Inactivo']], value: t.activo ? '1' : '0' } : null,
      ],
      onSubmit: async v => {
        const row = { nombre: v.nombre, valor_dia: v.valor_dia, telefono: v.telefono || null };
        if (edit) { row.activo = v.activo === '1'; await DB.update('trabajadores', t.id, row); }
        else nuevoId = (await DB.insert('trabajadores', { ...row, activo: true })).id;
      },
      extra: edit ? [{ label: 'Eliminar', cls: 'danger', onClick: async () => {
        if (!confirm(`¿Eliminar a ${t.nombre}? Se borran también sus días y pagos. Si ya no trabaja contigo, mejor márcalo como inactivo.`)) return false;
        await DB.remove('trabajadores', t.id); await reload(); location.hash = '#/personal'; toast('Trabajador eliminado'); } }] : [],
    });
    if (r) { await reload(); if (nuevoId) location.hash = '#/trabajador/' + nuevoId; else render(); toast('Trabajador guardado', 'ok'); }
  }

  // Valor del día: jornada normal (valor por día × jornada) o valor especial, más un extra opcional.
  const pagoDia = (t, v) => {
    const especial = v.jornada === 'otro';
    const j = especial ? 1 : (num(v.jornada) || 1);
    const base = especial ? num(v.valor_otro) : Math.round(num(t.valor_dia) * j);
    const extra = num(v.extra);
    return { j, base, extra, total: base + extra };
  };
  function pagoFields(getTrabs, pre = {}) {
    return [
      { name: 'jornada', label: 'Jornada', type: 'seg', options: [['1', 'Día completo'], ['0.5', 'Medio día'], ['otro', 'Valor especial']], value: pre.jornada || '1' },
      { name: 'valor_otro', label: 'Valor del día', type: 'money', required: true, value: pre.valor_otro, showIf: v => v.jornada === 'otro' },
      { name: 'extra', label: 'Extra: horas extra o bono (opcional)', type: 'money', value: pre.extra, help: 'Se suma al valor del día.' },
      { name: 'pago_info', type: 'info', compute: v => getTrabs(v).map(t => {
          const p = pagoDia(t, v);
          return `${esc(t.nombre.split(' ')[0])}: ${clp(p.base)}${p.extra ? ' + extra ' + clp(p.extra) : ''} = <b>${clp(p.total)}</b>`;
        }).join('<br>') },
    ];
  }

  let ultimoProyAsist = '';
  async function asistencia(pre = {}) {
    const activos = D.trabajadores.filter(t => t.activo).sort(byText('nombre'));
    if (!activos.length) { toast('Primero agrega un trabajador'); return formTrabajador(); }
    const proySel = pre.proyecto || (C.proy[ultimoProyAsist] ? ultimoProyAsist : '');
    const r = await openForm({
      title: 'Registrar asistencia',
      fields: [
        { name: 'fecha', label: 'Día', type: 'date', value: hoy(), required: true },
        { name: 'trabajadores', label: '¿Quiénes trabajaron?', type: 'checks', required: true, value: pre.trabajador ? [pre.trabajador] : [],
          options: activos.map(t => [t.id, t.nombre, clp(t.valor_dia) + ' por día']) },
        pagoFields(v => (v.trabajadores || []).map(id => C.trab[id]).filter(Boolean)),
        proyectoField(proySel, '¿En qué proyecto?', true),
        { name: 'nota', label: 'Nota (opcional)', type: 'text', placeholder: 'Ej: 2 horas extra' },
      ],
      validate: v => {
        const ya = D.asistencias.filter(a => a.fecha === v.fecha && v.trabajadores.includes(a.trabajador_id));
        if (ya.length && !confirm(`${[...new Set(ya.map(a => C.trab[a.trabajador_id]?.nombre))].join(', ')} ya tiene asistencia ese día. ¿Registrar de todos modos?`)) return 'Registro cancelado.';
      },
      onSubmit: async v => {
        for (const id of v.trabajadores) {
          const p = pagoDia(C.trab[id], v);
          await DB.insert('asistencias', { trabajador_id: id, proyecto_id: v.proyecto_id || null, fecha: v.fecha, jornada: p.j, valor: p.total, extra: p.extra, nota: v.nota || null });
        }
        ultimoProyAsist = v.proyecto_id || '';
      },
    });
    if (r) { await refresh(); toast(r.trabajadores.length > 1 ? `${r.trabajadores.length} asistencias guardadas` : 'Asistencia guardada', 'ok'); }
  }

  async function editAsist(id) {
    const a = D.asistencias.find(x => x.id === id); if (!a) return;
    const t = C.trab[a.trabajador_id]; if (!t) return;
    const extra = num(a.extra), base = num(a.valor) - extra;
    const normal = [1, 0.5].find(j => num(a.jornada) === j && base === Math.round(num(t.valor_dia) * j));
    const r = await openForm({
      title: `Día de ${t.nombre.split(' ')[0]}`,
      fields: [
        { name: 'fecha', label: 'Día', type: 'date', value: a.fecha, required: true },
        pagoFields(() => [t], { jornada: normal ? String(normal) : 'otro', valor_otro: normal ? '' : base, extra: extra || '' }),
        proyectoField(a.proyecto_id || '', '¿En qué proyecto?', true),
        { name: 'nota', label: 'Nota (opcional)', type: 'text', value: a.nota || '' },
      ],
      onSubmit: v => {
        const p = pagoDia(t, v);
        return DB.update('asistencias', id, { fecha: v.fecha, jornada: p.j, valor: p.total, extra: p.extra, proyecto_id: v.proyecto_id || null, nota: v.nota || null });
      },
      extra: [{ label: 'Borrar día', cls: 'danger', onClick: async () => {
        if (!confirm('¿Borrar este día trabajado?')) return false;
        await DB.remove('asistencias', id); await refresh(); toast('Día borrado'); } }],
    });
    if (r) { await refresh(); toast('Día actualizado', 'ok'); }
  }

  async function pagarTrab(id) {
    const t = C.trab[id]; const s = trabStats(id);
    const r = await openForm({
      title: `Pago a ${t.nombre}`,
      fields: [
        { name: 'monto', label: s.debe > 0 ? `Monto (le debes ${clp(s.debe)})` : 'Monto', type: 'money', required: true, big: true, value: s.debe > 0 ? s.debe : '' },
        { name: 'fecha', label: 'Fecha', type: 'date', value: hoy(), required: true },
        { name: 'nota', label: 'Nota (opcional)', type: 'text', placeholder: 'Ej: Semana del 14 al 18' },
      ],
      onSubmit: v => DB.insert('pagos_trabajador', { trabajador_id: id, monto: v.monto, fecha: v.fecha, nota: v.nota || null }),
    });
    if (r) { await refresh(); toast('Pago guardado', 'ok'); }
  }

  // ---------- respaldo
  async function exportar() {
    const csvCell = v => { const s = String(v ?? ''); return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const lines = [];
    const row = arr => lines.push(arr.map(csvCell).join(';'));
    row(['VENTAS Y GASTOS']);
    row(['Fecha', 'Tipo', 'Descripción', 'Cliente / Proveedor', 'Trabajo', 'Categoría', 'Con IVA', 'Neto', 'IVA', 'Total', 'Pagado', 'Saldo', 'Fecha límite']);
    for (const t of [...D.transacciones].sort((a, b) => a.fecha.localeCompare(b.fecha)))
      row([t.fecha, t.tipo === 'venta' ? 'Venta' : 'Gasto', t.descripcion, contraparte(t), C.proy[t.proyecto_id]?.nombre || '', t.categoria || '',
        t.con_iva ? 'Sí' : 'No', t.con_iva ? num(t.neto ?? t.monto - num(t.iva)) : num(t.monto), num(t.iva), num(t.monto), pagado(t), saldo(t), t.vencimiento || '']);
    row([]); row(['ABONOS Y PAGOS']);
    row(['Fecha', 'Tipo', 'Descripción', 'Cliente / Proveedor', 'Monto', 'Medio', 'Nota']);
    for (const a of [...D.abonos].sort((a, b) => a.fecha.localeCompare(b.fecha))) { const t = C.trx[a.transaccion_id]; if (t) row([a.fecha, t.tipo === 'venta' ? 'Cobro' : 'Pago', t.descripcion, contraparte(t), num(a.monto), a.medio || '', a.nota || '']); }
    row([]); row(['NEGOCIOS']);
    row(['Fecha cotización', 'Cliente', 'Trabajo', 'Estado', 'Probabilidad', 'Monto cotizado', 'Próxima acción', 'Fecha seguimiento']);
    for (const p of D.proyectos) row([p.fecha_cotizacion, nomCli(p.cliente_id), p.nombre, ESTADOS[p.estado], PROB[p.probabilidad], num(p.monto_cotizado), p.proxima_accion || '', p.fecha_seguimiento || '']);
    row([]); row(['ASISTENCIA']);
    row(['Fecha', 'Trabajador', 'Cotización / trabajo', 'Jornada', 'Valor día', 'Extra', 'Total', 'Nota']);
    for (const a of [...D.asistencias].sort((a, b) => a.fecha.localeCompare(b.fecha)))
      row([a.fecha, C.trab[a.trabajador_id]?.nombre || '', C.proy[a.proyecto_id]?.nombre || '', num(a.jornada), num(a.valor) - num(a.extra), num(a.extra), num(a.valor), a.nota || '']);
    row([]); row(['PAGOS A TRABAJADORES']);
    row(['Fecha', 'Trabajador', 'Monto', 'Nota']);
    for (const p of [...D.pagos_trabajador].sort((a, b) => a.fecha.localeCompare(b.fecha))) row([p.fecha, C.trab[p.trabajador_id]?.nombre || '', num(p.monto), p.nota || '']);
    row([]); row(['CLIENTES']); row(['Nombre', 'Teléfono', 'Correo', 'Dirección']);
    for (const c of D.clientes) row([c.nombre, c.telefono || '', c.email || '', c.direccion || '']);

    const name = `${EMPRESA}-respaldo-${hoy()}.csv`;
    const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const file = new File([blob], name, { type: 'text/csv' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: name }); return; } catch (e) { if (e.name === 'AbortError') return; }
    }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast('Respaldo descargado', 'ok');
  }

  function goBack(fallback) {
    if (stack.length > 1) history.back(); else location.hash = fallback || '#/';
  }

  // ------------------------------------------------------------ acciones
  const pre = ds => ({ cliente_id: ds.cliente || '', proyecto_id: ds.proyecto || '', proveedor_id: ds.proveedor || '' });
  const ACTIONS = {
    back: ds => goBack(ds.fallback),
    venta: ds => nuevaTrx('venta', pre(ds)),
    gasto: ds => nuevaTrx('gasto', pre(ds)),
    'edit-trx': ds => editTrx(ds.id),
    'abono-trx': ds => abonoTrx(ds.id),
    'abono-grupo': ds => abonoGrupo(ds.kind, ds.key),
    'del-abono': async ds => { if (!confirm('¿Borrar este abono?')) return; await DB.remove('abonos', ds.id); await refresh(); toast('Abono borrado'); },
    'nuevo-negocio': ds => formNegocio(null, { cliente_id: ds.cliente || '' }),
    'edit-negocio': ds => formNegocio(C.proy[ds.id]),
    estado: ds => setEstado(ds.id, ds.v),
    seguimiento: ds => seguimiento(ds.id),
    'seg-hecho': async ds => { await DB.update('proyectos', ds.id, { proxima_accion: null, fecha_seguimiento: null }); await refresh(); toast('Listo ✓', 'ok'); },
    'nuevo-cliente': () => formCliente(),
    'edit-cliente': ds => formCliente(C.cli[ds.id]),
    'nuevo-prov': () => formProveedor(),
    'edit-prov': ds => formProveedor(C.prov[ds.id]),
    'nuevo-trab': () => formTrabajador(),
    'edit-trab': ds => formTrabajador(C.trab[ds.id]),
    asistencia: ds => asistencia({ trabajador: ds.trabajador, proyecto: ds.proyecto }),
    'edit-asist': ds => editAsist(ds.id),
    'pagar-trab': ds => pagarTrab(ds.id),
    'del-asist': async ds => { if (!confirm('¿Borrar este día trabajado?')) return; await DB.remove('asistencias', ds.id); await refresh(); toast('Día borrado'); },
    'del-pago': async ds => { if (!confirm('¿Borrar este pago?')) return; await DB.remove('pagos_trabajador', ds.id); await refresh(); toast('Pago borrado'); },
    'saldo-ini': async () => {
      const r = await openForm({ title: 'Saldo inicial', fields: [{ name: 'valor', label: 'Dinero al comenzar (caja + banco)', type: 'money', big: true, value: C.saldoIni, help: 'Desde aquí se suman los cobros y se restan los pagos para calcular el dinero disponible.' }],
        onSubmit: v => DB.setAjuste('saldo_inicial', String(v.valor || 0)) });
      if (r) { await refresh(); toast('Saldo actualizado', 'ok'); }
    },
    exportar: () => exportar(),
    logout: async () => { if (!confirm('¿Cerrar sesión?')) return; await DB.signOut(); session = null; D = null; loadError = null; location.hash = '#/'; render(); },
    'demo-reset': async () => { if (!confirm('¿Volver a los datos de prueba iniciales?')) return; DB.resetDemo(); await refresh(); toast('Datos de prueba reiniciados'); },
    retry: async () => { loadError = null; render(); await safeLoad(); },
  };

  document.addEventListener('click', async e => {
    if (document.body.classList.contains('sheet-open') && !e.target.closest('.sheet-wrap')) return;
    const go0 = e.target.closest('[data-go]'), act0 = e.target.closest('[data-act]');
    // un botón de acción dentro de una tarjeta navegable tiene prioridad sobre la tarjeta
    const go = act0 && go0 && go0.contains(act0) ? null : go0;
    if (go && !go.closest('.sheet-wrap')) { e.preventDefault(); const h = go.dataset.go; if (location.hash === h || (h === '#/' && !location.hash)) render(); else location.hash = h; return; }
    const a = e.target.closest('[data-act]');
    if (a && ACTIONS[a.dataset.act]) {
      e.preventDefault();
      try { await ACTIONS[a.dataset.act](a.dataset, a); } catch (ex) { console.error(ex); toast(humanError(ex), 'err'); }
    }
  });

  document.addEventListener('submit', async e => {
    if (e.target.id !== 'login') return;
    e.preventDefault();
    const f = e.target, btn = $('button', f);
    btn.disabled = true; btn.textContent = 'Entrando…';
    try {
      session = await DB.signIn(f.email.value.trim(), f.password.value);
      render(); await safeLoad();
    } catch (ex) { app.innerHTML = vLogin(humanError(ex)); $('#login').email.value = f.email.value; }
  });

  window.addEventListener('hashchange', render);

  async function safeLoad() {
    try { await reload(); loadError = null; } catch (ex) { console.error(ex); loadError = ex; }
    render();
  }

  async function start() {
    try { await DB.init(); }
    catch (e) { if (e.code === 'CONFIG') { app.innerHTML = vConfig(); return; } throw e; }
    session = await DB.session();
    DB.onAuth(s => {
      const had = !!session; session = s;
      if (!s && had) { D = null; render(); }
    });
    render();
    if (session) await safeLoad();
    // recargar al volver a la app (por si se usó en otro dispositivo)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && session && D && !document.body.classList.contains('sheet-open')) reload().then(render).catch(() => {});
    });
  }

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  start();
})();
