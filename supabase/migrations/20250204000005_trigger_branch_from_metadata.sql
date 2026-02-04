-- When admin invites a doctor with branch_id in metadata, set it on the profile.
create or replace function public.handle_new_user()
returns trigger as $$
declare
  role_val text := nullif(trim(new.raw_user_meta_data->>'role'), '');
  branch_val text := nullif(trim(new.raw_user_meta_data->>'branch_id'), '');
  branch_uuid uuid := null;
begin
  if branch_val is not null and branch_val ~ '^[0-9a-fA-F-]{36}$' then
    branch_uuid := branch_val::uuid;
  end if;

  insert into public.profiles (id, email, full_name, role, branch_id)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      nullif(trim(new.raw_user_meta_data->>'name'), '')
    ),
    case
      when role_val in ('admin', 'doctor', 'receptionist') then role_val::app_role
      else 'receptionist'::app_role
    end,
    case
      when role_val = 'admin' then null
      else branch_uuid
    end
  );
  return new;
exception
  when others then
    insert into public.profiles (id, email, full_name, role, branch_id)
    values (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
      'receptionist'::app_role,
      null
    );
    return new;
end;
$$ language plpgsql security definer set search_path = public;
