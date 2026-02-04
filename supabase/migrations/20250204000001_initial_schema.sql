-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Custom type for user role
create type app_role as enum ('admin', 'doctor', 'receptionist');
create type appointment_status as enum ('scheduled', 'completed', 'cancelled', 'no_show');

-- Branches (admin creates these)
create table public.branches (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  address text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Profiles: extends auth.users with role and branch
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role app_role not null default 'receptionist',
  branch_id uuid references public.branches(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_no_branch check (
    (role = 'admin' and branch_id is null) or (role != 'admin')
  )
);

-- Patients (clinic's patient registry)
create table public.patients (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  phone text,
  email text,
  date_of_birth date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Recurring weekly schedule per doctor per branch
create table public.doctor_schedules (
  id uuid primary key default uuid_generate_v4(),
  doctor_id uuid not null references public.profiles(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  day_of_week smallint not null check (day_of_week >= 0 and day_of_week <= 6),
  start_time time not null,
  end_time time not null,
  slot_duration_minutes smallint not null default 30 check (slot_duration_minutes > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (doctor_id, branch_id, day_of_week)
);

-- Appointments (booked slots)
create table public.appointments (
  id uuid primary key default uuid_generate_v4(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  doctor_id uuid not null references public.profiles(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete restrict,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status appointment_status not null default 'scheduled',
  notes text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint end_after_start check (end_time > start_time)
);

create index idx_appointments_doctor_date on public.appointments(doctor_id, start_time);
create index idx_appointments_branch_date on public.appointments(branch_id, start_time);
create index idx_appointments_patient on public.appointments(patient_id);
create index idx_profiles_branch_role on public.profiles(branch_id, role);
create index idx_doctor_schedules_doctor on public.doctor_schedules(doctor_id);
create index idx_doctor_schedules_branch on public.doctor_schedules(branch_id);

-- Trigger: update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger branches_updated_at before update on public.branches
  for each row execute function public.set_updated_at();
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger patients_updated_at before update on public.patients
  for each row execute function public.set_updated_at();
create trigger doctor_schedules_updated_at before update on public.doctor_schedules
  for each row execute function public.set_updated_at();
create trigger appointments_updated_at before update on public.appointments
  for each row execute function public.set_updated_at();

-- Create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce((new.raw_user_meta_data->>'role')::app_role, 'receptionist')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.branches enable row level security;
alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.doctor_schedules enable row level security;
alter table public.appointments enable row level security;

-- Helper: current user's profile role and branch
create or replace function public.my_role() returns app_role as $$
  select role from public.profiles where id = auth.uid();
$$ language sql security definer stable;

create or replace function public.my_branch_id() returns uuid as $$
  select branch_id from public.profiles where id = auth.uid();
$$ language sql security definer stable;

-- Branches: admin all; others read own branch
create policy "Admin manage branches" on public.branches
  for all using (public.my_role() = 'admin');
create policy "Staff read own branch" on public.branches
  for select using (id = public.my_branch_id());

-- Profiles: admin all; staff read same branch
create policy "Admin manage profiles" on public.profiles
  for all using (public.my_role() = 'admin');
create policy "Users read own profile" on public.profiles
  for select using (id = auth.uid());
create policy "Staff read branch profiles" on public.profiles
  for select using (branch_id = public.my_branch_id());

-- Patients: admin + staff at any branch can read/write (for booking)
create policy "Staff manage patients" on public.patients
  for all using (
    public.my_role() = 'admin' or public.my_branch_id() is not null
  );

-- Doctor schedules: admin all; doctor own; receptionist same branch
create policy "Admin manage schedules" on public.doctor_schedules
  for all using (public.my_role() = 'admin');
create policy "Doctor manage own schedule" on public.doctor_schedules
  for all using (doctor_id = auth.uid());
create policy "Receptionist manage branch schedules" on public.doctor_schedules
  for all using (branch_id = public.my_branch_id());

-- Appointments: admin all; doctor own; receptionist same branch
create policy "Admin manage appointments" on public.appointments
  for all using (public.my_role() = 'admin');
create policy "Doctor manage own appointments" on public.appointments
  for all using (doctor_id = auth.uid());
create policy "Receptionist manage branch appointments" on public.appointments
  for all using (branch_id = public.my_branch_id());
create policy "Staff read branch appointments" on public.appointments
  for select using (branch_id = public.my_branch_id());
