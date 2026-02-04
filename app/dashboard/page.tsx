import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import Link from "next/link";
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  parseISO,
  setHours,
  setMinutes,
  addMinutes,
  isWithinInterval,
} from "date-fns";

export default async function DashboardPage() {
  const { profile } = await requireAuth();
  const supabase = await createClient();

  const isAdmin = profile.role === "admin";
  const branchId = profile.branch_id;

  // Fetch branches (admin: all; staff: own branch)
  const branchesQuery = supabase.from("branches").select("id, name, address, phone");
  if (!isAdmin && branchId) {
    branchesQuery.eq("id", branchId);
  }
  const { data: branches } = await branchesQuery.order("name");

  // Fetch doctors (from profiles) for context
  const doctorsQuery = supabase.from("profiles").select("id, full_name, email, role").eq("role", "doctor");
  if (!isAdmin && branchId) {
    doctorsQuery.eq("branch_id", branchId);
  }
  const { data: doctors } = await doctorsQuery.order("full_name");

  // This week's appointments for dashboard
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
  const weekEnd = addDays(weekStart, 7);
  const { data: appointments } = await supabase
    .from("appointments")
    .select("id, branch_id, doctor_id, patient_id, start_time, end_time, status")
    .gte("start_time", weekStart.toISOString())
    .lt("start_time", weekEnd.toISOString())
    .eq("status", "scheduled")
    .order("start_time");

  const { data: patients } = appointments?.length
    ? await supabase.from("patients").select("id, full_name").in("id", [...new Set(appointments?.map((a) => a.patient_id))])
    : { data: [] };

  const patientMap = new Map((patients ?? []).map((p) => [p.id, p.full_name]));

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <h1 className="text-2xl font-bold text-[#000000]">
        {isAdmin ? "All branches & schedules" : "Schedule overview"}
      </h1>

      {branches && branches.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#000000]">Branches</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {branches.map((branch) => (
              <Link
                key={branch.id}
                href={isAdmin ? `/dashboard/branches/${branch.id}` : "/dashboard"}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-teal-200 hover:shadow"
              >
                <h3 className="font-medium text-[#000000]">{branch.name}</h3>
                {branch.address && (
                  <p className="mt-1 text-sm text-black">{branch.address}</p>
                )}
                {branch.phone && (
                  <p className="text-sm text-black">{branch.phone}</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {doctors && doctors.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#000000]">Doctors</h2>
          <ul className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {doctors.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between border-b border-slate-100 px-4 py-3 last:border-0"
              >
                <span className="font-medium text-[#000000]">{d.full_name || d.email}</span>
                <Link
                  href={`/dashboard/doctors/${d.id}/schedule`}
                  className="text-sm text-teal-600 hover:underline"
                >
                  View schedule
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {appointments && appointments.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#000000]">Upcoming appointments (this week)</h2>
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 font-medium text-black">Date & time</th>
                  <th className="px-4 py-2 font-medium text-black">Patient</th>
                  <th className="px-4 py-2 font-medium text-black">Doctor</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt) => (
                  <tr key={apt.id} className="border-t border-slate-100">
                    <td className="px-4 py-2 text-black">
                      {format(parseISO(apt.start_time), "EEE, MMM d 'at' HH:mm")}
                    </td>
                    <td className="px-4 py-2">{patientMap.get(apt.patient_id) ?? "—"}</td>
                    <td className="px-4 py-2">
                      {doctors?.find((x) => x.id === apt.doctor_id)?.full_name ?? apt.doctor_id}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {(!branches || branches.length === 0) && isAdmin && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
          No branches yet. <Link href="/dashboard/branches/new" className="font-medium underline">Create your first branch</Link>.
        </p>
      )}
    </div>
  );
}
