-- Add 'rescheduled' to appointment status enum
alter type appointment_status add value if not exists 'rescheduled';

-- Add diagnosis and progress (doctor saves after appointment)
alter table public.appointments
  add column if not exists diagnosis text,
  add column if not exists progress text;

comment on column public.appointments.diagnosis is 'Doctor diagnosis after the appointment';
comment on column public.appointments.progress is 'Doctor progress notes after the appointment';
