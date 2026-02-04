# Clinic Booking System

A multi-branch clinic booking system built with Next.js and Supabase. Supports **admin** (owner), **doctors**, and **receptionists** with role-based access.

## Features

- **Admin**: Create and manage branches; create doctors (invite by email) and assign them to branches; assign staff roles and branches.
- **Doctors**: Set weekly schedule per branch; view and manage appointments; mark slots as taken (book with patient).
- **Receptionists**: Book appointments (branch, doctor, date, slot, patient); manage patients; view schedule.
- **Patient history**: Each patient has a profile and full appointment history across branches.

## Tech Stack

- **Next.js 16** (App Router)
- **Supabase**: PostgreSQL database, Auth, Row Level Security (RLS)
- **Tailwind CSS**
- **TypeScript**

## Setup

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In **Settings → API**, copy the **Project URL** and **anon public** key.

### 2. Environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL  
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key  
- `SUPABASE_SERVICE_ROLE_KEY` = your Supabase **service_role** key (from Settings → API). Required for admin “Create doctor” invites; keep secret and server-only.  

### 3. Run the database migration

In the Supabase Dashboard, open **SQL Editor** and run the contents of:

`supabase/migrations/20250204000001_initial_schema.sql`

This creates: `branches`, `profiles`, `patients`, `doctor_schedules`, `appointments`, RLS policies, and a trigger that creates a profile when a user signs up. Then run (in order) any other migrations in `supabase/migrations/`, including `20250204000005_trigger_branch_from_metadata.sql` so that when the admin invites a doctor with a branch, the profile gets that branch_id.

### 4. Create your first user (admin)

1. Enable **Email** auth in Supabase: **Authentication → Providers → Email** (enable and optionally disable “Confirm email” for local dev).
2. In **Authentication → Users**, click **Add user** and create a user with your email and password (or sign up via the app at `/login` if you’ve enabled signups).
3. Make yourself admin: in **SQL Editor** run (replace with your email):

```sql
update public.profiles set role = 'admin', branch_id = null where email = 'your@email.com';
```

### 5. Run the app

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You’ll be redirected to `/login`. Sign in, then you’ll see the dashboard.

## Usage

1. **Admin**: Create branches (Branches → Add branch). Add staff via Supabase Auth (or invite), then assign **role** and **branch** in **Staff**.
2. **Doctors**: Go to **My Schedule** (or dashboard) → **View schedule** for your profile, then set weekly availability per branch (day, start/end time, slot length).
3. **Receptionist / Doctor**: **Book appointment** → choose branch, doctor, date, time slot, and patient. Patients can be added under **Patients** first.
4. **Patient history**: Open **Patients** → click **History** on a patient to see all past and upcoming appointments.

## Project structure

- `app/` – Routes: `login`, `dashboard` (overview, branches, staff, appointments, patients), `dashboard/doctors/[id]/schedule`, `dashboard/appointments/new`, `dashboard/patients/new`, `dashboard/patients/[id]`.
- `app/dashboard/_components/` – Shared UI: nav, branch/patient/schedule forms, book-appointment flow.
- `lib/` – Supabase client/server, auth helpers, DB types, slot calculation.
- `supabase/migrations/` – Single migration for schema and RLS.

## Deployment

- **Next.js**: Deploy to Vercel (or any Node host). Set the same env vars in the project settings.
- **Supabase**: Hosted; no extra deployment. For production, enable email confirmation and configure redirect URLs in **Authentication → URL Configuration** (e.g. `https://yourdomain.com/auth/callback`).

## Database choice

**Supabase (PostgreSQL)** was chosen for:

- One place for database + auth  
- Row Level Security for branch/role-based access  
- Free tier and simple deployment  
- Good fit for multi-tenant (multi-branch) and relational data (branches, schedules, appointments, patients)
