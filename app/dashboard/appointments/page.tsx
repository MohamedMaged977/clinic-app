import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { format } from "date-fns";

export default async function AppointmentsPage() {
  const { profile } = await requireAuth();
  const supabase = await createClient();

  let query = supabase
    .from("appointments")
    .select("id, branch_id, doctor_id, patient_id, start_time, end_time, status")
    .gte("start_time", new Date().toISOString())
    .order("start_time");
  if (profile.role !== "admin" && profile.branch_id) {
    query = query.eq("branch_id", profile.branch_id);
  }
  const { data: upcoming } = await query;

  const pastQuery = supabase
    .from("appointments")
    .select("id, branch_id, doctor_id, patient_id, start_time, end_time, status")
    .lt("start_time", new Date().toISOString())
    .order("start_time", { ascending: false })
    .limit(20);
  if (profile.role !== "admin" && profile.branch_id) {
    pastQuery.eq("branch_id", profile.branch_id);
  }
  const { data: past } = await pastQuery;

  const patientIds = [...new Set([...(upcoming ?? []), ...(past ?? [])].map((a) => a.patient_id))];
  const doctorIds = [...new Set([...(upcoming ?? []), ...(past ?? [])].map((a) => a.doctor_id))];
  const branchIds = [...new Set([...(upcoming ?? []), ...(past ?? [])].map((a) => a.branch_id))];
  const { data: patients } = patientIds.length
    ? await supabase.from("patients").select("id, full_name").in("id", patientIds)
    : { data: [] };
  const { data: doctors } = doctorIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", doctorIds)
    : { data: [] };
  const { data: branches } = branchIds.length
    ? await supabase.from("branches").select("id, name").in("id", branchIds)
    : { data: [] };
  const patientMap = new Map((patients ?? []).map((p) => [p.id, p.full_name]));
  const doctorMap = new Map((doctors ?? []).map((d) => [d.id, d.full_name || (d as { email?: string }).email || d.id]));
  const branchMap = new Map((branches ?? []).map((b) => [b.id, b.name]));

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Appointments</h1>
        <Link
          href="/dashboard/appointments/new"
          className="rounded-lg bg-teal-600 px-4 py-2 font-medium text-white hover:bg-teal-700"
        >
          Book appointment
        </Link>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-black">Upcoming</h2>
        {upcoming && upcoming.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 font-medium text-black">Date & time</th>
                  <th className="px-4 py-2 font-medium text-black">Patient</th>
                  <th className="px-4 py-2 font-medium text-black">Doctor</th>
                  <th className="px-4 py-2 font-medium text-black">Branch</th>
                  <th className="px-4 py-2 font-medium text-black">Status</th>
                  <th className="px-4 py-2 font-medium text-black"></th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((a) => (
                  <tr key={a.id} className="border-t border-slate-100">
                    <td className="px-4 py-2">
                      <Link href={`/dashboard/appointments/${a.id}`} className="text-teal-600 hover:underline">
                        {format(new Date(a.start_time), "EEE, MMM d 'at' HH:mm")}
                      </Link>
                    </td>
                    <td className="px-4 py-2">{patientMap.get(a.patient_id) ?? "—"}</td>
                    <td className="px-4 py-2">{doctorMap.get(a.doctor_id) ?? "—"}</td>
                    <td className="px-4 py-2">{branchMap.get(a.branch_id) ?? "—"}</td>
                    <td className="px-4 py-2">
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <Link href={`/dashboard/appointments/${a.id}`} className="text-sm text-teal-600 hover:underline">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-black">No upcoming appointments.</p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-black">Past</h2>
        {past && past.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 font-medium text-black">Date & time</th>
                  <th className="px-4 py-2 font-medium text-black">Patient</th>
                  <th className="px-4 py-2 font-medium text-black">Doctor</th>
                  <th className="px-4 py-2 font-medium text-black">Status</th>
                  <th className="px-4 py-2 font-medium text-black"></th>
                </tr>
              </thead>
              <tbody>
                {past.map((a) => (
                  <tr key={a.id} className="border-t border-slate-100">
                    <td className="px-4 py-2 text-black">
                      <Link href={`/dashboard/appointments/${a.id}`} className="text-teal-600 hover:underline">
                        {format(new Date(a.start_time), "EEE, MMM d 'at' HH:mm")}
                      </Link>
                    </td>
                    <td className="px-4 py-2">{patientMap.get(a.patient_id) ?? "—"}</td>
                    <td className="px-4 py-2">{doctorMap.get(a.doctor_id) ?? "—"}</td>
                    <td className="px-4 py-2">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-black">
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <Link href={`/dashboard/appointments/${a.id}`} className="text-sm text-teal-600 hover:underline">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-black">No past appointments.</p>
        )}
      </section>
    </div>
  );
}
