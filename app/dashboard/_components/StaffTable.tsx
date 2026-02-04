"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Profile = { id: string; email: string; full_name: string | null; role: string; branch_id: string | null };
type Branch = { id: string; name: string };

export function StaffTable({ profiles, branches }: { profiles: Profile[]; branches: Branch[] }) {
  const [updating, setUpdating] = useState<string | null>(null);

  async function updateRoleBranch(profileId: string, role: string, branchId: string | null) {
    if (role === "admin" && branchId) branchId = null;
    setUpdating(profileId);
    const supabase = createClient();
    await supabase.from("profiles").update({ role, branch_id: branchId }).eq("id", profileId);
    setUpdating(null);
    window.location.reload();
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-2 font-medium text-black">Name</th>
            <th className="px-4 py-2 font-medium text-black">Email</th>
            <th className="px-4 py-2 font-medium text-black">Role</th>
            <th className="px-4 py-2 font-medium text-black">Branch</th>
            <th className="px-4 py-2 font-medium text-black">Actions</th>
          </tr>
        </thead>
        <tbody>
          {profiles.map((p) => (
            <StaffRow
              key={p.id}
              profile={p}
              branches={branches}
              updating={updating === p.id}
              onUpdate={updateRoleBranch}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StaffRow({
  profile,
  branches,
  updating,
  onUpdate,
}: {
  profile: Profile;
  branches: Branch[];
  updating: boolean;
  onUpdate: (id: string, role: string, branchId: string | null) => void;
}) {
  const [role, setRole] = useState(profile.role);
  const [branchId, setBranchId] = useState(profile.branch_id ?? "");

  const handleSave = () => {
    const bid = role === "admin" ? null : branchId || null;
    onUpdate(profile.id, role, bid);
  };

  const changed = role !== profile.role || (profile.branch_id ?? "") !== branchId;

  return (
    <tr className="border-t border-slate-100">
      <td className="px-4 py-2 font-medium text-slate-900">{profile.full_name || "—"}</td>
      <td className="px-4 py-2 text-black">{profile.email}</td>
      <td className="px-4 py-2">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded border border-slate-300 px-2 py-1 text-slate-900"
        >
          <option value="admin">admin</option>
          <option value="doctor">doctor</option>
          <option value="receptionist">receptionist</option>
        </select>
      </td>
      <td className="px-4 py-2">
        <select
          value={branchId}
          onChange={(e) => setBranchId(e.target.value)}
          disabled={role === "admin"}
          className="rounded border border-slate-300 px-2 py-1 text-slate-900 disabled:opacity-50"
        >
          <option value="">—</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-2">
        {changed && (
          <button
            type="button"
            onClick={handleSave}
            disabled={updating}
            className="text-teal-600 hover:underline disabled:opacity-50"
          >
            {updating ? "Saving…" : "Save"}
          </button>
        )}
      </td>
    </tr>
  );
}
