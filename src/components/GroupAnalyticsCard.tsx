/** Orbit v2.7 Group Analytics Card - token-hardened */
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { theme, getHealthColor, formatTimeAgo } from '../theme';
import { ENERGY_LEVELS, RELATIONSHIP_TYPES } from '../../stores/orbitStore';
import { buildUpcomingBirthdays } from '../services/calendarSync';

export type GroupAnalytics = {
  id: string;
  name: string;
  color: string;
  count: number;
  avgHealth: number;
  staleCount: number;
  energyDist: Record<string, number>;
  healthDist: { excellent: number; good: number; okay: number; poor: number; critical: number };
  upcomingBirthdays: number;
  remindersDue: number;
  members: any[];
  createdAt?: string;
};

type Props = {
  group: { id: string; name: string; color?: string; createdAt?: string };
  contacts: any[];
  reminders: any[];
  calculateHealth: (id: string) => number;
  onPress: (groupId: string) => void;
  getGroupCounts?: () => Record<string, number>;
};

function daysSince(iso: string | null): number {
  if (!iso) return 999;
  try { return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)); } catch { return 999; }
}

export function computeAnalytics(
  group: { id: string; name: string; color?: string },
  contacts: any[],
  reminders: any[],
  calculateHealth: (id: string) => number,
): GroupAnalytics {
  const members = contacts.filter((c: any) => c.groupId === group.id).map((c: any) => ({ ...c, health: calculateHealth(c.id) }));
  const count = members.length;
  const avgHealth = count ? Math.round(members.reduce((a: number, b: any) => a + b.health, 0) / count) : 0;
  const staleCount = members.filter((m: any) => m.health < 70).length;
  const energyDist: Record<string, number> = {};
  Object.keys(ENERGY_LEVELS).forEach(k => energyDist[k] = 0);
  members.forEach((m: any) => { energyDist[m.energy] = (energyDist[m.energy] || 0) + 1; });
  const healthDist = {
    excellent: members.filter((m: any) => m.health >= 80).length,
    good: members.filter((m: any) => m.health >= 60 && m.health < 80).length,
    okay: members.filter((m: any) => m.health >= 40 && m.health < 60).length,
    poor: members.filter((m: any) => m.health >= 20 && m.health < 40).length,
    critical: members.filter((m: any) => m.health < 20).length,
  };
  const bdays = buildUpcomingBirthdays(members.map((m: any) => ({ id: m.id, name: m.name, birthday: m.birthday })));
  const upcomingBirthdays = bdays.length;
  const now = Date.now();
  const remindersDue = reminders.filter((r: any) => {
    if (r.done) return false;
    const due = new Date(r.dueDate).getTime();
    return due <= now + 7 * 86400000 && members.some((m: any) => m.id === r.contactId);
  }).length;

  return {
    id: group.id, name: group.name, color: group.color || theme.colors.primary,
    count, avgHealth, staleCount, energyDist, healthDist, upcomingBirthdays, remindersDue, members,
    createdAt: (group as any).createdAt,
  };
}

