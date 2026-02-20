// Orbit - Customer Journey Mapping
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { useOrbitStore } from '../stores/orbitStore';

// Journey stages
const STAGES = [
  { id: 'awareness', name: 'Awareness', emoji: '👀', color: '#3182CE', description: 'First contact' },
  { id: 'interest', name: 'Interest', emoji: '🤔', color: '#D69E2E', description: 'Showing interest' },
  { id: 'consideration', name: 'Consideration', emoji: '📝', color: '#DD6B20', description: 'Evaluating options' },
  { id: 'intent', name: 'Intent', emoji: '🎯', color: '#E53E3E', description: 'Planning to connect' },
  { id: 'conversion', name: 'Conversion', emoji: '✅', color: '#38A169', description: 'Became contact' },
  { id: 'retention', name: 'Retention', emoji: '💚', color: '#805AD5', description: 'Maintained relationship' },
  { id: 'advocacy', name: 'Advocacy', emoji: '🌟', color: '#D53F8C', description: 'Promotes/refers' },
];

// Actions that move contacts through stages
const STAGE_ACTIONS = {
  awareness: ['Followed on social', 'Attended event', 'Visited website', 'Referred by friend'],
  interest: ['Replied to message', 'Asked questions', 'Downloaded content', 'Attended webinar'],
  consideration: ['Had meeting', 'Requested demo', 'Shared with team', 'Compared options'],
  intent: ['Committed to connect', 'Scheduled follow-up', 'Expressed interest'],
  conversion: ['First interaction logged', 'Added to contacts', 'Started relationship'],
  retention: ['Regular contact', 'Met in person', 'Collaborated on project'],
  advocacy: ['Gave referral', 'Wrote review', 'Recommended to others'],
};

