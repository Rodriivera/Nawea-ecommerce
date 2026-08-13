-- 010: grants explícitos — RLS sigue siendo la puerta de seguridad

grant usage on schema public to anon, authenticated, service_role;

-- tablas: RLS controla el acceso; los grants habilitan los permisos base
grant all on all tables in schema public to anon, authenticated, service_role;

-- secuencias (nextval dentro de RPC security definer corre como owner, pero por claridad)
grant usage, select on all sequences in schema public to anon, authenticated, service_role;

-- el rol postgres (dashboard/CLI) no necesita grants adicionales
