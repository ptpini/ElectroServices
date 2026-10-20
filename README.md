# ElectroServices — app de finanzas

App web instalable (PWA) para iPhone. Datos en Supabase. Sin App Store.

**Módulos:** panel principal (dinero disponible, por cobrar/pagar, trabajos, cotizaciones, próximas actividades) · ventas y gastos con abonos · deudas por cobrar y por pagar con recordatorio por WhatsApp/SMS · negocios/CRM (cotizado → aceptado → activo → terminado → cerrado, probabilidad, próxima acción) · clientes con trabajos, vendido, cobrado y saldo · personal (asistencia diaria por trabajo, costo de mano de obra, pagos y deuda con cada trabajador) · movimientos de caja por mes · exportar respaldo a Excel (.csv).

Probar sin base de datos: abrir `index.html?demo=1` (datos de prueba que quedan solo en ese equipo).

---


## Archivos

```
index.html            entrada
css/styles.css        diseño
js/config.js          URL y publishable key de Supabase  ← editar
js/db.js              conexión a datos (Supabase o demo)
js/app.js             pantallas y lógica
js/vendor/supabase.js librería de Supabase (local, no depende de CDN)
sw.js, manifest       instalación como app
supabase/schema.sql   base de datos
```
