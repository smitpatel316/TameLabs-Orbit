/** Orbit v2.7 Data Export Web - Blob URL download */
export type ExportableContact = {
  id: string; name: string; type: string; energy: string; healthScore?: number;
  createdAt?: string; lastInteraction?: string | null; birthday?: string | null;
  notes?: string; tags?: string[]; groupId?: string;
};

function esc(v: string): string {
  const s = String(v ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function buildGroupContactsCSV(contacts: ExportableContact[], calculateHealth?: (id: string) => number): string {
  const header = ['id','name','type','energy','health','lastInteraction','birthday','tags','notes','groupId','createdAt'];
  const rows = [header.join(',')];
  for (const c of contacts) {
    const health = c.healthScore ?? (calculateHealth ? calculateHealth(c.id) : 0);
    const tags = (c.tags||[]).join(';');
    rows.push([esc(c.id),esc(c.name),esc(c.type||''),esc(c.energy||''),esc(String(health)),esc(c.lastInteraction||''),esc(c.birthday||''),esc(tags),esc((c.notes||'').replace(/\n/g,' ')),esc(c.groupId||''),esc(c.createdAt||'')].join(','));
  }
  return rows.join('\n');
}

function downloadBlob(csv: string, filename: string) {
  if (typeof window==='undefined' || typeof document==='undefined') return false;
  try {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(()=>{ document.body.removeChild(a); URL.revokeObjectURL(url); }, 250);
    return true;
  } catch { return false; }
}

export async function exportGroupContacts(
  groupId: string, contacts: ExportableContact[], allGroups: { id: string; name: string }[], calculateHealth?: (id:string)=>number
): Promise<{ ok: boolean; msg: string; count: number }> {
  const g = allGroups.find(x=>x.id===groupId);
  const name = g?.name || 'group';
  const filtered = contacts.filter(c=>c.groupId===groupId);
  if (!filtered.length) return { ok: false, msg: `No contacts in ${name}`, count: 0 };
  const csv = buildGroupContactsCSV(filtered, calculateHealth);
  const filename = `orbit-${name.replace(/[^a-z0-9]/gi,'-').toLowerCase()}-${new Date().toISOString().slice(0,10)}.csv`;
  const ok = downloadBlob(csv, filename);
  return { ok, msg: ok ? `Downloaded ${filtered.length} contacts` : 'Download failed', count: filtered.length };
}

export async function exportAllGroupsCSV(
  contacts: ExportableContact[], groups: { id: string; name: string }[], calculateHealth?: (id:string)=>number
): Promise<{ ok: boolean; msg: string; count: number }> {
  if (!contacts.length) return { ok: false, msg: 'No contacts', count: 0 };
  const csv = buildGroupContactsCSV(contacts, calculateHealth);
  const filename = `orbit-all-contacts-${new Date().toISOString().slice(0,10)}.csv`;
  const ok = downloadBlob(csv, filename);
  return { ok, msg: ok ? `Downloaded ${contacts.length}` : 'Download failed', count: contacts.length };
}
