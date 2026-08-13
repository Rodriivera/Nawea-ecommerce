-- 011: ajuste de create_order_with_reservation
-- PostgREST serializa mal los arrays de objetos en parámetros jsonb
-- (bug conocido: "invalid input syntax for type json").
-- El contrato pasa a ser: p_items = { "lines": [ { product_id, color, size, qty } ] }

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
  v_lines jsonb := p_items -> 'lines';
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
  if jsonb_typeof(v_lines) <> 'array' or jsonb_array_length(v_lines) = 0 then
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

  for v_item in select * from jsonb_array_elements(v_lines)
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
