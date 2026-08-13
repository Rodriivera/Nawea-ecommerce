-- 013: Solución de restricción Foreign Key al eliminar productos con pedidos históricos

-- 1. Permitir nulos en product_id de order_items para preservar el historial de compras
alter table public.order_items alter column product_id drop not null;

-- 2. Modificar Foreign Key a ON DELETE SET NULL
alter table public.order_items drop constraint if exists order_items_product_id_fkey;
alter table public.order_items
  add constraint order_items_product_id_fkey
  foreign key (product_id) references public.products(id) on delete set null;

-- 3. Actualizar la RPC delete_product para realizar Soft Delete (Archivado) si hay pedidos, o Hard Delete si no los hay
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
  v_has_orders boolean;
begin
  select name into v_name from public.products where id = p_product_id;
  if not found then
    raise exception 'Producto inexistente';
  end if;

  -- Verificar si el producto tiene historial de pedidos
  select exists (
    select 1 from public.order_items where product_id = p_product_id
  ) into v_has_orders;

  if v_has_orders then
    -- Si el producto se ha vendido en pedidos pasados, se archiva automáticamente
    -- para no destruir registros históricos ni violar restricciones.
    update public.products
    set status = 'Archivado'
    where id = p_product_id;

    insert into public.admin_audit_logs (admin_id, action, entity, entity_id, metadata)
    values (
      p_admin_id,
      'PRODUCT_ARCHIVE',
      'products',
      p_product_id::text,
      jsonb_build_object('name', v_name, 'reason', 'Archivado por historial de ventas')
    );

    return jsonb_build_object('id', p_product_id, 'deleted', false, 'archived', true);
  else
    -- Si no tiene pedidos asociados, se elimina físicamente
    delete from public.products where id = p_product_id;

    insert into public.admin_audit_logs (admin_id, action, entity, entity_id, metadata)
    values (
      p_admin_id,
      'PRODUCT_DELETE',
      'products',
      p_product_id::text,
      jsonb_build_object('name', v_name, 'deleted', true)
    );

    return jsonb_build_object('id', p_product_id, 'deleted', true, 'archived', false);
  end if;
end;
$$;

revoke execute on function public.delete_product(uuid, uuid) from public, anon, authenticated;
grant execute on function public.delete_product(uuid, uuid) to service_role;
