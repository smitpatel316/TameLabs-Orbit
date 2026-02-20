// Orbit - Enhanced features

// Reminder system
export const ReminderSystem = {
  async scheduleReminder(contactId, contactName, days) {
    const reminder = {
      id: Date.now().toString(),
      contactId,
      contactName,
      scheduledFor: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending'
    };
    
    const reminders = await this.getReminders();
    reminders.push(reminder);
    
    // In production, would use Push Notifications
    return reminder;
  },

  async getReminders() {
    try {
      const data = await AsyncStorage.getItem('orbit-reminders');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async markComplete(reminderId) {
    const reminders = await this.getReminders();
    const updated = reminders.map(r => 
      r.id === reminderId ? { ...r, status: 'completed' } : r
    );
    await AsyncStorage.setItem('orbit-reminders', JSON.stringify(updated));
  },

  getSuggestions(contacts, interactions) {
    const suggestions = [];
    const now = new Date();
    
    contacts.forEach(contact => {
      const lastInteraction = contact.lastInteraction 
        ? new Date(contact.lastInteraction)
        : new Date(contact.createdAt);
      
      const daysSince = Math.floor((now - lastInteraction) / (1000 * 60 * 60 * 24));
      
      // Different thresholds based on relationship type
      const thresholds = {
        family: 14,
        friend: 21,
        professional: 30,
        romantic: 7,
        acquaintance: 60
      };
      
      const threshold = thresholds[contact.type] || 30;
      
      if (daysSince > threshold) {
        suggestions.push({
          contact,
          daysSince,
          message: `You haven't connected with ${contact.name} in ${daysSince} days`,
          priority: daysSince > threshold * 2 ? 'high' : 'medium'
        });
      }
    });
    
    return suggestions.sort((a, b) => b.daysSince - a.daysSince);
  }
};

// Energy tracking over time
export const EnergyTracker = {
  async track(contactId, energy) {
    const history = await this.getHistory(contactId);
    history.push({
      energy,
      date: new Date().toISOString()
    });
    
    // Keep last 30 entries
    const trimmed = history.slice(-30);
    await AsyncStorage.setItem(`orbit-energy-${contactId}`, JSON.stringify(trimmed));
    
    return trimmed;
  },

  async getHistory(contactId) {
    try {
      const data = await AsyncStorage.getItem(`orbit-energy-${contactId}`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async getAverage(contactId) {
    const history = await this.getHistory(contactId);
    if (history.length === 0) return 0;
    
    const sum = history.reduce((acc, h) => acc + h.energy, 0);
    return sum / history.length;
  },

  // Get trend (improving, declining, stable)
  async getTrend(contactId) {
    const history = await this.getHistory(contactId);
    if (history.length < 3) return 'stable';
    
    const recent = history.slice(-5);
    const older = history.slice(-10, -5);
    
    if (recent.length < 2 || older.length < 2) return 'stable';
    
    const recentAvg = recent.reduce((a, b) => a + b.energy, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b.energy, 0) / older.length;
    
    if (recentAvg > olderAvg + 0.3) return 'improving';
    if (recentAvg < olderAvg - 0.3) return 'declining';
    return 'stable';
  }
};

// Group analysis
export const GroupAnalysis = {
  analyze(contacts) {
    const byType = {};
    const byEnergy = { draining: 0, low: 0, neutral: 0, good: 0, nourishing: 0 };
    
    contacts.forEach(c => {
      // By type
      byType[c.type] = (byType[c.type] || 0) + 1;
      
      // By energy
      if (byEnergy[c.energy] !== undefined) {
        byEnergy[c.energy]++;
      }
    });
    
    // Health distribution
    const health = { healthy: 0, moderate: 0, needsAttention: 0 };
    contacts.forEach(c => {
      // Would calculate real health score
      const score = Math.random() * 100; // Placeholder
      if (score >= 70) health.healthy++;
      else if (score >= 40) health.moderate++;
      else health.needsAttention++;
    });
    
    return {
      byType,
      byEnergy,
      health,
      total: contacts.length,
      insights: this.generateInsights(byType, byEnergy, health)
    };
  },

  generateInsights(byType, byEnergy, health) {
    const insights = [];
    
    // Type insights
    const typeKeys = Object.keys(byType);
    if (typeKeys.length > 0) {
      const dominant = typeKeys.reduce((a, b) => byType[a] > byType[b] ? a : b);
      insights.push(`Most of your contacts are ${dominant}`);
    }
    
    // Energy insights
    const totalEnergy = Object.values(byEnergy).reduce((a, b) => a + b, 0);
    const draining = byEnergy.draining + byEnergy.low;
    if (draining / totalEnergy > 0.3) {
      insights.push('⚠️ Many relationships feel draining. Consider setting boundaries.');
    }
    
    // Health insights
    if (health.needsAttention > health.healthy) {
      insights.push(' Several relationships need attention. Check in with old friends!');
    }
    
    return insights;
  }
};

// Quick actions
export const QuickActions = {
  getForContact(contact) {
    const actions = [
      { id: 'log_interaction', label: 'Log Interaction', icon: '📝' },
      { id: 'send_message', label: 'Send Message', icon: '💬' },
      { id: 'schedule_call', label: 'Schedule Call', icon: '📞' },
      { id: 'add_reminder', label: 'Add Reminder', icon: '⏰' },
      { id: 'update_notes', label: 'Update Notes', icon: '📋' },
    ];
    
    // Filter based on relationship type
    if (contact.type === 'professional') {
      return actions.filter(a => ['log_interaction', 'add_reminder'].includes(a.id));
    }
    
    return actions;
  }
};
