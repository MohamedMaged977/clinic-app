import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function BranchesPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: branches } = await supabase.from("branches").select("*").order("name");

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Branches</h1>
        <Link
          href="/dashboard/branches/new"
          className="rounded-lg bg-teal-600 px-4 py-2 font-medium text-white hover:bg-teal-700"
        >
          Add branch
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {branches?.map((branch) => (
          <Link
            key={branch.id}
            href={`/dashboard/branches/${branch.id}`}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-200 hover:shadow"
          >
            <h2 className="font-semibold text-slate-900">{branch.name}</h2>
            {branch.address && (
              <p className="mt-1 text-sm text-black">{branch.address}</p>
            )}
            {branch.phone && (
              <p className="text-sm text-black">{branch.phone}</p>
            )}
          </Link>
        ))}
      </div>
      {(!branches || branches.length === 0) && (
        <p className="rounded-lg border border-slate-200 bg-white p-6 text-center text-black">
          No branches yet. Create one to get started.
        </p>
      )}
    </div>
  );
}
