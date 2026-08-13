-- 004: orders, order_items, promos, favorites + triggers de transiciones

create sequence public.order_number_seq start 3001;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  customer_id uuid references public.profiles(id) on delete set null,
  access_token uuid not null default gen_random_uuid(),
  email text not null,
  name text not null,
  phone text,
  shipping_address jsonb,
  shipping_method text not null check (shipping_method in ('estandar', 'express', 'retiro')),
  shipping_cost int not null default 0 check (shipping_cost >= 0),
  subtotal int not null check (subtotal >= 0),
  discount int not null default 0 check (discount >= 0),
  total int not null check (total >= 0),
  promo_code text,
  promo_discount int not null default 0 check (promo_discount >= 0),
  order_status text not null default 'PENDING' check (order_status in ('PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED')),
  payment_status text not null default 'PENDING' check (payment_status in ('PENDING', 'APPROVED', 'REJECTED', 'REFUNDED')),
  payment_method text check (payment_method in ('MERCADO_PAGO', 'TRANSFER')),
  payment_id text unique,
  preference_id text,
  payment_confirmed_at timestamptz,
  payment_confirmed_by uuid references public.profiles(id) on delete set null,
  reservation_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_customer_id_idx on public.orders(customer_id);
create index orders_order_status_idx on public.orders(order_status);
create index orders_payment_status_idx on public.orders(payment_status);
create index orders_email_idx on public.orders(email);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  name text not null,
  color text,
  size text,
  qty int not null check (qty > 0),
  unit_price int not null check (unit_price >= 0),
  subtotal int not null check (subtotal >= 0)
);

create index order_items_order_id_idx on public.order_items(order_id);
create index order_items_product_id_idx on public.order_items(product_id);

create table public.promos (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type text not null check (type in ('PERCENTAGE', 'FIXED', 'FREE_SHIPPING')),
  value int not null check (value >= 0),
  minimum_amount int not null default 0 check (minimum_amount >= 0),
  max_discount int check (max_discount is null or max_discount >= 0),
  starts_at timestamptz,
  expires_at timestamptz,
  usage_limit int check (usage_limit is null or usage_limit >= 0),
  uses int not null default 0 check (uses >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.favorites (
  customer_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (customer_id, product_id)
);

-- updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- validación de transiciones de order_status + coherencia con payment_status
create or replace function public.validate_order_transitions()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.order_status is distinct from new.order_status then
    if not (
      (old.order_status = 'PENDING' and new.order_status in ('CONFIRMED', 'CANCELLED')) or
      (old.order_status = 'CONFIRMED' and new.order_status in ('PREPARING', 'CANCELLED')) or
      (old.order_status = 'PREPARING' and new.order_status in ('SHIPPED', 'CANCELLED')) or
      (old.order_status = 'SHIPPED' and new.order_status in ('DELIVERED', 'CANCELLED'))
    ) then
      raise exception 'Transición inválida de order_status: % -> %', old.order_status, new.order_status;
    end if;
  end if;

  if new.order_status in ('CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED')
     and new.payment_status <> 'APPROVED' then
    raise exception 'order_status % requiere payment_status APPROVED', new.order_status;
  end if;

  if new.order_status = 'CANCELLED' and new.payment_status in ('APPROVED', 'REFUNDED') then
    raise exception 'Una orden CANCELLED no puede tener payment_status %', new.payment_status;
  end if;

  return new;
end;
$$;

create trigger trg_validate_order_transitions
  before update on public.orders
  for each row execute function public.validate_order_transitions();

-- validación de transiciones de payment_status
create or replace function public.validate_payment_transitions()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.payment_status is distinct from new.payment_status then
    if not (
      (old.payment_status = 'PENDING' and new.payment_status in ('APPROVED', 'REJECTED')) or
      (old.payment_status = 'APPROVED' and new.payment_status = 'REFUNDED')
    ) then
      raise exception 'Transición inválida de payment_status: % -> %', old.payment_status, new.payment_status;
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_validate_payment_transitions
  before update on public.orders
  for each row execute function public.validate_payment_transitions();
