// Orbit Store - Relationship management (Fixed syntax errors, fully typed)
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const RELATIONSHIP_TYPES: Record<string, { emoji: string; color: string; label: string }> = {
  family: { emoji: '👨‍👩‍👧', color: '#E53E3E', label: 'Family' },
  friend: { emoji: '🤝', color: '#3182CE', label: 'Friend' },
  professional: { emoji: '💼', color: '#D69E2E', label: 'Professional' },
  romantic: { emoji: '💕', color: '#D53F8C', label: 'Romantic' },
  acquaintance: { emoji: '👋', color: '#718096', label: 'Acquaintance' },
};

export const ENERGY_LEVELS: Record<string, { value: number; label: string; color: string }> = {
  draining: { value: -2, label: 'Draining', color: '#E53E3E' },
  low: { value: -1, label: 'Low', color: '#ED8936' },
  neutral: { value: 0, label: 'Neutral', color: '#A0AEC0' },
  good: { value: 1, label: 'Good', color: '#38A169' },
  nourishing: { value: 2, label: 'Nourishing', color: '#3182CE' },
};

export type Contact = {
  id: string;
  name: string;
  type: keyof typeof RELATIONSHIP_TYPES;
  energy: keyof typeof ENERGY_LEVELS;
  healthScore: number;
  createdAt: string;
  lastInteraction: string | null;
  birthday: string | null;
  notes?: string;
  tags?: string[];
  groupId?: string;
};

export type Interaction = {
  id: string;
  contactId: string;
  date: string;
  type: 'call' | 'text' | 'in-person' | 'email' | 'other';
  summary: string;
  topics?: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  energy?: keyof typeof ENERGY_LEVELS;
  createdAt: string;
};

export type Group = { id: string; name: string; color?: string };
export type Reminder = { id: string; contactId: string; message: string; dueDate: string; done: boolean; createdAt: string };

