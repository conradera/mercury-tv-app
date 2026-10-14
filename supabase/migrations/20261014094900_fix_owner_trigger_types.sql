create or replace function private.protect_owner() returns trigger language plpgsql set search_path = '' as $$
begin
 if tg_table_name = 'roles' then
   if old.id = 'R001' then
     raise exception 'The owner role cannot be modified or deleted';
   end if;
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
