-- Mercury admin workspace. Content payloads retain the app's versioned JSON format.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table public.roles (
 id text primary key,
 data jsonb not null check (jsonb_typeof(data) = 'object' and data->>'id' = id and jsonb_typeof(data->'permissions') = 'array')
);
create table public.users (
 id uuid primary key references auth.users(id) on delete cascade,
 name text not null check (length(trim(name)) > 0),
 email text not null,
 role_id text not null references public.roles(id) on delete restrict,
 status text not null default 'active' check (status in ('active','disabled')),
 is_owner boolean not null default false,
 updated_at timestamptz not null default now()
);
create unique index users_email_unique on public.users (lower(email));
create index users_role_id_idx on public.users(role_id);
create unique index users_one_owner on public.users(is_owner) where is_owner;

-- Authorization comes from protected database records, never user-editable metadata.
create function private.allowed(permission text default null) returns boolean
language sql stable security definer set search_path = '' as $$
 select auth.uid() is not null and exists (
   select 1 from public.users u join public.roles r on r.id = u.role_id
   where u.id = (select auth.uid()) and u.status = 'active'
   and (permission is null or (r.data->'permissions') ? permission)
 );
$$;
revoke all on function private.allowed(text) from public, anon;
grant execute on function private.allowed(text) to authenticated;

alter table public.roles enable row level security;
alter table public.users enable row level security;
grant select,insert,update,delete on public.roles to authenticated;
grant select on public.users to authenticated;
grant all on public.roles,public.users to service_role;
create policy roles_read on public.roles for select to authenticated using ((select private.allowed()));
create policy roles_insert on public.roles for insert to authenticated with check ((select private.allowed('users')));
create policy roles_update on public.roles for update to authenticated using ((select private.allowed('users'))) with check ((select private.allowed('users')));
create policy roles_delete on public.roles for delete to authenticated using ((select private.allowed('users')));
create policy users_read on public.users for select to authenticated using (id = (select auth.uid()) or (select private.allowed('users')));

create function private.protect_owner() returns trigger language plpgsql set search_path = '' as $$
begin
 if tg_table_name = 'roles' and old.id = 'R001' then
   raise exception 'The owner role cannot be modified or deleted';
 end if;
 if tg_table_name = 'users' then
 if old.is_owner then
   if tg_op = 'DELETE' then raise exception 'The workspace owner cannot be deleted'; end if;
   if new.status <> 'active' or new.role_id <> 'R001' or not new.is_owner then
     raise exception 'The workspace owner must retain full access';
   end if;
 end if;
 end if;
 if tg_op = 'DELETE' then return old; end if;
 return new;
end;
$$;
revoke all on function private.protect_owner() from public;
create trigger protect_owner_role before update or delete on public.roles for each row execute function private.protect_owner();
create trigger protect_owner_user before update or delete on public.users for each row execute function private.protect_owner();

create table public.products (id text primary key, data jsonb not null check (jsonb_typeof(data) = 'object'));
alter table public.products enable row level security;
grant select,insert,update,delete on public.products to authenticated;
grant all on public.products to service_role;
create policy products_read on public.products for select to authenticated using ((select private.allowed()));
create policy products_insert on public.products for insert to authenticated with check ((select private.allowed('products')));
create policy products_update on public.products for update to authenticated using ((select private.allowed('products'))) with check ((select private.allowed('products')));
create policy products_delete on public.products for delete to authenticated using ((select private.allowed('products')));
alter table public.products add constraint products_payload_id check (data->>'id' is not null and data->>'id' = id);

create table public.categories (id text primary key, data jsonb not null check (jsonb_typeof(data) = 'object'));
alter table public.categories enable row level security;
grant select,insert,update,delete on public.categories to authenticated;
grant all on public.categories to service_role;
create policy categories_read on public.categories for select to authenticated using ((select private.allowed()));
create policy categories_insert on public.categories for insert to authenticated with check ((select private.allowed('products')));
create policy categories_update on public.categories for update to authenticated using ((select private.allowed('products'))) with check ((select private.allowed('products')));
create policy categories_delete on public.categories for delete to authenticated using ((select private.allowed('products')));
alter table public.categories add constraint categories_payload_id check (data->>'id' is not null and data->>'id' = id);

