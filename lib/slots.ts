import {
  addMinutes,
  setHours,
  setMinutes,
  parseISO,
  format,
  isWithinInterval,
  startOfDay,
  getDay,
} from "date-fns";

export interface ScheduleRow {
  day_of_week: number;
  start_time: string; // "09:00:00"
  end_time: string;
  slot_duration_minutes: number;
}

export interface AppointmentRow {
  start_time: string;
  end_time: string;
}

/**
 * Get available time slots for a doctor at a branch on a given date.
 * Uses weekly schedule and subtracts existing appointments.
 */
export function getAvailableSlots(
  date: Date,
  schedules: ScheduleRow[],
  appointments: AppointmentRow[],
  slotDurationMinutes: number = 30
): { start: Date; end: Date; label: string }[] {
  const dayOfWeek = getDay(date); // 0 = Sun, 6 = Sat
  const daySchedules = schedules.filter((s) => s.day_of_week === dayOfWeek);
  if (daySchedules.length === 0) return [];

  const slots: { start: Date; end: Date; label: string }[] = [];
  const dayStart = startOfDay(date);

  for (const s of daySchedules) {
    const [sh, sm] = s.start_time.split(":").map(Number);
    const [eh, em] = s.end_time.split(":").map(Number);
    let slotStart = setMinutes(setHours(dayStart, sh), sm);
    const scheduleEnd = setMinutes(setHours(dayStart, eh), em);

    while (slotStart < scheduleEnd) {
      const slotEnd = addMinutes(slotStart, slotDurationMinutes);
      if (slotEnd > scheduleEnd) break;

      const overlaps = appointments.some(
        (a) =>
          isWithinInterval(slotStart, {
            start: parseISO(a.start_time),
            end: parseISO(a.end_time),
          }) ||
          isWithinInterval(slotEnd, {
            start: parseISO(a.start_time),
            end: parseISO(a.end_time),
          }) ||
          (parseISO(a.start_time) <= slotStart && parseISO(a.end_time) >= slotEnd)
      );
      if (!overlaps) {
        slots.push({
          start: slotStart,
          end: slotEnd,
          label: format(slotStart, "HH:mm") + " – " + format(slotEnd, "HH:mm"),
        });
      }
      slotStart = slotEnd;
    }
  }

  return slots.sort((a, b) => a.start.getTime() - b.start.getTime());
}
