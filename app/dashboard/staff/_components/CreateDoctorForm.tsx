"use client";

import { useState } from "react";
import { inviteDoctor } from "../actions";

type Branch = { id: string; name: string };

export function CreateDoctorForm({ branches }: { branches: Branch[] }) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const result = await inviteDoctor(email, fullName, branchId);
    setLoading(false);
    if (result.ok) {
      setMessage({ type: "ok", text: "Invitation sent. The doctor will receive an email to set their password." });
      setEmail("");
      setFullName("");
    } else {
      setMessage({ type: "error", text: result.error });
    }
  }

  if (branches.length === 0) {
    return (
      <p className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-black">
        Create at least one branch before adding doctors.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-black">Create doctor</h2>
      <p className="mb-4 text-sm text-black">
        Invite a doctor by email. They will receive an email to set their password and will be assigned to the selected branch.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="block text-sm font-medium text-black">Email *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-black bg-white"
            placeholder="doctor@clinic.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-black">Full name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-black bg-white"
            placeholder="Dr. Ahmed Hassan"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-black">Branch *</label>
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-black bg-white"
          >
            <option value="">Select branch</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-teal-600 px-4 py-2 font-medium text-white hover:bg-teal-700 disabled:opacity-50 sm:w-auto"
          >
            {loading ? "Sending…" : "Invite doctor"}
          </button>
        </div>
      </div>
      {message && (
        <p className={`mt-4 text-sm ${message.type === "ok" ? "text-green-600" : "text-red-600"}`}>
          {message.text}
        </p>
      )}
    </form>
  );
}
