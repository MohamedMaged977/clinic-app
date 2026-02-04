import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function BranchDetailPage({
  params,
}: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const { data: branch } = await supabase.from("branches").select("*").eq("id", id).single();
  if (!branch) notFound();

  const { data: staff } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("branch_id", id)
    .order("role")
    .order("full_name");
  const { data: schedules } = await supabase
    .from("doctor_schedules")
    .select("id, doctor_id, day_of_week, start_time, end_time, slot_duration_minutes")
    .eq("branch_id", id);

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const doctorIds = [...new Set(schedules?.map((s) => s.doctor_id) ?? [])];
  const { data: doctors } = doctorIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", doctorIds)
    : { data: [] };
  const doctorMap = new Map((doctors ?? []).map((d) => [d.id, d.full_name]));

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/dashboard/branches" className="text-sm text-teal-600 hover:underline">
        ← Back to branches
      </Link>
      <div className="mt-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{branch.name}</h1>
          {branch.address && <p className="text-black">{branch.address}</p>}
          {branch.phone && <p className="text-black">{branch.phone}</p>}
        </div>
        <Link
          href={`/dashboard/branches/${id}/edit`}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-black hover:bg-slate-50"
        >
          Edit
        </Link>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-black">Staff at this branch</h2>
        {staff && staff.length > 0 ? (
          <ul className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {staff.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between border-b border-slate-100 px-4 py-3 last:border-0"
              >
                <span className="font-medium text-slate-900">{s.full_name || s.email}</span>
                <span className="text-sm text-black">{s.role}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-black">No staff assigned yet. Assign from Staff.</p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-black">Doctor schedules</h2>
        {schedules && schedules.length > 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 font-medium text-black">Doctor</th>
                  <th className="px-4 py-2 font-medium text-black">Day</th>
                  <th className="px-4 py-2 font-medium text-black">Time</th>
                  <th className="px-4 py-2 font-medium text-black">Slot</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((s) => (
                  <tr key={s.id} className="border-t border-slate-100">
                    <td className="px-4 py-2">{doctorMap.get(s.doctor_id) ?? s.doctor_id}</td>
                    <td className="px-4 py-2">{dayNames[s.day_of_week]}</td>
                    <td className="px-4 py-2">{s.start_time} – {s.end_time}</td>
                    <td className="px-4 py-2">{s.slot_duration_minutes} min</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-black">No schedules yet. Doctors can set their schedule.</p>
        )}
      </section>
    </div>
  );
}
