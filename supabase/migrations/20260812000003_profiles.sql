-- 003: profiles + triggers de auth y rol

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text unique,
  phone text,
  address jsonb,
  city text,
  segment text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

-- crea el profile automáticamente al registrarse (email/password o Google)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(coalesce(new.email, ''), '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- sincroniza profiles.role -> JWT (app_metadata) para el middleware
create or replace function public.sync_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update auth.users
  set raw_app_meta_data = jsonb_set(
    coalesce(raw_app_meta_data, '{}'::jsonb),
    '{role}',
    to_jsonb(new.role)
  )
  where id = new.id;
  return new;
end;
$$;

create trigger on_profile_role_change
  after insert or update of role on public.profiles
  for each row execute function public.sync_profile_role();

-- impide escalada de privilegios desde el cliente: solo service_role puede cambiar el rol
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'No está permitido cambiar el rol de usuario desde el cliente';
  end if;
  return new;
end;
$$;

create trigger trg_prevent_role_escalation
  before update of role on public.profiles
  for each row execute function public.prevent_role_escalation();
