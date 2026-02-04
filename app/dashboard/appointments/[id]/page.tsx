import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { AppointmentDetailClient } from "../../_components/AppointmentDetailClient";

const STATUS_OPTIONS = [
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Done" },
  { value: "cancelled", label: "Cancelled" },
  { value: "rescheduled", label: "Rescheduled" },
  { value: "no_show", label: "No show" },
] as const;

function statusLabel(status: string): string {
  return STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
}

export default async function AppointmentDetailPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { profile } = await requireAuth();
  const { id } = await params;
  const supabase = await createClient();

  const { data: appointment } = await supabase
    .from("appointments")
    .select("id, branch_id, doctor_id, patient_id, start_time, end_time, status, notes, diagnosis, progress, created_by")
    .eq("id", id)
    .single();

  if (!appointment) notFound();

  const { data: patient } = await supabase.from("patients").select("id, full_name, phone, email").eq("id", appointment.patient_id).single();
  const { data: doctor } = await supabase.from("profiles").select("id, full_name, email").eq("id", appointment.doctor_id).single();
  const { data: branch } = await supabase.from("branches").select("id, name, address, phone").eq("id", appointment.branch_id).single();

  const doctorName = doctor ? (doctor.full_name || doctor.email || doctor.id) : "—";
  const canEdit = profile.role === "admin" || profile.role === "doctor" || profile.role === "receptionist";
  const canEditClinical = profile.role === "admin" || profile.role === "doctor";

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/dashboard/appointments" className="text-sm text-teal-600 hover:underline">
        ← Back to appointments
      </Link>
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-black">Appointment</h1>
        <dl className="mt-4 grid gap-2 text-sm">
          <div>
            <dt className="font-medium text-black">Date & time</dt>
            <dd className="text-black">
              {format(new Date(appointment.start_time), "EEEE, MMMM d, yyyy 'at' HH:mm")} – {format(new Date(appointment.end_time), "HH:mm")}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-black">Patient</dt>
            <dd className="text-black">
              <Link href={`/dashboard/patients/${appointment.patient_id}`} className="text-teal-600 hover:underline">
                {patient?.full_name ?? "—"}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="font-medium text-black">Doctor</dt>
            <dd className="text-black">{doctorName}</dd>
          </div>
          <div>
            <dt className="font-medium text-black">Branch</dt>
            <dd className="text-black">{branch?.name ?? "—"} {branch?.address && ` · ${branch.address}`}</dd>
          </div>
          <div>
            <dt className="font-medium text-black">Status</dt>
            <dd>
              {canEdit ? (
                <AppointmentDetailClient
                  appointmentId={appointment.id}
                  currentStatus={appointment.status}
                  currentDiagnosis={appointment.diagnosis ?? ""}
                  currentProgress={appointment.progress ?? ""}
                  canEditClinical={canEditClinical}
                  statusOptions={STATUS_OPTIONS}
                />
              ) : (
                <span className="rounded px-2 py-0.5 text-xs font-medium bg-slate-100 text-black">{statusLabel(appointment.status)}</span>
              )}
            </dd>
          </div>
          {appointment.notes && (
            <div>
              <dt className="font-medium text-black">Notes</dt>
              <dd className="text-black">{appointment.notes}</dd>
            </div>
          )}
        </dl>
      </div>

      {canEditClinical && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-black">Clinical notes (doctor)</h2>
          <p className="mt-1 text-sm text-black">Save diagnosis and progress after the appointment.</p>
          <AppointmentDetailClient
            appointmentId={appointment.id}
            currentStatus={appointment.status}
            currentDiagnosis={appointment.diagnosis ?? ""}
            currentProgress={appointment.progress ?? ""}
            canEditClinical={canEditClinical}
            statusOptions={STATUS_OPTIONS}
            showClinicalForm
          />
        </div>
      )}

      {!canEditClinical && (appointment.diagnosis || appointment.progress) && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-black">Clinical notes</h2>
          {appointment.diagnosis && (
            <div className="mt-2">
              <dt className="font-medium text-black">Diagnosis</dt>
              <dd className="mt-1 text-black">{appointment.diagnosis}</dd>
            </div>
          )}
          {appointment.progress && (
            <div className="mt-2">
              <dt className="font-medium text-black">Progress</dt>
              <dd className="mt-1 text-black">{appointment.progress}</dd>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
