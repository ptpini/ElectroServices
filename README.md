# ElectroServices — app de finanzas

App web instalable (PWA) para iPhone. Datos en Supabase. Sin App Store.

**Módulos:** panel principal (dinero disponible, por cobrar/pagar, trabajos, cotizaciones, próximas actividades) · ventas y gastos con abonos · deudas por cobrar y por pagar con recordatorio por WhatsApp/SMS · negocios/CRM (cotizado → aceptado → activo → terminado → cerrado, probabilidad, próxima acción) · clientes con trabajos, vendido, cobrado y saldo · personal (asistencia diaria por trabajo, costo de mano de obra, pagos y deuda con cada trabajador) · movimientos de caja por mes · exportar respaldo a Excel (.csv).

Probar sin base de datos: abrir `index.html?demo=1` (datos de prueba que quedan solo en ese equipo).

---

## 1. Supabase (una sola vez)

1. **Borrar la secret key** que se compartió por chat: *Project Settings → API Keys → Secret keys → eliminar / rotar.* La app solo usa la *publishable key*.
2. **Crear las tablas:** *SQL Editor → New query* → pegar todo `supabase/schema.sql` → **Run**. Debe decir *Success*.
3. **Crear el usuario de Arturo:** *Authentication → Users → Add user → Create new user* → su correo y una contraseña → marcar **Auto Confirm User**.
4. **Cerrar registros nuevos:** *Authentication → Sign In / Providers →* desactivar **Allow new users to sign up**. Así nadie más puede crear cuenta.
5. Copiar la **Project URL** (*Project Settings → Data API*, algo como `https://abcd.supabase.co`) y pegarla en `js/config.js` → `SUPABASE_URL`.

## 2. Publicar en GitHub Pages (gratis)

**Opción A — VS Code / terminal**
```bash
cd electroservices
git init && git add . && git commit -m "ElectroServices v1"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/electroservices.git
git push -u origin main
```
**Opción B — sin terminal:** crear el repo en github.com → *Add file → Upload files* → arrastrar **el contenido** de la carpeta (no la carpeta) → *Commit*.

Luego: repo → *Settings → Pages → Source: Deploy from a branch → main / (root) → Save*. En 1–2 minutos queda en
`https://TU-USUARIO.github.io/electroservices/`

> El repo puede ser público: no contiene datos ni claves secretas (la publishable key es pública por diseño y la seguridad la ponen las reglas RLS del schema). Si lo prefieres privado, GitHub Pages en repos privados requiere plan pago; alternativa gratis: Netlify o Cloudflare Pages arrastrando la carpeta.

## 3. Instalar en el iPhone de Arturo

1. Abrir el link en **Safari** (tiene que ser Safari).
2. Botón **Compartir** (cuadrado con flecha) → **Agregar a pantalla de inicio** → *Agregar*.
3. Abrir desde el ícono amarillo y entrar con su correo y contraseña. La sesión queda guardada.

## 4. Actualizar la app más adelante

Editar, hacer `git push`, y en `sw.js` cambiar `VERSION` (ej. `es-1.0.1`). Al abrirla con internet se actualiza sola (a veces requiere cerrarla y abrirla una vez).

## Cómo funciona el dinero

- **Dinero disponible** = saldo inicial (Ajustes) + todo lo cobrado − todo lo pagado (gastos y trabajadores).
- Una venta o gasto puede quedar *pagado*, *con abono* o *como deuda*; cada pago se registra como **abono**. Un abono a un cliente con varias deudas se descuenta primero de la más antigua.
- **Mano de obra:** cada día registrado suma `valor por día × jornada` a lo que se le debe al trabajador y al costo del trabajo; los pagos lo descuentan.
- **Utilidad del trabajo** = vendido (o cotizado si aún no hay venta) − gastos del trabajo − mano de obra.

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
