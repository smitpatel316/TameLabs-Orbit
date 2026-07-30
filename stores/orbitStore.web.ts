import React from 'react';

export const RELATIONSHIP_TYPES: Record<string, { emoji: string; color: string; label: string }> = {
  family: { emoji: 'FAM', color: '#E53E3E', label: 'Family' },
  friend: { emoji: 'FR', color: '#3182CE', label: 'Friend' },
  professional: { emoji: 'WORK', color: '#D69E2E', label: 'Professional' },
  romantic: { emoji: 'LOVE', color: '#D53F8C', label: 'Romantic' },
  acquaintance: { emoji: 'HI', color: '#718096', label: 'Acquaintance' },
};
export const ENERGY_LEVELS: Record<string, { value: number; label: string; color: string }> = {
  draining: { value: -2, label: 'Draining', color: '#E53E3E' },
  low: { value: -1, label: 'Low', color: '#ED8936' },
  neutral: { value: 0, label: 'Neutral', color: '#A0AEC0' },
  good: { value: 1, label: 'Good', color: '#38A169' },
  nourishing: { value: 2, label: 'Nourishing', color: '#3182CE' },
};

export type Contact = { id: string; name: string; type: keyof typeof RELATIONSHIP_TYPES; energy: keyof typeof ENERGY_LEVELS; healthScore: number; createdAt: string; lastInteraction: string | null; birthday: string | null; notes?: string; tags?: string[]; };
export type Interaction = { id: string; contactId: string; date: string; type: string; summary: string; topics?: string[]; sentiment?: string; energy?: string; createdAt: string; };
export type Group = { id: string; name: string };
export type Reminder = { id: string; contactId: string; message: string; dueDate: string; done: boolean; createdAt: string };

const KEY = 'orbit-v2-web';
const safeLoad = () => {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null;
    const s = localStorage.getItem(KEY);
    if (!s) return null;
    return JSON.parse(s);
  } catch { return null; }
};
const safeSave = (state: any) => {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    localStorage.setItem(KEY, JSON.stringify({ contacts: state.contacts, interactions: state.interactions, tags: state.tags, groups: state.groups, reminders: state.reminders }));
  } catch {}
};

const initialData = { contacts: [], interactions: [], tags: ['Work','Family','Friends'], groups: [], reminders: [] };

type BulkResult = { imported: number; skipped: number; importedContacts: Contact[] };

type OrbitState = {
  contacts: Contact[]; interactions: Interaction[]; tags: string[]; groups: Group[]; reminders: Reminder[];
  addContact: (c: any) => Contact;
  updateContact: (id: string, u: any) => void;
  deleteContact: (id: string) => void;
  addTag: (t: string) => void; removeTag: (t: string) => void;
  addGroup: (n: string) => Group; deleteGroup: (id: string) => void;
  addInteraction: (i: any) => Interaction;
  getContactWithInteractions: (id: string) => any;
  calculateHealthScore: (id: string) => number;
  getNeedingAttention: () => any[];
  getByType: (type: string) => Contact[];
  getStats: () => any;
  addReminder: (r: any) => Reminder;
  toggleReminder: (id: string) => void;
  deleteReminder: (id: string) => void;
  bulkImportContacts: (incoming: { name: string; birthday?: string | null; notes?: string; tags?: string[] }[]) => BulkResult;
};

let memoryState: OrbitState = (() => {
  const loaded = safeLoad();
  const base = loaded || initialData;
  const state: any = {
    contacts: base.contacts || [],
    interactions: base.interactions || [],
    tags: base.tags || ['Work','Family','Friends'],
    groups: base.groups || [],
    reminders: base.reminders || [],
  };
  return state as OrbitState;
})();

const listeners = new Set<() => void>();
const notify = () => listeners.forEach(l => l());

const calcHealth = (contactId: string) => {
  const c = memoryState.contacts.find(x => x.id === contactId);
  if (!c) return 0;
  const its = memoryState.interactions.filter(i => i.contactId === contactId).slice(0,10);
  if (!its.length) return 100;
  const recency = c.lastInteraction ? Math.max(0, 100 - Math.floor((Date.now()-new Date(c.lastInteraction).getTime())/86400000)*2) : 50;
  const freq = Math.min(100, its.length*15);
  const avg = its.reduce((acc,cur:any)=>acc+((ENERGY_LEVELS as any)[cur.energy||c.energy]?.value||0),0)/its.length;
  const eScore = Math.round((avg+2)/4*100);
  return Math.round(recency*0.3 + freq*0.3 + eScore*0.4);
};

