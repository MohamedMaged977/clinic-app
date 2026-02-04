import { requireAuth } from "@/lib/auth";
import Link from "next/link";
import { PatientForm } from "../../_components/PatientForm";

export default async function NewPatientPage() {
  await requireAuth();
  return (
    <div className="mx-auto max-w-lg">
      <Link href="/dashboard/patients" className="text-sm text-teal-600 hover:underline">
        ← Back to patients
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">New patient</h1>
      <PatientForm />
    </div>
  );
}