interface OrbitState {
  contacts: Contact[];
  interactions: Interaction[];
  tags: string[];
  groups: Group[];
  reminders: Reminder[];
  addContact: (c: Partial<Contact> & { name: string }) => Contact;
  updateContact: (id: string, updates: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  addGroup: (name: string) => Group;
  deleteGroup: (id: string) => void;
  addInteraction: (i: Partial<Interaction> & { contactId: string }) => Interaction;
  getContactWithInteractions: (contactId: string) => { contact?: Contact; interactions: Interaction[] };
  calculateHealthScore: (contactId: string) => number;
  getNeedingAttention: () => Contact[];
  getByType: (type: string) => Contact[];
  getStats: () => { totalContacts: number; totalInteractions: number; byType: Record<string, number> };
  addReminder: (r: Partial<Reminder> & { contactId: string; message: string }) => Reminder;
  toggleReminder: (id: string) => void;
  deleteReminder: (id: string) => void;
}

export const useOrbitStore = create<OrbitState>()(
  persist(
    (set, get) => ({
      contacts: [],
      interactions: [],
      tags: ['Work', 'Family', 'Friends', 'Sports', 'Tech'],
      groups: [],
      reminders: [],

      addContact: (contact) => {
        const newContact: Contact = {
          id: Date.now().toString() + Math.random().toString(36).slice(2, 5),
          name: contact.name,
          type: (contact.type as any) || 'acquaintance',
          energy: (contact.energy as any) || 'neutral',
          healthScore: 100,
          createdAt: new Date().toISOString(),
          lastInteraction: null,
          birthday: null,
          notes: contact.notes || '',
          tags: contact.tags || [],
          groupId: contact.groupId,
        };
        set((state) => ({
          contacts: [newContact, ...state.contacts],
        }));
        return newContact;
      },

      updateContact: (id, updates) => {
        set((state) => ({
          contacts: state.contacts.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        }));
      },

      deleteContact: (id) => {
        set((state) => ({
          contacts: state.contacts.filter((c) => c.id !== id),
          interactions: state.interactions.filter((i) => i.contactId !== id),
          reminders: state.reminders.filter((r) => r.contactId !== id),
        }));
      },

      addTag: (tag) => {
        const t = tag.trim();
        if (!t) return;
        set((state) => ({
          tags: state.tags.includes(t) ? state.tags : [...state.tags, t],
        }));
      },

      removeTag: (tag) => {
        set((state) => ({ tags: state.tags.filter((t) => t !== tag) }));
      },

      addGroup: (name) => {
        const newGroup: Group = { id: Date.now().toString(), name: name.trim() };
        set((state) => ({ groups: [...state.groups, newGroup] }));
        return newGroup;
      },

      deleteGroup: (id) => {
        set((state) => ({ groups: state.groups.filter((g) => g.id !== id) }));
      },

      addInteraction: (interaction) => {
        const newInteraction: Interaction = {
          id: Date.now().toString() + Math.random().toString(36).slice(2, 5),
          contactId: interaction.contactId,
          date: interaction.date || new Date().toISOString(),
          type: interaction.type || 'other',
          summary: interaction.summary || '',
          topics: interaction.topics || [],
          sentiment: interaction.sentiment || 'neutral',
          energy: interaction.energy || 'neutral',
          createdAt: new Date().toISOString(),
        };
        set((state) => {
          const updatedContacts = state.contacts.map((c) =>
            c.id === interaction.contactId ? { ...c, lastInteraction: new Date().toISOString() } : c
          );
          return {
            contacts: updatedContacts,
            interactions: [newInteraction, ...state.interactions],
          };
        });
        return newInteraction;
      },

      getContactWithInteractions: (contactId) => {
        const { contacts, interactions } = get();
        const contact = contacts.find((c) => c.id === contactId);
        const contactInteractions = interactions.filter((i) => i.contactId === contactId);
        return { contact, interactions: contactInteractions };
      },

      calculateHealthScore: (contactId) => {
        const { contacts, interactions } = get();
        const contact = contacts.find((c) => c.id === contactId);
        if (!contact) return 0;
        const contactInteractions = interactions.filter((i) => i.contactId === contactId).slice(0, 10);
        if (contactInteractions.length === 0) return 100;
        const daysSinceLast = contact.lastInteraction
          ? Math.floor((Date.now() - new Date(contact.lastInteraction).getTime()) / (1000 * 60 * 60 * 24))
          : 365;
        const recencyScore = Math.max(0, 100 - daysSinceLast * 2);
        const frequencyScore = Math.min(100, contactInteractions.length * 10);
        const energyValue = ENERGY_LEVELS[contact.energy]?.value ?? 0;
        const energyScore = ((energyValue + 2) / 4) * 100;
        // bonus for positive sentiment
        const positiveCount = contactInteractions.filter((i) => i.sentiment === 'positive').length;
        const sentimentBonus = contactInteractions.length ? (positiveCount / contactInteractions.length) * 10 : 0;
        return Math.round(recencyScore * 0.3 + frequencyScore * 0.3 + energyScore * 0.35 + sentimentBonus * 0.05);
      },

      getNeedingAttention: () => {
        const { contacts } = get();
        return contacts
          .map((c) => ({ ...c, healthScore: get().calculateHealthScore(c.id) }))
          .filter((c) => c.healthScore < 70)
          .sort((a, b) => a.healthScore - b.healthScore);
      },

      getByType: (type) => {
        const { contacts } = get();
        return contacts.filter((c) => c.type === type);
      },

      getStats: () => {
        const { contacts, interactions } = get();
        const types: Record<string, number> = {};
        contacts.forEach((c) => {
          types[c.type] = (types[c.type] || 0) + 1;
        });
        return { totalContacts: contacts.length, totalInteractions: interactions.length, byType: types };
      },

      addReminder: (r) => {
        const newRem: Reminder = {
          id: Date.now().toString(),
          contactId: r.contactId,
          message: r.message,
          dueDate: r.dueDate || new Date(Date.now() + 86400000 * 3).toISOString(),
          done: false,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ reminders: [newRem, ...s.reminders] }));
        return newRem;
      },

      toggleReminder: (id) => {
        set((s) => ({
          reminders: s.reminders.map((r) => (r.id === id ? { ...r, done: !r.done } : r)),
        }));
      },

      deleteReminder: (id) => {
        set((s) => ({ reminders: s.reminders.filter((r) => r.id !== id) }));
      },
    }),
    {
      name: 'orbit-contacts-v2',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