create table public.media (id text primary key, data jsonb not null check (jsonb_typeof(data) = 'object'));
alter table public.media enable row level security;
grant select,insert,update,delete on public.media to authenticated;
grant all on public.media to service_role;
create policy media_read on public.media for select to authenticated using ((select private.allowed()));
create policy media_insert on public.media for insert to authenticated with check ((select private.allowed('media')));
create policy media_update on public.media for update to authenticated using ((select private.allowed('media'))) with check ((select private.allowed('media')));
create policy media_delete on public.media for delete to authenticated using ((select private.allowed('media')));
alter table public.media add constraint media_payload_id check (data->>'id' is not null and data->>'id' = id);

create table public.campaigns (id text primary key, data jsonb not null check (jsonb_typeof(data) = 'object'));
alter table public.campaigns enable row level security;
grant select,insert,update,delete on public.campaigns to authenticated;
grant all on public.campaigns to service_role;
create policy campaigns_read on public.campaigns for select to authenticated using ((select private.allowed()));
create policy campaigns_insert on public.campaigns for insert to authenticated with check ((select private.allowed('campaigns')));
create policy campaigns_update on public.campaigns for update to authenticated using ((select private.allowed('campaigns'))) with check ((select private.allowed('campaigns')));
create policy campaigns_delete on public.campaigns for delete to authenticated using ((select private.allowed('campaigns')));
alter table public.campaigns add constraint campaigns_payload_id check (data->>'id' is not null and data->>'id' = id);

create table public.playlists (id text primary key, data jsonb not null check (jsonb_typeof(data) = 'object'));
alter table public.playlists enable row level security;
grant select,insert,update,delete on public.playlists to authenticated;
grant all on public.playlists to service_role;
create policy playlists_read on public.playlists for select to authenticated using ((select private.allowed()));
create policy playlists_insert on public.playlists for insert to authenticated with check ((select private.allowed('playlists')));
create policy playlists_update on public.playlists for update to authenticated using ((select private.allowed('playlists'))) with check ((select private.allowed('playlists')));
create policy playlists_delete on public.playlists for delete to authenticated using ((select private.allowed('playlists')));
alter table public.playlists add constraint playlists_payload_id check (data->>'id' is not null and data->>'id' = id);

create table public.screens (id text primary key, data jsonb not null check (jsonb_typeof(data) = 'object'));
alter table public.screens enable row level security;
grant select,insert,update,delete on public.screens to authenticated;
grant all on public.screens to service_role;
create policy screens_read on public.screens for select to authenticated using ((select private.allowed()));
create policy screens_insert on public.screens for insert to authenticated with check ((select private.allowed('screens')));
create policy screens_update on public.screens for update to authenticated using ((select private.allowed('screens'))) with check ((select private.allowed('screens')));
create policy screens_delete on public.screens for delete to authenticated using ((select private.allowed('screens')));
alter table public.screens add constraint screens_payload_id check (data->>'id' is not null and data->>'id' = id);

create table public.groups (id text primary key, data jsonb not null check (jsonb_typeof(data) = 'object'));
alter table public.groups enable row level security;
grant select,insert,update,delete on public.groups to authenticated;
grant all on public.groups to service_role;
create policy groups_read on public.groups for select to authenticated using ((select private.allowed()));
create policy groups_insert on public.groups for insert to authenticated with check ((select private.allowed('screens')));
create policy groups_update on public.groups for update to authenticated using ((select private.allowed('screens'))) with check ((select private.allowed('screens')));
create policy groups_delete on public.groups for delete to authenticated using ((select private.allowed('screens')));
alter table public.groups add constraint groups_payload_id check (data->>'id' is not null and data->>'id' = id);

create table public.branches (id text primary key, data jsonb not null check (jsonb_typeof(data) = 'object'));
alter table public.branches enable row level security;
grant select,insert,update,delete on public.branches to authenticated;
grant all on public.branches to service_role;
create policy branches_read on public.branches for select to authenticated using ((select private.allowed()));
create policy branches_insert on public.branches for insert to authenticated with check ((select private.allowed('settings')));
create policy branches_update on public.branches for update to authenticated using ((select private.allowed('settings'))) with check ((select private.allowed('settings')));
create policy branches_delete on public.branches for delete to authenticated using ((select private.allowed('settings')));
alter table public.branches add constraint branches_payload_id check (data->>'id' is not null and data->>'id' = id);

