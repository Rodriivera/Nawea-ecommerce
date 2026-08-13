-- 006: RLS + is_admin + policies

-- helper anti-recursión para políticas de admin
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- catálogo: lectura pública (solo activos), admin acceso total
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_colors enable row level security;
alter table public.product_sizes enable row level security;
alter table public.product_images enable row level security;

create policy categories_public_read on public.categories for select using (true);
create policy categories_admin_all on public.categories for all using (public.is_admin());

create policy products_public_read on public.products for select using (status = 'Activo');
create policy products_admin_all on public.products for all using (public.is_admin());

create policy product_colors_public_read on public.product_colors for select using (true);
create policy product_colors_admin_all on public.product_colors for all using (public.is_admin());

create policy product_sizes_public_read on public.product_sizes for select using (true);
create policy product_sizes_admin_all on public.product_sizes for all using (public.is_admin());

create policy product_images_public_read on public.product_images for select using (true);
create policy product_images_admin_all on public.product_images for all using (public.is_admin());

-- profiles: cada usuario ve/edita su propio perfil; admin todo
alter table public.profiles enable row level security;

create policy profiles_select_own on public.profiles for select using (auth.uid() = id);
create policy profiles_update_own on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy profiles_admin_all on public.profiles for all using (public.is_admin());

-- orders/order_items: solo los propios; admin todo. Sin inserts/updates desde el cliente (solo RPC)
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy orders_select_own on public.orders for select using (customer_id = auth.uid());
create policy orders_admin_all on public.orders for all using (public.is_admin());

create policy order_items_select_own on public.order_items for select
  using (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id and o.customer_id = auth.uid()
  ));
create policy order_items_admin_all on public.order_items for all using (public.is_admin());

-- favorites: propios; admin todo
alter table public.favorites enable row level security;

create policy favorites_select_own on public.favorites for select using (customer_id = auth.uid());
create policy favorites_insert_own on public.favorites for insert with check (customer_id = auth.uid());
create policy favorites_delete_own on public.favorites for delete using (customer_id = auth.uid());
create policy favorites_admin_all on public.favorites for all using (public.is_admin());

-- promos/inventory/admin_audit/settings: SOLO admin (nunca expuestos a clientes)
alter table public.promos enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.settings enable row level security;

create policy promos_admin_all on public.promos for all using (public.is_admin());
create policy inventory_movements_admin_all on public.inventory_movements for all using (public.is_admin());
create policy admin_audit_logs_admin_all on public.admin_audit_logs for all using (public.is_admin());
create policy settings_admin_all on public.settings for all using (public.is_admin());
