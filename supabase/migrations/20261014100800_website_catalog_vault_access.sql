create extension if not exists supabase_vault with schema vault;

-- Edge Functions receive the service role at runtime. Keep this RPC in the
-- exposed schema, but make it callable only by that role.
create or replace function public.mercury_products_api_key()
returns text
language sql
security definer
set search_path = ''
as $$
  select decrypted_secret
  from vault.decrypted_secrets
  where name = 'mercury_products_api_key'
  limit 1;
$$;

revoke all on function public.mercury_products_api_key() from public, anon, authenticated;
grant execute on function public.mercury_products_api_key() to service_role;
