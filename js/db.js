// =====================================================================
// Capa de datos: Supabase (real) o localStorage (modo demo: ?demo=1)
// =====================================================================
window.DB = (() => {
  'use strict';
  const TABLES = ['clientes', 'proveedores', 'proyectos', 'trabajadores', 'transacciones',
    'abonos', 'asistencias', 'pagos_trabajador', 'ajustes'];
  const demo = new URLSearchParams(location.search).has('demo');
  const CFG = window.APP_CONFIG || {};
  let sb = null;
  let userId = null;

  const uuid = () => (crypto.randomUUID ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16);
    }));

  // ------------------------------------------------------------ DEMO
  const LS = 'electroservices_demo_v3';
  const dLoad = () => { try { return JSON.parse(localStorage.getItem(LS)); } catch { return null; } };
  const dSave = d => localStorage.setItem(LS, JSON.stringify(d));

  function seed() {
    const d = Object.fromEntries(TABLES.map(t => [t, []]));
    const now = Date.now();
    let k = 0;
    const add = (t, row) => { const r = { id: uuid(), created_at: new Date(now + (k++) * 1000).toISOString(), ...row }; d[t].push(r); return r; };
    const ymd = off => { const x = new Date(); x.setDate(x.getDate() + off); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };

    const portugal = add('clientes', { nombre: 'Portugal 71', telefono: '+56 9 1111 2222', direccion: 'Portugal 71, Santiago' });
    const verrock = add('clientes', { nombre: 'Ver Rock', telefono: '+56 9 3333 4444' });
    const madeleine = add('clientes', { nombre: 'Madeleine', telefono: '+56 9 5555 6666' });
    const strindberg = add('clientes', { nombre: 'Strindberg', telefono: '' });

    const pm = add('proveedores', { nombre: 'Patricio Medina' });
    const sii = add('proveedores', { nombre: 'SII' });

    const p1 = add('proyectos', { cliente_id: portugal.id, nombre: 'Mantención edificio', monto_cotizado: 910000, estado: 'activo', probabilidad: 'alta', fecha_cotizacion: ymd(-20), proxima_accion: 'Cobrar segundo abono', fecha_seguimiento: ymd(1) });
    const p2 = add('proyectos', { cliente_id: madeleine.id, nombre: 'Cambio de tablero casa', monto_cotizado: 650000, estado: 'cotizado', probabilidad: 'media', fecha_cotizacion: ymd(-4), proxima_accion: 'Llamar para confirmar', fecha_seguimiento: ymd(-1) });
    add('proyectos', { cliente_id: strindberg.id, nombre: 'Iluminación local comercial', monto_cotizado: 1200000, estado: 'cotizado', probabilidad: 'alta', fecha_cotizacion: ymd(-2), proxima_accion: 'Enviar cotización corregida', fecha_seguimiento: ymd(3) });

    const venta = (cli, desc, monto, fecha, proy, pago) => {
      const t = add('transacciones', { tipo: 'venta', descripcion: desc, monto, fecha, cliente_id: cli, proyecto_id: proy || null });
      if (pago) add('abonos', { transaccion_id: t.id, monto: pago, fecha, medio: 'Transferencia' });
      return t;
    };
    const gasto = (prov, desc, monto, fecha, cat, proy, pago) => {
      const t = add('transacciones', { tipo: 'gasto', descripcion: desc, monto, fecha, categoria: cat, proveedor_id: prov, proyecto_id: proy || null });
      if (pago) add('abonos', { transaccion_id: t.id, monto: pago, fecha, medio: 'Transferencia' });
      return t;
    };
    venta(portugal.id, 'Sala de máquinas', 250000, ymd(-9), p1.id);
    venta(portugal.id, 'Limpieza tablero antiguo', 390000, ymd(-9), p1.id);
    venta(portugal.id, 'Focos y enchufe', 270000, ymd(-16), p1.id);
    Object.assign(venta(verrock.id, 'Revisión instalación', 107100, ymd(-9)), { con_iva: true, neto: 90000, iva: 17100 });
    venta(madeleine.id, 'Reparación enchufes', 175000, ymd(-9));
    venta(strindberg.id, 'Instalación luminarias', 357000, ymd(-14));
    venta(verrock.id, 'Visita técnica', 60000, ymd(-12), null, 60000);
    gasto(pm.id, 'Materiales Portugal 71', 210000, ymd(-16), 'Materiales', p1.id);
    gasto(sii.id, 'IVA septiembre', 690000, ymd(-34), 'Impuestos (SII)');
    gasto(null, 'Bencina', 35000, ymd(-3), 'Transporte y combustible', null, 35000);

    const t1 = add('trabajadores', { nombre: 'Juan Pérez', telefono: '', valor_dia: 45000, activo: true });
    const t2 = add('trabajadores', { nombre: 'Luis Soto', telefono: '', valor_dia: 40000, activo: true });
    for (const off of [-4, -3, -2, -1]) {
      add('asistencias', { trabajador_id: t1.id, proyecto_id: p1.id, fecha: ymd(off), jornada: 1, valor: 45000 });
      add('asistencias', { trabajador_id: t2.id, proyecto_id: p1.id, fecha: ymd(off), jornada: off === -1 ? 0.5 : 1, valor: off === -1 ? 20000 : 40000 });
    }
    add('pagos_trabajador', { trabajador_id: t1.id, monto: 90000, fecha: ymd(-2), nota: 'Adelanto' });
    d.ajustes.push({ clave: 'saldo_inicial', valor: '1500000' });
    void p2;
    return d;
  }

  function dData() { let d = dLoad(); if (!d) { d = seed(); dSave(d); } return d; }

  // ------------------------------------------------------------ API
  async function init() {
    if (demo) { dData(); return; }
    if (!window.supabase || !CFG.SUPABASE_URL || CFG.SUPABASE_URL.includes('TU-PROYECTO')) {
      const e = new Error('CONFIG'); e.code = 'CONFIG'; throw e;
    }
    sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'electroservices-auth' }
    });
  }

  async function session() {
    if (demo) return { user: { id: 'demo', email: 'demo@electroservices' } };
    const { data } = await sb.auth.getSession();
    userId = data.session?.user?.id || null;
    return data.session;
  }

  function onAuth(cb) {
    if (demo) return;
    sb.auth.onAuthStateChange((_ev, s) => { userId = s?.user?.id || null; cb(s); });
  }

  async function signIn(email, password) {
    if (demo) return;
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    userId = data.user.id;
    return data.session;
  }

  async function signOut() { if (!demo) await sb.auth.signOut(); }

  async function loadTable(t) {
    const out = [];
    const page = 1000;
    for (let from = 0; ; from += page) {
      const { data, error } = await sb.from(t).select('*').range(from, from + page - 1);
      if (error) throw error;
      out.push(...data);
      if (data.length < page) break;
    }
    return out;
  }

  async function loadAll() {
    if (demo) return JSON.parse(JSON.stringify(dData()));
    const res = await Promise.all(TABLES.map(loadTable));
    return Object.fromEntries(TABLES.map((t, i) => [t, res[i]]));
  }

  async function insert(t, row) {
    if (demo) {
      const d = dData();
      const r = { id: uuid(), created_at: new Date().toISOString(), ...row };
      d[t].push(r); dSave(d); return r;
    }
    const { data, error } = await sb.from(t).insert(row).select().single();
    if (error) throw error;
    return data;
  }

  async function update(t, id, patch) {
    if (demo) {
      const d = dData(); const r = d[t].find(x => x.id === id);
      if (r) Object.assign(r, patch); dSave(d); return r;
    }
    const { data, error } = await sb.from(t).update(patch).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  async function remove(t, id) {
    if (demo) {
      const d = dData();
      d[t] = d[t].filter(x => x.id !== id);
      // imitar las reglas de la base de datos
      const nullify = (tab, col) => d[tab].forEach(r => { if (r[col] === id) r[col] = null; });
      const drop = (tab, col) => { d[tab] = d[tab].filter(r => r[col] !== id); };
      if (t === 'transacciones') drop('abonos', 'transaccion_id');
      if (t === 'trabajadores') { drop('asistencias', 'trabajador_id'); drop('pagos_trabajador', 'trabajador_id'); }
      if (t === 'clientes') { nullify('proyectos', 'cliente_id'); nullify('transacciones', 'cliente_id'); }
      if (t === 'proveedores') nullify('transacciones', 'proveedor_id');
      if (t === 'proyectos') { nullify('transacciones', 'proyecto_id'); nullify('asistencias', 'proyecto_id'); }
      dSave(d); return;
    }
    const { error } = await sb.from(t).delete().eq('id', id);
    if (error) throw error;
  }

  async function setAjuste(clave, valor) {
    if (demo) {
      const d = dData(); const r = d.ajustes.find(a => a.clave === clave);
      if (r) r.valor = valor; else d.ajustes.push({ clave, valor });
      dSave(d); return;
    }
    const { error } = await sb.from('ajustes').upsert({ user_id: userId, clave, valor }, { onConflict: 'user_id,clave' });
    if (error) throw error;
  }

  function resetDemo() { localStorage.removeItem(LS); }

  // ------------------------------------------------------------ PDFs de propuestas
  // Bucket público "propuestas": cada archivo con nombre aleatorio dentro de la carpeta del usuario.
  // Solo el dueño puede subir o borrar; el cliente lo abre con el link (como un Google Doc compartido).
  const BUCKET = 'propuestas';
  async function uploadPropuesta(proyectoId, file) {
    if (demo) return { path: 'demo/' + uuid() + '.pdf', url: URL.createObjectURL(file) };
    const path = `${userId}/${proyectoId}/${uuid()}.pdf`;
    const { error } = await sb.storage.from(BUCKET).upload(path, file, { contentType: 'application/pdf', upsert: false });
    if (error) throw error;
    const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
    return { path, url: data.publicUrl };
  }
  async function removeArchivo(path) {
    if (demo || !path) return;
    const { error } = await sb.storage.from(BUCKET).remove([path]);
    if (error) console.warn('No se pudo borrar el PDF anterior', error);
  }

  return { demo, init, session, onAuth, signIn, signOut, loadAll, insert, update, remove, setAjuste, resetDemo, uploadPropuesta, removeArchivo };
})();
