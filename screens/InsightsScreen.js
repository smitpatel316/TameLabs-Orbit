// Insights Screen
import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useOrbitStore, RELATIONSHIP_TYPES } from '../stores/orbitStore';

export default function InsightsScreen() {
  const contacts = useOrbitStore((state) => state.contacts);
  const interactions = useOrbitStore((state) => state.interactions);
  const getStats = useOrbitStore((state) => state.getStats);
  const stats = getStats();
  
  const needingAttention = contacts
    .map(c => ({ ...c, health: Math.floor(Math.random() * 100) }))
    .filter(c => c.health < 60)
    .slice(0, 5);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>📊 Overview</Text>
          <View style={styles.stats}>
            <View style={styles.stat}><Text style={styles.statValue}>{stats.totalContacts}</Text><Text style={styles.statLabel}>Contacts</Text></View>
            <View style={styles.stat}><Text style={styles.statValue}>{stats.totalInteractions}</Text><Text style={styles.statLabel}>Interactions</Text></View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>👥 By Type</Text>
          {Object.entries(RELATIONSHIP_TYPES).map(([key, val]) => (
            <View key={key} style={styles.typeRow}>
              <Text style={styles.typeEmoji}>{val.emoji}</Text>
              <Text style={styles.typeName}>{val.label}</Text>
              <Text style={styles.typeCount}>{stats.byType?.[key] || 0}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>⚠️ Needs Attention</Text>
          {needingAttention.length === 0 ? (
            <Text style={styles.empty}>All relationships are healthy! 🎉</Text>
          ) : (
            needingAttention.map(c => (
              <View key={c.id} style={styles.attentionItem}>
                <Text style={styles.attentionName}>{c.name}</Text>
                <Text style={styles.attentionHealth}>{c.health}% health</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>💡 Suggestions</Text>
          <Text style={styles.suggestion}>• Reach out to old friends this week</Text>
          <Text style={styles.suggestion}>• Schedule monthly check-ins with key contacts</Text>
          <Text style={styles.suggestion}>• Track energy levels after each interaction</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#16213e' },
  content: { padding: 16 },
  card: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, marginBottom: 16 },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  stats: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  statLabel: { color: '#A0AEC0', fontSize: 12, marginTop: 4 },
  typeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#2D3748' },
  typeEmoji: { fontSize: 20, marginRight: 12 },
  typeName: { flex: 1, color: '#fff' },
  typeCount: { color: '#A0AEC0', fontWeight: 'bold' },
  empty: { color: '#38A169', fontStyle: 'italic', textAlign: 'center', padding: 20 },
  attentionItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  attentionName: { color: '#fff' },
  attentionHealth: { color: '#E53E3E' },
  suggestion: { color: '#A0AEC0', marginBottom: 8 },
});
