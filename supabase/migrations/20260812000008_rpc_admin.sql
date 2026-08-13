-- 008: RPC administrativas + revoke de execute (solo service_role)

-- ============================================================
-- adjust_stock: ingreso/ajuste/devolución de stock con
-- trazabilidad (inventory_movements) y auditoría.
-- ============================================================
create or replace function public.adjust_stock(
  p_product_id uuid,
  p_quantity int,
  p_type text,
  p_reason text default null,
  p_admin_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stock int;
begin
  if p_type not in ('IN', 'RETURN', 'ADJUST') then
    raise exception 'Tipo de movimiento inválido';
  end if;
  if p_quantity = 0 then
    raise exception 'La cantidad no puede ser cero';
  end if;

  update public.products
  set stock = stock + p_quantity
  where id = p_product_id
  returning stock into v_stock;

  if not found then
    raise exception 'Producto inexistente';
  end if;

  insert into public.inventory_movements (product_id, type, quantity, reason, created_by)
  values (p_product_id, p_type, p_quantity, p_reason, p_admin_id);

  insert into public.admin_audit_logs (admin_id, action, entity, entity_id, metadata)
  values (
    p_admin_id,
    'INVENTORY_' || p_type,
    'products',
    p_product_id::text,
    jsonb_build_object('quantity', p_quantity, 'reason', p_reason, 'stock_after', v_stock)
  );

  return jsonb_build_object('product_id', p_product_id, 'stock', v_stock);
end;
$$;

-- ============================================================
-- update_order_status: transición validada por trigger + auditoría
-- ============================================================
create or replace function public.update_order_status(
  p_order_id uuid,
  p_status text,
  p_admin_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_number text;
begin
  if p_status not in ('PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED') then
    raise exception 'Transición no permitida por esta vía';
  end if;

  select number into v_number from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Orden inexistente';
  end if;

  update public.orders
  set order_status = p_status
  where id = p_order_id;

  insert into public.admin_audit_logs (admin_id, action, entity, entity_id, metadata)
  values (
    p_admin_id,
    'ORDER_STATUS_CHANGE',
    'orders',
    p_order_id::text,
    jsonb_build_object('order_number', v_number, 'order_status', p_status)
  );

  return jsonb_build_object('order_id', p_order_id, 'order_status', p_status);
end;
$$;

-- ============================================================
-- set_user_role: cambio de rol (impide escalada desde cliente
-- via prevent_role_escalation; acá solo service_role llega).
-- ============================================================
create or replace function public.set_user_role(
  p_user_id uuid,
  p_role text,
  p_admin_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_role not in ('customer', 'admin') then
    raise exception 'Rol inválido';
  end if;

  update public.profiles
  set role = p_role
  where id = p_user_id;

  if not found then
    raise exception 'Usuario inexistente';
  end if;

  insert into public.admin_audit_logs (admin_id, action, entity, entity_id, metadata)
  values (p_admin_id, 'ROLE_CHANGE', 'profiles', p_user_id::text, jsonb_build_object('role', p_role));

  return jsonb_build_object('user_id', p_user_id, 'role', p_role);
end;
$$;

-- ============================================================
-- save_product: upsert de producto + variantes + imágenes,
-- atómico con su log de auditoría.
-- ============================================================
create or replace function public.save_product(
  p_product jsonb,
  p_admin_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product_id uuid;
  v_slug text;
  v_name text;
  v_new boolean;
begin
  v_slug := p_product ->> 'slug';
  v_name := p_product ->> 'name';
  if v_slug is null or v_name is null then
    raise exception 'slug y name son requeridos';
  end if;

  if (p_product ->> 'id') is null or (p_product ->> 'id') = '' then
    insert into public.products (
      code, slug, name, category_id, price, compare_at, badge, description,
      features, materials, dimensions, care, sku, stock, min_stock, sold, status
    )
    values (
      p_product ->> 'code',
      v_slug,
      v_name,
      (p_product ->> 'category_id')::uuid,
      (p_product ->> 'price')::int,
      nullif(p_product ->> 'compare_at', '')::int,
      p_product ->> 'badge',
      p_product ->> 'description',
      coalesce(p_product -> 'features', '[]'::jsonb),
      p_product ->> 'materials',
      p_product ->> 'dimensions',
      p_product ->> 'care',
      p_product ->> 'sku',
      coalesce((p_product ->> 'stock')::int, 0),
      coalesce((p_product ->> 'min_stock')::int, 0),
      coalesce((p_product ->> 'sold')::int, 0),
      coalesce(p_product ->> 'status', 'Activo')
    )
    returning id into v_product_id;
    v_new := true;
  else
    v_product_id := (p_product ->> 'id')::uuid;
    update public.products set
      code = p_product ->> 'code',
      slug = v_slug,
      name = v_name,
      category_id = (p_product ->> 'category_id')::uuid,
      price = (p_product ->> 'price')::int,
      compare_at = nullif(p_product ->> 'compare_at', '')::int,
      badge = p_product ->> 'badge',
      description = p_product ->> 'description',
      features = coalesce(p_product -> 'features', '[]'::jsonb),
      materials = p_product ->> 'materials',
      dimensions = p_product ->> 'dimensions',
      care = p_product ->> 'care',
      sku = p_product ->> 'sku',
      min_stock = coalesce((p_product ->> 'min_stock')::int, 0),
      status = coalesce(p_product ->> 'status', 'Activo')
    where id = v_product_id;
    if not found then
      raise exception 'Producto inexistente';
    end if;
    v_new := false;
  end if;

  if p_product ? 'colors' then
    delete from public.product_colors where product_id = v_product_id;
    insert into public.product_colors (product_id, name, hex)
    select v_product_id, c ->> 'name', c ->> 'hex'
    from jsonb_array_elements(p_product -> 'colors') c;
  end if;

  if p_product ? 'sizes' then
    delete from public.product_sizes where product_id = v_product_id;
    insert into public.product_sizes (product_id, name)
    select v_product_id, s ->> 'name'
    from jsonb_array_elements(p_product -> 'sizes') s;
  end if;

  if p_product ? 'images' then
    delete from public.product_images where product_id = v_product_id;
    insert into public.product_images (product_id, url, alt, position)
    select v_product_id, i ->> 'url', i ->> 'alt', coalesce((i ->> 'position')::int, 0)
    from jsonb_array_elements(p_product -> 'images') i;
  end if;

  insert into public.admin_audit_logs (admin_id, action, entity, entity_id, metadata)
  values (
    p_admin_id,
    case when v_new then 'PRODUCT_CREATE' else 'PRODUCT_UPDATE' end,
    'products',
    v_product_id::text,
    jsonb_build_object('slug', v_slug, 'name', v_name)
  );

  return jsonb_build_object('id', v_product_id, 'new', v_new);
end;
$$;

-- ============================================================
-- delete_product: baja de producto con auditoría
-- ============================================================
create or replace function public.delete_product(
  p_product_id uuid,
  p_admin_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  select name into v_name from public.products where id = p_product_id;
  if not found then
    raise exception 'Producto inexistente';
  end if;

  delete from public.products where id = p_product_id;

  insert into public.admin_audit_logs (admin_id, action, entity, entity_id, metadata)
  values (p_admin_id, 'PRODUCT_DELETE', 'products', p_product_id::text, jsonb_build_object('name', v_name));

  return jsonb_build_object('id', p_product_id, 'deleted', true);
end;
$$;

-- ============================================================
-- save_promo / delete_promo: CRUD de promociones con auditoría
-- ============================================================
create or replace function public.save_promo(
  p_promo jsonb,
  p_admin_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_new boolean;
begin
  v_code := upper(trim(p_promo ->> 'code'));
  if v_code is null or v_code = '' then
    raise exception 'El código es requerido';
  end if;
  if (p_promo ->> 'type') not in ('PERCENTAGE', 'FIXED', 'FREE_SHIPPING') then
    raise exception 'Tipo de promoción inválido';
  end if;

  if (p_promo ->> 'id') is null or (p_promo ->> 'id') = '' then
    insert into public.promos (
      code, type, value, minimum_amount, max_discount,
      starts_at, expires_at, usage_limit, uses, active
    )
    values (
      v_code,
      p_promo ->> 'type',
      (p_promo ->> 'value')::int,
      coalesce((p_promo ->> 'minimum_amount')::int, 0),
      nullif(p_promo ->> 'max_discount', '')::int,
      nullif(p_promo ->> 'starts_at', '')::timestamptz,
      nullif(p_promo ->> 'expires_at', '')::timestamptz,
      nullif(p_promo ->> 'usage_limit', '')::int,
      coalesce((p_promo ->> 'uses')::int, 0),
      coalesce((p_promo ->> 'active')::boolean, true)
    );
    v_new := true;
  else
    update public.promos set
      code = v_code,
      type = p_promo ->> 'type',
      value = (p_promo ->> 'value')::int,
      minimum_amount = coalesce((p_promo ->> 'minimum_amount')::int, 0),
      max_discount = nullif(p_promo ->> 'max_discount', '')::int,
      starts_at = nullif(p_promo ->> 'starts_at', '')::timestamptz,
      expires_at = nullif(p_promo ->> 'expires_at', '')::timestamptz,
      usage_limit = nullif(p_promo ->> 'usage_limit', '')::int,
      active = coalesce((p_promo ->> 'active')::boolean, true)
    where code = v_code;
    if not found then
      raise exception 'Promoción inexistente';
    end if;
    v_new := false;
  end if;

  insert into public.admin_audit_logs (admin_id, action, entity, entity_id, metadata)
  values (
    p_admin_id,
    case when v_new then 'PROMO_CREATE' else 'PROMO_UPDATE' end,
    'promos',
    v_code,
    jsonb_build_object('code', v_code, 'type', p_promo ->> 'type')
  );

  return jsonb_build_object('code', v_code, 'new', v_new);
end;
$$;

create or replace function public.delete_promo(
  p_code text,
  p_admin_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.promos where code = upper(trim(p_code));
  if not found then
    raise exception 'Promoción inexistente';
  end if;

  insert into public.admin_audit_logs (admin_id, action, entity, entity_id, metadata)
  values (p_admin_id, 'PROMO_DELETE', 'promos', upper(trim(p_code)), jsonb_build_object('code', upper(trim(p_code))));

  return jsonb_build_object('code', upper(trim(p_code)), 'deleted', true);
end;
$$;

-- ============================================================
-- save_settings: configuración con auditoría
-- ============================================================
create or replace function public.save_settings(
  p_key text,
  p_value jsonb,
  p_admin_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.settings (key, value)
  values (p_key, p_value)
  on conflict (key) do update set value = excluded.value;

  insert into public.admin_audit_logs (admin_id, action, entity, entity_id, metadata)
  values (p_admin_id, 'SETTINGS_UPDATE', 'settings', p_key, jsonb_build_object('value', p_value));

  return jsonb_build_object('key', p_key, 'value', p_value);
end;
$$;

-- ============================================================
-- Seguridad: las RPC solo se ejecutan con service_role.
-- is_admin() queda ejecutable por todos (la usan las políticas RLS).
-- ============================================================
revoke execute on function public.create_order_with_reservation(jsonb, jsonb, jsonb, text, uuid, text) from public, anon, authenticated;
grant execute on function public.create_order_with_reservation(jsonb, jsonb, jsonb, text, uuid, text) to service_role;

revoke execute on function public.confirm_payment(uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.confirm_payment(uuid, text, uuid) to service_role;

revoke execute on function public.release_reservation(uuid, text, text) from public, anon, authenticated;
grant execute on function public.release_reservation(uuid, text, text) to service_role;

revoke execute on function public.release_expired_reservations() from public, anon, authenticated;
grant execute on function public.release_expired_reservations() to service_role;

revoke execute on function public.adjust_stock(uuid, int, text, text, uuid) from public, anon, authenticated;
grant execute on function public.adjust_stock(uuid, int, text, text, uuid) to service_role;

revoke execute on function public.update_order_status(uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.update_order_status(uuid, text, uuid) to service_role;

revoke execute on function public.set_user_role(uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.set_user_role(uuid, text, uuid) to service_role;

revoke execute on function public.save_product(jsonb, uuid) from public, anon, authenticated;
grant execute on function public.save_product(jsonb, uuid) to service_role;

revoke execute on function public.delete_product(uuid, uuid) from public, anon, authenticated;
grant execute on function public.delete_product(uuid, uuid) to service_role;

revoke execute on function public.save_promo(jsonb, uuid) from public, anon, authenticated;
grant execute on function public.save_promo(jsonb, uuid) to service_role;

revoke execute on function public.delete_promo(text, uuid) from public, anon, authenticated;
grant execute on function public.delete_promo(text, uuid) to service_role;

revoke execute on function public.save_settings(text, jsonb, uuid) from public, anon, authenticated;
grant execute on function public.save_settings(text, jsonb, uuid) to service_role;
