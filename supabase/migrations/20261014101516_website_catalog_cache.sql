create table public.website_catalog_cache (
  id text primary key,
  data jsonb not null check (jsonb_typeof(data) = 'array'),
  fetched_at timestamptz not null
);

alter table public.website_catalog_cache enable row level security;
revoke all on public.website_catalog_cache from public, anon, authenticated;
grant all on public.website_catalog_cache to service_role;
