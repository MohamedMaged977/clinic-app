import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import { BranchForm } from "../../_components/BranchForm";

export default async function NewBranchPage() {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-lg">
      <Link href="/dashboard/branches" className="text-sm text-teal-600 hover:underline">
        ← Back to branches
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">New branch</h1>
      <BranchForm />
    </div>
  );
}
