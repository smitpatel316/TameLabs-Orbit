import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useOrbitStore } from '../stores/orbitStore';
import { theme } from '../src/theme';

const { width } = Dimensions.get('window');

export default function InsightsScreen() {
  const stats = useOrbitStore((s) => s.getStats());
  const contacts = useOrbitStore((s) => s.contacts);
  const calculateHealthScore = useOrbitStore((s) => s.calculateHealthScore);

  const healthDistribution = {
    critical: contacts.filter(c => calculateHealthScore(c.id) < 40).length,
    warning: contacts.filter(c => calculateHealthScore(c.id) >= 40 && calculateHealthScore(c.id) < 70).length,
    healthy: contacts.filter(c => calculateHealthScore(c.id) >= 70).length,
  };

  const total = contacts.length || 1;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Relationship Health</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Contacts</Text>
          <Text style={styles.statValue}>{stats.totalContacts}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Interactions</Text>
          <Text style={styles.statValue}>{stats.totalInteractions}</Text>
        </View>
      </View>

      <View style={styles.distributionSection}>
        <Text style={styles.sectionTitle}>Health Distribution</Text>
        
        <View style={styles.barRow}>
          <Text style={styles.barLabel}>Healthy</Text>
          <View style={styles.barContainer}>
            <View style={[styles.barFill, { width: `${(healthDistribution.healthy / total) * 100}%`, backgroundColor: theme.colors.success }]} />
          </View>
          <Text style={styles.barValue}>{healthDistribution.healthy}</Text>
        </View>

        <View style={styles.barRow}>
          <Text style={styles.barLabel}>Warning</Text>
          <View style={styles.barContainer}>
            <View style={[styles.barFill, { width: `${(healthDistribution.warning / total) * 100}%`, backgroundColor: theme.colors.warning }]} />
          </View>
          <Text style={styles.barValue}>{healthDistribution.warning}</Text>
        </View>

        <View style={styles.barRow}>
          <Text style={styles.barLabel}>Critical</Text>
          <View style={styles.barContainer}>
            <View style={[styles.barFill, { width: `${(healthDistribution.critical / total) * 100}%`, backgroundColor: theme.colors.danger }]} />
          </View>
          <Text style={styles.barValue}>{healthDistribution.critical}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 16 },
  title: { color: theme.colors.text, fontSize: 24, fontWeight: '700', marginBottom: 24, marginTop: 20 },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  statCard: { 
    flex: 1, 
    backgroundColor: theme.colors.surface, 
    padding: 20, 
    borderRadius: theme.borderRadius.l, 
    borderWidth: 1, 
    borderColor: theme.colors.border,
    ...theme.shadows.sm 
  },
  statLabel: { color: theme.colors.textSecondary, fontSize: 14, marginBottom: 4 },
  statValue: { color: theme.colors.text, fontSize: 28, fontWeight: '700' },
  distributionSection: { backgroundColor: theme.colors.surface, padding: 20, borderRadius: theme.borderRadius.l, borderWidth: 1, borderColor: theme.colors.border },
  sectionTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '600', marginBottom: 16 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  barLabel: { color: theme.colors.textSecondary, fontSize: 14, width: 70 },
  barContainer: { flex: 1, height: 12, backgroundColor: theme.colors.surfaceHover, borderRadius: 6, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 6 },
  barValue: { color: theme.colors.text, fontSize: 12, fontWeight: '600', width: 30, textAlign: 'right' },
});
