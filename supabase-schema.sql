-- Ejecuta este SQL en Supabase: SQL Editor → New query → pegar y Run

-- Proyectos
create table if not exists proyectos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  activo boolean not null default true,
  presupuesto numeric not null default 0,
  cerrado_en text,
  gasto_real numeric,
  horas int,
  closed_at timestamptz,
  trabajadores_snap jsonb
);

-- Empleados
create table if not exists empleados (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  activo boolean not null default true,
  tarifa numeric not null default 0
);

-- Registros del día (un registro por empleado por fecha)
create table if not exists registros (
  id uuid primary key default gen_random_uuid(),
  eid uuid not null references empleados(id) on delete cascade,
  llenador_id uuid not null references empleados(id) on delete cascade,
  fecha date not null default current_date,
  items jsonb not null default '[]',
  unique(eid, fecha)
);

-- Papelera (proyectos eliminados, se pueden restaurar en 30 días)
create table if not exists papelera (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null unique,
  snapshot jsonb not null,
  deleted_at timestamptz not null default now()
);

-- Permitir que el cliente anónimo lea y escriba (ajusta RLS después si quieres auth)
alter table proyectos enable row level security;
alter table empleados enable row level security;
alter table registros enable row level security;
alter table papelera enable row level security;

create policy "Allow all for proyectos" on proyectos for all using (true) with check (true);
create policy "Allow all for empleados" on empleados for all using (true) with check (true);
create policy "Allow all for registros" on registros for all using (true) with check (true);
create policy "Allow all for papelera" on papelera for all using (true) with check (true);

-- Si la tabla proyectos ya existía, agregar columnas para closed_at y trabajadores_snap
alter table proyectos add column if not exists closed_at timestamptz;
alter table proyectos add column if not exists trabajadores_snap jsonb;
