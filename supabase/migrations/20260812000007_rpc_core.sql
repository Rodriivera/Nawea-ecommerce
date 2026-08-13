-- 007: RPC del núcleo — checkout atómico, confirmación idempotente, liberación

-- ============================================================
-- create_order_with_reservation: valida stock, congela precios,
-- valida cupón, crea orden + items, reserva stock. TODO en una
-- transacción. Lock de productos en bloque y ordenado (sin
-- deadlocks). reservation_expires_at SIEMPRE la fija el servidor
-- (NOW() + TTL). Punto 9: el frontend nunca decide precios ni
-- descuentos: todo se calcula acá con datos de la DB.
-- ============================================================
create or replace function public.create_order_with_reservation(
  p_items jsonb,
  p_contact jsonb,
  p_shipping jsonb,
  p_promo text default null,
  p_customer_id uuid default null,
  p_payment_method text default 'MERCADO_PAGO'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_number text;
  v_subtotal int := 0;
  v_promo_discount int := 0;
  v_shipping_cost int := 0;
  v_total int;
  v_email text;
  v_name text;
  v_phone text;
  v_shipping_method text;
  v_address jsonb;
  v_item jsonb;
  v_product_id uuid;
  v_qty int;
  v_color text;
  v_size text;
  v_price int;
  v_available int;
  v_promo public.promos%rowtype;
  v_settings jsonb;
  v_expires timestamptz;
  v_existing uuid;
  v_ttl_minutes int;
  v_product_name text;
  v_product_ids uuid[];
begin
  if p_payment_method not in ('MERCADO_PAGO', 'TRANSFER') then
    raise exception 'Método de pago inválido';
  end if;

  v_email := lower(trim(p_contact ->> 'email'));
  v_name := p_contact ->> 'name';
  v_phone := p_contact ->> 'phone';
  v_shipping_method := p_shipping ->> 'method';
  v_address := p_shipping -> 'address';

  if v_email is null or v_email = '' then
    raise exception 'El email es obligatorio';
  end if;
  if v_shipping_method is null or v_shipping_method not in ('estandar', 'express', 'retiro') then
    raise exception 'Método de envío inválido';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido debe contener al menos un ítem';
  end if;

  -- una sola reserva activa por email: impide encadenar reservas para acaparar stock
  select o.id into v_existing
  from public.orders o
  where o.email = v_email
    and o.order_status = 'PENDING'
    and o.payment_status = 'PENDING'
    and o.reservation_expires_at > now()
  limit 1;
  if v_existing is not null then
    raise exception 'Ya existe una reserva activa para este email';
  end if;

  v_settings := coalesce(
    (select value from public.settings where key = 'shipping'),
    '{"estandar": 7900, "express": 12900, "retiro": 0, "free_threshold": 120000}'::jsonb
  );

  -- líneas del pedido (solo ids/atributos del cliente, sin precios)
  create temp table t_order_lines (
    product_id uuid not null,
    color text,
    size text,
    qty int not null,
    unit_price int,
    name text
  ) on commit drop;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item ->> 'product_id')::uuid;
    v_qty := (v_item ->> 'qty')::int;
    v_color := v_item ->> 'color';
    v_size := v_item ->> 'size';

    if v_product_id is null or v_qty is null or v_qty <= 0 then
      raise exception 'Ítem inválido';
    end if;

    insert into t_order_lines (product_id, color, size, qty)
    values (v_product_id, v_color, v_size, v_qty);
  end loop;

  select array_agg(distinct product_id) into v_product_ids from t_order_lines;

  -- LOCK en bloque, ordenado por id: serializa concurrentes sin deadlocks.
  -- Los FOR UPDATE posteriores son re-locks de filas ya tomadas.
  perform p.id
  from public.products p
  where p.id = any(v_product_ids)
  order by p.id
  for update;

  -- validación de stock + precio congelado desde la DB
  for v_item in select * from t_order_lines
  loop
    select p.price, p.stock - p.reserved, p.name
      into v_price, v_available, v_product_name
    from public.products p
    where p.id = v_item.product_id;

    if not found then
      raise exception 'Producto inexistente: %', v_item.product_id;
    end if;
    if v_available < v_item.qty then
      raise exception 'Stock insuficiente para %', v_product_name;
    end if;

    if v_item.color is not null and not exists (
      select 1 from public.product_colors c
      where c.product_id = v_item.product_id and c.name = v_item.color
    ) then
      raise exception 'Color inválido para %', v_product_name;
    end if;
    if v_item.size is not null and not exists (
      select 1 from public.product_sizes s
      where s.product_id = v_item.product_id and s.name = v_item.size
    ) then
      raise exception 'Talle inválido para %', v_product_name;
    end if;

    update t_order_lines
    set unit_price = v_price, name = v_product_name
    where product_id = v_item.product_id;

    v_subtotal := v_subtotal + (v_price * v_item.qty);
  end loop;

  -- cupón: validación completa dentro de la transacción (después del subtotal)
  if p_promo is not null and trim(p_promo) <> '' then
    select * into v_promo
    from public.promos
    where code = upper(trim(p_promo))
      and active
      and (starts_at is null or starts_at <= now())
      and (expires_at is null or expires_at >= now())
    for update;

    if not found then
      raise exception 'Cupón inválido o vencido';
    end if;
    if v_promo.usage_limit is not null and v_promo.uses >= v_promo.usage_limit then
      raise exception 'Cupón agotado';
    end if;
    if v_promo.minimum_amount > 0 and v_subtotal < v_promo.minimum_amount then
      raise exception 'El cupón exige un mínimo de compra';
    end if;
  end if;

  -- envío
  v_shipping_cost := (v_settings ->> v_shipping_method)::int;
  if v_shipping_method = 'estandar'
     and (v_settings ->> 'free_threshold')::int > 0
     and v_subtotal >= (v_settings ->> 'free_threshold')::int then
    v_shipping_cost := 0;
  end if;

  -- descuento final
  if v_promo.id is not null then
    if v_promo.type = 'PERCENTAGE' then
      v_promo_discount := round(v_subtotal * v_promo.value / 100.0);
      if v_promo.max_discount is not null and v_promo_discount > v_promo.max_discount then
        v_promo_discount := v_promo.max_discount;
      end if;
    elsif v_promo.type = 'FIXED' then
      v_promo_discount := least(v_promo.value, v_subtotal);
    elsif v_promo.type = 'FREE_SHIPPING' then
      v_promo_discount := v_shipping_cost;
    end if;
  end if;

  v_total := greatest(v_subtotal - v_promo_discount + v_shipping_cost, 0);

  -- TTL de reserva desde settings (default 20 min), siempre server-side
  v_ttl_minutes := coalesce(
    (select (value ->> 'reservation_ttl_minutes')::int from public.settings where key = 'reservation_ttl'),
    20
  );
  v_expires := now() + make_interval(mins => v_ttl_minutes);

  v_number := 'NW-' || nextval('public.order_number_seq');

  insert into public.orders (
    number, customer_id, email, name, phone, shipping_address,
    shipping_method, shipping_cost, subtotal, discount, total,
    promo_code, promo_discount, payment_method, order_status, payment_status,
    reservation_expires_at
  )
  values (
    v_number, p_customer_id, v_email, v_name, v_phone, v_address,
    v_shipping_method, v_shipping_cost, v_subtotal, v_promo_discount, v_total,
    case when v_promo.id is not null then v_promo.code else null end,
    v_promo_discount, p_payment_method, 'PENDING', 'PENDING',
    v_expires
  )
  returning id into v_order_id;

  for v_item in select * from t_order_lines
  loop
    insert into public.order_items (order_id, product_id, name, color, size, qty, unit_price, subtotal)
    values (
      v_order_id, v_item.product_id, v_item.name, v_item.color, v_item.size,
      v_item.qty, v_item.unit_price, v_item.unit_price * v_item.qty
    );

    update public.products
    set reserved = reserved + v_item.qty
    where id = v_item.product_id;

    insert into public.inventory_movements (product_id, order_id, type, quantity, reason)
    values (v_item.product_id, v_order_id, 'RESERVATION', v_item.qty, 'Reserva de stock al crear la orden ' || v_number);
  end loop;

  return jsonb_build_object(
    'order_id', v_order_id,
    'number', v_number,
    'subtotal', v_subtotal,
    'discount', v_promo_discount,
    'shipping_cost', v_shipping_cost,
    'total', v_total,
    'access_token', (select access_token from public.orders where id = v_order_id),
    'reservation_expires_at', v_expires
  );
