-- 005: inventario, auditoría y settings

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  type text not null check (type in ('IN', 'SALE', 'RETURN', 'ADJUST', 'RESERVATION', 'RELEASE')),
  quantity int not null check (quantity <> 0),
  reason text,
  created_by uuid,
  created_at timestamptz not null default now()
);

create index inventory_movements_product_id_idx on public.inventory_movements(product_id, created_at desc);
create index inventory_movements_order_id_idx on public.inventory_movements(order_id);

create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index admin_audit_logs_created_at_idx on public.admin_audit_logs(created_at desc);

create table public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create trigger trg_settings_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();
