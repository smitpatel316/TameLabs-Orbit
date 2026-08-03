/** Orbit v2.7 Groups Analytics Screen */
import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useOrbitStore } from '../stores/orbitStore';
import { theme, getHealthColor } from '../src/theme';
import { EmptyState } from '../src/components/EmptyState';
import { GroupAnalyticsCard, computeAnalytics } from '../src/components/GroupAnalyticsCard';
import { GroupDetailModal } from '../src/components/GroupDetailModal';
import { buildUpcomingBirthdays } from '../src/services/calendarSync';
import { logger } from '../src/utils/logger';

export default function GroupsAnalyticsScreen({ navigation }: any) {
  const contacts = useOrbitStore(s => s.contacts);
  const groups = useOrbitStore(s => s.groups);
  const reminders = useOrbitStore(s => s.reminders);
  const calculateHealth = useOrbitStore(s => s.calculateHealthScore);
  const getGroupCounts = useOrbitStore(s => s.getGroupCounts);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [exportingAll, setExportingAll] = useState(false);

  const onRefresh = useCallback(() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 600); }, []);
  React.useEffect(() => { logger.info('GroupsAnalytics', 'mounted', { v: '2.7.0', groups: groups.length, contacts: contacts.length }); }, []);

  const groupCounts = useMemo(() => { try { return getGroupCounts(); } catch { return {} as Record<string, number>; } }, [contacts, groups]);

  const analyticsList = useMemo(() => {
    return groups.map((g: any) => computeAnalytics(g, contacts as any, reminders as any, calculateHealth)).sort((a, b) => b.count - a.count || b.avgHealth - a.avgHealth);
  }, [groups, contacts, reminders, calculateHealth]);

  const totals = useMemo(() => {
    const grouped = contacts.filter((c: any) => c.groupId).length;
    const ungrouped = contacts.length - grouped;
    const avg = contacts.length ? Math.round(contacts.reduce((a: number, c: any) => a + calculateHealth(c.id), 0) / contacts.length) : 0;
    const stale = contacts.filter((c: any) => calculateHealth(c.id) < 70).length;
    const bdays = buildUpcomingBirthdays(contacts.map((c: any) => ({ id: c.id, name: c.name, birthday: c.birthday })));
    const dueReminders = reminders.filter((r: any) => !r.done && new Date(r.dueDate).getTime() <= Date.now() + 7 * 86400000).length;
    return { grouped, ungrouped, avg, stale, bdays: bdays.length, dueReminders, total: contacts.length };
  }, [contacts, reminders, calculateHealth]);

  const handleExportAll = useCallback(async () => {
    setExportingAll(true);
    try {
      const mod: any = await import('../src/services/dataExport').catch(() => null);
      if (!mod) { Alert.alert('Export unavailable', 'install expo-file-system'); return; }
      const res = await mod.exportAllGroupsCSV(contacts as any, groups as any, calculateHealth);
      Alert.alert(res.ok ? 'Exported' : 'Failed', res.msg);
    } catch (e: any) { Alert.alert('Export error', e?.message || 'Failed'); }
    finally { setExportingAll(false); }
  }, [contacts, groups, calculateHealth]);

  if (groups.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <EmptyState title="No groups yet" description="Create groups in Settings to see Groups Analytics Dashboard - per-group avg health, energy distribution, stale count, birthdays, reminders due." icon="chart" action={{ label: 'Go to Settings', onPress: () => navigation?.navigate?.('Settings') }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.text} />} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Groups Analytics</Text>
          <Text style={styles.sub}>v2.7.0 • {groups.length} groups • {totals.grouped} grouped • {totals.ungrouped} ungrouped • {totals.total} total</Text>
        </View>

        <View style={styles.overviewCard}>
          <Text style={styles.cardTitle}>Data Overview • Groups</Text>
          <View style={styles.overviewGrid}>
            <View style={styles.ovStat}><Text style={styles.ovLabel}>Total grouped</Text><Text style={styles.ovValue}>{totals.grouped}</Text></View>
            <View style={styles.ovStat}><Text style={styles.ovLabel}>Avg health</Text><Text style={styles.ovValue}>{totals.avg}%</Text></View>
            <View style={styles.ovStat}><Text style={styles.ovLabel}>Stale {'<70%'}</Text><Text style={[styles.ovValue, totals.stale > 0 && { color: theme.colors.health.critical }]}>{totals.stale}</Text></View>
            <View style={styles.ovStat}><Text style={styles.ovLabel}>🎂 60d</Text><Text style={styles.ovValue}>{totals.bdays}</Text></View>
            <View style={styles.ovStat}><Text style={styles.ovLabel}>⏰ 7d due</Text><Text style={[styles.ovValue, totals.dueReminders > 0 && { color: theme.colors.warning }]}>{totals.dueReminders}</Text></View>
          </View>
          <TouchableOpacity style={styles.exportAllBtn} onPress={handleExportAll} disabled={exportingAll} activeOpacity={0.7}><Text style={styles.exportAllText}>{exportingAll ? 'Exporting...' : `Export all ${totals.total} CSV`}</Text></TouchableOpacity>
          <Text style={styles.hint}>Export via dynamic import expo-file-system sharing document-picker .catch(()=&gt;null) web Blob URL fallback</Text>
        </View>

        <View style={{ gap: theme.spacing.m }}>
          <Text style={styles.sectionTitle}>Per-Group • {analyticsList.length} cards • tap for detail modal (avatar 20 circle initial + health badge + timeAgo + energy + groupBadge + Quick Stats)</Text>
          {analyticsList.map((a: any) => {
            const g = groups.find((gg: any) => gg.id === a.id);
            if (!g) return null;
            return <GroupAnalyticsCard key={a.id} group={g as any} contacts={contacts as any} reminders={reminders as any} calculateHealth={calculateHealth} onPress={(id: string) => setSelectedGroupId(id)} />;
          })}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      <GroupDetailModal groupId={selectedGroupId} onClose={() => setSelectedGroupId(null)} navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  emptyContainer: { flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center' },
  content: { padding: theme.spacing.l, gap: theme.spacing.ml, paddingBottom: 32 },
  header: { gap: 4, alignItems: 'center', paddingVertical: theme.spacing.s },
  title: { ...theme.typography.h1, color: theme.colors.text },
  sub: { ...theme.typography.caption, color: theme.colors.textSecondary },
  overviewCard: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.l, padding: theme.spacing.ml, borderWidth: 1, borderColor: theme.colors.border, ...theme.shadows.card, gap: theme.spacing.s },
  cardTitle: { ...theme.typography.label, color: theme.colors.text },
  overviewGrid: { flexDirection: 'row', flexWrap: 'wrap' as any, gap: theme.spacing.s },
  ovStat: { backgroundColor: theme.colors.surfaceMuted, padding: theme.spacing.s, borderRadius: theme.borderRadius.m, borderWidth: 1, borderColor: theme.colors.borderLight, minWidth: 80, alignItems: 'center', gap: 2, flex: 1 },
  ovLabel: { ...theme.typography.micro, color: theme.colors.textTertiary, fontSize: 10, textTransform: 'uppercase' as any },
  ovValue: { ...theme.typography.h3, color: theme.colors.text, fontSize: 15 },
  exportAllBtn: { backgroundColor: theme.colors.primary, paddingHorizontal: 14, paddingVertical: 9, borderRadius: theme.borderRadius.m, alignItems: 'center' },
  exportAllText: { color: theme.colors.onPrimary, fontWeight: '700' as const, fontSize: 13 },
  hint: { ...theme.typography.micro, color: theme.colors.textTertiary, fontStyle: 'italic' as const, fontSize: 10, lineHeight: 12 },
  sectionTitle: { ...theme.typography.caption, color: theme.colors.textSecondary, fontSize: 12, lineHeight: 15 },
});
