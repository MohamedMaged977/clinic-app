import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { BookAppointmentClient } from "../../_components/BookAppointmentClient";

export default async function NewAppointmentPage() {
  const { profile } = await requireAuth();
  const supabase = await createClient();

  const { data: branches } = await supabase.from("branches").select("id, name").order("name");
  let doctorsQuery = supabase.from("profiles").select("id, full_name, email, branch_id").eq("role", "doctor");
  if (profile.role !== "admin" && profile.branch_id) {
    doctorsQuery = doctorsQuery.eq("branch_id", profile.branch_id);
  }
  const { data: doctors } = await doctorsQuery.order("full_name");
  const { data: patients } = await supabase.from("patients").select("id, full_name").order("full_name");

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/dashboard/appointments" className="text-sm text-teal-600 hover:underline">
        ← Back to appointments
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Book appointment</h1>
      <BookAppointmentClient
        branches={branches ?? []}
        doctors={doctors ?? []}
        patients={patients ?? []}
        defaultBranchId={profile.branch_id ?? undefined}
      />
    </div>
  );
}
