/** Orbit v2.7 Data Export - Group CSV */
import { theme } from '../theme';

export type ExportableContact = {
  id: string;
  name: string;
  type: string;
  energy: string;
  healthScore?: number;
  createdAt?: string;
  lastInteraction?: string | null;
  birthday?: string | null;
  notes?: string;
  tags?: string[];
  groupId?: string;
};

function esc(v: string): string {
  const s = String(v ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function buildGroupContactsCSV(contacts: ExportableContact[], calculateHealth?: (id: string) => number): string {
  const header = ['id','name','type','energy','health','lastInteraction','birthday','tags','notes','groupId','createdAt'];
  const rows = [header.join(',')];
  for (const c of contacts) {
    const health = c.healthScore ?? (calculateHealth ? calculateHealth(c.id) : 0);
    const tags = (c.tags || []).join(';');
    rows.push([
      esc(c.id),
      esc(c.name),
      esc(c.type || ''),
      esc(c.energy || ''),
      esc(String(health)),
      esc(c.lastInteraction || ''),
      esc(c.birthday || ''),
      esc(tags),
      esc((c.notes || '').replace(/\n/g,' ')),
      esc(c.groupId || ''),
      esc(c.createdAt || ''),
    ].join(','));
  }
  return rows.join('\n');
}

export async function exportGroupContacts(
  groupId: string,
  contacts: ExportableContact[],
  allGroups: { id: string; name: string }[],
  calculateHealth?: (id: string) => number
): Promise<{ ok: boolean; msg: string; count: number }> {
  try {
    const g = allGroups.find(x => x.id === groupId);
    const groupName = g?.name || 'group';
    const filtered = contacts.filter(c => c.groupId === groupId);
    if (filtered.length === 0) return { ok: false, msg: `No contacts in ${groupName}`, count: 0 };
    const csv = buildGroupContactsCSV(filtered, calculateHealth);
    const filename = `orbit-${groupName.replace(/[^a-z0-9]/gi,'-').toLowerCase()}-${new Date().toISOString().slice(0,10)}.csv`;

    // Dynamic import expo-file-system + expo-sharing - safe fallback
    const fsMod: any = await import('expo-file-system').catch(() => null);
    if (fsMod) {
      try {
        const dir = (fsMod.documentDirectory || fsMod.cacheDirectory || '') as string;
        const path = `${dir}${filename}`;
        // @ts-ignore FileSystem API v15+ uses writeAsStringAsync in legacy, newer uses File API; try both
        if (fsMod.File && fsMod.Paths) {
          const file = new fsMod.File(new fsMod.Paths.document, filename);
          try { file.create(); } catch {}
          await file.write(csv).catch(async () => {
            // fallback legacy
            if (fsMod.writeAsStringAsync) await fsMod.writeAsStringAsync(path, csv);
          });
        } else if (fsMod.writeAsStringAsync) {
          await fsMod.writeAsStringAsync(path, csv);
        }
        const sharingMod: any = await import('expo-sharing').catch(() => null);
        if (sharingMod && (await sharingMod.isAvailableAsync().catch(() => false))) {
          await sharingMod.shareAsync(path, { mimeType: 'text/csv', dialogTitle: `Export ${groupName}` });
          return { ok: true, msg: `Exported ${filtered.length} contacts`, count: filtered.length };
        }
        // fallback to RN Share
        const { Share } = await import('react-native').catch(() => ({ Share: null } as any));
        if (Share && Share.share) {
          await Share.share({ message: csv, title: filename });
        }
        return { ok: true, msg: `Exported ${filtered.length} contacts to ${filename}`, count: filtered.length };
      } catch (e:any) {
        // fallback to Share with CSV text
        try {
          const { Share } = await import('react-native').catch(() => ({ Share: null } as any));
          if (Share?.share) await Share.share({ message: csv, title: filename });
          return { ok: true, msg: `Exported ${filtered.length} as text share`, count: filtered.length };
        } catch {}
        return { ok: false, msg: e?.message || 'Export failed', count: 0 };
      }
    }
    // No fs module: RN Share fallback
    try {
      const { Share } = await import('react-native').catch(() => ({ Share: null } as any));
      if (Share?.share) {
        await Share.share({ message: csv, title: filename });
        return { ok: true, msg: `Exported ${filtered.length} contacts`, count: filtered.length };
      }
    } catch {}
    return { ok: false, msg: 'File system not available - install expo-file-system', count: 0 };
  } catch (e:any) {
    return { ok: false, msg: e?.message || 'Export failed', count: 0 };
  }
}

export async function exportAllGroupsCSV(
  contacts: ExportableContact[],
  groups: { id: string; name: string }[],
  calculateHealth?: (id: string) => number
): Promise<{ ok: boolean; msg: string; count: number }> {
  if (!contacts.length) return { ok: false, msg: 'No contacts', count: 0 };
  const csv = buildGroupContactsCSV(contacts, calculateHealth);
  const filename = `orbit-all-contacts-${new Date().toISOString().slice(0,10)}.csv`;
  const fsMod: any = await import('expo-file-system').catch(() => null);
  if (fsMod) {
    try {
      const dir = (fsMod.documentDirectory || fsMod.cacheDirectory || '') as string;
      const path = `${dir}${filename}`;
      if (fsMod.File && fsMod.Paths) {
        const file = new fsMod.File(new fsMod.Paths.document, filename);
        try { file.create(); } catch {}
        await file.write(csv).catch(async () => { if (fsMod.writeAsStringAsync) await fsMod.writeAsStringAsync(path, csv); });
      } else if (fsMod.writeAsStringAsync) {
        await fsMod.writeAsStringAsync(path, csv);
      }
      const sharingMod: any = await import('expo-sharing').catch(() => null);
      if (sharingMod && (await sharingMod.isAvailableAsync().catch(() => false))) {
        await sharingMod.shareAsync(path, { mimeType: 'text/csv', dialogTitle: 'Export all contacts' });
        return { ok: true, msg: `Exported ${contacts.length}`, count: contacts.length };
      }
      const { Share } = await import('react-native').catch(() => ({ Share: null } as any));
      if (Share?.share) await Share.share({ message: csv, title: filename });
      return { ok: true, msg: `Exported ${contacts.length}`, count: contacts.length };
    } catch (e:any) { return { ok: false, msg: e?.message||'Failed', count: 0 }; }
  }
  return { ok: false, msg: 'FS unavailable', count: 0 };
}
