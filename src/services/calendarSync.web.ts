/**
 * Web shim for calendar sync - no native calendar, build upcoming list only
 */

export type BirthdayReminder = {
  contactId: string;
  name: string;
  birthday: string;
  nextDate: string;
  daysUntil: number;
};

export type CalendarOpResult = {
  ok: boolean;
  msg: string;
  count?: number;
};

function daysUntilNextBirthday(mmdd: string): { next: Date; days: number } | null {
  try {
    const m = mmdd.match(/^(\d{2})\/(\d{2})$/);
    if (!m) return null;
    const mo = parseInt(m[1], 10) - 1;
    const day = parseInt(m[2], 10);
    if (mo < 0 || mo > 11 || day < 1 || day > 31) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    let next = new Date(now.getFullYear(), mo, day);
    next.setHours(9, 0, 0, 0);
    if (next < now) next = new Date(now.getFullYear() + 1, mo, day, 9, 0, 0, 0);
    const diff = Math.ceil((next.getTime() - now.getTime()) / 86400000);
    return { next, days: diff };
  } catch {
    return null;
  }
}

export function buildUpcomingBirthdays(contacts: { id: string; name: string; birthday: string | null }[]): BirthdayReminder[] {
  const out: BirthdayReminder[] = [];
  for (const c of contacts) {
    if (!c.birthday) continue;
    const d = daysUntilNextBirthday(c.birthday);
    if (!d) continue;
    if (d.days <= 60) {
      out.push({
        contactId: c.id,
        name: c.name,
        birthday: c.birthday!,
        nextDate: d.next.toISOString(),
        daysUntil: d.days,
      });
    }
  }
  return out.sort((a, b) => a.daysUntil - b.daysUntil);
}

export async function requestCalendarPermission(): Promise<{ granted: boolean; status: string }> {
  return { granted: false, status: 'web-unavailable' };
}

export async function syncBirthdaysToCalendar(
  _birthdays: BirthdayReminder[],
  _opts?: { calendarId?: string }
): Promise<CalendarOpResult> {
  return { ok: false, msg: 'Calendar sync not available on web - use Orbit mobile app for calendar sync' };
}
