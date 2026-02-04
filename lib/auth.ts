import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/db/types";
import { redirect } from "next/navigation";

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export async function getProfile(): Promise<(Profile & { role: UserRole }) | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!profile) return null;
  return profile as Profile & { role: UserRole };
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) redirect("/login");
  const profile = await getProfile();
  if (!profile) redirect("/login");
  return { session, profile };
}

export async function requireAdmin() {
  const { profile } = await requireAuth();
  if (profile.role !== "admin") redirect("/dashboard");
  return profile;
}

export function isAdmin(role: UserRole) {
  return role === "admin";
}

export function canManageBranch(role: UserRole) {
  return role === "admin";
}

export function canManageSchedules(role: UserRole, branchId: string | null, targetBranchId: string) {
  if (role === "admin") return true;
  return branchId === targetBranchId;
}

export function canManageAppointments(role: UserRole, branchId: string | null, targetBranchId?: string) {
  if (role === "admin") return true;
  if (!targetBranchId) return !!branchId;
  return branchId === targetBranchId;
}
