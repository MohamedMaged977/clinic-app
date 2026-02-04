import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BranchForm } from "../../../_components/BranchForm";

export default async function EditBranchPage({
  params,
}: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const { data: branch } = await supabase.from("branches").select("*").eq("id", id).single();
  if (!branch) notFound();

  return (
    <div className="mx-auto max-w-lg">
      <Link href={`/dashboard/branches/${id}`} className="text-sm text-teal-600 hover:underline">
        ← Back to branch
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Edit branch</h1>
      <BranchForm branch={branch} />
    </div>
  );
}
