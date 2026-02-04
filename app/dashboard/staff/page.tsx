import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StaffTable } from "../_components/StaffTable";
import { CreateDoctorForm } from "./_components/CreateDoctorForm";

export default async function StaffPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, branch_id")
    .order("role")
    .order("full_name");
  const { data: branches } = await supabase.from("branches").select("id, name").order("name");

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-6 text-2xl font-bold text-black">Staff</h1>
      <CreateDoctorForm branches={branches ?? []} />
      <h2 className="mb-3 text-lg font-semibold text-black">All staff</h2>
      <p className="mb-4 text-sm text-black">
        Assign role and branch. Create doctors above, or change role/branch for existing users here.
      </p>
      <StaffTable profiles={profiles ?? []} branches={branches ?? []} />
    </div>
  );
}
