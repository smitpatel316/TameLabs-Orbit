import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, TextInput, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useOrbitStore, ENERGY_LEVELS } from '../stores/orbitStore';
import { theme, formatTimeAgo, formatDate } from '../src/theme';
import { EmptyState } from '../src/components/EmptyState';
import { Button } from '../src/components/Button';
import { logger } from '../src/utils/logger';

type TimeRange = 'all' | '7d' | '30d' | '90d';
type SentFilter = 'all' | 'positive' | 'neutral' | 'negative';
type EnergyFilter = 'all' | keyof typeof ENERGY_LEVELS;

const RANGE_LABEL: Record<TimeRange,string> = { all: 'All time', '7d':'Last 7d', '30d':'Last 30d', '90d':'Last 90d' };
const SENT_CHIPS: { key: SentFilter; label: string; color: string }[] = [
  { key: 'all', label: 'All', color: theme.colors.text },
  { key: 'positive', label: 'Positive', color: theme.colors.success },
  { key: 'neutral', label: 'Neutral', color: theme.colors.textTertiary },
  { key: 'negative', label: 'Negative', color: theme.colors.danger },
];

export default function SentimentScreen({ route, navigation }: any) {
  const { id } = route.params;
  const getContactWithInteractions = useOrbitStore(s => (s as any).getContactWithInteractions);
  const result = getContactWithInteractions(id);
  const contact = result?.contact;
  const allInteractions: any[] = result?.interactions || [];
  const [refreshing, setRefreshing] = useState(false);
  const [range, setRange] = useState<TimeRange>('all');
  const [sentFilter, setSentFilter] = useState<SentFilter>('all');
  const [energyFilter, setEnergyFilter] = useState<EnergyFilter>('all');
  const [query, setQuery] = useState('');

  const onRefresh = useCallback(()=>{
    setRefreshing(true);
    logger.info('Sentiment','pull to refresh',{id});
    setTimeout(()=> setRefreshing(false), 600);
  }, [id]);

  const ranged = useMemo(()=>{
    if (range==='all') return allInteractions;
    const days = range==='7d'?7: range==='30d'?30:90;
    const cutoff = Date.now() - days*86400000;
    return allInteractions.filter((i:any)=> new Date(i.createdAt).getTime()>=cutoff);
  }, [allInteractions, range]);

  const filtered = useMemo(()=>{
    let list = [...ranged];
    if (sentFilter!=='all') list = list.filter(i=>i.sentiment===sentFilter);
    if (energyFilter!=='all') list = list.filter(i=>i.energy===energyFilter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(i=> (i.summary||'').toLowerCase().includes(q));
    }
    return list;
  }, [ranged, sentFilter, energyFilter, query]);

  const stats = useMemo(()=>{
    if (!filtered.length) return { pos:0, neu:0, neg:0, total:0 };
    const pos = filtered.filter((i:any)=>i.sentiment==='positive').length;
    const neu = filtered.filter((i:any)=>i.sentiment==='neutral').length;
    const neg = filtered.filter((i:any)=>i.sentiment==='negative').length;
    return { pos, neu, neg, total: filtered.length };
  }, [filtered]);

  const energyCorrelation = useMemo(()=>{
    // avg sentiment per energy level
    const levels: Record<string, { pos:number; total:number; score:number }> = {};
    for (const lvl of Object.keys(ENERGY_LEVELS)) levels[lvl]={pos:0,total:0,score:0};
    for (const i of filtered) {
      const lvl = i.energy || 'neutral';
      if (!levels[lvl]) levels[lvl]={pos:0,total:0,score:0};
      levels[lvl].total++;
      if (i.sentiment==='positive') levels[lvl].pos++;
      if (i.sentiment==='negative') levels[lvl].score -=1;
      if (i.sentiment==='positive') levels[lvl].score +=1;
    }
    return Object.entries(levels).filter(([,v])=>v.total>0).map(([k,v])=>({ energy:k, total:v.total, posPct: v.total? Math.round(v.pos/v.total*100):0, avgSent: v.total? (v.score/v.total).toFixed(2):'0' }));
  }, [filtered]);

  const energyTrend = useMemo(()=>{
    const sorted = [...filtered].sort((a:any,b:any)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()).slice(0,15);
    return sorted.map((i:any)=>({ date: i.createdAt, energy: i.energy, sentiment: i.sentiment, summary: i.summary }));
  }, [filtered]);

  const activeFilters = (range!=='all'?1:0)+(sentFilter!=='all'?1:0)+(energyFilter!=='all'?1:0)+(query.trim()?1:0);
  const clearFilters = ()=>{ setRange('all'); setSentFilter('all'); setEnergyFilter('all'); setQuery(''); };

  if (!contact) {
    return (
      <View style={styles.errorContainer}>
        <EmptyState title="Not found" description="Contact no longer exists." icon="search" action={{ label: 'Go back', onPress: ()=>navigation?.goBack?.() }} />
      </View>
    );
  }

  const total = stats.total || 1;
  const totalAll = allInteractions.length;
  const insightText = stats.total===0 ? 'No interactions in this filter. Try All time or clear filters. Sentiment helps you see emotional trends over time.' :
    (stats as any).neg/total>0.5 ? 'Mostly negative in this window. Is this relationship draining? Consider a boundary conversation. Health score also penalizes draining energy.' :
    (stats as any).pos/total>0.6 ? 'Mostly positive in this window! Nourishing relationship - invest more time here. Positive sentiment adds a small bonus to health score.' :
    'Mixed sentiment. Normal for close relationships - highs and lows are natural. Check energy correlation below for deeper pattern.';

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.text} />} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Sentiment</Text>
          <Text style={styles.sub}>{contact.name} - {filtered.length} / {totalAll} interactions {range!=='all'?`(${RANGE_LABEL[range]})`:''}{activeFilters>0?` - ${activeFilters} filter${activeFilters>1?'s':''}`:''}</Text>
        </View>

        <View style={styles.filtersCard}>
          <View style={styles.filterHeaderRow}>
            <Text style={styles.filterTitle}>Filters + Time</Text>
            {activeFilters>0 && <TouchableOpacity onPress={clearFilters} hitSlop={8}><Text style={styles.clearLink}>Clear ({activeFilters})</Text></TouchableOpacity>}
          </View>

          <View style={styles.chipSection}>
            <Text style={styles.chipLabel}>Time range</Text>
            <View style={styles.chipRow}>
              {(['all','7d','30d','90d'] as TimeRange[]).map(k=>{
                const active = range===k;
                return (
                  <TouchableOpacity key={k} style={[styles.filterChip, active && styles.filterChipActive]} onPress={()=>setRange(k)} activeOpacity={0.7} accessibilityRole="button" accessibilityState={{ selected: active }}>
                    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{RANGE_LABEL[k]}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.searchRow}>
            <TextInput value={query} onChangeText={setQuery} placeholder="Search summary" placeholderTextColor={theme.colors.textMuted} style={styles.searchInput} clearButtonMode="while-editing" returnKeyType="search" accessibilityLabel="Search sentiment notes" />
            {query.length>0 && <TouchableOpacity onPress={()=>setQuery('')} style={styles.clearSearchBtn}><Text style={styles.clearSearchText}>x</Text></TouchableOpacity>}
          </View>

          <View style={styles.chipSection}>
            <Text style={styles.chipLabel}>Sentiment focus</Text>
            <View style={styles.chipRow}>
              {SENT_CHIPS.map(c=>{
                const active = sentFilter===c.key;
                return (
                  <TouchableOpacity key={c.key} style={[styles.filterChip, active && { backgroundColor: c.color===theme.colors.text ? theme.colors.primary : c.color, borderColor: c.color===theme.colors.text ? theme.colors.primary : c.color }]} onPress={()=>setSentFilter(c.key)} activeOpacity={0.7} accessibilityState={{ selected: active }}>
                    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{c.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.chipSection}>
            <Text style={styles.chipLabel}>Energy</Text>
            <View style={styles.chipRow}>
              {(['all', ...Object.keys(ENERGY_LEVELS)] as any[]).map((k:string)=>{
                const active = energyFilter===k;
                const col = k==='all' ? theme.colors.text : (ENERGY_LEVELS as any)[k]?.color || theme.colors.textTertiary;
                return (
                  <TouchableOpacity key={k} style={[styles.filterChip, active && { backgroundColor: col, borderColor: col }]} onPress={()=>setEnergyFilter(k as any)} activeOpacity={0.7} accessibilityState={{ selected: active }}>
                    <View style={[styles.chipDot, { backgroundColor: active ? '#FFF' : col }]} />
                    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{k}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {ranged.length===0 && allInteractions.length>0 ? (
          <EmptyState title="No interactions in range" description={`Try ${RANGE_LABEL.all} or a wider window. You have ${totalAll} total interactions.`} action={{ label: 'Show all', onPress: ()=>setRange('all') }} />
        ) : filtered.length===0 ? (
          <EmptyState title={stats.total===0 && ranged.length>0 ? 'No matches in filters' : 'No sentiment yet'} description={stats.total===0 && ranged.length>0 ? 'Try clearing sentiment/energy/search filters.' : 'Log interactions with sentiment to see patterns. Each interaction you log with energy + sentiment helps Orbit calculate health.'} icon="search" action={{ label: activeFilters>0 ? 'Clear filters' : 'Log interaction', onPress: ()=> activeFilters>0 ? clearFilters() : navigation.navigate('AddInteraction',{contactId:id}) }} />
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Breakdown - {filtered.length} {range!=='all'?RANGE_LABEL[range]:''}</Text>
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
              <View style={styles.miniStatsRow}>
                <View style={styles.miniStat}><Text style={styles.miniVal}>{Math.round(stats.pos/total*100)}%</Text><Text style={styles.miniLabel}>Pos</Text></View>
                <View style={styles.miniSep} />
                <View style={styles.miniStat}><Text style={styles.miniVal}>{filtered.length}</Text><Text style={styles.miniLabel}>In filter</Text></View>
                <View style={styles.miniSep} />
                <View style={styles.miniStat}><Text style={styles.miniVal}>{totalAll}</Text><Text style={styles.miniLabel}>All time</Text></View>
              </View>
            </View>

            {energyCorrelation.length>0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Energy to Sentiment correlation</Text>
                <Text style={styles.cardHint}>Positive % per energy level - does nourishing leave you feeling positive?</Text>
                {energyCorrelation.sort((a,b)=>b.posPct-a.posPct).map(row=>{
                  const col = (ENERGY_LEVELS as any)[row.energy]?.color || theme.colors.textTertiary;
                  return (
                    <View key={row.energy} style={styles.corrRow}>
                      <View style={styles.corrLeft}>
                        <View style={[styles.corrDot, { backgroundColor: col }]} />
                        <Text style={styles.corrLabel}>{row.energy}</Text>
                        <Text style={styles.corrCount}>({row.total})</Text>
                      </View>
                      <View style={styles.barWrap}>
                        <View style={styles.barTrack}><View style={[styles.barFill, { width: `${row.posPct}%`, backgroundColor: row.posPct>=60 ? theme.colors.success : row.posPct>=40 ? theme.colors.textTertiary : theme.colors.danger }]} /></View>
                        <Text style={styles.val}>{row.posPct}% pos - avg {row.avgSent}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Insight</Text>
              <Text style={styles.body}>{insightText}</Text>
              <View style={styles.detailRows}>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Formula</Text><Text style={styles.detailVal}>recency 30% + freq 30% + energy 35% + sentiment 5%</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Positive bonus</Text><Text style={styles.detailVal}>up to +10% health from positive ratio</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Draining penalty</Text><Text style={styles.detailVal}>energy draining = lower health component</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Window</Text><Text style={styles.detailVal}>{RANGE_LABEL[range]} - {filtered.length}/{totalAll}</Text></View>
              </View>
            </View>

            {energyTrend.length>0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Recent Trend - last {energyTrend.length}</Text>
                <Text style={styles.cardHint}>Newest first - {activeFilters>0?`${filtered.length} in filter`:''}</Text>
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
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  errorContainer: { flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center' },
  content: { padding: theme.spacing.l, gap: theme.spacing.ml, paddingBottom: 40 },
  header: { gap: 4 },
  title: { ...theme.typography.h1, color: theme.colors.text },
  sub: { ...theme.typography.bodySmall, color: theme.colors.textSecondary },
  filtersCard: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.l, padding: theme.spacing.m, borderWidth: 1, borderColor: theme.colors.border, ...theme.shadows.card, gap: theme.spacing.m },
  filterHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  filterTitle: { ...theme.typography.label, color: theme.colors.text },
  clearLink: { ...theme.typography.micro, color: theme.colors.accent || theme.colors.text, fontWeight: '600' as any, textDecorationLine: 'underline' as any },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surfaceMuted, borderRadius: theme.borderRadius.m, borderWidth: 1, borderColor: theme.colors.borderLight, paddingHorizontal: theme.spacing.m, height: 40 },
  searchInput: { flex: 1, fontSize: 14, color: theme.colors.text },
  clearSearchBtn: { width: 24, height: 24, borderRadius: 12, backgroundColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' },
  clearSearchText: { fontSize: 12, fontWeight: '700' as any, color: theme.colors.textSecondary },
  chipSection: { gap: 6 },
  chipLabel: { ...theme.typography.micro, color: theme.colors.textTertiary, fontWeight: '700' as any, textTransform: 'uppercase' as any, letterSpacing: 0.6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: theme.borderRadius.pill, backgroundColor: theme.colors.surfaceMuted, borderWidth: 1, borderColor: theme.colors.borderLight, ...theme.shadows.chip },
  filterChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  filterChipText: { fontSize: 11, fontWeight: '600' as any, color: theme.colors.textSecondary, textTransform: 'capitalize' as any },
  filterChipTextActive: { color: '#FFF' },
  chipDot: { width: 6, height: 6, borderRadius: 3 },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.l, padding: theme.spacing.ml, borderWidth: 1, borderColor: theme.colors.border, ...theme.shadows.card, gap: theme.spacing.s },
  cardTitle: { ...theme.typography.label, color: theme.colors.text, marginBottom: 4 },
  cardHint: { ...theme.typography.micro, color: theme.colors.textTertiary, fontStyle: 'italic' as any, marginBottom: 4 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: theme.spacing.s, gap: theme.spacing.m },
  breakdownLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  breakdownDot: { width: 10, height: 10, borderRadius: 5 },
  label: { ...theme.typography.bodySmall, color: theme.colors.text },
  barWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.s, justifyContent: 'flex-end' },
  barTrack: { flex: 1, height: 8, backgroundColor: theme.colors.surfaceHover, borderRadius: theme.borderRadius.full, overflow: 'hidden', maxWidth: 100 },
  barFill: { height: '100%', borderRadius: theme.borderRadius.full },
  val: { ...theme.typography.caption, color: theme.colors.text, fontWeight: '600' as any, minWidth: 60, textAlign: 'right' as any },
  miniStatsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: theme.colors.surfaceMuted, padding: theme.spacing.s, borderRadius: theme.borderRadius.m, borderWidth: 1, borderColor: theme.colors.borderLight, marginTop: theme.spacing.s },
  miniStat: { alignItems: 'center', gap: 2 },
  miniVal: { fontSize: 14, fontWeight: '700' as any, color: theme.colors.text },
  miniLabel: { ...theme.typography.micro, color: theme.colors.textTertiary, textTransform: 'uppercase' as any, fontWeight: '600' as any },
  miniSep: { width: 1, height: 20, backgroundColor: theme.colors.borderLight },
  corrRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.s, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight },
  corrLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, width: 110 },
  corrDot: { width: 8, height: 8, borderRadius: 4 },
  corrLabel: { ...theme.typography.caption, color: theme.colors.text, textTransform: 'capitalize' as any, flex: 1 },
  corrCount: { ...theme.typography.micro, color: theme.colors.textTertiary },
  body: { ...theme.typography.bodySmall, color: theme.colors.textSecondary, lineHeight: 20 },
  detailRows: { gap: theme.spacing.s, marginTop: theme.spacing.s, backgroundColor: theme.colors.surfaceMuted, padding: theme.spacing.m, borderRadius: theme.borderRadius.m, borderWidth: 1, borderColor: theme.colors.borderLight },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.m },
  detailLabel: { ...theme.typography.micro, color: theme.colors.textTertiary, fontWeight: '700' as any, textTransform: 'uppercase' as any },
  detailVal: { ...theme.typography.micro, color: theme.colors.textSecondary, flex: 1, textAlign: 'right' as any },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.s, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight },
  trendDate: { ...theme.typography.micro, color: theme.colors.textTertiary, width: 38 },
  trendChips: { flexDirection: 'row', gap: 4 },
  trendChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: theme.borderRadius.pill, backgroundColor: theme.colors.surfaceHover },
  trendChipText: { fontSize: 9, color: '#FFF', fontWeight: '600' as any, textTransform: 'capitalize' as any },
  trendSummary: { ...theme.typography.caption, color: theme.colors.textSecondary, flex: 1 },
});
