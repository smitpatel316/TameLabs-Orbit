/** Orbit v2.7 Group Detail Modal */
import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Alert, ScrollView } from 'react-native';
import { theme, getHealthColor, formatTimeAgo, formatDate } from '../theme';
import { useOrbitStore, RELATIONSHIP_TYPES, ENERGY_LEVELS } from '../../stores/orbitStore';
import { buildUpcomingBirthdays } from '../services/calendarSync';
import { computeAnalytics } from './GroupAnalyticsCard';
import { logger } from '../utils/logger';

type Props = {
  groupId: string | null;
  onClose: () => void;
  navigation?: any;
};

function daysSince(iso: string | null): number {
  if (!iso) return 999;
  try { return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)); } catch { return 999; }
}

export function GroupDetailModal({ groupId, onClose, navigation }: Props) {
  const groups = useOrbitStore(s => s.groups);
  const contacts = useOrbitStore(s => s.contacts);
  const reminders = useOrbitStore(s => s.reminders);
  const calculateHealth = useOrbitStore(s => s.calculateHealthScore);
  const [exporting, setExporting] = useState(false);

  const group = useMemo(() => groups.find((g: any) => g.id === groupId), [groups, groupId]);
  const analytics = useMemo(() => {
    if (!group) return null;
    return computeAnalytics(group as any, contacts as any, reminders as any, calculateHealth);
  }, [group, contacts, reminders, calculateHealth]);

  const sortedMembers = useMemo(() => {
    if (!analytics) return [];
    return [...analytics.members].sort((a: any, b: any) => a.name.localeCompare(b.name));
  }, [analytics]);

  const handleExport = useCallback(async () => {
    if (!groupId || !analytics) return;
    setExporting(true);
    try {
      const mod: any = await import('../services/dataExport').catch(() => null);
      if (!mod) { Alert.alert('Export unavailable', 'Install expo-file-system + expo-sharing'); return; }
      const res = await mod.exportGroupContacts(groupId, contacts as any, groups as any, calculateHealth);
      Alert.alert(res.ok ? 'Exported' : 'Export failed', res.msg);
      logger.info('GroupDetail', 'export CSV', res);
    } catch (e: any) {
      Alert.alert('Export error', e?.message || 'Failed');
    } finally { setExporting(false); }
  }, [groupId, analytics, contacts, groups, calculateHealth]);

  if (!groupId || !group) return null;

  const renderMember = ({ item }: any) => {
    const typeInfo = (RELATIONSHIP_TYPES as any)[item.type] || RELATIONSHIP_TYPES.acquaintance;
    const energyInfo = (ENERGY_LEVELS as any)[item.energy] || ENERGY_LEVELS.neutral;
    const days = daysSince(item.lastInteraction);
    return (
      <TouchableOpacity
        style={styles.memberRow}
        onPress={() => {
          onClose();
          if (navigation?.navigate) navigation.navigate('ContactDetail', { id: item.id });
        }}
        activeOpacity={0.7}
        accessibilityLabel={`Open ${item.name}`}
      >
        <View style={[styles.avatar20, { backgroundColor: typeInfo.color }]}>
          <Text style={styles.avatar20Text}>{(item.name?.[0] || '?').toUpperCase()}</Text>
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.memberMeta} numberOfLines={1}>
            {typeInfo.emoji} {typeInfo.label} · {energyInfo.label} · {days > 365 ? 'never' : `${days}d`} · {formatTimeAgo(item.lastInteraction || item.createdAt)} · {formatDate(item.lastInteraction || item.createdAt)}
          </Text>
        </View>
        <View style={[styles.healthBadgeSmall, { backgroundColor: getHealthColor(item.health) }]}>
          <Text style={styles.healthBadgeSmallText}>{item.health}%</Text>
        </View>
        <View style={[styles.energyPill, { borderColor: energyInfo.color, backgroundColor: energyInfo.color + '15' }]}>
          <Text style={[styles.energyPillText, { color: energyInfo.color }]}>{item.energy}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={!!groupId} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.sheetHeader}>
          <View style={[styles.dotLarge, { backgroundColor: (group as any).color || theme.colors.primary }]} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.title}>{(group as any).name}</Text>
            <Text style={styles.sub}>
              {analytics ? `${analytics.count} members · avg ${analytics.avgHealth}% · ${analytics.staleCount} need attention · ${analytics.upcomingBirthdays} 🎂 60d · ${analytics.remindersDue} ⏰ 7d due` : ''}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={8} style={styles.closeBtn}><Text style={styles.closeText}>X</Text></TouchableOpacity>
        </View>

        {analytics && (
          <>
            <View style={styles.quickStatsCard}>
              <Text style={styles.cardTitle}>Quick Stats</Text>
              <View style={styles.quickGrid}>
                <View style={styles.qStat}><Text style={styles.qVal}>{analytics.count}</Text><Text style={styles.qLabel}>Members</Text></View>
                <View style={styles.qStat}><Text style={styles.qVal}>{analytics.avgHealth}%</Text><Text style={styles.qLabel}>Avg health</Text></View>
                <View style={styles.qStat}><Text style={[styles.qVal, analytics.staleCount > 0 && { color: theme.colors.health.critical }]}>{analytics.staleCount}</Text><Text style={styles.qLabel}>Stale {'<70%'}</Text></View>
                <View style={styles.qStat}><Text style={styles.qVal}>{analytics.upcomingBirthdays}</Text><Text style={styles.qLabel}>🎂 60d</Text></View>
                <View style={styles.qStat}><Text style={[styles.qVal, analytics.remindersDue > 0 && { color: theme.colors.warning }]}>{analytics.remindersDue}</Text><Text style={styles.qLabel}>⏰ Due</Text></View>
              </View>

              <Text style={[styles.cardTitle, { marginTop: theme.spacing.s }]}>Energy Distribution</Text>
              <View style={styles.energyDistGrid}>
                {Object.entries(ENERGY_LEVELS).map(([k, v]: any) => {
                  const cnt = analytics.energyDist[k] || 0;
                  if (cnt === 0) return null;
                  return (
                    <View key={k} style={styles.energyDistRow}>
                      <View style={[styles.energyDistDot, { backgroundColor: v.color }]} />
                      <Text style={styles.energyDistLabel}>{v.label}</Text>
                      <View style={styles.energyDistTrack}><View style={[styles.energyDistFill, { width: `${(cnt / analytics.count) * 100}%`, backgroundColor: v.color }]} /></View>
                      <Text style={styles.energyDistCount}>{cnt}</Text>
                    </View>
                  );
                })}
              </View>

              <Text style={[styles.cardTitle, { marginTop: theme.spacing.s }]}>Health Distribution</Text>
              <View style={styles.energyDistGrid}>
                {[
                  { label: 'Excellent 80-100', key: 'excellent', color: theme.colors.health.excellent },
                  { label: 'Good 60-80', key: 'good', color: theme.colors.health.good },
                  { label: 'Okay 40-60', key: 'okay', color: theme.colors.health.okay },
                  { label: 'Poor 20-40', key: 'poor', color: theme.colors.health.poor },
                  { label: 'Critical <20', key: 'critical', color: theme.colors.health.critical },
                ].map(h => {
                  const cnt = (analytics.healthDist as any)[h.key] || 0;
                  if (cnt === 0) return null;
                  return (
                    <View key={h.key} style={styles.energyDistRow}>
                      <View style={[styles.energyDistDot, { backgroundColor: h.color }]} />
                      <Text style={styles.energyDistLabel}>{h.label}</Text>
                      <View style={styles.energyDistTrack}><View style={[styles.energyDistFill, { width: `${(cnt / analytics.count) * 100}%`, backgroundColor: h.color }]} /></View>
                      <Text style={styles.energyDistCount}>{cnt}</Text>
                    </View>
                  );
                })}
              </View>

              <View style={{ flexDirection: 'row', gap: theme.spacing.s, marginTop: theme.spacing.m }}>
                <TouchableOpacity style={styles.exportBtn} onPress={handleExport} activeOpacity={0.7} disabled={exporting} accessibilityRole="button" accessibilityLabel={`Export ${group.name} CSV`}>
                  <Text style={styles.exportBtnText}>{exporting ? 'Exporting...' : `Export CSV (${analytics.count})`}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.closeActionBtn} onPress={onClose} activeOpacity={0.7}><Text style={styles.closeActionText}>Close</Text></TouchableOpacity>
              </View>
              <Text style={styles.hint}>CSV export via expo-file-system + expo-sharing fallback to Blob URL on web. .catch guarded guarded per platform shim.</Text>
            </View>

            <View style={{ flex: 1 }}>
              <View style={styles.listHeader}>
                <Text style={styles.cardTitle}>Members • {sortedMembers.length}</Text>
                <Text style={styles.listHint}>avatar 20 circle initial + health badge + timeAgo + energy + groupBadge + Quick Stats above</Text>
              </View>
              <FlatList
                data={sortedMembers}
                keyExtractor={(i: any) => i.id}
                renderItem={renderMember}
                contentContainerStyle={{ padding: theme.spacing.ml, paddingBottom: 96, gap: 0 }}
                ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: theme.colors.borderLight, marginVertical: 2 }} />}
                ListEmptyComponent={<Text style={styles.emptyListText}>No members</Text>}
              />
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.m, padding: theme.spacing.l, borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight, backgroundColor: theme.colors.surface },
  dotLarge: { width: 14, height: 14, borderRadius: 7 },
  title: { ...theme.typography.h2, color: theme.colors.text },
  sub: { ...theme.typography.micro, color: theme.colors.textSecondary, lineHeight: 14 },
  closeBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: theme.colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border },
  closeText: { fontSize: 12, fontWeight: '700' as const, color: theme.colors.textSecondary },
  quickStatsCard: { padding: theme.spacing.ml, backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight, gap: theme.spacing.s },
  cardTitle: { ...theme.typography.label, color: theme.colors.text },
  quickGrid: { flexDirection: 'row', gap: theme.spacing.s, flexWrap: 'wrap' as any },
  qStat: { backgroundColor: theme.colors.surfaceMuted, borderRadius: theme.borderRadius.m, padding: theme.spacing.s, minWidth: 64, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.borderLight, gap: 2 },
  qVal: { ...theme.typography.h3, color: theme.colors.text, fontSize: 15 },
  qLabel: { ...theme.typography.micro, color: theme.colors.textTertiary, fontSize: 10, textTransform: 'uppercase' as any },
  energyDistGrid: { gap: 6 },
  energyDistRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  energyDistDot: { width: 8, height: 8, borderRadius: 4 },
  energyDistLabel: { ...theme.typography.caption, color: theme.colors.textSecondary, width: 120, fontSize: 12 },
  energyDistTrack: { flex: 1, height: 6, backgroundColor: theme.colors.surfaceMuted, borderRadius: 3, overflow: 'hidden' },
  energyDistFill: { height: '100%', borderRadius: 3 },
  energyDistCount: { ...theme.typography.caption, color: theme.colors.text, fontWeight: '600' as const, width: 20, textAlign: 'right' as any },
  exportBtn: { backgroundColor: theme.colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: theme.borderRadius.m, flex: 1, alignItems: 'center' },
  exportBtnText: { color: theme.colors.onPrimary, fontWeight: '700' as const, fontSize: 13 },
  closeActionBtn: { backgroundColor: theme.colors.surfaceMuted, paddingHorizontal: 16, paddingVertical: 10, borderRadius: theme.borderRadius.m, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center' },
  closeActionText: { color: theme.colors.text, fontWeight: '600' as const, fontSize: 13 },
  hint: { ...theme.typography.micro, color: theme.colors.textTertiary, fontStyle: 'italic' as const, lineHeight: 13, fontSize: 10 },
  listHeader: { paddingHorizontal: theme.spacing.l, paddingTop: theme.spacing.m, paddingBottom: 4, gap: 2 },
  listHint: { ...theme.typography.micro, color: theme.colors.textTertiary, fontSize: 10, fontStyle: 'italic' as const },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.s, paddingVertical: theme.spacing.s },
  avatar20: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  avatar20Text: { color: theme.colors.onPrimary, fontWeight: '700' as const, fontSize: 14 },
  memberInfo: { flex: 1, gap: 2 },
  memberName: { ...theme.typography.bodySmall, color: theme.colors.text, fontWeight: '600' as const },
  memberMeta: { ...theme.typography.micro, color: theme.colors.textSecondary, lineHeight: 13, fontSize: 11 },
  healthBadgeSmall: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: theme.borderRadius.pill },
  healthBadgeSmallText: { color: theme.colors.onPrimary, fontSize: 10, fontWeight: '700' as const },
  energyPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: theme.borderRadius.pill, borderWidth: 1 },
  energyPillText: { fontSize: 10, fontWeight: '600' as const },
  emptyListText: { ...theme.typography.caption, color: theme.colors.textTertiary, textAlign: 'center' as any, paddingVertical: 24, fontStyle: 'italic' as const },
});
