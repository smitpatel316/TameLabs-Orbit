/**
 * Orbit Calendar Service
 * - Real path: expo-calendar via dynamic import
 * - Web path: shim (no native calendar)
 * Quality: safe guards, never crashes, shows upcoming birthdays as reminders
 */

export type BirthdayReminder = {
  contactId: string;
  name: string;
  birthday: string; // MM/DD
  nextDate: string; // ISO future
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
    // only within 60 days forward
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
  try {
    const mod: any = await import('expo-calendar').catch(() => null);
    if (!mod) return { granted: false, status: 'unavailable' };
    const { status } = await mod.requestCalendarPermissionsAsync();
    const { status: remStatus } = await mod.requestRemindersPermissionsAsync().catch(() => ({ status: 'undetermined' }));
    return { granted: status === 'granted', status };
  } catch {
    return { granted: false, status: 'error' };
  }
}

export async function syncBirthdaysToCalendar(
  birthdays: BirthdayReminder[],
  opts?: { calendarId?: string }
): Promise<CalendarOpResult> {
  try {
    const mod: any = await import('expo-calendar').catch(() => null);
    if (!mod) return { ok: false, msg: 'Calendar not available (install expo-calendar)' };

    const { status } = await mod.getCalendarPermissionsAsync().catch(() => ({ status: 'undetermined' }));
    if (status !== 'granted') {
      const req = await mod.requestCalendarPermissionsAsync();
      if (req.status !== 'granted') return { ok: false, msg: 'Calendar permission denied' };
    }

    // Find default calendar or first writable
    let targetCalId = opts?.calendarId;
    if (!targetCalId) {
      const cals = await mod.getCalendarsAsync(mod.EntityTypes.EVENT).catch(() => []);
      const writable = (cals || []).filter((c: any) => c.allowsModifications);
      const def = writable.find((c: any) => c.isPrimary) || writable[0];
      if (!def) return { ok: false, msg: 'No writable calendar found' };
      targetCalId = def.id;
    }

    let created = 0;
    for (const b of birthdays) {
      try {
        // Create all-day recurring yearly? Expo calendar: create yearly by RRULE if supported, else single
        const start = new Date(b.nextDate);
        const end = new Date(start);
        end.setHours(10, 0, 0, 0);
        await mod.createEventAsync(targetCalId, {
          title: `${b.name} birthday`,
          notes: `Orbit: ${b.name} birthday ${b.birthday}`,
          startDate: start,
          endDate: end,
          timeZone: 'UTC',
          alarms: [{ relativeOffset: -1440 }, { relativeOffset: -60 }], // 1d and 1h before
        });
        created++;
      } catch {}
    }
    return { ok: true, msg: `Added ${created} birthdays to calendar`, count: created };
  } catch (e: any) {
    return { ok: false, msg: e?.message || 'Calendar sync failed' };
  }
}
