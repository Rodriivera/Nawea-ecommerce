-- 020: RPCs para gestión de categorías con límite estricto de máximo 6 categorías

create or replace function public.save_category(
  p_category jsonb,
  p_admin_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_category_id uuid;
  v_slug text;
  v_name text;
  v_new boolean;
  v_count int;
begin
  v_slug := lower(trim(p_category ->> 'slug'));
  v_name := trim(p_category ->> 'name');

  if v_slug is null or v_slug = '' or v_name is null or v_name = '' then
    raise exception 'El nombre y el slug son requeridos';
  end if;

  if (p_category ->> 'id') is null or (p_category ->> 'id') = '' then
    -- Verificar límite de 6 categorías
    select count(*) into v_count from public.categories;
    if v_count >= 6 then
      raise exception 'Límite alcanzado: no se pueden crear más de 6 categorías en la tienda';
    end if;

    insert into public.categories (
      slug, name, index, intro, image_url, sort_order
    )
    values (
      v_slug,
      v_name,
      coalesce(p_category ->> 'index', LPAD((v_count + 1)::text, 2, '0')),
      p_category ->> 'intro',
      p_category ->> 'image_url',
      coalesce((p_category ->> 'sort_order')::int, v_count + 1)
    )
    returning id into v_category_id;
    v_new := true;
  else
    v_category_id := (p_category ->> 'id')::uuid;

    update public.categories set
      slug = v_slug,
      name = v_name,
      index = coalesce(p_category ->> 'index', index),
      intro = p_category ->> 'intro',
      image_url = coalesce(p_category ->> 'image_url', image_url),
      sort_order = coalesce((p_category ->> 'sort_order')::int, sort_order)
    where id = v_category_id;

    if not found then
      raise exception 'Categoría inexistente';
    end if;
    v_new := false;
  end if;

  insert into public.admin_audit_logs (admin_id, action, entity, entity_id, metadata)
  values (
    p_admin_id,
    case when v_new then 'CATEGORY_CREATE' else 'CATEGORY_UPDATE' end,
    'categories',
    v_category_id::text,
    jsonb_build_object('slug', v_slug, 'name', v_name)
  );

  return jsonb_build_object('category_id', v_category_id, 'slug', v_slug, 'created', v_new);
end;
$$;

create or replace function public.delete_category(
  p_category_id uuid,
  p_admin_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product_count int;
  v_name text;
begin
  select name into v_name from public.categories where id = p_category_id;
  if not found then
    raise exception 'Categoría inexistente';
  end if;

  select count(*) into v_product_count from public.products where category_id = p_category_id;
  if v_product_count > 0 then
    raise exception 'No se puede eliminar la categoría "%" porque tiene % productos asociados', v_name, v_product_count;
  end if;

  delete from public.categories where id = p_category_id;

  insert into public.admin_audit_logs (admin_id, action, entity, entity_id, metadata)
  values (
    p_admin_id,
    'CATEGORY_DELETE',
    'categories',
    p_category_id::text,
    jsonb_build_object('name', v_name)
  );

  return jsonb_build_object('category_id', p_category_id, 'deleted', true);
end;
$$;

revoke execute on function public.save_category(jsonb, uuid) from public, anon, authenticated;
grant execute on function public.save_category(jsonb, uuid) to service_role;

revoke execute on function public.delete_category(uuid, uuid) from public, anon, authenticated;
grant execute on function public.delete_category(uuid, uuid) to service_role;
