import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useOrbitStore, ENERGY_LEVELS } from '../stores/orbitStore';
import { theme, formatTimeAgo, formatDate } from '../src/theme';
import { EmptyState } from '../src/components/EmptyState';
import { logger } from '../src/utils/logger';

export default function SentimentScreen({ route, navigation }: any) {
  const { id } = route.params;
  const getContactWithInteractions = useOrbitStore(s => (s as any).getContactWithInteractions);
  const result = getContactWithInteractions(id);
  const contact = result?.contact;
  const interactions = result?.interactions;
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(()=>{
    setRefreshing(true);
    logger.info('Sentiment','pull to refresh',{id});
    setTimeout(()=> setRefreshing(false), 600);
  }, [id]);

  const stats = useMemo(()=>{
    if (!interactions) return { pos:0, neu:0, neg:0, total:0 };
    const pos = interactions.filter((i:any)=>i.sentiment==='positive').length;
    const neu = interactions.filter((i:any)=>i.sentiment==='neutral').length;
    const neg = interactions.filter((i:any)=>i.sentiment==='negative').length;
    return { pos, neu, neg, total: interactions.length };
  }, [interactions]);

  const energyTrend = useMemo(()=>{
    if (!interactions) return [];
    const last = [...interactions].sort((a:any,b:any)=>b.createdAt.localeCompare(a.createdAt)).slice(0,10);
    return last.map((i:any)=>({ date: i.createdAt, energy: i.energy, sentiment: i.sentiment, summary: i.summary }));
  }, [interactions]);

  if (!contact) {
    return (
      <View style={styles.errorContainer}>
        <EmptyState title="Not found" description="Contact no longer exists." icon="search" action={{ label: 'Go back', onPress: ()=>navigation?.goBack?.() }} />
      </View>
    );
  }

  const total = stats.total || 1;
  const insightText = stats.total===0 ? 'Log interactions with sentiment to see patterns. Sentiment helps you see emotional trends over time.' :
    (stats as any).neg/total>0.5 ? 'Mostly negative. Is this relationship draining? Consider a boundary conversation. Health score also penalizes draining energy.' :
    (stats as any).pos/total>0.6 ? 'Mostly positive! Nourishing relationship — invest more time here. Positive sentiment adds a small bonus to health score.' :
    'Mixed sentiment. Normal for close relationships — highs and lows are natural. Look at energy trend below for deeper pattern.';

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.text} />} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Sentiment</Text>
          <Text style={styles.sub}>{contact.name} • {stats.total} interactions analyzed</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Breakdown</Text>
          {[
            { label: 'Positive', count: stats.pos, pct: Math.round(stats.pos/total*100), color: theme.colors.success },
            { label: 'Neutral', count: stats.neu, pct: Math.round(stats.neu/total*100), color: theme.colors.textTertiary },
            { label: 'Negative', count: stats.neg, pct: Math.round(stats.neg/total*100), color: theme.colors.danger },
          ].map(row=>(
            <View key={row.label} style={styles.breakdownRow}>
              <View style={styles.breakdownLeft}>
                <View style={[styles.breakdownDot, { backgroundColor: row.color }]} />
                <Text style={styles.label}>{row.label}</Text>
              </View>
              <View style={styles.barWrap}>
                <View style={styles.barTrack}><View style={[styles.barFill, { width: `${row.pct}%`, backgroundColor: row.color }]} /></View>
                <Text style={styles.val}>{row.count} ({row.pct}%)</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Insight</Text>
          <Text style={styles.body}>{insightText}</Text>
          <View style={styles.detailRows}>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Formula</Text><Text style={styles.detailVal}>recency 30% + freq 30% + energy 35% + sentiment 5%</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Positive bonus</Text><Text style={styles.detailVal}>up to +10% health from positive ratio</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Draining penalty</Text><Text style={styles.detailVal}>energy draining = lower health component</Text></View>
          </View>
        </View>

        {energyTrend.length>0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recent Trend • last {energyTrend.length}</Text>
            {energyTrend.map((t:any, i:number)=>(
              <View key={i} style={styles.trendRow}>
                <Text style={styles.trendDate}>{formatTimeAgo(t.date)}</Text>
                <View style={styles.trendChips}>
                  <View style={[styles.trendChip, { backgroundColor: (ENERGY_LEVELS as any)[t.energy]?.color || theme.colors.textTertiary }]}><Text style={styles.trendChipText}>{t.energy}</Text></View>
                  <View style={[styles.trendChip, t.sentiment==='positive' ? { backgroundColor: theme.colors.success } : t.sentiment==='negative' ? { backgroundColor: theme.colors.danger } : {}]}><Text style={styles.trendChipText}>{t.sentiment}</Text></View>
                </View>
                <Text style={styles.trendSummary} numberOfLines={1}>{t.summary}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  errorContainer: { flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center' },
  content: { padding: theme.spacing.l, gap: theme.spacing.ml },
  header: { gap: 4 },
  title: { ...theme.typography.h1, color: theme.colors.text },
  sub: { ...theme.typography.bodySmall, color: theme.colors.textSecondary },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.l, padding: theme.spacing.ml, borderWidth: 1, borderColor: theme.colors.border, ...theme.shadows.card, gap: theme.spacing.s },
  cardTitle: { ...theme.typography.label, color: theme.colors.text, marginBottom: 4 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: theme.spacing.s, gap: theme.spacing.m },
  breakdownLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  breakdownDot: { width: 10, height: 10, borderRadius: 5 },
  label: { ...theme.typography.bodySmall, color: theme.colors.text },
  barWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.s, justifyContent: 'flex-end' },
  barTrack: { flex: 1, height: 8, backgroundColor: theme.colors.surfaceHover, borderRadius: theme.borderRadius.full, overflow: 'hidden', maxWidth: 100 },
  barFill: { height: '100%', borderRadius: theme.borderRadius.full },
  val: { ...theme.typography.caption, color: theme.colors.text, fontWeight: '600' as any, minWidth: 60, textAlign: 'right' as any },
  body: { ...theme.typography.bodySmall, color: theme.colors.textSecondary, lineHeight: 20 },
  detailRows: { gap: theme.spacing.s, marginTop: theme.spacing.s, backgroundColor: theme.colors.surfaceMuted, padding: theme.spacing.m, borderRadius: theme.borderRadius.m, borderWidth: 1, borderColor: theme.colors.borderLight },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.m },
  detailLabel: { ...theme.typography.micro, color: theme.colors.textTertiary, fontWeight: '700' as any, textTransform: 'uppercase' as any },
  detailVal: { ...theme.typography.micro, color: theme.colors.textSecondary, flex: 1, textAlign: 'right' as any },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.s, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight },
  trendDate: { ...theme.typography.micro, color: theme.colors.textTertiary, width: 32 },
  trendChips: { flexDirection: 'row', gap: 4 },
  trendChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: theme.borderRadius.pill, backgroundColor: theme.colors.surfaceHover },
  trendChipText: { fontSize: 9, color: '#FFF', fontWeight: '600' as any, textTransform: 'capitalize' as any },
  trendSummary: { ...theme.typography.caption, color: theme.colors.textSecondary, flex: 1 },
});