create table public.schedules (id text primary key, data jsonb not null check (jsonb_typeof(data) = 'object'));
alter table public.schedules enable row level security;
grant select,insert,update,delete on public.schedules to authenticated;
grant all on public.schedules to service_role;
create policy schedules_read on public.schedules for select to authenticated using ((select private.allowed()));
create policy schedules_insert on public.schedules for insert to authenticated with check ((select private.allowed('schedules')));
create policy schedules_update on public.schedules for update to authenticated using ((select private.allowed('schedules'))) with check ((select private.allowed('schedules')));
create policy schedules_delete on public.schedules for delete to authenticated using ((select private.allowed('schedules')));
alter table public.schedules add constraint schedules_payload_id check (data->>'id' is not null and data->>'id' = id);

create table public.announcements (id text primary key, data jsonb not null check (jsonb_typeof(data) = 'object'));
alter table public.announcements enable row level security;
grant select,insert,update,delete on public.announcements to authenticated;
grant all on public.announcements to service_role;
create policy announcements_read on public.announcements for select to authenticated using ((select private.allowed()));
create policy announcements_insert on public.announcements for insert to authenticated with check ((select private.allowed('announcements')));
create policy announcements_update on public.announcements for update to authenticated using ((select private.allowed('announcements'))) with check ((select private.allowed('announcements')));
create policy announcements_delete on public.announcements for delete to authenticated using ((select private.allowed('announcements')));
alter table public.announcements add constraint announcements_payload_id check (data->>'id' is not null and data->>'id' = id);

create table public.themes (id text primary key, data jsonb not null check (jsonb_typeof(data) = 'object'));
alter table public.themes enable row level security;
grant select,insert,update,delete on public.themes to authenticated;
grant all on public.themes to service_role;
create policy themes_read on public.themes for select to authenticated using ((select private.allowed()));
create policy themes_insert on public.themes for insert to authenticated with check ((select private.allowed('themes')));
create policy themes_update on public.themes for update to authenticated using ((select private.allowed('themes'))) with check ((select private.allowed('themes')));
create policy themes_delete on public.themes for delete to authenticated using ((select private.allowed('themes')));
alter table public.themes add constraint themes_payload_id check (data->>'id' is not null and data->>'id' = id);

create table public.layouts (id text primary key, data jsonb not null check (jsonb_typeof(data) = 'object'));
alter table public.layouts enable row level security;
grant select,insert,update,delete on public.layouts to authenticated;
grant all on public.layouts to service_role;
create policy layouts_read on public.layouts for select to authenticated using ((select private.allowed()));
create policy layouts_insert on public.layouts for insert to authenticated with check ((select private.allowed('themes')));
create policy layouts_update on public.layouts for update to authenticated using ((select private.allowed('themes'))) with check ((select private.allowed('themes')));
create policy layouts_delete on public.layouts for delete to authenticated using ((select private.allowed('themes')));
alter table public.layouts add constraint layouts_payload_id check (data->>'id' is not null and data->>'id' = id);

create table public.settings (id text primary key, data jsonb not null check (jsonb_typeof(data) = 'object'));
alter table public.settings enable row level security;
grant select,insert,update,delete on public.settings to authenticated;
grant all on public.settings to service_role;
create policy settings_read on public.settings for select to authenticated using ((select private.allowed()));
create policy settings_insert on public.settings for insert to authenticated with check ((select private.allowed('settings')));
create policy settings_update on public.settings for update to authenticated using ((select private.allowed('settings'))) with check ((select private.allowed('settings')));
create policy settings_delete on public.settings for delete to authenticated using ((select private.allowed('settings')));

create table public.notifications (id text primary key, data jsonb not null check (jsonb_typeof(data) = 'object'));
alter table public.notifications enable row level security;
grant select,insert,update,delete on public.notifications to authenticated;
grant all on public.notifications to service_role;
create policy notifications_read on public.notifications for select to authenticated using ((select private.allowed()));
create policy notifications_insert on public.notifications for insert to authenticated with check ((select private.allowed('settings')));
create policy notifications_update on public.notifications for update to authenticated using ((select private.allowed('settings'))) with check ((select private.allowed('settings')));
create policy notifications_delete on public.notifications for delete to authenticated using ((select private.allowed('settings')));

