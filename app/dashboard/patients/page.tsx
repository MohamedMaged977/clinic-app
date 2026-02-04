import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function PatientsPage() {
  const { profile } = await requireAuth();
  const supabase = await createClient();

  let query = supabase.from("patients").select("id, full_name, phone, email, created_at").order("full_name");
  if (profile.role !== "admin" && profile.branch_id) {
    // For non-admin we still show all patients (used when booking at this branch)
    // RLS will restrict to what's allowed
  }
  const { data: patients } = await query;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Patients</h1>
        <Link
          href="/dashboard/patients/new"
          className="rounded-lg bg-teal-600 px-4 py-2 font-medium text-white hover:bg-teal-700"
        >
          Add patient
        </Link>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 font-medium text-black">Name</th>
              <th className="px-4 py-2 font-medium text-black">Phone</th>
              <th className="px-4 py-2 font-medium text-black">Email</th>
              <th className="px-4 py-2 font-medium text-black">Actions</th>
            </tr>
          </thead>
          <tbody>
            {patients?.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-medium text-slate-900">{p.full_name}</td>
                <td className="px-4 py-2 text-black">{p.phone ?? "—"}</td>
                <td className="px-4 py-2 text-black">{p.email ?? "—"}</td>
                <td className="px-4 py-2">
                  <Link href={`/dashboard/patients/${p.id}`} className="text-teal-600 hover:underline">
                    History
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(!patients || patients.length === 0) && (
        <p className="mt-4 rounded-lg border border-slate-200 bg-white p-6 text-center text-black">
          No patients yet. Add a patient to book appointments.
        </p>
      )}
    </div>
  );
}