export default function JourneyMapping() {
  const contacts = useOrbitStore((state) => state.contacts);
  const interactions = useOrbitStore((state) => state.interactions);
  
  // Track journey for each contact
  const [journeys, setJourneys] = useState({});
  
  const getContactJourney = (contactId) => {
    const contactInteractions = interactions
      .filter(i => i.contactId === contactId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    if (contactInteractions.length === 0) {
      return { currentStage: 'awareness', history: [], nextActions: STAGE_ACTIONS.awareness };
    }
    
    // Simple logic - would be AI-powered in production
    const stageIndex = Math.min(
      Math.floor(contactInteractions.length / 2),
      STAGES.length - 1
    );
    const currentStage = STAGES[stageIndex];
    
    const history = contactInteractions.slice(0, 5).map(i => ({
      stage: STAGES[stageIndex - 1] || STAGES[0],
      action: i.summary,
      date: i.createdAt
    }));
    
    const nextActions = STAGE_ACTIONS[currentStage.id] || [];
    
    return { currentStage, history, nextActions };
  };

  const getStageStats = () => {
    const stats = {};
    STAGES.forEach(stage => {
      stats[stage.id] = { count: 0, contacts: [] };
    });
    
    contacts.forEach(contact => {
      const journey = getContactJourney(contact.id);
      const stageId = journey.currentStage.id;
      stats[stageId].count++;
      stats[stageId].contacts.push(contact);
    });
    
    return stats;
  };

  const stageStats = getStageStats();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>🗺️ Journey Mapping</Text>
        
        {/* Funnel Overview */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Relationship Funnel</Text>
          <View style={styles.funnel}>
            {STAGES.map((stage, index) => {
              const count = stageStats[stage.id].count;
              const maxWidth = Math.max(...Object.values(stageStats).map(s => s.count)) || 1;
              const width = count > 0 ? Math.max(20, (count / maxWidth) * 100) : 0;
              
              return (
                <View key={stage.id} style={styles.funnelStage}>
                  <View style={[styles.funnelBar, { width: `${width}%`, backgroundColor: stage.color }]}>
                    <Text style={styles.funnelCount}>{count}</Text>
                  </View>
                  <View style={styles.funnelLabel}>
                    <Text style={styles.funnelEmoji}>{stage.emoji}</Text>
                    <Text style={styles.funnelName}>{stage.name}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Stage Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>By Stage</Text>
          {STAGES.map(stage => {
            const count = stageStats[stage.id].count;
            if (count === 0) return null;
            
            return (
              <View key={stage.id} style={styles.stageSection}>
                <View style={styles.stageHeader}>
                  <Text style={styles.stageEmoji}>{stage.emoji}</Text>
                  <View style={styles.stageInfo}>
                    <Text style={styles.stageName}>{stage.name}</Text>
                    <Text style={styles.stageDesc}>{stage.description}</Text>
                  </View>
                  <View style={[styles.stageCount, { backgroundColor: stage.color }]}>
                    <Text style={styles.stageCountText}>{count}</Text>
                  </View>
                </View>
                
                {/* Contacts in this stage */}
                <View style={styles.contactList}>
                  {stageStats[stage.id].contacts.slice(0, 3).map(contact => (
                    <TouchableOpacity key={contact.id} style={styles.contactChip}>
                      <Text style={styles.contactInitial}>{contact.name[0]}</Text>
                      <Text style={styles.contactName}>{contact.name}</Text>
                    </TouchableOpacity>
                  ))}
                  {stageStats[stage.id].contacts.length > 3 && (
                    <Text style={styles.moreText}>+{stageStats[stage.id].contacts.length - 3} more</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Actions by Stage */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💡 Actions to Progress</Text>
          {STAGES.slice(0, -1).map(stage => (
            <View key={stage.id} style={styles.actionSection}>
              <View style={styles.actionHeader}>
                <Text style={styles.actionEmoji}>{stage.emoji}</Text>
                <Text style={styles.actionStage}>To reach {STAGES[STAGES.indexOf(stage) + 1].name}:</Text>
              </View>
              <View style={styles.actionList}>
                {STAGE_ACTIONS[stage.id].slice(0, 3).map((action, i) => (
                  <View key={i} style={styles.actionItem}>
                    <Text style={styles.actionBullet}>•</Text>
                    <Text style={styles.actionText}>{action}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>🎯 Journey Tips</Text>
          <Text style={styles.tip}>• Focus on moving contacts to the next stage</Text>
          <Text style={styles.tip}>• Track interactions that advance relationships</Text>
          <Text style={styles.tip}>• Identify stuck contacts needing attention</Text>
          <Text style={styles.tip}>• Celebrate advocacy - ask for referrals!</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#16213e' },
  content: { padding: 16 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  card: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, marginBottom: 16 },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 16 },
  funnel: { gap: 8 },
  funnelStage: { marginBottom: 4 },
  funnelBar: { height: 28, borderRadius: 4, justifyContent: 'center', paddingLeft: 8, minWidth: 28 },
  funnelCount: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  funnelLabel: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  funnelEmoji: { fontSize: 14, marginRight: 6 },
  funnelName: { color: '#A0AEC0', fontSize: 12 },
  stageSection: { marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#2D3748' },
  stageHeader: { flexDirection: 'row', alignItems: 'center' },
  stageEmoji: { fontSize: 24, marginRight: 12 },
  stageInfo: { flex: 1 },
  stageName: { color: '#fff', fontWeight: '600' },
  stageDesc: { color: '#A0AEC0', fontSize: 12 },
  stageCount: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  stageCountText: { color: '#fff', fontWeight: 'bold' },
  contactList: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 8 },
  contactChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2D3748', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  contactInitial: { width: 20, height: 20, backgroundColor: '#E53E3E', borderRadius: 10, textAlign: 'center', color: '#fff', fontSize: 10, lineHeight: 20, overflow: 'hidden', marginRight: 6 },
  contactName: { color: '#A0AEC0', fontSize: 12 },
  moreText: { color: '#718096', fontSize: 12, alignSelf: 'center' },
  actionSection: { marginBottom: 16 },
  actionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  actionEmoji: { fontSize: 18, marginRight: 8 },
  actionStage: { color: '#A0AEC0', fontSize: 14 },
  actionList: { marginLeft: 26 },
  actionItem: { flexDirection: 'row', marginBottom: 4 },
  actionBullet: { color: '#38A169', marginRight: 8 },
  actionText: { color: '#A0AEC0', fontSize: 13, flex: 1 },
  tipsCard: { backgroundColor: '#2D3748', borderRadius: 12, padding: 16 },
  tipsTitle: { color: '#fff', fontWeight: '600', marginBottom: 12 },
  tip: { color: '#A0AEC0', fontSize: 14, marginBottom: 8 },
});