create table public.published_screens (id text primary key, data jsonb not null check (jsonb_typeof(data) = 'object'));
alter table public.published_screens enable row level security;
grant select,insert,update,delete on public.published_screens to authenticated;
grant all on public.published_screens to service_role;
create policy published_screens_read on public.published_screens for select to authenticated using ((select private.allowed()));
create policy published_screens_insert on public.published_screens for insert to authenticated with check ((select private.allowed('publish')));
create policy published_screens_update on public.published_screens for update to authenticated using ((select private.allowed('publish'))) with check ((select private.allowed('publish')));
create policy published_screens_delete on public.published_screens for delete to authenticated using ((select private.allowed('publish')));

-- Only deliberately published screen snapshots and uploaded signage assets are public.
grant select on public.published_screens to anon;
create policy signage_public_read on public.published_screens for select to anon using (true);
create table public.activity_logs (id text primary key, data jsonb not null);
create table public.versions (id text primary key, data jsonb not null);
create table public.ready_records (id text primary key, data jsonb not null);
alter table public.activity_logs enable row level security;
grant select on public.activity_logs to authenticated;
grant all on public.activity_logs to service_role;
create policy activity_logs_read on public.activity_logs for select to authenticated using ((select private.allowed()));
alter table public.versions enable row level security;
grant select on public.versions to authenticated;
grant all on public.versions to service_role;
create policy versions_read on public.versions for select to authenticated using ((select private.allowed()));
alter table public.ready_records enable row level security;
grant select on public.ready_records to authenticated;
grant all on public.ready_records to service_role;
create policy ready_records_read on public.ready_records for select to authenticated using ((select private.allowed()));

-- Keep history and last-ready content atomically with each edit. Trigger-only,
-- non-exposed function; callers cannot forge logs or overwrite ready snapshots.
create function private.track_content() returns trigger
language plpgsql security definer set search_path = '' as $$
declare actor_id uuid := auth.uid(); actor_name text; snapshot jsonb; event_id text := gen_random_uuid()::text;
begin
 if actor_id is null then return coalesce(new,old); end if;
 if not private.allowed() then raise exception 'Active workspace access required'; end if;
 select name into actor_name from public.users where id = actor_id;
 if tg_op <> 'DELETE' then
   if tg_table_name in ('products','media','campaigns','playlists','announcements')
      and new.data->>'status' in ('published','live') and not private.allowed('publish') then
     raise exception 'Publish permission required';
   end if;
 end if;
 if tg_op <> 'INSERT' then
   insert into public.versions values(event_id,jsonb_build_object('id',event_id,'collection',tg_table_name,'entityId',old.id,'time',now(),'actor',actor_name,'value',old.data));
 end if;
 if tg_op = 'DELETE' then
   delete from public.ready_records where id=tg_table_name||':'||old.id;
 else
   if new.data->>'status' in ('published','live') then
     insert into public.ready_records values(tg_table_name||':'||new.id,new.data) on conflict(id) do update set data=excluded.data;
   end if;
 end if;
 snapshot := case when tg_op='DELETE' then old.data else new.data end;
 insert into public.activity_logs values(event_id,jsonb_build_object('id',event_id,'actor',actor_name,'action',tg_op,'target',snapshot->>'name','module',tg_table_name,'time',now()));
 return coalesce(new,old);
end;
$$;
revoke all on function private.track_content() from public,anon,authenticated;
create trigger track_products after insert or update or delete on public.products for each row execute function private.track_content();
create trigger track_categories after insert or update or delete on public.categories for each row execute function private.track_content();
create trigger track_media after insert or update or delete on public.media for each row execute function private.track_content();
create trigger track_campaigns after insert or update or delete on public.campaigns for each row execute function private.track_content();
create trigger track_playlists after insert or update or delete on public.playlists for each row execute function private.track_content();
create trigger track_screens after insert or update or delete on public.screens for each row execute function private.track_content();
create trigger track_groups after insert or update or delete on public.groups for each row execute function private.track_content();
create trigger track_branches after insert or update or delete on public.branches for each row execute function private.track_content();
create trigger track_schedules after insert or update or delete on public.schedules for each row execute function private.track_content();
create trigger track_announcements after insert or update or delete on public.announcements for each row execute function private.track_content();

