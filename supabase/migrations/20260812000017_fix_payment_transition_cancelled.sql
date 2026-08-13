-- 017: Permitir transiciones de payment_status PENDING -> CANCELLED y APPROVED -> REFUNDED/CANCELLED al cancelar pedidos

create or replace function public.validate_payment_transitions()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.payment_status is distinct from new.payment_status then
    if not (
      (old.payment_status = 'PENDING' and new.payment_status in ('APPROVED', 'REJECTED', 'CANCELLED')) or
      (old.payment_status = 'APPROVED' and new.payment_status in ('REFUNDED', 'CANCELLED'))
    ) then
      raise exception 'Transición inválida de payment_status: % -> %', old.payment_status, new.payment_status;
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.validate_order_transitions()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.order_status is distinct from new.order_status then
    if not (
      (old.order_status = 'PENDING' and new.order_status in ('CONFIRMED', 'CANCELLED')) or
      (old.order_status = 'CONFIRMED' and new.order_status in ('PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED')) or
      (old.order_status = 'PREPARING' and new.order_status in ('SHIPPED', 'DELIVERED', 'CANCELLED')) or
      (old.order_status = 'SHIPPED' and new.order_status in ('DELIVERED', 'CANCELLED')) or
      (old.order_status = 'DELIVERED' and new.order_status in ('CANCELLED'))
    ) then
      raise exception 'Transición inválida de order_status: % -> %', old.order_status, new.order_status;
    end if;
  end if;

  if new.order_status in ('CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED')
     and new.payment_status <> 'APPROVED' then
    raise exception 'order_status % requiere payment_status APPROVED', new.order_status;
  end if;

  if new.order_status = 'CANCELLED' and new.payment_status = 'APPROVED' then
    raise exception 'Una orden CANCELLED no puede mantener payment_status APPROVED';
  end if;

  return new;
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
    if v_order.payment_status = 'APPROVED' or v_order.order_status in ('CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED') then
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
