import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";

export default async function PatientDetailPage({
  params,
}: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id } = await params;
  const supabase = await createClient();
  const { data: patient } = await supabase.from("patients").select("*").eq("id", id).single();
  if (!patient) notFound();

  const { data: appointments } = await supabase
    .from("appointments")
    .select("id, branch_id, doctor_id, start_time, end_time, status, notes")
    .eq("patient_id", id)
    .order("start_time", { ascending: false });

  const branchIds = [...new Set(appointments?.map((a) => a.branch_id) ?? [])];
  const doctorIds = [...new Set(appointments?.map((a) => a.doctor_id) ?? [])];
  const { data: branches } = branchIds.length
    ? await supabase.from("branches").select("id, name").in("id", branchIds)
    : { data: [] };
  const { data: doctors } = doctorIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", doctorIds)
    : { data: [] };
  const branchMap = new Map((branches ?? []).map((b) => [b.id, b.name]));
  const doctorMap = new Map((doctors ?? []).map((d) => [d.id, d.full_name || (d as { email?: string }).email || d.id]));

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/dashboard/patients" className="text-sm text-teal-600 hover:underline">
        ← Back to patients
      </Link>
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">{patient.full_name}</h1>
        <p className="text-black">{patient.phone ?? "—"}</p>
        <p className="text-black">{patient.email ?? "—"}</p>
        {patient.date_of_birth && (
          <p className="text-black">DOB: {patient.date_of_birth}</p>
        )}
        {patient.notes && (
          <p className="mt-2 text-sm text-black">Notes: {patient.notes}</p>
        )}
      </div>

      <h2 className="mt-8 text-lg font-semibold text-black">Appointment history</h2>
      {appointments && appointments.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {appointments.map((apt) => (
            <li key={apt.id}>
              <Link
                href={`/dashboard/appointments/${apt.id}`}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 transition hover:border-teal-200 hover:bg-slate-50"
              >
                <div>
                  <span className="font-medium text-black">
                    {format(new Date(apt.start_time), "EEE, MMM d, yyyy 'at' HH:mm")}
                  </span>
                  <span className="ml-2 text-black">
                    {branchMap.get(apt.branch_id)} · {doctorMap.get(apt.doctor_id)}
                  </span>
                </div>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${
                    apt.status === "scheduled"
                      ? "bg-amber-100 text-amber-800"
                      : apt.status === "completed"
                      ? "bg-green-100 text-green-800"
                      : apt.status === "rescheduled"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-slate-100 text-black"
                  }`}
                >
                  {apt.status === "completed" ? "Done" : apt.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-black">No appointments yet.</p>
      )}
    </div>
  );
}