create table public.screen_commands (
 id uuid primary key default gen_random_uuid(),
 screen_id text not null references public.screens(id) on delete cascade,
 command text not null check (command in ('sync','refresh','restart','clear-cache','screenshot','mute','unmute','pause','resume','maintenance','disable')),
 created_at timestamptz not null default now(),
 status text not null default 'pending' check(status in ('pending','completed','failed'))
);
create index screen_commands_screen_idx on public.screen_commands(screen_id,created_at);
alter table public.screen_commands enable row level security;
grant select,insert on public.screen_commands to authenticated;
grant all on public.screen_commands to service_role;
create policy commands_read on public.screen_commands for select to authenticated using ((select private.allowed('screens')));
create policy commands_insert on public.screen_commands for insert to authenticated with check ((select private.allowed('screens')));

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('signage-media','signage-media',true,104857600,array['image/png','image/jpeg','image/webp','video/mp4','video/webm'])
on conflict(id) do nothing;
create policy mercury_media_read on storage.objects for select to authenticated using (bucket_id='signage-media' and (select private.allowed()));
create policy mercury_media_insert on storage.objects for insert to authenticated with check (bucket_id='signage-media' and ((select private.allowed('media')) or (select private.allowed('products')) or (select private.allowed('campaigns')) or (select private.allowed('themes')) or (select private.allowed('settings'))));
create policy mercury_media_update on storage.objects for update to authenticated using (bucket_id='signage-media' and (select private.allowed('media'))) with check (bucket_id='signage-media' and (select private.allowed('media')));
create policy mercury_media_delete on storage.objects for delete to authenticated using (bucket_id='signage-media' and (select private.allowed('media')));

