-- =====================================================================
-- ElectroServices - Base de datos
-- Pegar completo en Supabase > SQL Editor > New query > Run
-- Se puede ejecutar más de una vez sin romper nada.
-- =====================================================================

-- ---------- CLIENTES ----------
create table if not exists public.clientes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nombre      text not null,
  telefono    text,
  email       text,
  direccion   text,
  notas       text,
  created_at  timestamptz not null default now()
);

-- ---------- PROVEEDORES (a quién se le debe) ----------
create table if not exists public.proveedores (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nombre      text not null,
  telefono    text,
  notas       text,
  created_at  timestamptz not null default now()
);

-- ---------- NEGOCIOS / PROYECTOS (cotización -> trabajo) ----------
create table if not exists public.proyectos (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null default auth.uid() references auth.users(id) on delete cascade,
  cliente_id         uuid references public.clientes(id) on delete set null,
  nombre             text not null,
  descripcion        text,
  monto_cotizado     numeric(14,0) not null default 0,
  estado             text not null default 'cotizado'
                     check (estado in ('cotizado','aceptado','activo','terminado','cerrado','perdido')),
  probabilidad       text not null default 'media'
                     check (probabilidad in ('alta','media','baja')),
  fecha_cotizacion   date not null default current_date,
  proxima_accion     text,
  fecha_seguimiento  date,
  created_at         timestamptz not null default now()
);

-- v1.4: link al documento de propuesta de cada cotización
alter table public.proyectos add column if not exists propuesta_url text;
-- v1.5: ruta del PDF subido a Storage (si la propuesta es un PDF subido desde la app)
alter table public.proyectos add column if not exists propuesta_path text;

-- ---------- TRABAJADORES ----------
create table if not exists public.trabajadores (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nombre      text not null,
  telefono    text,
  valor_dia   numeric(14,0) not null default 0,
  activo      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------- VENTAS Y GASTOS ----------
-- Una venta o gasto puede quedar pagado o como deuda.
-- Todo lo que entra o sale de caja se registra como ABONO.
create table if not exists public.transacciones (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tipo          text not null check (tipo in ('venta','gasto')),
  descripcion   text not null,
  monto         numeric(14,0) not null check (monto > 0),
  fecha         date not null default current_date,
  vencimiento   date,
  categoria     text,
  cliente_id    uuid references public.clientes(id) on delete set null,
  proveedor_id  uuid references public.proveedores(id) on delete set null,
  proyecto_id   uuid references public.proyectos(id) on delete set null,
  created_at    timestamptz not null default now()
);

-- v1.1: IVA en ventas (monto = total a cobrar; neto + iva cuando con_iva)
alter table public.transacciones add column if not exists con_iva boolean not null default false;
alter table public.transacciones add column if not exists neto numeric(14,0);
alter table public.transacciones add column if not exists iva numeric(14,0) not null default 0;

create table if not exists public.abonos (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  transaccion_id  uuid not null references public.transacciones(id) on delete cascade,
  monto           numeric(14,0) not null check (monto > 0),
  fecha           date not null default current_date,
  medio           text,
  nota            text,
  created_at      timestamptz not null default now()
);

-- ---------- PERSONAL: asistencia y pagos ----------
create table if not exists public.asistencias (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  trabajador_id  uuid not null references public.trabajadores(id) on delete cascade,
  proyecto_id    uuid references public.proyectos(id) on delete set null,
  fecha          date not null default current_date,
  jornada        numeric(3,1) not null default 1 check (jornada > 0),
  valor          numeric(14,0) not null default 0,
  nota           text,
  created_at     timestamptz not null default now()
);

-- v1.2: extra (horas extra / bono) por día. valor = valor del día + extra
alter table public.asistencias add column if not exists extra numeric(14,0) not null default 0;

create table if not exists public.pagos_trabajador (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  trabajador_id  uuid not null references public.trabajadores(id) on delete cascade,
  monto          numeric(14,0) not null check (monto > 0),
  fecha          date not null default current_date,
  nota           text,
  created_at     timestamptz not null default now()
);

-- ---------- AJUSTES (saldo inicial de caja, etc.) ----------
create table if not exists public.ajustes (
  user_id  uuid not null default auth.uid() references auth.users(id) on delete cascade,
  clave    text not null,
  valor    text,
  primary key (user_id, clave)
);

-- ---------- ÍNDICES ----------
create index if not exists idx_trx_user      on public.transacciones(user_id);
create index if not exists idx_abonos_trx    on public.abonos(transaccion_id);
create index if not exists idx_asist_trab    on public.asistencias(trabajador_id);
create index if not exists idx_proy_cliente  on public.proyectos(cliente_id);

-- ---------- SEGURIDAD: cada usuario ve solo sus datos ----------
do $$
declare t text;
begin
  foreach t in array array['clientes','proveedores','proyectos','trabajadores',
                           'transacciones','abonos','asistencias','pagos_trabajador','ajustes']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "solo_dueno" on public.%I', t);
    execute format(
      'create policy "solo_dueno" on public.%I for all to authenticated
         using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

-- ---------- STORAGE: PDFs de propuestas (v1.5) ----------
-- Bucket público con nombres aleatorios: el cliente abre el PDF con el link (igual que un Google Doc compartido).
-- Nadie puede listar los archivos; solo el dueño sube o borra dentro de su carpeta (<user_id>/...).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('propuestas', 'propuestas', true, 20971520, array['application/pdf'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "propuestas_subir_propias" on storage.objects;
drop policy if exists "propuestas_ver_propias" on storage.objects;
drop policy if exists "propuestas_borrar_propias" on storage.objects;
create policy "propuestas_subir_propias" on storage.objects for insert to authenticated
  with check (bucket_id = 'propuestas' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "propuestas_ver_propias" on storage.objects for select to authenticated
  using (bucket_id = 'propuestas' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "propuestas_borrar_propias" on storage.objects for delete to authenticated
  using (bucket_id = 'propuestas' and (storage.foldername(name))[1] = auth.uid()::text);