export function GroupAnalyticsCard({ group, contacts, reminders, calculateHealth, onPress }: Props) {
  const analytics = useMemo(() => computeAnalytics(group, contacts, reminders, calculateHealth), [group, contacts, reminders, calculateHealth]);

  const energyEntries = Object.entries(analytics.energyDist).filter(([, v]) => v > 0).sort((a, b) => {
    const va = (ENERGY_LEVELS as any)[a[0]]?.value ?? 0;
    const vb = (ENERGY_LEVELS as any)[b[0]]?.value ?? 0;
    return vb - va;
  });

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(group.id)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Open group ${group.name} analytics ${analytics.count} members`}
    >
      <View style={styles.header}>
        <View style={[styles.dot, { backgroundColor: analytics.color }]} />
        <Text style={styles.name} numberOfLines={1}>{analytics.name}</Text>
        <View style={styles.countPill}><Text style={styles.countText}>{analytics.count}</Text></View>
        {analytics.createdAt ? <Text style={styles.created}>{formatTimeAgo(analytics.createdAt)}</Text> : null}
      </View>

      {analytics.count === 0 ? (
        <Text style={styles.emptyHint}>No contacts yet - add contacts to this group</Text>
      ) : (
        <>
          <View style={styles.statsRow}>
            <View style={styles.statMini}>
              <Text style={styles.statMiniLabel}>Avg health</Text>
              <View style={[styles.healthChip, { backgroundColor: getHealthColor(analytics.avgHealth) }]}>
                <Text style={styles.healthChipText}>{analytics.avgHealth}%</Text>
              </View>
            </View>
            <View style={styles.statMini}>
              <Text style={styles.statMiniLabel}>Stale</Text>
              <Text style={[styles.statMiniValue, analytics.staleCount > 0 && { color: theme.colors.health.critical }]}>{analytics.staleCount}</Text>
            </View>
            <View style={styles.statMini}>
              <Text style={styles.statMiniLabel}>🎂 60d</Text>
              <Text style={styles.statMiniValue}>{analytics.upcomingBirthdays}</Text>
            </View>
            <View style={styles.statMini}>
              <Text style={styles.statMiniLabel}>⏰ Due</Text>
              <Text style={[styles.statMiniValue, analytics.remindersDue > 0 && { color: theme.colors.warning }]}>{analytics.remindersDue}</Text>
            </View>
          </View>

          {energyEntries.length > 0 && (
            <View style={styles.distRow}>
              {energyEntries.map(([k, count]) => {
                const info: any = (ENERGY_LEVELS as any)[k];
                if (!info) return null;
                return (
                  <View key={k} style={[styles.energyChip, { borderColor: info.color, backgroundColor: info.color + '18' }]}>
                    <View style={[styles.energyDot, { backgroundColor: info.color }]} />
                    <Text style={[styles.energyText, { color: info.color }]}>{info.label} {count}</Text>
                  </View>
                );
              })}
            </View>
          )}

          <View style={styles.healthBarRow}>
            {[
              { label: '80+', count: analytics.healthDist.excellent, color: theme.colors.health.excellent },
              { label: '60+', count: analytics.healthDist.good, color: theme.colors.health.good },
              { label: '40+', count: analytics.healthDist.okay, color: theme.colors.health.okay },
              { label: '20+', count: analytics.healthDist.poor, color: theme.colors.health.poor },
              { label: 'under 20', count: analytics.healthDist.critical, color: theme.colors.health.critical },
            ].map(h => {
              const w = analytics.count ? (h.count / analytics.count) * 100 : 0;
              return h.count === 0 ? null : (
                <View key={h.label} style={styles.hBarSegment} accessibilityLabel={`${h.label} ${h.count}`}>
                  <View style={[styles.hBarFill, { width: `${Math.max(8, w)}%`, backgroundColor: h.color }]} />
                  <Text style={styles.hBarLabel}>{h.label}·{h.count}</Text>
                </View>
              );
            })}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.avatarRow}>
            {analytics.members.slice(0, 8).map((m: any) => (
              <View key={m.id} style={[styles.avatarMini, { backgroundColor: (RELATIONSHIP_TYPES as any)[m.type]?.color || theme.colors.textTertiary }]}>
                <Text style={styles.avatarMiniText}>{(m.name?.[0] || '?').toUpperCase()}</Text>
                <View style={[styles.avatarHealthDot, { backgroundColor: getHealthColor(m.health) }]} />
              </View>
            ))}
            {analytics.count > 8 && <Text style={styles.moreText}>+{analytics.count - 8}</Text>}
          </ScrollView>

          <Text style={styles.tapHint}>Tap for detail - export CSV in detail</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.l, padding: theme.spacing.ml, borderWidth: 1, borderColor: theme.colors.border, gap: theme.spacing.s, ...theme.shadows.card },
  header: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.s },
  dot: { width: 12, height: 12, borderRadius: 6 },
  name: { ...theme.typography.h3, color: theme.colors.text, flex: 1 },
  countPill: { backgroundColor: theme.colors.surfaceMuted, paddingHorizontal: 8, paddingVertical: 2, borderRadius: theme.borderRadius.pill, borderWidth: 1, borderColor: theme.colors.borderLight },
  countText: { fontSize: 11, fontWeight: '700' as const, color: theme.colors.textSecondary },
  created: { ...theme.typography.micro, color: theme.colors.textTertiary },
  emptyHint: { ...theme.typography.caption, color: theme.colors.textTertiary, fontStyle: 'italic' as const },
  statsRow: { flexDirection: 'row', gap: theme.spacing.m, alignItems: 'center', flexWrap: 'wrap' as any },
  statMini: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statMiniLabel: { ...theme.typography.micro, color: theme.colors.textSecondary, textTransform: 'uppercase' as any, fontWeight: '600' as const, fontSize: 10 },
  statMiniValue: { ...theme.typography.caption, color: theme.colors.text, fontWeight: '700' as const },
  healthChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: theme.borderRadius.pill },
  healthChipText: { color: theme.colors.onPrimary, fontSize: 11, fontWeight: '700' as const },
  distRow: { flexDirection: 'row', flexWrap: 'wrap' as any, gap: 6 },
  energyChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: theme.borderRadius.pill, borderWidth: 1 },
  energyDot: { width: 6, height: 6, borderRadius: 3 },
  energyText: { fontSize: 10, fontWeight: '600' as const },
  healthBarRow: { flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' as any },
  hBarSegment: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.colors.surfaceMuted, borderRadius: theme.borderRadius.pill, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: theme.colors.borderLight },
  hBarFill: { height: 6, borderRadius: 3 },
  hBarLabel: { ...theme.typography.micro, color: theme.colors.textSecondary, fontSize: 10 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.s },
  avatarMini: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  avatarMiniText: { color: theme.colors.onPrimary, fontWeight: '700' as const, fontSize: 12 },
  avatarHealthDot: { position: 'absolute', bottom: -1, right: -1, width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: theme.colors.surface },
  moreText: { ...theme.typography.caption, color: theme.colors.textTertiary, marginLeft: 4 },
  tapHint: { ...theme.typography.micro, color: theme.colors.textTertiary, fontStyle: 'italic' as const, fontSize: 10 },
});
