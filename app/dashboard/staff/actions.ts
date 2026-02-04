"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type InviteDoctorResult = { ok: true } | { ok: false; error: string };

export async function inviteDoctor(
  email: string,
  fullName: string,
  branchId: string
): Promise<InviteDoctorResult> {
  await requireAdmin();

  const trimmedEmail = email.trim().toLowerCase();
  const trimmedName = fullName.trim();
  if (!trimmedEmail) return { ok: false, error: "Email is required." };
  if (!branchId) return { ok: false, error: "Branch is required." };

  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(trimmedEmail, {
    data: {
      full_name: trimmedName || undefined,
      role: "doctor",
      branch_id: branchId,
    },
  });

  if (error) {
    if (error.message.includes("already been registered")) {
      return { ok: false, error: "A user with this email already exists. Assign them as doctor in the table below." };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard/staff");
  return { ok: true };
}
