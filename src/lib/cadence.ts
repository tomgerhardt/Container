import type { EventCadence } from "@/types";

export function generateEventsFromCadence(cadence: EventCadence): Date[] {
  const results: Date[] = [];
  const start = cadence.startDate.toDate();
  const qty = Math.min(Math.max(1, cadence.qtyAhead), 100);

  let current = new Date(start);

  while (results.length < qty) {
    const candidate = getNextOccurrence(current, cadence, results.length === 0);
    if (!candidate) break;
    results.push(candidate);
    current = new Date(candidate.getTime() + 1000 * 60); // 1 min after to avoid duplicates
  }

  return results;
}

function getNextOccurrence(from: Date, cadence: EventCadence, isFirst: boolean): Date | null {
  const { frequency, every } = cadence;

  if (frequency === "daily") {
    const d = new Date(from);
    if (!isFirst) d.setDate(d.getDate() + every);
    return applyTime(d, cadence.time);
  }

  if (frequency === "weekly") {
    const targetDays = cadence.daysOfWeek ?? [1]; // default Monday
    const d = new Date(from);
    if (!isFirst) d.setDate(d.getDate() + 1);

    for (let i = 0; i < 7 * every * 2; i++) {
      if (targetDays.includes(d.getDay())) {
        return applyTime(d, cadence.time);
      }
      d.setDate(d.getDate() + 1);
    }
    return null;
  }

  if (frequency === "monthly") {
    const d = new Date(from);
    if (!isFirst) d.setMonth(d.getMonth() + every);

    if (cadence.useWeekdayOfMonth && cadence.weekOfMonth != null && cadence.weekdayOfMonth != null) {
      return getNthWeekdayOfMonth(d.getFullYear(), d.getMonth(), cadence.weekOfMonth, cadence.weekdayOfMonth, cadence.time);
    } else {
      const day = cadence.dayOfMonth ?? 1;
      const result = new Date(d.getFullYear(), d.getMonth(), day);
      if (!isFirst && result <= from) {
        result.setMonth(result.getMonth() + every);
      }
      return applyTime(result, cadence.time);
    }
  }

  if (frequency === "yearly") {
    const d = new Date(from);
    if (!isFirst) d.setFullYear(d.getFullYear() + every);
    const result = new Date(d.getFullYear(), cadence.monthOfYear ?? 0, cadence.dayOfMonth ?? 1);
    if (!isFirst && result <= from) result.setFullYear(result.getFullYear() + every);
    return applyTime(result, cadence.time);
  }

  return null;
}

function getNthWeekdayOfMonth(year: number, month: number, week: number, weekday: number, time: string): Date {
  const first = new Date(year, month, 1);
  const firstWeekday = first.getDay();
  let day = 1 + ((weekday - firstWeekday + 7) % 7) + (week - 1) * 7;
  // If overflows the month, go back one week
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  if (day > daysInMonth) day -= 7;
  return applyTime(new Date(year, month, day), time);
}

function applyTime(date: Date, time: string): Date {
  const result = new Date(date);
  // Parse "7:30pm", "10:00am", etc.
  const match = time.match(/^(\d{1,2}):(\d{2})(am|pm)$/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const meridiem = match[3].toLowerCase();
    if (meridiem === "pm" && hours !== 12) hours += 12;
    if (meridiem === "am" && hours === 12) hours = 0;
    result.setHours(hours, minutes, 0, 0);
  }
  return result;
}

export function formatOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}
