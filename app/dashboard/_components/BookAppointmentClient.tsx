"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { addDays, format, startOfDay } from "date-fns";
import { getAvailableSlots } from "@/lib/slots";

type Branch = { id: string; name: string };
type Doctor = { id: string; full_name: string | null; email?: string | null; branch_id: string | null };
type Patient = { id: string; full_name: string };

export function BookAppointmentClient({
  branches,
  doctors,
  patients,
  defaultBranchId,
}: {
  branches: Branch[];
  doctors: Doctor[];
  patients: Patient[];
  defaultBranchId?: string;
}) {
  const router = useRouter();
  const [branchId, setBranchId] = useState(defaultBranchId ?? branches[0]?.id ?? "");
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState(format(addDays(new Date(), 1), "yyyy-MM-dd"));
  const [slot, setSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [patientId, setPatientId] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doctorsInBranch = branchId
    ? doctors.filter((d) => d.branch_id === branchId)
    : [];
  const [schedules, setSchedules] = useState<{ day_of_week: number; start_time: string; end_time: string; slot_duration_minutes: number }[]>([]);
  const [appointments, setAppointments] = useState<{ start_time: string; end_time: string }[]>([]);
  const [slots, setSlots] = useState<{ start: Date; end: Date; label: string }[]>([]);

  useEffect(() => {
    setDoctorId(doctorsInBranch[0]?.id ?? "");
  }, [branchId]);

  useEffect(() => {
    if (!doctorId || !branchId || !date) {
      setSlots([]);
      return;
    }
    const supabase = createClient();
    (async () => {
      const { data: s } = await supabase
        .from("doctor_schedules")
        .select("day_of_week, start_time, end_time, slot_duration_minutes")
        .eq("doctor_id", doctorId)
        .eq("branch_id", branchId);
      setSchedules(s ?? []);

      const dayStart = startOfDay(new Date(date));
      const dayEnd = addDays(dayStart, 1);
      const { data: a } = await supabase
        .from("appointments")
        .select("start_time, end_time")
        .eq("doctor_id", doctorId)
        .eq("status", "scheduled")
        .gte("start_time", dayStart.toISOString())
        .lt("start_time", dayEnd.toISOString());
      setAppointments(a ?? []);
    })();
  }, [doctorId, branchId, date]);

  useEffect(() => {
    if (schedules.length === 0) {
      setSlots([]);
      setSlot(null);
      return;
    }
    const dateObj = new Date(date + "T12:00:00");
    const available = getAvailableSlots(dateObj, schedules, appointments, schedules[0]?.slot_duration_minutes ?? 30);
    setSlots(available);
    setSlot(null);
  }, [schedules, appointments, date]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!slot || !patientId || !doctorId || !branchId) {
      setError("Please select date, slot, and patient.");
      return;
    }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Not signed in.");
      setLoading(false);
      return;
    }
    const { error: err } = await supabase.from("appointments").insert({
      branch_id: branchId,
      doctor_id: doctorId,
      patient_id: patientId,
      start_time: slot.start.toISOString(),
      end_time: slot.end.toISOString(),
      status: "scheduled",
      notes: notes.trim() || null,
      created_by: user.id,
    });
    if (err) setError(err.message);
    else {
      router.push("/dashboard/appointments");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
      <div>
        <label className="block text-sm font-medium text-black">Branch</label>
        <select
          value={branchId}
          onChange={(e) => setBranchId(e.target.value)}
          required
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
        >
          <option value="">Select branch</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-black">Doctor</label>
        <select
          value={doctorId}
          onChange={(e) => setDoctorId(e.target.value)}
          required
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
        >
          <option value="">Select doctor</option>
          {doctorsInBranch.map((d) => (
            <option key={d.id} value={d.id}>{d.full_name || d.email || d.id}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-black">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          min={format(new Date(), "yyyy-MM-dd")}
          required
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-black">Time slot</label>
        {slots.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {slots.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => setSlot({ start: s.start, end: s.end })}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  slot && slot.start.getTime() === s.start.getTime()
                    ? "border-teal-500 bg-teal-50 text-teal-700"
                    : "border-slate-300 bg-white text-black hover:bg-slate-50"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-1 text-sm text-black">No slots available on this day. Doctor may not have schedule set.</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-black">Patient</label>
        <select
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          required
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
        >
          <option value="">Select patient</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>{p.full_name}</option>
          ))}
        </select>
        <p className="mt-1 text-xs text-black">
          <a href="/dashboard/patients/new" className="text-teal-600 hover:underline">Add new patient</a> if not listed.
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-black">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading || !slot}
        className="w-full rounded-lg bg-teal-600 px-4 py-2 font-medium text-white hover:bg-teal-700 disabled:opacity-50"
      >
        {loading ? "Booking…" : "Book appointment"}
      </button>
    </form>
  );
}
