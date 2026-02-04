-- Fix 1: Allow insert into profiles when the row id matches auth.uid()
-- (So the trigger can create a profile when a new user is created/invited.
-- In some Supabase setups the trigger runs with the new user context.)
create policy "Allow insert own profile"
  on public.profiles for insert
  with check (id = auth.uid());

-- Fix 2: Safer trigger - avoid invalid app_role cast from invite metadata
create or replace function public.handle_new_user()
returns trigger as $$
declare
  role_val text := nullif(trim(new.raw_user_meta_data->>'role'), '');
begin
  insert into public.profiles (id, email, full_name, role)
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
    end
  );
  return new;
exception
  when others then
    -- Fallback: insert with default role if anything fails (e.g. RLS)
    insert into public.profiles (id, email, full_name, role)
    values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'), 'receptionist'::app_role);
    return new;
end;
$$ language plpgsql security definer set search_path = public;