-- Initial workspace defaults; no demo users, screens, logs or content.
insert into public.roles(id,data) values('R001','{"id":"R001","name":"Super Admin","status":"published","updatedAt":"2026-10-14T09:44:52.312Z","permissions":["products","media","campaigns","playlists","screens","themes","users","publish","analytics","settings","announcements","schedules"]}'::jsonb) on conflict(id) do nothing;
insert into public.roles(id,data) values('R002','{"id":"R002","name":"Marketing Manager","status":"published","updatedAt":"2026-10-14T09:44:52.312Z","permissions":["products","media","campaigns","playlists","analytics","publish","announcements","schedules"]}'::jsonb) on conflict(id) do nothing;
insert into public.roles(id,data) values('R003','{"id":"R003","name":"Content Manager","status":"published","updatedAt":"2026-10-14T09:44:52.312Z","permissions":["products","media","campaigns","playlists"]}'::jsonb) on conflict(id) do nothing;
insert into public.roles(id,data) values('R004','{"id":"R004","name":"Store Manager","status":"published","updatedAt":"2026-10-14T09:44:52.312Z","permissions":["screens","announcements","schedules"]}'::jsonb) on conflict(id) do nothing;
insert into public.roles(id,data) values('R005','{"id":"R005","name":"Viewer","status":"published","updatedAt":"2026-10-14T09:44:52.312Z","permissions":[]}'::jsonb) on conflict(id) do nothing;
insert into public.categories(id,data) values('CAT1','{"id":"CAT1","name":"Laptops","status":"active","updatedAt":"2026-10-14T09:44:52.312Z","icon":"Monitor","color":"#78924f","order":0}'::jsonb) on conflict(id) do nothing;
insert into public.categories(id,data) values('CAT2','{"id":"CAT2","name":"Desktops","status":"active","updatedAt":"2026-10-14T09:44:52.312Z","icon":"Monitor","color":"#78924f","order":1}'::jsonb) on conflict(id) do nothing;
insert into public.categories(id,data) values('CAT3','{"id":"CAT3","name":"Printers","status":"active","updatedAt":"2026-10-14T09:44:52.312Z","icon":"Monitor","color":"#78924f","order":2}'::jsonb) on conflict(id) do nothing;
insert into public.categories(id,data) values('CAT4','{"id":"CAT4","name":"Monitors","status":"active","updatedAt":"2026-10-14T09:44:52.312Z","icon":"Monitor","color":"#78924f","order":3}'::jsonb) on conflict(id) do nothing;
insert into public.categories(id,data) values('CAT5','{"id":"CAT5","name":"Networking","status":"active","updatedAt":"2026-10-14T09:44:52.312Z","icon":"Monitor","color":"#78924f","order":4}'::jsonb) on conflict(id) do nothing;
insert into public.categories(id,data) values('CAT6','{"id":"CAT6","name":"Power solutions","status":"active","updatedAt":"2026-10-14T09:44:52.312Z","icon":"Monitor","color":"#78924f","order":5}'::jsonb) on conflict(id) do nothing;
insert into public.categories(id,data) values('CAT7','{"id":"CAT7","name":"Security","status":"active","updatedAt":"2026-10-14T09:44:52.312Z","icon":"Monitor","color":"#78924f","order":6}'::jsonb) on conflict(id) do nothing;
insert into public.categories(id,data) values('CAT8','{"id":"CAT8","name":"Accessories","status":"active","updatedAt":"2026-10-14T09:44:52.312Z","icon":"Monitor","color":"#78924f","order":7}'::jsonb) on conflict(id) do nothing;
insert into public.categories(id,data) values('CAT9','{"id":"CAT9","name":"Software","status":"active","updatedAt":"2026-10-14T09:44:52.312Z","icon":"Monitor","color":"#78924f","order":8}'::jsonb) on conflict(id) do nothing;
insert into public.categories(id,data) values('CAT10','{"id":"CAT10","name":"Storage","status":"active","updatedAt":"2026-10-14T09:44:52.312Z","icon":"Monitor","color":"#78924f","order":9}'::jsonb) on conflict(id) do nothing;
insert into public.categories(id,data) values('CAT11','{"id":"CAT11","name":"Servers","status":"active","updatedAt":"2026-10-14T09:44:52.312Z","icon":"Monitor","color":"#78924f","order":10}'::jsonb) on conflict(id) do nothing;
insert into public.themes(id,data) values('mercury-classic','{"id":"mercury-classic","name":"Mercury Classic","colors":{"primary":"#3159ba","secondary":"#506278","accent":"#c5ef72","background":"#f7f8f6","surface":"#101c2c","text":"#172334","mutedText":"#74808b","headerBackground":"#ffffff","sidebarBackground":"#ffffff","tickerBackground":"#ffffff","tickerText":"#172334","price":"#172334","cta":"#c5ef72","success":"#408256","warning":"#bf852d","error":"#cf5050"},"typography":{"headingFont":"Inter","bodyFont":"Inter","headingWeight":750,"priceWeight":800,"scale":"Default"},"borderRadius":"Medium","animationStyle":"Crossfade","animationSpeed":"Normal"}'::jsonb) on conflict(id) do nothing;
insert into public.themes(id,data) values('mercury-dark','{"id":"mercury-dark","name":"Mercury Dark","colors":{"primary":"#3159ba","secondary":"#506278","accent":"#c5ef72","background":"#07111f","surface":"#101c2c","text":"#f3f6fb","mutedText":"#74808b","headerBackground":"#101c2c","sidebarBackground":"#142235","tickerBackground":"#142235","tickerText":"#f3f6fb","price":"#c5ef72","cta":"#c5ef72","success":"#408256","warning":"#bf852d","error":"#cf5050"},"typography":{"headingFont":"Inter","bodyFont":"Inter","headingWeight":750,"priceWeight":800,"scale":"Default"},"borderRadius":"Medium","animationStyle":"Crossfade","animationSpeed":"Normal"}'::jsonb) on conflict(id) do nothing;
insert into public.themes(id,data) values('mercury-executive','{"id":"mercury-executive","name":"Mercury Executive","colors":{"primary":"#3159ba","secondary":"#506278","accent":"#c7d1df","background":"#dfe4e9","surface":"#172435","text":"#172334","mutedText":"#74808b","headerBackground":"#ffffff","sidebarBackground":"#ffffff","tickerBackground":"#ffffff","tickerText":"#172334","price":"#172334","cta":"#c7d1df","success":"#408256","warning":"#bf852d","error":"#cf5050"},"typography":{"headingFont":"Inter","bodyFont":"Inter","headingWeight":750,"priceWeight":800,"scale":"Default"},"borderRadius":"Medium","animationStyle":"Crossfade","animationSpeed":"Normal"}'::jsonb) on conflict(id) do nothing;
insert into public.themes(id,data) values('mercury-light','{"id":"mercury-light","name":"Mercury Light","colors":{"primary":"#3159ba","secondary":"#506278","accent":"#acd0ff","background":"#eff4fc","surface":"#1d3f65","text":"#172334","mutedText":"#74808b","headerBackground":"#ffffff","sidebarBackground":"#ffffff","tickerBackground":"#ffffff","tickerText":"#172334","price":"#172334","cta":"#acd0ff","success":"#408256","warning":"#bf852d","error":"#cf5050"},"typography":{"headingFont":"Inter","bodyFont":"Inter","headingWeight":750,"priceWeight":800,"scale":"Default"},"borderRadius":"Medium","animationStyle":"Crossfade","animationSpeed":"Normal"}'::jsonb) on conflict(id) do nothing;
insert into public.themes(id,data) values('high-contrast','{"id":"high-contrast","name":"High Contrast","colors":{"primary":"#3159ba","secondary":"#506278","accent":"#ffff00","background":"#000000","surface":"#000000","text":"#ffffff","mutedText":"#74808b","headerBackground":"#000000","sidebarBackground":"#000000","tickerBackground":"#000000","tickerText":"#ffffff","price":"#ffff00","cta":"#ffff00","success":"#408256","warning":"#bf852d","error":"#cf5050"},"typography":{"headingFont":"Inter","bodyFont":"Inter","headingWeight":750,"priceWeight":800,"scale":"Default"},"borderRadius":"Medium","animationStyle":"Crossfade","animationSpeed":"Normal"}'::jsonb) on conflict(id) do nothing;
insert into public.layouts(id,data) values('classic','{"id":"classic","name":"Classic Mercury","headerEnabled":true,"headerHeight":10.8,"sidebarEnabled":true,"sidebarWidth":25,"tickerEnabled":true,"tickerHeight":16,"companyInfoEnabled":true,"logoSize":15,"mediaFit":"cover","clockPosition":"right","companyInfoPosition":"bottom"}'::jsonb) on conflict(id) do nothing;
insert into public.layouts(id,data) values('media-focus','{"id":"media-focus","name":"Media Focus","headerEnabled":true,"headerHeight":10.8,"sidebarEnabled":false,"sidebarWidth":25,"tickerEnabled":true,"tickerHeight":16,"companyInfoEnabled":true,"logoSize":15,"mediaFit":"cover","clockPosition":"right","companyInfoPosition":"bottom"}'::jsonb) on conflict(id) do nothing;
insert into public.layouts(id,data) values('product-focus','{"id":"product-focus","name":"Product Focus","headerEnabled":true,"headerHeight":10.8,"sidebarEnabled":true,"sidebarWidth":38,"tickerEnabled":true,"tickerHeight":16,"companyInfoEnabled":true,"logoSize":15,"mediaFit":"cover","clockPosition":"right","companyInfoPosition":"bottom"}'::jsonb) on conflict(id) do nothing;
insert into public.layouts(id,data) values('campaign-fullscreen','{"id":"campaign-fullscreen","name":"Campaign Fullscreen","headerEnabled":false,"headerHeight":10.8,"sidebarEnabled":false,"sidebarWidth":25,"tickerEnabled":false,"tickerHeight":16,"companyInfoEnabled":false,"logoSize":15,"mediaFit":"cover","clockPosition":"right","companyInfoPosition":"bottom"}'::jsonb) on conflict(id) do nothing;
insert into public.layouts(id,data) values('split-screen','{"id":"split-screen","name":"Split Screen","headerEnabled":true,"headerHeight":10.8,"sidebarEnabled":true,"sidebarWidth":50,"tickerEnabled":true,"tickerHeight":16,"companyInfoEnabled":true,"logoSize":15,"mediaFit":"cover","clockPosition":"right","companyInfoPosition":"bottom"}'::jsonb) on conflict(id) do nothing;
insert into public.layouts(id,data) values('minimal','{"id":"minimal","name":"Minimal","headerEnabled":true,"headerHeight":10.8,"sidebarEnabled":false,"sidebarWidth":25,"tickerEnabled":false,"tickerHeight":16,"companyInfoEnabled":true,"logoSize":15,"mediaFit":"cover","clockPosition":"right","companyInfoPosition":"bottom"}'::jsonb) on conflict(id) do nothing;
insert into public.settings(id,data) values('company','{"companyName":"Mercury Computers Limited","website":"www.mercurycomputerslimited.com","phone":"","address":"","email":"","tagline":"Technology. Business. Connected.","timezone":"Africa/Kampala","currency":"UGX","logo":"/mercury-logo.png","lightLogo":"","darkLogo":"","favicon":"","loadingLogo":"","featuredRotation":10000,"tickerRotation":8000,"campaignRotation":12000,"showClock":true,"showPrices":true,"muted":true,"preload":true,"maxImageSize":10,"maxVideoSize":100,"imageDuration":12,"apiBaseUrl":"","notificationEmail":false,"notificationScreens":true,"autoBackup":false,"backupFrequency":"Weekly"}'::jsonb) on conflict(id) do nothing;
