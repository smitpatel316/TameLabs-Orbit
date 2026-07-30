/**
 * Orbit Contacts Import Service
 * - Real path: expo-contacts via dynamic import
 * - Web path: .web.ts shim returns mock stub
 * Quality-first: permission flow, dedup, birthday parsing MM/DD
 */

export type SystemContact = {
  id: string;
  name: string;
  rawName: string;
  phoneNumbers?: string[];
  emails?: string[];
  birthday?: string | null;
  note?: string;
  imageAvailable?: boolean;
};

export type ImportCandidate = SystemContact & {
  alreadyExists: boolean;
  duplicateOf?: string;
};

function parseBirthday(raw: any): string | null {
  if (!raw) return null;
  try {
    if (typeof raw === 'string') {
      const s = raw.trim();
      if (!s) return null;
      const m = s.match(/(\d{1,2})[\/\-](\d{1,2})/);
      if (m) {
        const mo = m[1].padStart(2, '0');
        const day = m[2].padStart(2, '0');
        return `${mo}/${day}`;
      }
      return null;
    }
    if (raw.month != null && raw.day != null) {
      const mo = String(raw.month).padStart(2, '0');
      const day = String(raw.day).padStart(2, '0');
      const moN = parseInt(mo, 10);
      const dayN = parseInt(day, 10);
      if (moN >= 1 && moN <= 12 && dayN >= 1 && dayN <= 31) return `${mo}/${day}`;
    }
    if (raw instanceof Date) {
      const mo = String(raw.getMonth() + 1).padStart(2, '0');
      const day = String(raw.getDate()).padStart(2, '0');
      return `${mo}/${day}`;
    }
  } catch {}
  return null;
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

export async function requestContactsPermission(): Promise<{
  granted: boolean;
  canAskAgain: boolean;
  status: string;
}> {
  try {
    const mod: any = await import('expo-contacts').catch(() => null);
    if (!mod) {
      return { granted: false, canAskAgain: true, status: 'unavailable' };
    }
    const { status, canAskAgain } = await mod.requestPermissionsAsync();
    return { granted: status === 'granted', canAskAgain: !!canAskAgain, status };
  } catch {
    return { granted: false, canAskAgain: true, status: 'error' };
  }
}

export async function getContactsPermissionStatus(): Promise<string> {
  try {
    const mod: any = await import('expo-contacts').catch(() => null);
    if (!mod) return 'unavailable';
    const { status } = await mod.getPermissionsAsync();
    return status;
  } catch {
    return 'unknown';
  }
}

export async function fetchSystemContacts(): Promise<SystemContact[]> {
  try {
    const mod: any = await import('expo-contacts').catch(() => null);
    if (!mod) return [];
    const { status } = await mod.getPermissionsAsync();
    if (status !== 'granted') return [];
    const { data } = await mod.getContactsAsync({
      fields: [mod.Fields.Name, mod.Fields.PhoneNumbers, mod.Fields.Emails, mod.Fields.Birthday, mod.Fields.Note, mod.Fields.ImageAvailable],
      sort: mod.SortTypes.FirstName,
    });
    if (!data) return [];
    const out: SystemContact[] = [];
    for (const c of data) {
      const name = (c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.nickname || '').trim();
      if (!name || name.length < 1) continue;
      if (name.length > 80) continue;
      const phoneNumbers = (c.phoneNumbers || [])
        .map((p: any) => p.number || p.digits || String(p))
        .filter(Boolean)
        .slice(0, 3);
      const emails = (c.emails || [])
        .map((e: any) => e.email || String(e))
        .filter(Boolean)
        .slice(0, 3);
      let birthday: string | null = null;
      if (c.birthday) birthday = parseBirthday(c.birthday);
      if (!birthday && (c as any).birthdayMonth != null) {
        birthday = parseBirthday({ month: (c as any).birthdayMonth, day: (c as any).birthdayDay });
      }
      out.push({
        id: String(c.id || c.lookupKey || `${name}-${out.length}`),
        name,
        rawName: c.name || name,
        phoneNumbers,
        emails,
        birthday,
        note: c.note ? String(c.note).slice(0, 500) : undefined,
        imageAvailable: !!c.imageAvailable,
      });
    }
    return out;
  } catch {
    return [];
  }
}

export function buildImportCandidates(system: SystemContact[], existingNames: string[]): ImportCandidate[] {
  const existingNorm = new Map<string, string>();
  for (const n of existingNames) existingNorm.set(normalizeName(n), n);
  return system
    .map((sc) => {
      const norm = normalizeName(sc.name);
      const dup = existingNorm.get(norm);
      return {
        ...sc,
        alreadyExists: !!dup,
        duplicateOf: dup,
      };
    })
    .sort((a, b) => {
      if (a.alreadyExists !== b.alreadyExists) return a.alreadyExists ? 1 : -1;
      return a.name.localeCompare(b.name);
    });
}

export function filterCandidates(cands: ImportCandidate[], query: string): ImportCandidate[] {
  const q = query.trim().toLowerCase();
  if (!q) return cands;
  return cands.filter((c) => c.name.toLowerCase().includes(q) || (c.emails || []).some((e) => e.toLowerCase().includes(q)));
}
