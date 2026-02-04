import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ScheduleForm } from "../../../_components/ScheduleForm";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function DoctorSchedulePage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { profile } = await requireAuth();
  const { id: doctorId } = await params;
  const supabase = await createClient();

  const isAdmin = profile.role === "admin";
  const isOwnSchedule = profile.id === doctorId;
  if (!isAdmin && !isOwnSchedule) notFound();

  const { data: doctor } = await supabase.from("profiles").select("id, full_name, email, branch_id").eq("id", doctorId).single();
  if (!doctor) notFound();

  const { data: schedules } = await supabase
    .from("doctor_schedules")
    .select("id, branch_id, day_of_week, start_time, end_time, slot_duration_minutes")
    .eq("doctor_id", doctorId)
    .order("branch_id")
    .order("day_of_week");

  const branchIds = [...new Set(schedules?.map((s) => s.branch_id) ?? [])];
  const { data: branches } = branchIds.length
    ? await supabase.from("branches").select("id, name").in("id", branchIds)
    : { data: [] };
  const branchMap = new Map((branches ?? []).map((b) => [b.id, b.name]));

  const { data: allBranches } = await supabase.from("branches").select("id, name").order("name");

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/dashboard" className="text-sm text-teal-600 hover:underline">
        ← Back to dashboard
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">
        Schedule: {doctor.full_name || doctor.email}
      </h1>
      <p className="mt-1 text-black">
        Set your weekly availability per branch. Slots are generated from these times.
      </p>
      <ScheduleForm
        doctorId={doctorId}
        currentSchedules={schedules ?? []}
        branches={allBranches ?? []}
        branchMap={branchMap}
        canEdit={isAdmin || isOwnSchedule}
      />
    </div>
  );
}