end;
$$;

-- ============================================================
-- confirm_payment: idempotente por DB. Baja stock, libera
-- reserva, sube sold. Fuente de verdad = webhook MP o
-- confirmación manual de transferencia (p_confirmed_by).
-- ============================================================
create or replace function public.confirm_payment(
  p_order_id uuid,
  p_payment_id text default null,
  p_confirmed_by uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_item record;
begin
  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Orden inexistente';
  end if;

  -- idempotencia: un pago ya aprobado no se vuelve a procesar
  if v_order.payment_status = 'APPROVED' then
    return jsonb_build_object(
      'order_status', v_order.order_status,
      'payment_status', v_order.payment_status,
      'already_approved', true
    );
  end if;

  if v_order.order_status <> 'PENDING' then
    raise exception 'La orden ya no es confirmable (estado %)', v_order.order_status;
  end if;
  if v_order.reservation_expires_at is null or v_order.reservation_expires_at < now() then
    raise exception 'La reserva de la orden % ya expiró', v_order.number;
  end if;

  if v_order.payment_id is not null
     and p_payment_id is not null
     and v_order.payment_id <> p_payment_id then
    raise exception 'Conflicto de payment_id para la orden %', v_order.number;
  end if;

  for v_item in select * from public.order_items where order_id = p_order_id
  loop
    update public.products
    set stock = stock - v_item.qty,
        reserved = reserved - v_item.qty,
        sold = sold + v_item.qty
    where id = v_item.product_id
      and stock >= v_item.qty;

    if not found then
      raise exception 'Stock insuficiente al confirmar la orden %', v_order.number;
    end if;

    insert into public.inventory_movements (product_id, order_id, type, quantity, reason)
    values (v_item.product_id, p_order_id, 'SALE', v_item.qty, 'Venta confirmada ' || v_order.number);
  end loop;

  if v_order.promo_code is not null then
    update public.promos set uses = uses + 1 where code = v_order.promo_code;
  end if;

  update public.orders
  set payment_status = 'APPROVED',
      order_status = 'CONFIRMED',
      payment_id = coalesce(p_payment_id, payment_id),
      payment_confirmed_at = now(),
      payment_confirmed_by = p_confirmed_by
  where id = p_order_id;

  if p_confirmed_by is not null then
    insert into public.admin_audit_logs (admin_id, action, entity, entity_id, metadata)
    values (
      p_confirmed_by,
      'PAYMENT_CONFIRMED_MANUAL',
      'orders',
      p_order_id::text,
      jsonb_build_object('order_number', v_order.number, 'payment_method', v_order.payment_method, 'payment_status', 'APPROVED')
    );
  end if;

  return jsonb_build_object('order_status', 'CONFIRMED', 'payment_status', 'APPROVED', 'already_approved', false);
end;
$$;

-- ============================================================
-- release_reservation: libera stock reservado y cancela la
-- orden. Idempotente: si la orden ya no está PENDING, no-op.
-- ============================================================
create or replace function public.release_reservation(
  p_order_id uuid,
  p_reason text default 'Cancelación',
  p_payment_status text default 'PENDING'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_item record;
begin
  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Orden inexistente';
  end if;

  if v_order.payment_status = 'APPROVED' then
    return jsonb_build_object('status', 'noop', 'reason', 'payment already approved');
  end if;

  if v_order.order_status <> 'PENDING' then
    return jsonb_build_object('status', 'noop', 'reason', 'order not pending');
  end if;

  if p_payment_status not in ('PENDING', 'REJECTED') then
    raise exception 'payment_status inválido para la liberación';
  end if;

  for v_item in select * from public.order_items where order_id = p_order_id
  loop
    update public.products
    set reserved = greatest(reserved - v_item.qty, 0)
    where id = v_item.product_id;

    insert into public.inventory_movements (product_id, order_id, type, quantity, reason)
    values (v_item.product_id, p_order_id, 'RELEASE', v_item.qty, p_reason || ' — ' || v_order.number);
  end loop;

  update public.orders
  set order_status = 'CANCELLED',
      payment_status = p_payment_status
  where id = p_order_id;

  return jsonb_build_object('order_status', 'CANCELLED', 'payment_status', p_payment_status, 'status', 'released');
end;
$$;

-- ============================================================
-- release_expired_reservations: libera reservas vencidas.
-- Ejecutado por pg_cron cada 5 minutos.
-- ============================================================
create or replace function public.release_expired_reservations()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int := 0;
  v_order_id uuid;
begin
  for v_order_id in
    select id from public.orders
    where order_status = 'PENDING'
      and payment_status = 'PENDING'
      and reservation_expires_at < now()
  loop
    perform public.release_reservation(v_order_id, 'Reserva expirada', 'PENDING');
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;
