// Orbit Store - Relationship management
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const RELATIONSHIP_TYPES = {
  family: { emoji: '👨‍👩‍👧', color: '#E53E3E', label: 'Family' },
  friend: { emoji: '🤝', color: '#3182CE', label: 'Friend' },
  professional: { emoji: '💼', color: '#D69E2E', label: 'Professional' },
  romantic: { emoji: '💕', color: '#D53F8C', label: 'Romantic' },
  acquaintance: { emoji: '👋', color: '#718096', label: 'Acquaintance' },
};

const ENERGY_LEVELS = {
  draining: { value: -2, label: 'Draining', color: '#E53E3E' },
  low: { value: -1, label: 'Low', color: '#ED8936' },
  neutral: { value: 0, label: 'Neutral', color: '#A0AEC0' },
  good: { value: 1, label: 'Good', color: '#38A169' },
  nourishing: { value: 2, label: 'Nourishing', color: '#3182CE' },
};

export const useOrbitStore = create(
  persist(
    (set, get) => ({
      contacts: [],
      interactions: [],
      
      // Add a new contact
      addContact: (contact) => {
        const newContact = {
          id: Date.now().toString(),
          ...contact,
          energy: 'neutral',
          healthScore: 100,
          createdAt: new Date().toISOString(),
          lastInteraction: null,
        };
        set((state) => ({
          contacts: [newContact, ...state.contacts],
        }));
        return newContact;
      },
      
      // Update contact
      updateContact: (id, updates) => {
        set((state) => ({
          contacts: state.contacts.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        }));
      },
      
      // Delete contact
      deleteContact: (id) => {
        set((state) => ({
          contacts: state.contacts.filter((c) => c.id !== id),
          interactions: state.interactions.filter((i) => i.contactId !== id),
        }));
      },
      
      // Add interaction
      addInteraction: (interaction) => {
        const newInteraction = {
          id: Date.now().toString(),
          ...interaction,
          createdAt: new Date().toISOString(),
        };
        set((state) => {
          // Update last interaction time for contact
          const updatedContacts = state.contacts.map((c) =>
            c.id === interaction.contactId
              ? { ...c, lastInteraction: new Date().toISOString() }
              : c
          );
          return {
            contacts: updatedContacts,
            interactions: [newInteraction, ...state.interactions],
          };
        });
        return newInteraction;
      },
      
      // Get contact with interactions
      getContactWithInteractions: (contactId) => {
        const { contacts, interactions } = get();
        const contact = contacts.find((c) => c.id === contactId);
        const contactInteractions = interactions.filter(
          (i) => i.contactId === contactId
        );
        return { contact, interactions: contactInteractions };
      },
      
      // Calculate relationship health score
      calculateHealthScore: (contactId) => {
        const { contacts, interactions } = get();
        const contact = contacts.find((c) => c.id === contactId);
        if (!contact) return 0;
        
        const contactInteractions = interactions.filter(
          (i) => i.contactId === contactId
        ).slice(0, 10); // Last 10 interactions
        
        if (contactInteractions.length === 0) return 100;
        
        // Factors:
        // 1. Recency (30%)
        const daysSinceLast = contact.lastInteraction
          ? Math.floor((Date.now() - new Date(contact.lastInteraction).getTime()) / (1000 * 60 * 60 * 24))
          : 365;
        const recencyScore = Math.max(0, 100 - daysSinceLast * 2);
        
        // 2. Interaction frequency (30%)
        const interactionCount = contactInteractions.length;
        const frequencyScore = Math.min(100, interactionCount * 10);
        
        // 3. Energy rating%)
        const energy (40Value = ENERGY_LEVELS[contact.energy]?.value || 0;
        const energyScore = ((energyValue + 2) / 4) * 100;
        
        return Math.round((recencyScore * 0.3) + (frequencyScore * 0.3) + (energyScore * 0.4));
      },
      
      // Get contacts needing attention
      getNeedingAttention: () => {
        const { contacts, calculateHealthScore } = get();
        return contacts
          .map((c) => ({ ...c, healthScore: calculateHealthScore(c.id) }))
          .filter((c) => c.healthScore < 70)
          .sort((a, b) => a.healthScore - b.healthScore);
      },
      
      // Get contacts by type
      getByType: (type) => {
        const { contacts } = get();
        return contacts.filter((c) => c.type === type);
      },
      
      // Get stats
      getStats: () => {
        const { contacts, interactions } = get();
        const types = {};
        contacts.forEach((c) => {
          types[c.type] = (types[c.type] || 0) + 1;
        });
        
        return {
          totalContacts: contacts.length,
          totalInteractions: interactions.length,
          byType: types,
        };
      },
    }),
    {
      name: 'orbit-contacts',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export { RELATIONSHIP_TYPES, ENERGY_LEVELS };
