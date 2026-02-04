"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type ScheduleRow = {
  id?: string;
  branch_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function ScheduleForm({
  doctorId,
  currentSchedules,
  branches,
  branchMap,
  canEdit,
}: {
  doctorId: string;
  currentSchedules: ScheduleRow[];
  branches: { id: string; name: string }[];
  branchMap: Map<string, string>;
  canEdit: boolean;
}) {
  const [rows, setRows] = useState<ScheduleRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    setRows(
      currentSchedules.length > 0
        ? currentSchedules.map((s) => ({
            ...s,
            start_time: s.start_time.slice(0, 5),
            end_time: s.end_time.slice(0, 5),
          }))
        : []
    );
  }, [currentSchedules]);

  function addRow() {
    setRows((prev) => [
      ...prev,
      {
        branch_id: branches[0]?.id ?? "",
        day_of_week: 1,
        start_time: "09:00",
        end_time: "17:00",
        slot_duration_minutes: 30,
      },
    ]);
  }

  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateRow(i: number, field: keyof ScheduleRow, value: string | number) {
    setRows((prev) => {
      const next = [...prev];
      (next[i] as Record<string, unknown>)[field] = value;
      return next;
    });
  }

  async function handleSave() {
    if (!canEdit) return;
    setSaving(true);
    setMessage(null);
    const supabase = createClient();
    const toInsert = rows
      .filter((r) => r.branch_id && r.start_time && r.end_time)
      .map((r) => ({
        doctor_id: doctorId,
        branch_id: r.branch_id,
        day_of_week: r.day_of_week,
        start_time: r.start_time.length === 5 ? r.start_time + ":00" : r.start_time,
        end_time: r.end_time.length === 5 ? r.end_time + ":00" : r.end_time,
        slot_duration_minutes: r.slot_duration_minutes,
      }));

    await supabase.from("doctor_schedules").delete().eq("doctor_id", doctorId);
    if (toInsert.length > 0) {
      const { error: insertErr } = await supabase.from("doctor_schedules").insert(toInsert);
      if (insertErr) {
        setMessage({ type: "error", text: insertErr.message });
      } else {
        setMessage({ type: "ok", text: "Schedule saved." });
        window.location.reload();
      }
    } else {
      setMessage({ type: "ok", text: "Schedule cleared." });
      window.location.reload();
    }
    setSaving(false);
  }

  if (rows.length === 0 && !canEdit) {
    return <p className="mt-4 text-black">No schedule set.</p>;
  }

  return (
    <div className="mt-6 space-y-4">
      {rows.map((row, i) => (
        <div
          key={i}
          className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4"
        >
          <div className="w-36">
            <label className="block text-xs font-medium text-black">Branch</label>
            <select
              value={row.branch_id}
              onChange={(e) => updateRow(i, "branch_id", e.target.value)}
              disabled={!canEdit}
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div className="w-28">
            <label className="block text-xs font-medium text-black">Day</label>
            <select
              value={row.day_of_week}
              onChange={(e) => updateRow(i, "day_of_week", Number(e.target.value))}
              disabled={!canEdit}
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            >
              {DAY_NAMES.map((name, d) => (
                <option key={d} value={d}>{name}</option>
              ))}
            </select>
          </div>
          <div className="w-24">
            <label className="block text-xs font-medium text-black">Start</label>
            <input
              type="time"
              value={row.start_time}
              onChange={(e) => updateRow(i, "start_time", e.target.value)}
              disabled={!canEdit}
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div className="w-24">
            <label className="block text-xs font-medium text-black">End</label>
            <input
              type="time"
              value={row.end_time}
              onChange={(e) => updateRow(i, "end_time", e.target.value)}
              disabled={!canEdit}
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div className="w-20">
            <label className="block text-xs font-medium text-black">Slot (min)</label>
            <select
              value={row.slot_duration_minutes}
              onChange={(e) => updateRow(i, "slot_duration_minutes", Number(e.target.value))}
              disabled={!canEdit}
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            >
              <option value={15}>15</option>
              <option value={30}>30</option>
              <option value={45}>45</option>
              <option value={60}>60</option>
            </select>
          </div>
          {canEdit && (
            <button
              type="button"
              onClick={() => removeRow(i)}
              className="rounded border border-red-200 px-2 py-1.5 text-sm text-red-600 hover:bg-red-50"
            >
              Remove
            </button>
          )}
        </div>
      ))}
      {canEdit && (
        <>
          <button
            type="button"
            onClick={addRow}
            className="rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm text-black hover:bg-slate-50"
          >
            + Add slot
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-teal-600 px-4 py-2 font-medium text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save schedule"}
            </button>
          </div>
        </>
      )}
      {message && (
        <p className={message.type === "ok" ? "text-green-600" : "text-red-600"}>
          {message.text}
        </p>
      )}
    </div>
  );
}
