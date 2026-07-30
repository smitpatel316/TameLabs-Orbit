/**
 * Web shim for contacts import - no native permission, returns empty + hint message
 * Metro resolves .web.ts over .ts on web automatically
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

export async function requestContactsPermission(): Promise<{
  granted: boolean;
  canAskAgain: boolean;
  status: string;
}> {
  // Web: contacts API not available, use mock demo data for QA
  if (typeof window !== 'undefined') {
    // Allow user to proceed with mock demo import on web for testing
    return { granted: true, canAskAgain: false, status: 'web-mock' };
  }
  return { granted: false, canAskAgain: false, status: 'unavailable-web' };
}

export async function getContactsPermissionStatus(): Promise<string> {
  if (typeof window !== 'undefined') return 'web-mock';
  return 'unavailable';
}

function genMockContacts(): SystemContact[] {
  const names = [
    'Alex Rivera',
    'Jordan Chen',
    'Sam Patel',
    'Morgan Lee',
    'Casey Kim',
    'Taylor Brooks',
    'Riley Singh',
    'Avery Johnson',
    'Quinn Davis',
    'Blake Wilson',
  ];
  return names.map((name, i) => ({
    id: `web-mock-${i}`,
    name,
    rawName: name,
    phoneNumbers: [`555-01${String(i).padStart(2, '0')}`],
    emails: [`${name.toLowerCase().replace(' ', '.')}@example.com`],
    birthday: i % 3 === 0 ? `0${(i % 9) + 1}/15` : null,
    note: i % 2 === 0 ? `Met at demo event ${i}` : undefined,
    imageAvailable: false,
  }));
}

export async function fetchSystemContacts(): Promise<SystemContact[]> {
  // Web: return mock list for testing the import UI
  if (typeof window !== 'undefined') return genMockContacts();
  return [];
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function buildImportCandidates(system: SystemContact[], existingNames: string[]): ImportCandidate[] {
  const existingNorm = new Map<string, string>();
  for (const n of existingNames) existingNorm.set(normalizeName(n), n);
  return system
    .map((sc) => {
      const norm = normalizeName(sc.name);
      const dup = existingNorm.get(norm);
      return { ...sc, alreadyExists: !!dup, duplicateOf: dup };
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
