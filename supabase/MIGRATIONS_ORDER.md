# Migrations to run (in order)

Run these in the **Supabase Dashboard → SQL Editor**, one at a time, in this order.

---

## 1. `20250204000001_initial_schema.sql`

**Run first.** Creates:

- Tables: `branches`, `profiles`, `patients`, `doctor_schedules`, `appointments`
- Enums: `app_role`, `appointment_status`
- RLS policies and trigger that creates a profile when a user signs up

If you already ran this when you first set up the app, skip it.

---

## 2. `20250204000002_fix_profile_trigger.sql`

- Adds RLS policy so the profile-creation trigger can insert when a user is created/invited
- Makes the trigger safer (no invalid enum from invite metadata)

Run this if you had "Database error saving new user" when inviting users.

---

## 3. `20250204000003_appointment_status_diagnosis.sql`

- Adds **`rescheduled`** to the appointment status enum
- Adds columns **`diagnosis`** and **`progress`** to `appointments` (for doctor clinical notes)

Run this for: appointment statuses (Scheduled, Done, Cancelled, Rescheduled) and diagnosis/progress on appointment detail.

---

## 4. `20250204000004_profile_update_own.sql`

- Allows users to **update their own profile** (e.g. set full name on "My profile")

Run this for: doctors/staff setting their name from the dashboard.

---

## 5. `20250204000005_trigger_branch_from_metadata.sql`

- Updates the **new-user trigger** so when the admin invites a doctor with a branch, the profile gets **`branch_id`** from the invite metadata

Run this for: admin "Create doctor" and assign to branch on the Staff page.

---

## Summary

| # | File | Purpose |
|---|------|--------|
| 1 | `20250204000001_initial_schema.sql` | Full schema (run once at start) |
| 2 | `20250204000002_fix_profile_trigger.sql` | Fix invite user / profile creation |
| 3 | `20250204000003_appointment_status_diagnosis.sql` | Rescheduled status + diagnosis & progress |
| 4 | `20250204000004_profile_update_own.sql` | Users can edit own profile (name) |
| 5 | `20250204000005_trigger_branch_from_metadata.sql` | Admin create doctor + assign branch |

**If you haven’t run any of these yet:** run **1 → 2 → 3 → 4 → 5**.

**If you already ran 1 (and maybe 2):** run the rest in order (3, then 4, then 5).
