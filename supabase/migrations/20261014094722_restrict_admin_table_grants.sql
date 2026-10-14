-- Supabase default privileges may grant more than the explicit GRANT statements.
-- Account writes must pass through the authenticated admin-users function.
revoke all on public.users,public.activity_logs,public.versions,public.ready_records,public.screen_commands from anon,authenticated;
grant select on public.users,public.activity_logs,public.versions,public.ready_records to authenticated;
grant select,insert on public.screen_commands to authenticated;
-- Authenticated roles must not bypass DELETE policies through TRUNCATE.
revoke truncate,references,trigger on all tables in schema public from anon,authenticated;
