-- 016: Control de nulos en release_reservation y update_order_status

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
    if v_item.product_id is not null then
      update public.products
      set reserved = greatest(reserved - v_item.qty, 0)
      where id = v_item.product_id;

      insert into public.inventory_movements (product_id, order_id, type, quantity, reason)
      values (v_item.product_id, p_order_id, 'RELEASE', v_item.qty, p_reason || ' — ' || v_order.number);
    end if;
  end loop;

  update public.orders
  set order_status = 'CANCELLED',
      payment_status = p_payment_status
  where id = p_order_id;

  return jsonb_build_object('order_status', 'CANCELLED', 'payment_status', p_payment_status, 'status', 'released');
end;
$$;

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
  v_order public.orders%rowtype;
  v_item record;
begin
  if p_status not in ('PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED') then
    raise exception 'Estado de pedido inválido: %', p_status;
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Orden inexistente';
  end if;

  -- Si el pedido cambia a CANCELLED y no estaba cancelado previamente
  if p_status = 'CANCELLED' and v_order.order_status <> 'CANCELLED' then
    if v_order.payment_status = 'APPROVED' or v_order.order_status in ('CONFIRMED', 'PREPARING', 'SHIPPED') then
      -- Devolver stock para productos ya vendidos
      for v_item in select * from public.order_items where order_id = p_order_id loop
        if v_item.product_id is not null then
          update public.products
          set stock = stock + v_item.qty,
              sold = greatest(sold - v_item.qty, 0)
          where id = v_item.product_id;

          insert into public.inventory_movements (product_id, order_id, type, quantity, reason, created_by)
          values (v_item.product_id, p_order_id, 'RETURN', v_item.qty, 'Cancelación por administrador ' || v_order.number, p_admin_id);
        end if;
      end loop;
    elsif v_order.order_status = 'PENDING' then
      -- Liberar reservas para productos pendientes
      for v_item in select * from public.order_items where order_id = p_order_id loop
        if v_item.product_id is not null then
          update public.products
          set reserved = greatest(reserved - v_item.qty, 0)
          where id = v_item.product_id;

          insert into public.inventory_movements (product_id, order_id, type, quantity, reason, created_by)
          values (v_item.product_id, p_order_id, 'RELEASE', v_item.qty, 'Cancelación por administrador ' || v_order.number, p_admin_id);
        end if;
      end loop;
    end if;

    update public.orders
    set order_status = 'CANCELLED',
        payment_status = case when payment_status = 'APPROVED' then 'REFUNDED' else 'CANCELLED' end
    where id = p_order_id;
  else
    -- Cambio de estado normal (PENDING, CONFIRMED, PREPARING, SHIPPED, DELIVERED)
    update public.orders
    set order_status = p_status
    where id = p_order_id;
  end if;

  insert into public.admin_audit_logs (admin_id, action, entity, entity_id, metadata)
  values (
    p_admin_id,
    'ORDER_STATUS_CHANGE',
    'orders',
    p_order_id::text,
    jsonb_build_object('order_number', v_order.number, 'old_status', v_order.order_status, 'new_status', p_status)
  );

  return jsonb_build_object('order_id', p_order_id, 'order_status', p_status);
end;
$$;

revoke execute on function public.update_order_status(uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.update_order_status(uuid, text, uuid) to service_role;

revoke execute on function public.release_reservation(uuid, text, text) from public, anon, authenticated;
grant execute on function public.release_reservation(uuid, text, text) to service_role;
