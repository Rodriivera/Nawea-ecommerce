-- 014: Permitir eliminación física completa de productos en delete_product RPC
-- Dado que order_items tiene ON DELETE SET NULL, la eliminación física no rompe pedidos históricos.

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

  -- Eliminar producto físicamente.
  -- Las tablas secundarias (imágenes, variantes, favoritos) se eliminan por CASCADE.
  -- Los ítems de pedidos históricos se preservan desvinculando el ID (ON DELETE SET NULL).
  delete from public.products where id = p_product_id;

  insert into public.admin_audit_logs (admin_id, action, entity, entity_id, metadata)
  values (
    p_admin_id,
    'PRODUCT_DELETE',
    'products',
    p_product_id::text,
    jsonb_build_object('name', v_name, 'deleted', true)
  );

  return jsonb_build_object('id', p_product_id, 'deleted', true);
end;
$$;

revoke execute on function public.delete_product(uuid, uuid) from public, anon, authenticated;
grant execute on function public.delete_product(uuid, uuid) to service_role;
