-- Allow users to update their own profile (e.g. full_name for doctor name)
create policy "Users update own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());
