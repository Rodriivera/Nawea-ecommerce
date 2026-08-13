-- 019: Bucket de Supabase Storage para imágenes de productos

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

-- RLS para lectura pública
drop policy if exists "Imágenes de productos públicas" on storage.objects;
create policy "Imágenes de productos públicas"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- RLS para escritura de usuarios autenticados / admins
drop policy if exists "Carga de imágenes de productos" on storage.objects;
create policy "Carga de imágenes de productos"
  on storage.objects for insert
  with check (bucket_id = 'product-images');

drop policy if exists "Eliminación de imágenes de productos" on storage.objects;
create policy "Eliminación de imágenes de productos"
  on storage.objects for delete
  using (bucket_id = 'product-images');
