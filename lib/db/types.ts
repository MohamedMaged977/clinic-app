export type UserRole = "admin" | "doctor" | "receptionist";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  branch_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Branch {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  date_of_birth: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DoctorSchedule {
  id: string;
  doctor_id: string;
  branch_id: string;
  day_of_week: number; // 0 = Sunday, 6 = Saturday
  start_time: string; // "09:00"
  end_time: string;   // "17:00"
  slot_duration_minutes: number;
  created_at: string;
  updated_at: string;
}

export type AppointmentStatus = "scheduled" | "completed" | "cancelled" | "no_show" | "rescheduled";

export interface Appointment {
  id: string;
  branch_id: string;
  doctor_id: string;
  patient_id: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  notes: string | null;
  diagnosis: string | null;
  progress: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Joined types for UI
export interface BranchWithRelations extends Branch {
  doctors?: Profile[];
  receptionists?: Profile[];
}

export interface AppointmentWithRelations extends Appointment {
  patient?: Patient;
  doctor?: Profile;
  branch?: Branch;
}

export interface DoctorScheduleWithBranch extends DoctorSchedule {
  branch?: Branch;
}
