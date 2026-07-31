import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, TextInput, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useOrbitStore, ENERGY_LEVELS } from '../stores/orbitStore';
import { theme, formatTimeAgo, formatDate, formatFullDate } from '../src/theme';
import { EmptyState } from '../src/components/EmptyState';
import { logger } from '../src/utils/logger';

type SentFilter = 'all' | 'positive' | 'neutral' | 'negative';
type EnergyFilter = 'all' | keyof typeof ENERGY_LEVELS;
type TypeFilter = 'all' | 'call' | 'text' | 'in-person' | 'email' | 'other';

const SENT_CHIPS: { key: SentFilter; label: string; color: string }[] = [
  { key: 'all', label: 'All', color: theme.colors.text },
  { key: 'positive', label: 'Positive', color: theme.colors.success },
  { key: 'neutral', label: 'Neutral', color: theme.colors.textTertiary },
  { key: 'negative', label: 'Negative', color: theme.colors.danger },
];
const TYPE_CHIPS: TypeFilter[] = ['all','call','text','in-person','email','other'];
const ENERGY_KEYS = ['all', ...Object.keys(ENERGY_LEVELS)] as EnergyFilter[];

export default function JourneyMappingScreen({ route, navigation }: any) {
  const { id } = route.params;
  const getContactWithInteractions = useOrbitStore(s => (s as any).getContactWithInteractions);
  const result = getContactWithInteractions(id);
  const contact = result?.contact;
  const interactions: any[] = result?.interactions || [];
  const [refreshing, setRefreshing] = useState(false);
  const [sentFilter, setSentFilter] = useState<SentFilter>('all');
  const [energyFilter, setEnergyFilter] = useState<EnergyFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [query, setQuery] = useState('');
  const [groupBy, setGroupBy] = useState<'all'|'month'>('month');

  const onRefresh = useCallback(()=>{
    setRefreshing(true);
    logger.info('Journey','pull to refresh',{id});
    setTimeout(()=> setRefreshing(false), 600);
  }, [id]);

  const filtered = useMemo(()=>{
    let list = [...interactions].sort((a:any,b:any)=>a.createdAt.localeCompare(b.createdAt));
    if (sentFilter !== 'all') list = list.filter(i=>i.sentiment===sentFilter);
    if (energyFilter !== 'all') list = list.filter(i=>i.energy===energyFilter);
    if (typeFilter !== 'all') list = list.filter(i=>i.type===typeFilter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(i=> (i.summary||'').toLowerCase().includes(q) || (i.type||'').toLowerCase().includes(q) || (i.energy||'').toLowerCase().includes(q) || (i.sentiment||'').toLowerCase().includes(q));
    }
    return list;
  }, [interactions, sentFilter, energyFilter, typeFilter, query]);

  const stats = useMemo(()=>{
    if (interactions.length===0) return null;
    const sorted = [...interactions].sort((a:any,b:any)=>new Date(a.createdAt).getTime()-new Date(b.createdAt).getTime());
    const first = new Date(sorted[0].createdAt);
    const last = new Date(sorted[sorted.length-1].createdAt);
    const spanDays = Math.max(1, Math.ceil((last.getTime()-first.getTime())/86400000));
    const avgGap = interactions.length>1 ? Math.round(spanDays/(interactions.length-1)) : 0;
    const last3 = sorted.slice(-3).map((i:any)=> i.energy);
    const bySent = { pos: interactions.filter((i:any)=>i.sentiment==='positive').length, neu: interactions.filter((i:any)=>i.sentiment==='neutral').length, neg: interactions.filter((i:any)=>i.sentiment==='negative').length };
    return { total: interactions.length, spanDays, avgGap, first, last, last3, bySent };
  }, [interactions]);

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'] as const;
  const grouped = useMemo(()=>{
    if (groupBy==='all') return [{ key: 'All time', items: filtered }];
    const map = new Map<string, any[]>();
    for (const it of filtered) {
      const d = new Date(it.createdAt);
      const isoMonth = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      const label = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
      const compositeKey = `${isoMonth}|${label}`;
      if (!map.has(compositeKey)) map.set(compositeKey, []);
      map.get(compositeKey)!.push(it);
    }
    const entries = Array.from(map.entries()).sort((a,b)=> b[0].localeCompare(a[0]));
    return entries.map(([ck, items])=>{
      const [, label] = ck.split('|');
      return { key: label, items: items.sort((a:any,b:any)=>a.createdAt.localeCompare(b.createdAt)) };
    });
  }, [filtered, groupBy]);

  const activeCount = (sentFilter!=='all' ? 1:0) + (energyFilter!=='all' ? 1:0) + (typeFilter!=='all' ? 1:0) + (query.trim()?1:0);
  const clearFilters = () => { setSentFilter('all'); setEnergyFilter('all'); setTypeFilter('all'); setQuery(''); };

  if (!contact) {
    return (
      <View style={styles.errorContainer}>
        <EmptyState title="Not found" description="Contact no longer exists." icon="search" action={{ label: 'Go back', onPress: ()=>navigation?.goBack?.() }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.text} />} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Journey</Text>
          <Text style={styles.sub}>{contact.name} {stats ? `- ${stats.total} interactions - ${stats.spanDays}d span - avg ${stats.avgGap}d` : '- 0 interactions'}</Text>
        </View>

        {stats && (
          <View style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}><Text style={styles.statVal}>{stats.total}</Text><Text style={styles.statLabel}>Total</Text></View>
              <View style={styles.statSep} />
              <View style={styles.statItem}><Text style={styles.statVal}>{stats.spanDays}d</Text><Text style={styles.statLabel}>Span</Text></View>
              <View style={styles.statSep} />
              <View style={styles.statItem}><Text style={styles.statVal}>{stats.avgGap}d</Text><Text style={styles.statLabel}>Avg gap</Text></View>
              <View style={styles.statSep} />
              <View style={styles.statItem}><Text style={[styles.statVal,{ color: stats.bySent.neg>stats.bySent.pos ? theme.colors.danger : theme.colors.success }]}>{stats.bySent.pos}/{stats.bySent.neg}</Text><Text style={styles.statLabel}>+/-</Text></View>
            </View>
            {stats.last3.length>0 && (
              <View style={styles.energyPreview}>
                <Text style={styles.previewLabel}>Recent energy</Text>
                <View style={styles.energyDots}>
                  {stats.last3.map((e:any,i:number)=>{
                    const col = (ENERGY_LEVELS as any)[e]?.color || theme.colors.textTertiary;
                    return <View key={i} style={[styles.energyDotLg, { backgroundColor: col }]} />;
                  })}
                </View>
                <Text style={styles.previewMeta} numberOfLines={1}>{stats.last3.join(' -> ')}</Text>
              </View>
            )}
          </View>
        )}

        {interactions.length>0 && (
          <View style={styles.filtersCard}>
            <View style={styles.filterHeaderRow}>
              <Text style={styles.filterTitle}>Filters</Text>
              {activeCount>0 && <TouchableOpacity onPress={clearFilters} hitSlop={8}><Text style={styles.clearLink}>Clear ({activeCount})</Text></TouchableOpacity>}
            </View>

            <View style={styles.searchRow}>
              <TextInput value={query} onChangeText={setQuery} placeholder="Search summary, type, energy, sentiment" placeholderTextColor={theme.colors.textMuted} style={styles.searchInput} clearButtonMode="while-editing" returnKeyType="search" accessibilityLabel="Search interactions" />
              {query.length>0 && <TouchableOpacity onPress={()=>setQuery('')} style={styles.clearSearchBtn}><Text style={styles.clearSearchText}>x</Text></TouchableOpacity>}
            </View>

            <View style={styles.chipSection}>
              <Text style={styles.chipLabel}>Sentiment</Text>
              <View style={styles.chipRow}>
                {SENT_CHIPS.map(c=>{
                  const active = sentFilter===c.key;
                  return (
                    <TouchableOpacity key={c.key} style={[styles.filterChip, active && { backgroundColor: c.color===theme.colors.text ? theme.colors.primary : c.color, borderColor: c.color===theme.colors.text ? theme.colors.primary : c.color }]} onPress={()=>setSentFilter(c.key)} activeOpacity={0.7} accessibilityRole="button" accessibilityState={{ selected: active }} accessibilityLabel={`Filter ${c.label}`}>
                      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{c.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.chipSection}>
              <Text style={styles.chipLabel}>Energy</Text>
              <View style={styles.chipRow}>
                {ENERGY_KEYS.map((k)=>{
                  const active = energyFilter===k;
                  const col = k==='all' ? theme.colors.text : (ENERGY_LEVELS as any)[k]?.color || theme.colors.textTertiary;
                  return (
                    <TouchableOpacity key={k} style={[styles.filterChip, active && { backgroundColor: col, borderColor: col }]} onPress={()=>setEnergyFilter(k)} activeOpacity={0.7} accessibilityRole="button" accessibilityState={{ selected: active }}>
                      <View style={[styles.chipDot, { backgroundColor: active ? '#FFF' : col }]} />
                      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{k}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.chipSection}>
              <Text style={styles.chipLabel}>Type</Text>
              <View style={styles.chipRow}>
                {TYPE_CHIPS.map(k=>{
                  const active = typeFilter===k;
                  return (
                    <TouchableOpacity key={k} style={[styles.filterChip, active && styles.filterChipActive]} onPress={()=>setTypeFilter(k)} activeOpacity={0.7} accessibilityRole="button" accessibilityState={{ selected: active }}>
                      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{k}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.chipSection}>
              <Text style={styles.chipLabel}>Group</Text>
              <View style={styles.chipRow}>
                {(['all','month'] as const).map(k=>{
                  const active = groupBy===k;
                  return (
                    <TouchableOpacity key={k} style={[styles.filterChip, active && styles.filterChipActive]} onPress={()=>setGroupBy(k)} activeOpacity={0.7} accessibilityState={{ selected: active }}>
                      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{k==='month' ? 'By month' : 'All'}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {filtered.length!==interactions.length && (
              <Text style={styles.filterMeta}>{filtered.length} of {interactions.length} shown</Text>
            )}
          </View>
        )}

        {interactions.length===0 ? (
          <EmptyState title="No journey yet" description="Log interactions to see a vertical timeline with energy and sentiment trends. Journey shows the arc of this relationship over time." icon="timeline" action={{ label: 'Log first interaction', onPress: ()=> navigation.navigate('AddInteraction', { contactId: id }) }} />
        ) : filtered.length===0 ? (
          <EmptyState title="No matches" description="Try clearing filters or search to see more interactions." icon="search" action={{ label: 'Clear filters', onPress: clearFilters }} />
        ) : (
          grouped.map((group)=>(
            <View key={group.key} style={styles.monthGroup}>
              {groupBy==='month' && <Text style={styles.monthHeader}>{group.key} - {group.items.length}</Text>}
              {group.items.map((i:any, idx:number)=>(
                <View key={i.id} style={styles.item}>
                  <View style={styles.lineContainer}>
                    <View style={[styles.dot, { backgroundColor: i.sentiment==='positive' ? theme.colors.success : i.sentiment==='negative' ? theme.colors.danger : theme.colors.textTertiary }]} />
                    {idx < group.items.length-1 && <View style={styles.line} />}
                  </View>
                  <View style={styles.itemContent}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.date}>{formatDate(i.createdAt)}</Text>
                      <Text style={styles.timeAgo}>{formatTimeAgo(i.createdAt)}</Text>
                    </View>
                    <Text style={styles.summary}>{i.summary}</Text>
                    <View style={styles.metaRow}>
                      <View style={styles.metaChip}><Text style={styles.metaChipText}>{i.type}</Text></View>
                      <View style={[styles.metaChip, { borderColor: (ENERGY_LEVELS as any)[i.energy]?.color || theme.colors.borderLight }]}><View style={[styles.metaEnergyDot, { backgroundColor: (ENERGY_LEVELS as any)[i.energy]?.color || theme.colors.textTertiary }]} /><Text style={styles.metaChipText}>{i.energy || 'neutral'}</Text></View>
                      <View style={[styles.metaChip, i.sentiment==='positive' && styles.metaChipPos, i.sentiment==='negative' && styles.metaChipNeg]}><Text style={styles.metaChipText}>{i.sentiment || 'neutral'}</Text></View>
                    </View>
                    <Text style={styles.fullDate}>{formatFullDate(i.createdAt)}</Text>
                  </View>
                </View>
              ))}
            </View>
          ))
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  errorContainer: { flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center' },
  content: { padding: theme.spacing.l, gap: theme.spacing.m, paddingBottom: 40 },
  header: { gap: 4 },
  title: { ...theme.typography.h1, color: theme.colors.text },
  sub: { ...theme.typography.bodySmall, color: theme.colors.textSecondary },
  statsCard: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.l, padding: theme.spacing.m, borderWidth: 1, borderColor: theme.colors.border, ...theme.shadows.card, gap: theme.spacing.m },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  statItem: { alignItems: 'center', gap: 2, flex: 1 },
  statVal: { fontSize: 18, fontWeight: '800' as any, color: theme.colors.text },
  statLabel: { ...theme.typography.micro, color: theme.colors.textTertiary, textTransform: 'uppercase' as any, fontWeight: '700' as any, letterSpacing: 0.6 },
  statSep: { width: 1, height: 28, backgroundColor: theme.colors.borderLight },
  energyPreview: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.colors.surfaceMuted, padding: theme.spacing.s, borderRadius: theme.borderRadius.m, borderWidth: 1, borderColor: theme.colors.borderLight },
  previewLabel: { ...theme.typography.micro, color: theme.colors.textTertiary, fontWeight: '700' as any, textTransform: 'uppercase' as any },
  energyDots: { flexDirection: 'row', gap: 6 },
  energyDotLg: { width: 10, height: 10, borderRadius: 5 },
  previewMeta: { ...theme.typography.micro, color: theme.colors.textSecondary, flex: 1 },
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
  filterMeta: { ...theme.typography.micro, color: theme.colors.textTertiary, fontStyle: 'italic' as any },
  monthGroup: { gap: 2 },
  monthHeader: { ...theme.typography.label, color: theme.colors.textSecondary, marginTop: theme.spacing.s, marginBottom: 4 },
  item: { flexDirection: 'row', gap: theme.spacing.m },
  lineContainer: { alignItems: 'center', width: 20 },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: theme.colors.background, ...theme.shadows.chip },
  line: { flex: 1, width: 2, backgroundColor: theme.colors.border, marginTop: 4, opacity: 0.6 },
  itemContent: { flex: 1, backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.l, padding: theme.spacing.m, marginBottom: theme.spacing.m, borderWidth: 1, borderColor: theme.colors.border, ...theme.shadows.card, gap: 6 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { ...theme.typography.caption, color: theme.colors.textSecondary, fontWeight: '600' as any },
  timeAgo: { ...theme.typography.micro, color: theme.colors.textTertiary },
  summary: { ...theme.typography.bodySmall, color: theme.colors.text },
  metaRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 2, alignItems: 'center' },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.colors.surfaceMuted, paddingHorizontal: 8, paddingVertical: 2, borderRadius: theme.borderRadius.pill, borderWidth: 1, borderColor: theme.colors.borderLight },
  metaEnergyDot: { width: 6, height: 6, borderRadius: 3 },
  metaChipPos: { backgroundColor: theme.colors.success+'22', borderColor: theme.colors.success+'40' },
  metaChipNeg: { backgroundColor: theme.colors.danger+'22', borderColor: theme.colors.danger+'40' },
  metaChipText: { fontSize: 10, color: theme.colors.textSecondary, fontWeight: '600' as any, textTransform: 'capitalize' as any },
  fullDate: { ...theme.typography.micro, color: theme.colors.textTertiary, marginTop: 2, fontStyle: 'italic' as any },
});