export const useOrbitStore = (selector?: any) => {
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    const l = () => setTick(t=>t+1);
    listeners.add(l);
    // Load from localStorage on mount (client side)
    const loaded = safeLoad();
    if (loaded) {
      memoryState = { ...memoryState, contacts: loaded.contacts||[], interactions: loaded.interactions||[], tags: loaded.tags||['Work','Family','Friends'], groups: loaded.groups||[], reminders: loaded.reminders||[], } as any;
      // re-add methods below
      Object.assign(memoryState, methods);
      setTick(t=>t+1);
    }
    return () => { listeners.delete(l); };
  }, []);

  const methods: any = {
    addContact: (c: any) => {
      const contact: Contact = { id:'c_'+Date.now(), name:c.name, type:c.type||'friend', energy:c.energy||'neutral', healthScore:100, createdAt:new Date().toISOString(), lastInteraction:null, birthday:c.birthday||null, notes:c.notes, tags:c.tags||[] };
      memoryState.contacts = [contact, ...memoryState.contacts];
      safeSave(memoryState); notify(); return contact;
    },
    updateContact: (id: string, u: any) => { memoryState.contacts = memoryState.contacts.map(x=>x.id===id?{...x,...u}:x); safeSave(memoryState); notify(); },
    deleteContact: (id: string) => { memoryState.contacts = memoryState.contacts.filter(x=>x.id!==id); memoryState.interactions = memoryState.interactions.filter(x=>x.contactId!==id); memoryState.reminders = memoryState.reminders.filter(x=>x.contactId!==id); safeSave(memoryState); notify(); },
    addTag: (t: string) => { if (!memoryState.tags.includes(t)) { memoryState.tags = [...memoryState.tags, t]; safeSave(memoryState); notify(); } },
    removeTag: (t: string) => { memoryState.tags = memoryState.tags.filter(x=>x!==t); safeSave(memoryState); notify(); },
    addGroup: (n: string) => { const g={id:'g_'+Date.now(), name:n}; memoryState.groups=[...memoryState.groups,g]; safeSave(memoryState); notify(); return g; },
    deleteGroup: (id: string) => { memoryState.groups=memoryState.groups.filter(x=>x.id!==id); safeSave(memoryState); notify(); },
    addInteraction: (i: any) => { const inter: Interaction={id:'i_'+Date.now(), contactId:i.contactId, date:i.date||new Date().toISOString(), type:i.type||'other', summary:i.summary||'', topics:i.topics, sentiment:i.sentiment, energy:i.energy, createdAt:new Date().toISOString()}; memoryState.contacts=memoryState.contacts.map(c=>c.id===i.contactId?{...c,lastInteraction:inter.date}:c); memoryState.interactions=[inter,...memoryState.interactions]; safeSave(memoryState); notify(); return inter; },
    getContactWithInteractions: (contactId: string) => ({ contact: memoryState.contacts.find(c=>c.id===contactId), interactions: memoryState.interactions.filter(i=>i.contactId===contactId).sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime()) }),
    calculateHealthScore: calcHealth,
    getNeedingAttention: () => memoryState.contacts.map(c=>({...c, healthScore:calcHealth(c.id)})).filter((c:any)=>c.healthScore<70).sort((a:any,b:any)=>a.healthScore-b.healthScore),
    getByType: (type: string) => memoryState.contacts.filter(c=>c.type===type),
    getStats: () => { const byType: any={}; memoryState.contacts.forEach(c=>{byType[c.type]=(byType[c.type]||0)+1;}); return { totalContacts:memoryState.contacts.length, totalInteractions:memoryState.interactions.length, byType }; },
    addReminder: (r: any) => { const rem: Reminder={id:'r_'+Date.now(), contactId:r.contactId, message:r.message, dueDate:r.dueDate||new Date().toISOString(), done:false, createdAt:new Date().toISOString()}; memoryState.reminders=[rem,...memoryState.reminders]; safeSave(memoryState); notify(); return rem; },
    toggleReminder: (id: string) => { memoryState.reminders=memoryState.reminders.map(rr=>rr.id===id?{...rr,done:!rr.done}:rr); safeSave(memoryState); notify(); },
    deleteReminder: (id: string) => { memoryState.reminders=memoryState.reminders.filter(rr=>rr.id!==id); safeSave(memoryState); notify(); },
    bulkImportContacts: (incoming: any[]) => {
      const norm = (n: string) => n.trim().toLowerCase().replace(/\s+/g,' ');
      const existingNorm = new Set<string>(memoryState.contacts.map((c:any)=>norm(c.name)));
      const newOnes: Contact[] = [];
      let skipped = 0;
      const seen = new Set<string>();
      for (const it of incoming) {
        const nm = it.name?.trim();
        if (!nm || nm.length<1 || nm.length>80) { skipped++; continue; }
        const key = norm(nm);
        if (existingNorm.has(key) || seen.has(key)) { skipped++; continue; }
        seen.add(key);
        const contact: Contact = { id:'c_'+Date.now()+'_'+newOnes.length+'_'+Math.random().toString(36).slice(2,5), name:nm, type:'acquaintance' as any, energy:'neutral' as any, healthScore:100, createdAt:new Date().toISOString(), lastInteraction:null, birthday: it.birthday||null, notes: it.notes||'', tags: it.tags||[] };
        newOnes.push(contact);
      }
      if (newOnes.length) {
        memoryState.contacts = [...newOnes.reverse(), ...memoryState.contacts];
        safeSave(memoryState); notify();
      }
      return { imported: newOnes.length, skipped, importedContacts: newOnes };
    },
  };

  // Merge methods into memoryState for selector access
  Object.assign(memoryState, methods);
  const fullState = memoryState as any;

  if (typeof selector === 'function') {
    return selector(fullState);
  }
  return fullState;
};
