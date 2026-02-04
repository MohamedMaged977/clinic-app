"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type StatusOption = { value: string; label: string };

type Props = {
  appointmentId: string;
  currentStatus: string;
  currentDiagnosis: string;
  currentProgress: string;
  canEditClinical: boolean;
  statusOptions: readonly StatusOption[];
  showClinicalForm?: boolean;
};

export function AppointmentDetailClient({
  appointmentId,
  currentStatus,
  currentDiagnosis,
  currentProgress,
  canEditClinical,
  statusOptions,
  showClinicalForm = false,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [diagnosis, setDiagnosis] = useState(currentDiagnosis);
  const [progress, setProgress] = useState(currentProgress);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingClinical, setSavingClinical] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  async function handleSaveStatus() {
    setSavingStatus(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("appointments")
      .update({ status })
      .eq("id", appointmentId);
    if (error) setMessage({ type: "error", text: error.message });
    else {
      setMessage({ type: "ok", text: "Status updated." });
      router.refresh();
    }
    setSavingStatus(false);
  }

  async function handleSaveClinical() {
    setSavingClinical(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("appointments")
      .update({ diagnosis: diagnosis.trim() || null, progress: progress.trim() || null })
      .eq("id", appointmentId);
    if (error) setMessage({ type: "error", text: error.message });
    else {
      setMessage({ type: "ok", text: "Diagnosis and progress saved." });
      router.refresh();
    }
    setSavingClinical(false);
  }

  if (showClinicalForm) {
    return (
      <div className="mt-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-black">Diagnosis</label>
          <textarea
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-black bg-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-black">Progress</label>
          <textarea
            value={progress}
            onChange={(e) => setProgress(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-black bg-white"
          />
        </div>
        {message && (
          <p className={`text-sm ${message.type === "ok" ? "text-green-600" : "text-red-600"}`}>{message.text}</p>
        )}
        <button
          type="button"
          onClick={handleSaveClinical}
          disabled={savingClinical}
          className="rounded-lg bg-teal-600 px-4 py-2 font-medium text-white hover:bg-teal-700 disabled:opacity-50"
        >
          {savingClinical ? "Saving…" : "Save diagnosis & progress"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="rounded border border-slate-300 px-2 py-1 text-sm text-black bg-white"
      >
        {statusOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <button
        type="button"
        onClick={handleSaveStatus}
        disabled={savingStatus}
        className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
      >
        {savingStatus ? "Saving…" : "Save status"}
      </button>
      {message && !showClinicalForm && (
        <span className={`text-sm ${message.type === "ok" ? "text-green-600" : "text-red-600"}`}>{message.text}</span>
      )}
    </div>
  );
}
