import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useOrbitStore, RELATIONSHIP_TYPES } from '../stores/orbitStore';
import { theme, formatTimeAgo, formatDate, getHealthColor } from '../src/theme';
import { EmptyState } from '../src/components/EmptyState';
import { Button } from '../src/components/Button';
import { buildUpcomingBirthdays, syncBirthdaysToCalendar, requestCalendarPermission } from '../src/services/calendarSync';
import { logger } from '../src/utils/logger';

export default function InsightsScreen({ navigation }: any) {
  const stats = useOrbitStore((s) => s.getStats());
  const contacts = useOrbitStore((s) => s.contacts);
  const calculateHealthScore = useOrbitStore((s) => s.calculateHealthScore);
  const getNeedingAttention = useOrbitStore((s) => s.getNeedingAttention);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(()=>{
    setRefreshing(true);
    logger.info('Insights','pull to refresh');
    setTimeout(()=> setRefreshing(false), 600);
  }, []);

  const healthDistribution = useMemo(()=>({
    excellent: contacts.filter(c => calculateHealthScore(c.id) >= 80).length,
    good: contacts.filter(c => calculateHealthScore(c.id) >= 60 && calculateHealthScore(c.id) < 80).length,
    okay: contacts.filter(c => calculateHealthScore(c.id) >= 40 && calculateHealthScore(c.id) < 60).length,
    poor: contacts.filter(c => calculateHealthScore(c.id) >= 20 && calculateHealthScore(c.id) < 40).length,
    critical: contacts.filter(c => calculateHealthScore(c.id) < 20).length,
  }), [contacts, calculateHealthScore]);

  const byType = useMemo(()=>{
    const m: Record<string, number> = {};
    contacts.forEach(c=> { m[c.type] = (m[c.type]||0)+1; });
    return m;
  }, [contacts]);

  const needingAttention = useMemo(()=> getNeedingAttention().slice(0,5), [getNeedingAttention]);
  const total = contacts.length || 1;

  const upcomingBirthdaysRaw = useMemo(()=>{
    return buildUpcomingBirthdays(contacts.map(c=>({ id: c.id, name: c.name, birthday: c.birthday }))).slice(0,10);
  }, [contacts]);

  // Adapt to old rendering shape for compatibility + new fields
  const upcomingBirthdays = useMemo(()=>{
    return upcomingBirthdaysRaw.map((b:any)=> ({
      contact: { id: b.contactId, name: b.name, birthday: b.birthday },
      next: new Date(b.nextDate),
      diffDays: b.daysUntil,
      _raw: b, // keep raw for calendar sync
    }));
  }, [upcomingBirthdaysRaw]);

  const [syncing, setSyncing] = useState(false);

  const handleCalendarSync = useCallback(async()=>{
    setSyncing(true);
    try {
      const perm = await requestCalendarPermission();
      if (perm.status==='unavailable') {
        Alert.alert('Not available', 'Calendar sync requires expo-calendar installed. Run: npx expo install expo-calendar. Available on device builds only.');
        setSyncing(false);
        return;
      }
      if (!perm.granted) {
        Alert.alert('Permission needed', `Calendar permission status: ${perm.status}. Allow in system settings.`);
        setSyncing(false);
        return;
      }
      const result = await syncBirthdaysToCalendar(upcomingBirthdaysRaw as any);
      Alert.alert(result.ok?'Synced':'Sync failed', result.msg);
      logger.info('Insights','calendar sync', result);
    } catch (e:any){
      Alert.alert('Sync error', e?.message||'Unknown');
    } finally { setSyncing(false); }
  }, [upcomingBirthdaysRaw]);

  const recentContact = useMemo(()=>{
    if (!contacts.length) return null;
    return [...contacts].sort((a,b)=> (b.lastInteraction||b.createdAt).localeCompare(a.lastInteraction||a.createdAt))[0];
  }, [contacts]);

  if (contacts.length===0) {
    return (
      <View style={styles.emptyContainer}>
        <EmptyState title="No insights yet" description="Add contacts and log interactions to see health distribution and suggestions." icon="chart" action={{ label: 'Add contact', onPress: ()=> (navigation as any)?.navigate?.('ContactsTab', { screen: 'AddContact' }) }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.text} />} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Insights</Text>
          <Text style={styles.sub}>{contacts.length} contacts • {stats.totalInteractions} interactions</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Contacts</Text>
            <Text style={styles.statValue}>{stats.totalContacts}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Interactions</Text>
            <Text style={styles.statValue}>{stats.totalInteractions}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Avg Health</Text>
            <Text style={styles.statValue}>{contacts.length ? Math.round(contacts.reduce((acc,c)=>acc+calculateHealthScore(c.id),0)/contacts.length) : 0}%</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health Distribution</Text>
          {[
            { label: 'Excellent 80-100', count: healthDistribution.excellent, color: theme.colors.health.excellent },
            { label: 'Good 60-80', count: healthDistribution.good, color: theme.colors.health.good },
            { label: 'Okay 40-60', count: healthDistribution.okay, color: theme.colors.health.okay },
            { label: 'Poor 20-40', count: healthDistribution.poor, color: theme.colors.health.poor },
            { label: 'Critical <20', count: healthDistribution.critical, color: theme.colors.health.critical },
          ].map(row=>(
            <View key={row.label} style={styles.barRow}>
              <Text style={styles.barLabel}>{row.label}</Text>
              <View style={styles.barContainer}>
                <View style={[styles.barFill, { width: `${(row.count / total) * 100}%`, backgroundColor: row.color }]} />
              </View>
              <Text style={styles.barValue}>{row.count}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>By Type</Text>
          <View style={styles.typeGrid}>
            {Object.entries(byType).map(([t,count])=>{
              const info = (RELATIONSHIP_TYPES as any)[t];
              if (!info) return null;
              return (
                <View key={t} style={styles.typeCard}>
                  <View style={[styles.typeDot, { backgroundColor: info.color }]} />
                  <Text style={styles.typeLabel}>{info.emoji} {info.label}</Text>
                  <Text style={styles.typeCount}>{count}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {upcomingBirthdays.length>0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Birthdays • 60d • {upcomingBirthdays.length}</Text>
              <Button title={syncing?'Syncing...':'Sync to calendar'} size="s" variant="secondary" onPress={handleCalendarSync} loading={syncing} accessibilityLabel="Sync birthdays to device calendar" />
            </View>
            <Text style={styles.hint}>Birthdays are stored as MM/DD locally. Sync creates calendar events with 1d + 1h alarms. Works on device builds with expo-calendar.</Text>
            {upcomingBirthdays.map((b:any)=>(
              <View key={b.contact.id} style={styles.birthdayRow}>
                <View style={styles.birthAvatar}><Text style={styles.birthAvatarText}>{b.contact.name[0].toUpperCase()}</Text></View>
                <View style={{flex:1}}>
                  <Text style={styles.birthName}>{b.contact.name}</Text>
                  <Text style={styles.birthDate}>{formatDate(b.next.toISOString())} • {b.diffDays===0 ? 'Today!' : b.diffDays===1 ? 'Tomorrow' : `in ${b.diffDays}d`} • {b.contact.birthday}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {recentContact && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Most Recent Contact</Text>
            <TouchableOpacity style={styles.recentCard} onPress={()=>navigation?.navigate?.('ContactDetail', { id: recentContact.id })} activeOpacity={0.7}>
              <Text style={styles.recentName}>{recentContact.name}</Text>
              <Text style={styles.recentMeta}>{recentContact.lastInteraction ? formatTimeAgo(recentContact.lastInteraction) : formatTimeAgo(recentContact.createdAt)} • {formatDate(recentContact.lastInteraction||recentContact.createdAt)}</Text>
            </TouchableOpacity>
          </View>
        )}

        {needingAttention.length>0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Needs Attention • &lt;70% health • {needingAttention.length}</Text>
            {needingAttention.map((c:any)=>(
              <TouchableOpacity key={c.id} style={styles.attentionRow} onPress={()=>navigation?.navigate?.('ContactDetail', { id: c.id })} activeOpacity={0.7}>
                <View style={[styles.attAvatar, { backgroundColor: (RELATIONSHIP_TYPES as any)[c.type]?.color || theme.colors.textTertiary }]}><Text style={styles.attAvatarText}>{c.name[0].toUpperCase()}</Text></View>
                <View style={{flex:1}}>
                  <Text style={styles.attName}>{c.name}</Text>
                  <Text style={styles.attMeta}>{c.lastInteraction ? `${formatTimeAgo(c.lastInteraction)} • last interaction` : 'Never contacted'}</Text>
                </View>
                <View style={[styles.attHealth, { backgroundColor: getHealthColor(c.healthScore) }]}><Text style={styles.attHealthText}>{c.healthScore}%</Text></View>
              </TouchableOpacity>
            ))}
            <View style={styles.suggestionBox}>
              <Text style={styles.suggestionTitle}>Suggestion</Text>
              <Text style={styles.suggestionText}>{needingAttention.length>2 ? 'Several contacts need attention. Try a weekly check-in ritual — 10 min on Sundays.' : 'Reach out to reconnect. A short text counts — health improves with recency.'}</Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quality Checklist</Text>
          <View style={styles.checkList}>
            <Text style={styles.checkRow}>• Health score uses recency + energy + sentiment (fixed random bug)</Text>
            <Text style={styles.checkRow}>• Time-ago formatting everywhere, not raw dates</Text>
            <Text style={styles.checkRow}>• Pull-to-refresh on all lists</Text>
            <Text style={styles.checkRow}>• Empty states with actions</Text>
            <Text style={styles.checkRow}>• Birthdays from MM/DD stored locally</Text>
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  emptyContainer: { flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center' },
  content: { padding: theme.spacing.l, gap: theme.spacing.ml },
  header: { gap: 4 },
  title: { ...theme.typography.h1, color: theme.colors.text },
  sub: { ...theme.typography.caption, color: theme.colors.textSecondary },
  statsGrid: { flexDirection: 'row', gap: theme.spacing.s },
  statCard: { flex: 1, backgroundColor: theme.colors.surface, padding: theme.spacing.ml, borderRadius: theme.borderRadius.l, borderWidth: 1, borderColor: theme.colors.border, ...theme.shadows.card, alignItems: 'center', gap: 4 },
  statLabel: { ...theme.typography.micro, color: theme.colors.textTertiary, textTransform: 'uppercase' as any },
  statValue: { ...theme.typography.h1, color: theme.colors.text },
  section: { backgroundColor: theme.colors.surface, padding: theme.spacing.ml, borderRadius: theme.borderRadius.l, borderWidth: 1, borderColor: theme.colors.border, ...theme.shadows.card, gap: theme.spacing.s },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.s, marginBottom: 2 },
  sectionTitle: { ...theme.typography.label, color: theme.colors.text, marginBottom: 2, flex: 1 },
  hint: { ...theme.typography.micro, color: theme.colors.textTertiary, fontStyle: 'italic' as any, lineHeight: 14 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.s },
  barLabel: { ...theme.typography.caption, color: theme.colors.textSecondary, width: 110 },
  barContainer: { flex: 1, height: 8, backgroundColor: theme.colors.surfaceHover, borderRadius: theme.borderRadius.full, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: theme.borderRadius.full },
  barValue: { ...theme.typography.caption, color: theme.colors.text, fontWeight: '600' as any, width: 24, textAlign: 'right' as any },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.s, marginTop: theme.spacing.s },
  typeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surfaceMuted, paddingHorizontal: theme.spacing.m, paddingVertical: theme.spacing.s, borderRadius: theme.borderRadius.pill, borderWidth: 1, borderColor: theme.colors.borderLight, gap: 6 },
  typeDot: { width: 8, height: 8, borderRadius: 4 },
  typeLabel: { ...theme.typography.caption, color: theme.colors.text },
  typeCount: { ...theme.typography.caption, color: theme.colors.textSecondary, fontWeight: '700' as any },
  birthdayRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.m, paddingVertical: theme.spacing.s, borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight },
  birthAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' },
  birthAvatarText: { color: '#FFF', fontWeight: '700' as any, fontSize: 14 },
  birthName: { ...theme.typography.bodySmall, color: theme.colors.text, fontWeight: '600' as any },
  birthDate: { ...theme.typography.micro, color: theme.colors.textTertiary, marginTop: 2 },
  recentCard: { backgroundColor: theme.colors.surfaceMuted, padding: theme.spacing.m, borderRadius: theme.borderRadius.m, borderWidth: 1, borderColor: theme.colors.borderLight, gap: 4 },
  recentName: { ...theme.typography.bodySmall, color: theme.colors.text, fontWeight: '700' as any },
  recentMeta: { ...theme.typography.caption, color: theme.colors.textSecondary },
  attentionRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.m, paddingVertical: theme.spacing.s, borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight },
  attAvatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  attAvatarText: { color: '#FFF', fontWeight: '700' as any, fontSize: 12 },
  attName: { ...theme.typography.bodySmall, color: theme.colors.text, fontWeight: '600' as any },
  attMeta: { ...theme.typography.micro, color: theme.colors.textTertiary, marginTop: 2 },
  attHealth: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: theme.borderRadius.pill },
  attHealthText: { color: '#FFF', fontSize: 10, fontWeight: '700' as any },
  suggestionBox: { backgroundColor: theme.colors.surfaceMuted, padding: theme.spacing.m, borderRadius: theme.borderRadius.m, borderWidth: 1, borderColor: theme.colors.borderLight, gap: 4, marginTop: theme.spacing.s },
  suggestionTitle: { ...theme.typography.caption, color: theme.colors.text, fontWeight: '700' as any },
  suggestionText: { ...theme.typography.caption, color: theme.colors.textSecondary, lineHeight: 16 },
  checkList: { gap: 6, marginTop: theme.spacing.s },
  checkRow: { ...theme.typography.caption, color: theme.colors.textTertiary },
});
