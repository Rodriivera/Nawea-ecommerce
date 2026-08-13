-- 002: catálogo (categorías, productos, variantes, imágenes)

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  index text,
  intro text,
  image_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  slug text not null unique,
  name text not null,
  category_id uuid not null references public.categories(id) on delete restrict,
  price int not null check (price >= 0),
  compare_at int check (compare_at is null or compare_at >= 0),
  badge text,
  description text,
  features jsonb not null default '[]'::jsonb,
  materials text,
  dimensions text,
  care text,
  sku text not null unique,
  stock int not null default 0 check (stock >= 0),
  reserved int not null default 0 check (reserved >= 0),
  min_stock int not null default 0,
  sold int not null default 0 check (sold >= 0),
  status text not null default 'Activo' check (status in ('Activo', 'Borrador', 'Archivado')),
  created_at timestamptz not null default now(),
  constraint products_reserved_le_stock check (reserved <= stock)
);

create table public.product_colors (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  hex text not null
);

create table public.product_sizes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  alt text,
  position int not null default 0
);

create index products_category_id_idx on public.products(category_id);
create index products_status_idx on public.products(status);
create index product_colors_product_id_idx on public.product_colors(product_id);
create index product_sizes_product_id_idx on public.product_sizes(product_id);
create index product_images_product_id_idx on public.product_images(product_id);
