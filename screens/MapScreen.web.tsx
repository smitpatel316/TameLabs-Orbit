import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, TextInput, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';

import { useOrbitStore, RELATIONSHIP_TYPES, ENERGY_LEVELS } from '../stores/orbitStore';
import { theme, formatTimeAgo, getHealthColor, formatDate } from '../src/theme';
import { EmptyState } from '../src/components/EmptyState';
import { Button } from '../src/components/Button';
import { GroupAnalyticsCard, computeAnalytics } from '../src/components/GroupAnalyticsCard';
import { GroupDetailModal } from '../src/components/GroupDetailModal';
import { buildUpcomingBirthdays } from '../src/services/calendarSync';
import { logger } from '../src/utils/logger';

type QuadrantKey = 'high-high' | 'high-low' | 'low-high' | 'low-low' | 'all';
type EnergyFilter = keyof typeof ENERGY_LEVELS | 'all';
type TypeFilter = keyof typeof RELATIONSHIP_TYPES | 'all';
type GroupFilter = string;

const QUADRANTS: Record<Exclude<QuadrantKey,'all'>, { label: string; desc: string; color: string }> = {
  'high-high': { label: 'Inner Circle', desc: 'high energy + recent', color: theme.colors.health.excellent },
  'high-low':  { label: 'Need to Reach Out', desc: 'high energy + stale', color: theme.colors.health.okay },
  'low-high':  { label: 'High Maintenance', desc: 'low energy + recent', color: theme.colors.health.poor },
  'low-low':   { label: 'Natural Fade', desc: 'low energy + stale', color: theme.colors.textMuted },
};

function daysSince(iso: string | null): number {
  if (!iso) return 999;
  try { return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)); } catch { return 999; }
}
function isNourishing(energy: string): boolean {
  return (ENERGY_LEVELS as any)[energy]?.value >= 1;
}
function classify(c: any): Exclude<QuadrantKey,'all'> {
  const nourishing = isNourishing(c.energy);
  const recent = daysSince(c.lastInteraction) <= 14;
  if (nourishing && recent) return 'high-high';
  if (nourishing && !recent) return 'high-low';
  if (!nourishing && recent) return 'low-high';
  return 'low-low';
}

export default function MapScreen({ navigation }: any) {
  const contacts = useOrbitStore(s => s.contacts);
  const groups = useOrbitStore(s => s.groups);
  const reminders = useOrbitStore(s => s.reminders);
  const getGroupCounts = useOrbitStore(s => s.getGroupCounts);
  const calculateHealthScore = useOrbitStore(s => s.calculateHealthScore);
  const [refreshing, setRefreshing] = useState(false);
  const [quadrantFilter, setQuadrantFilter] = useState<QuadrantKey>('all');
  const [energyFilter, setEnergyFilter] = useState<EnergyFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('all');
  const [search, setSearch] = useState('');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [detailGroupId, setDetailGroupId] = useState<string | null>(null);

  const onRefresh = useCallback(()=>{
    setRefreshing(true);
    logger.info('Map','pull to refresh',{ count: contacts.length });
    setTimeout(()=> setRefreshing(false), 600);
  }, [contacts.length]);

  React.useEffect(()=>{ logger.info('MapScreen','mounted',{ v: '2.7.0-groups-analytics' }); }, []);

  const enriched = useMemo(()=>{
    return contacts.map(c=>{
      const health = calculateHealthScore(c.id);
      const quad = classify(c);
      const energyVal = (ENERGY_LEVELS as any)[c.energy]?.value ?? 0;
      const days = daysSince(c.lastInteraction);
      return { ...c, health, energyVal, quad, days };
    });
  }, [contacts, calculateHealthScore]);

  const filtered = useMemo(()=>{
    let list = enriched;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c=> c.name.toLowerCase().includes(q) || (c.notes||'').toLowerCase().includes(q) || c.tags?.some((t:string)=>t.toLowerCase().includes(q)));
    }
    if (quadrantFilter!=='all') list = list.filter(c=> c.quad===quadrantFilter);
    if (energyFilter!=='all') list = list.filter(c=> c.energy===energyFilter);
    if (typeFilter!=='all') list = list.filter(c=> c.type===typeFilter);
    if (groupFilter!=='all') {
      if (groupFilter==='__none') list = list.filter(c=> !c.groupId);
      else list = list.filter(c=> c.groupId===groupFilter);
    }
    return list;
  }, [enriched, search, quadrantFilter, energyFilter, typeFilter, groupFilter]);

  const quadrants = useMemo(()=>{
    const buckets: Record<Exclude<QuadrantKey,'all'>, typeof enriched> = { 'high-high': [], 'high-low': [], 'low-high': [], 'low-low': [] };
    filtered.forEach(c=> { buckets[c.quad].push(c); });
    return buckets;
  }, [filtered]);

  const byType = useMemo(()=>{
    const m: any = {};
    Object.keys(RELATIONSHIP_TYPES).forEach(t=> m[t]=filtered.filter(c=>c.type===t));
    return m;
  }, [filtered]);

  const energyBuckets = useMemo(()=>{
    return (Object.keys(ENERGY_LEVELS) as any[]).map((k:string)=>{
      const list = filtered.filter(c=>c.energy===k);
      const info = (ENERGY_LEVELS as any)[k];
      return { key: k, label: info.label, color: info.color, value: info.value, list, count: list.length, avgHealth: list.length ? Math.round(list.reduce((a,b)=>a+b.health,0)/list.length) : 0 };
    }).sort((a,b)=> b.value - a.value);
  }, [filtered]);

  const healthBuckets = useMemo(()=>{
    return [
      { label: '80-100 excellent', fn: (c:any)=>c.health>=80, color: theme.colors.health.excellent },
      { label: '60-80 good', fn: (c:any)=>c.health>=60&&c.health<80, color: theme.colors.health.good },
      { label: '40-60 okay', fn: (c:any)=>c.health>=40&&c.health<60, color: theme.colors.health.okay },
      { label: '20-40 poor', fn: (c:any)=>c.health>=20&&c.health<40, color: theme.colors.health.poor },
      { label: 'under 20 critical', fn: (c:any)=>c.health<20, color: theme.colors.health.critical },
    ];
  }, []);

  const groupCounts = useMemo(()=> getGroupCounts(), [contacts, groups]);
  const groupMap = useMemo(()=>{
    const m: Record<string, any> = {};
    groups.forEach(g=> m[g.id]=g);
    return m;
  }, [groups]);

  const byGroup = useMemo(()=>{
    const m: Record<string, typeof enriched> = {};
    filtered.forEach(c=>{
      const gid = c.groupId || '__none';
      if (!m[gid]) m[gid]=[];
      m[gid].push(c);
    });
    return m;
  }, [filtered]);

  const stats = useMemo(()=>{
    if (!filtered.length) return null;
    const nourishing = filtered.filter(c=>isNourishing(c.energy)).length;
    const stale = filtered.filter(c=> c.days > 30).length;
    const critical = filtered.filter(c=> c.health < 40).length;
    return { nourishing, stale, critical, avgHealth: Math.round(filtered.reduce((a,c)=>a+c.health,0)/filtered.length) };
  }, [filtered]);

  const selected = useMemo(()=> selectedContactId ? enriched.find(c=>c.id===selectedContactId) || null : null, [selectedContactId, enriched]);
  const clearFilters = useCallback(()=>{ setQuadrantFilter('all'); setEnergyFilter('all'); setTypeFilter('all'); setGroupFilter('all'); setSearch(''); }, []);
  const ungroupedCount = contacts.filter(c=>!c.groupId).length;

  // v2.7 per-group analytics list computed for Map By Groups Analytics section
  const groupsAnalytics = useMemo(()=>{
    return groups.map((g:any)=> computeAnalytics(g, contacts as any, reminders as any, calculateHealthScore)).sort((a,b)=> b.count - a.count || b.avgHealth - a.avgHealth);
  }, [groups, contacts, reminders, calculateHealthScore]);

  if (contacts.length===0) {
    return (
      <View style={styles.emptyContainer}>
        <EmptyState title="Map empty" description="Add contacts to see energy cloud, quadrants and health clustering." icon="map" action={{ label: 'Add contact', onPress: ()=>navigation.navigate('ContactsTab', { screen: 'AddContact' } as any) }} />
      </View>
    );
  }

  const activeFilterCount = (quadrantFilter!=='all'?1:0)+(energyFilter!=='all'?1:0)+(typeFilter!=='all'?1:0)+(groupFilter!=='all'?1:0)+(search.trim()?1:0);
  const groupedCount = contacts.filter(c=>c.groupId).length;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.text} />} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Relationship Map</Text>
          <Text style={styles.sub}>{filtered.length}/{contacts.length} visible - quadrants + energy + groups + search{groupedCount ? ` - ${groupedCount} grouped` : ''} - v2.7 groups analytics</Text>
        </View>

        {/* Detail overlay */}
        {selected && (
          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <View style={[styles.detailAvatar, { backgroundColor: (RELATIONSHIP_TYPES as any)[selected.type]?.color || theme.colors.textTertiary }]}><Text style={styles.detailAvatarText}>{(selected.name?.[0]||'?').toUpperCase()}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailName}>{selected.name}</Text>
                <Text style={styles.detailMeta}>{(RELATIONSHIP_TYPES as any)[selected.type]?.emoji} {(RELATIONSHIP_TYPES as any)[selected.type]?.label} - {selected.energy} - {selected.days > 365 ? 'never' : `${selected.days}d ago`} - {formatDate(selected.lastInteraction || selected.createdAt)} - {formatTimeAgo(selected.lastInteraction || selected.createdAt)}</Text>
              </View>
              <TouchableOpacity onPress={()=>setSelectedContactId(null)} hitSlop={8}><Text style={styles.detailClose}>X</Text></TouchableOpacity>
            </View>
            <View style={styles.detailRow}>
              <View style={[styles.healthBadge, { backgroundColor: getHealthColor(selected.health) }]}><Text style={styles.healthBadgeText}>{selected.health}%</Text></View>
              <View style={[styles.quadChip, { borderColor: QUADRANTS[selected.quad].color }]}><Text style={[styles.quadChipText, { color: QUADRANTS[selected.quad].color }]}>{QUADRANTS[selected.quad].label}</Text></View>
              {selected.groupId && groupMap[selected.groupId] ? (
                <TouchableOpacity style={[styles.groupPill, { borderColor: groupMap[selected.groupId].color || theme.colors.border }]} onPress={()=>setDetailGroupId(selected.groupId || null)}><View style={[styles.groupDotSmall, { backgroundColor: groupMap[selected.groupId].color || theme.colors.textTertiary }]} /><Text style={styles.groupPillText}>{groupMap[selected.groupId].name}</Text></TouchableOpacity>
              ) : null}
              <Text style={styles.detailDesc}>{QUADRANTS[selected.quad].desc}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <Button title="Open" onPress={()=>{ setSelectedContactId(null); navigation.navigate('ContactDetail',{ id: selected.id }); }} size="s" accessibilityLabel="Open contact" />
              <Button title="Log Interaction" onPress={()=>{ setSelectedContactId(null); navigation.navigate('AddInteraction',{ contactId: selected.id }); }} variant="secondary" size="s" />
              <Button title="Close" onPress={()=>setSelectedContactId(null)} variant="ghost" size="s" />
            </View>
          </View>
        )}

        {/* Search + filters */}
        <View style={styles.filtersCard}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search name, notes, tags..."
            placeholderTextColor={theme.colors.textTertiary}
            value={search}
            onChangeText={setSearch}
            clearButtonMode="while-editing"
            returnKeyType="search"
            accessibilityLabel="Search filtered map"
          />
          <Text style={styles.filterLabel}>Quadrant {quadrantFilter==='all' ? '(all)' : QUADRANTS[quadrantFilter].label}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            <TouchableOpacity style={[styles.chip, quadrantFilter==='all' && styles.chipActive]} onPress={()=>setQuadrantFilter('all')} accessibilityRole="button" accessibilityState={{ selected: quadrantFilter==='all' }}><Text style={[styles.chipText, quadrantFilter==='all' && styles.chipTextActive]}>All</Text></TouchableOpacity>
            {(Object.keys(QUADRANTS) as Exclude<QuadrantKey,'all'>[]).map(k=> (
              <TouchableOpacity key={k} style={[styles.chip, quadrantFilter===k && styles.chipActive, quadrantFilter===k && { backgroundColor: QUADRANTS[k].color }]} onPress={()=>setQuadrantFilter(k)} accessibilityRole="button" accessibilityState={{ selected: quadrantFilter===k }}><Text style={[styles.chipText, quadrantFilter===k && styles.chipTextActive, quadrantFilter===k && { color: theme.colors.onPrimary }]}>{QUADRANTS[k].label}</Text></TouchableOpacity>
            ))}
          </ScrollView>
          <Text style={[styles.filterLabel, { marginTop: 8 }]}>Energy</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            <TouchableOpacity style={[styles.chip, energyFilter==='all' && styles.chipActive]} onPress={()=>setEnergyFilter('all')}><Text style={[styles.chipText, energyFilter==='all' && styles.chipTextActive]}>All</Text></TouchableOpacity>
            {Object.entries(ENERGY_LEVELS).map(([k,v]: any)=>(
              <TouchableOpacity key={k} style={[styles.chip, energyFilter===k && { backgroundColor: v.color, borderColor: v.color }]} onPress={()=>setEnergyFilter(energyFilter===k?'all':k as any)} accessibilityRole="button" accessibilityState={{ selected: energyFilter===k }}><Text style={[styles.chipText, energyFilter===k && { color: theme.colors.onPrimary }]}>{v.label}</Text></TouchableOpacity>
            ))}
          </ScrollView>
          <Text style={[styles.filterLabel, { marginTop: 8 }]}>Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            <TouchableOpacity style={[styles.chip, typeFilter==='all' && styles.chipActive]} onPress={()=>setTypeFilter('all')}><Text style={[styles.chipText, typeFilter==='all' && styles.chipTextActive]}>All</Text></TouchableOpacity>
            {Object.entries(RELATIONSHIP_TYPES).map(([k,v]: any)=>(
              <TouchableOpacity key={k} style={[styles.chip, typeFilter===k && { backgroundColor: v.color }]} onPress={()=>setTypeFilter(typeFilter===k?'all':k as any)}><Text style={[styles.chipText, typeFilter===k && { color: theme.colors.onPrimary }]}>{v.emoji} {v.label}</Text></TouchableOpacity>
            ))}
          </ScrollView>
          {groups.length > 0 && (
            <>
              <Text style={[styles.filterLabel, { marginTop: 8 }]}>Groups {groupFilter!=='all' ? `(${groupMap[groupFilter]?.name || 'No group'})` : ''} - {groups.length} total • tap pill to open GroupDetail analytics modal</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                <TouchableOpacity style={[styles.chip, groupFilter==='all' && styles.chipActive]} onPress={()=>setGroupFilter('all')} accessibilityRole="button" accessibilityState={{ selected: groupFilter==='all' }}><Text style={[styles.chipText, groupFilter==='all' && styles.chipTextActive]}>All {contacts.length}</Text></TouchableOpacity>
                {groups.map((g:any)=>{
                  const count = groupCounts[g.id] || 0;
                  const active = groupFilter===g.id;
                  return (
                    <TouchableOpacity key={g.id} style={[styles.chip, { borderColor: active ? g.color : theme.colors.border }, active && { backgroundColor: g.color }]} onPress={()=>{ if(active) { setGroupFilter('all'); } else { setGroupFilter(g.id); } }} onLongPress={()=>setDetailGroupId(g.id)} delayLongPress={350} accessibilityRole="button" accessibilityState={{ selected: active }} accessibilityLabel={`Filter group ${g.name} long-press for analytics`}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <View style={[styles.groupDotSmall, { backgroundColor: active ? theme.colors.onPrimary : g.color }]} />
                        <Text style={[styles.chipText, active && { color: theme.colors.onPrimary }]}>{g.name}</Text>
                        <View style={[styles.countBadge, active && { backgroundColor: 'rgba(255,255,255,0.25)' }]}><Text style={[styles.countBadgeText, active && { color: theme.colors.onPrimary }]}>{count}</Text></View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
                {ungroupedCount > 0 && (
                  <TouchableOpacity style={[styles.chip, groupFilter==='__none' && styles.chipActive]} onPress={()=>setGroupFilter(groupFilter==='__none' ? 'all' : '__none')}><Text style={[styles.chipText, groupFilter==='__none' && styles.chipTextActive]}>No group {ungroupedCount}</Text></TouchableOpacity>
                )}
              </ScrollView>
            </>
          )}
          {activeFilterCount>0 && (
            <View style={styles.activeFiltersRow}>
              <Text style={styles.activeFiltersText}>{filtered.length} match - {activeFilterCount} filter{activeFilterCount>1?'s':''}</Text>
              <TouchableOpacity onPress={clearFilters} style={styles.clearBtn} accessibilityRole="button"><Text style={styles.clearText}>Clear all</Text></TouchableOpacity>
            </View>
          )}
        </View>

        {/* Quadrant Grid - 2x2 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Energy vs Recency Quadrant</Text>
          <Text style={styles.cardHint}>tap a quadrant to filter - tap a bubble to see details</Text>
          <View style={styles.quadrantGrid}>
            {(Object.keys(QUADRANTS) as Exclude<QuadrantKey,'all'>[]).map(q=>{
              const info = QUADRANTS[q];
              const list = quadrants[q];
              const isActive = quadrantFilter===q;
              return (
                <TouchableOpacity
                  key={q}
                  style={[styles.quadrantCell, { borderColor: isActive ? info.color : theme.colors.borderLight, backgroundColor: isActive ? info.color+'18' : theme.colors.surfaceMuted }]}
                  onPress={()=> setQuadrantFilter(isActive ? 'all' : q)}
                  activeOpacity={0.7}
                  accessibilityLabel={`${info.label} ${list.length} contacts`}
                  accessibilityRole="button"
                >
                  <View style={[styles.quadrantDot, { backgroundColor: info.color }]} />
                  <Text style={styles.quadrantLabel}>{info.label}</Text>
                  <Text style={styles.quadrantDesc}>{info.desc}</Text>
                  <Text style={[styles.quadrantCount, isActive && { color: info.color, fontWeight: '800' as any }]}>{list.length}</Text>
                  <View style={styles.quadrantBubbles}>
                    {list.slice(0,8).map(c=>(
                      <TouchableOpacity key={c.id} style={[styles.qMiniBubble, { backgroundColor: (ENERGY_LEVELS as any)[c.energy]?.color || theme.colors.textTertiary }]} onPress={()=>setSelectedContactId(c.id)} accessibilityLabel={c.name}>
                        <Text style={styles.qMiniText}>{(c.name?.[0]||'?').toUpperCase()}</Text>
                      </TouchableOpacity>
                    ))}
                    {list.length>8 && <Text style={styles.qMore}>+{list.length-8}</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.axisRow}>
            <Text style={styles.axisLabel}>low energy                           high energy</Text>
          </View>
          <View style={styles.axisRowVertical} />
        </View>

        {/* By Groups clusters - v2.7 enhanced with GroupAnalyticsCard */}
        {groups.length > 0 && filtered.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>By Groups • {Object.keys(byGroup).filter(k=>k!=='__none').length} groups • {filtered.filter(c=>c.groupId).length} grouped • v2.7 analytics</Text>
            <Text style={styles.cardHint}>Groups cluster your Map - tap pill for detail modal (avatar 20 + health badge + timeAgo + energy + Quick Stats) • Tap group chip to filter • Long-press chip for analytics modal</Text>
            {Object.entries(byGroup).filter(([gid])=> gid!=='__none').map(([gid, list]: any)=>{
              const g = groupMap[gid];
              if (!g) return null;
              if (!list.length) return null;
              const avg = Math.round(list.reduce((a:number,c:any)=>a+c.health,0)/list.length);
              const isActive = groupFilter===gid;
              return (
                <View key={gid} style={[styles.groupCluster, isActive && { borderColor: g.color, borderWidth: 1.5 }]}>
                  <TouchableOpacity style={styles.groupHeader} onPress={()=>setGroupFilter(isActive ? 'all' : gid)} activeOpacity={0.7} accessibilityLabel={`Filter group ${g.name}`}>
                    <View style={[styles.groupDot, { backgroundColor: g.color }]} />
                    <Text style={styles.groupTitle}>{g.name} - {list.length}</Text>
                    <Text style={styles.groupAvg}>avg {avg}%</Text>
                    <TouchableOpacity style={[styles.groupActiveHint, isActive && { backgroundColor: g.color }]} onPress={()=>setDetailGroupId(gid)}><Text style={[styles.groupActiveHintText, isActive && { color: theme.colors.onPrimary }]}>Detail</Text></TouchableOpacity>
                  </TouchableOpacity>
                  <View style={styles.bubbleRow}>
                    {list.slice(0,20).map((c:any)=>
                      <TouchableOpacity key={c.id} style={[styles.miniBubble, { backgroundColor: g.color, borderWidth: selectedContactId===c.id?2:0, borderColor: theme.colors.primary }]} onPress={()=>setSelectedContactId(c.id)} activeOpacity={0.7} accessibilityLabel={c.name}>
                        <Text style={styles.miniBubbleText}>{(c.name?.[0]||'?').toUpperCase()}</Text>
                      </TouchableOpacity>
                    )}
                    {list.length>20 && <Text style={styles.moreText}>+{list.length-20}</Text>}
                  </View>
                </View>
              );
            })}
            {byGroup['__none'] && byGroup['__none'].length > 0 && (
              <View style={styles.groupCluster}>
                <View style={styles.groupHeader}>
                  <View style={[styles.groupDot, { backgroundColor: theme.colors.textMuted }]} />
                  <Text style={styles.groupTitle}>No group - {byGroup['__none'].length}</Text>
                  <Text style={styles.groupAvg}>avg {Math.round(byGroup['__none'].reduce((a:number,c:any)=>a+c.health,0)/byGroup['__none'].length)}%</Text>
                  <TouchableOpacity onPress={()=>setGroupFilter(groupFilter==='__none' ? 'all' : '__none')} style={styles.groupActiveHint}><Text style={styles.groupActiveHintText}>{groupFilter==='__none' ? 'filtered' : 'tap'}</Text></TouchableOpacity>
                </View>
                <View style={styles.bubbleRow}>
                  {byGroup['__none'].slice(0,20).map((c:any)=>
                    <TouchableOpacity key={c.id} style={[styles.miniBubble, { backgroundColor: theme.colors.textTertiary, borderWidth: selectedContactId===c.id?2:0, borderColor: theme.colors.primary }]} onPress={()=>setSelectedContactId(c.id)} activeOpacity={0.7} accessibilityLabel={c.name}>
                      <Text style={styles.miniBubbleText}>{(c.name?.[0]||'?').toUpperCase()}</Text>
                    </TouchableOpacity>
                  )}
                  {byGroup['__none'].length>20 && <Text style={styles.moreText}>+{byGroup['__none'].length-20}</Text>}
                </View>
              </View>
            )}
            {Object.keys(byGroup).filter(k=>k!=='__none').length===0 && (
              <Text style={styles.emptyGroupHint}>No grouped contacts yet - assign groups in ContactsList or AddContact to cluster here</Text>
            )}
          </View>
        )}

        {/* v2.7 Groups Analytics Cards - per-group avg health, energy distribution, stale count, birthdays 60d, reminders due */}
        {groupsAnalytics.length > 0 && (
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={styles.cardTitle}>Groups Analytics Dashboard • v2.7 • {groupsAnalytics.length} groups</Text>
              <TouchableOpacity onPress={()=> navigation.navigate('GroupsAnalytics')} style={{ backgroundColor: theme.colors.surfaceHover, paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.borderRadius.pill, borderWidth: 1, borderColor: theme.colors.border }}><Text style={{ fontSize: 11, color: theme.colors.textSecondary, fontWeight: '600' as any }}>Open full</Text></TouchableOpacity>
            </View>
            <Text style={styles.cardHint}>Per-group avg health, energy distribution, stale count {'below 70 pct health'}, totalGrouped, birthdays upcoming 60d count, reminders due • tap card for GroupDetail modal</Text>
            <View style={{ gap: theme.spacing.s, marginTop: theme.spacing.s }}>
              {groupsAnalytics.map((ga: any)=>{
                const g = groups.find((gg:any)=>gg.id===ga.id);
                if (!g) return null;
                return (
                  <GroupAnalyticsCard key={ga.id} group={g as any} contacts={contacts as any} reminders={reminders as any} calculateHealth={calculateHealthScore} onPress={(id:string)=> setDetailGroupId(id)} />
                );
              })}
            </View>
          </View>
        )}

        {/* Energy Cloud - horizontal scroll */}
        {filtered.length>0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Energy Cloud - {filtered.length}</Text>
            <Text style={styles.cardHint}>Opacity = health - Color = energy - Tap for details</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cloudRow}>
              {filtered.sort((a,b)=> b.energyVal - a.energyVal).slice(0,60).map(c=>(
                <TouchableOpacity key={c.id} style={[styles.bubble, { backgroundColor: (ENERGY_LEVELS as any)[c.energy]?.color || theme.colors.textTertiary, opacity: 0.35 + (c.health/100)*0.65, borderWidth: selectedContactId===c.id ? 2 : 0, borderColor: theme.colors.primary }]} onPress={()=>setSelectedContactId(c.id)} activeOpacity={0.7} accessibilityLabel={`${c.name} ${c.health}% ${c.energy}`}>
                  <Text style={styles.bubbleText}>{(c.name?.[0]||'?').toUpperCase()}</Text>
                  <View style={[styles.bubbleHealthDot, { backgroundColor: getHealthColor(c.health) }]} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* By Type clusters */}
        {filtered.length>0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>By Type - {Object.values(byType).reduce((a:number,b:any)=>a+(b.length||0),0)} visible</Text>
            {Object.entries(byType).map(([type, list]: any)=>{
              const info = (RELATIONSHIP_TYPES as any)[type];
              if (!list.length) return null;
              return (
                <View key={type} style={styles.group}>
                  <View style={styles.groupHeader}>
                    <View style={[styles.groupDot, { backgroundColor: info.color }]} />
                    <Text style={styles.groupTitle}>{info.emoji} {info.label} - {list.length}</Text>
                    <Text style={styles.groupAvg}>avg {list.length ? Math.round(list.reduce((a:number,c:any)=>a+c.health,0)/list.length) : 0}%</Text>
                  </View>
                  <View style={styles.bubbleRow}>
                    {list.slice(0,20).map((c:any)=>
                      <TouchableOpacity key={c.id} style={[styles.miniBubble, { backgroundColor: info.color, borderWidth: selectedContactId===c.id?2:0, borderColor: theme.colors.primary }]} onPress={()=>setSelectedContactId(c.id)} activeOpacity={0.7} accessibilityLabel={c.name}>
                        <Text style={styles.miniBubbleText}>{(c.name?.[0]||'?').toUpperCase()}</Text>
                      </TouchableOpacity>
                    )}
                    {list.length>20 && <Text style={styles.moreText}>+{list.length-20}</Text>}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Energy buckets with avg health */}
        {filtered.length>0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Energy Levels - Avg health</Text>
            <View style={styles.distList}>
              {energyBuckets.map(b=>{
                const pct = filtered.length ? (b.count/filtered.length)*100 : 0;
                return (
                  <View key={b.key} style={styles.distRow}>
                    <View style={styles.distLabelRow}>
                      <View style={[styles.distDot, { backgroundColor: b.color }]} />
                      <Text style={styles.distLabel} numberOfLines={1}>{b.label}</Text>
                    </View>
                    <View style={styles.distTrack}><View style={[styles.distFill, { width: `${pct}%`, backgroundColor: b.color }]} /></View>
                    <Text style={styles.distCount}>{b.count}</Text>
                    <Text style={styles.distAvg}>{b.count ? `${b.avgHealth}%` : '-'}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Health distribution */}
        {filtered.length>0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Health Distribution</Text>
            <View style={styles.distList}>
              {healthBuckets.map(({label, fn, color}: any)=>{
                const count = filtered.filter(fn).length;
                const pct = filtered.length ? (count/filtered.length)*100 : 0;
                return (
                  <View key={label as string} style={styles.distRow}>
                    <View style={styles.distLabelRow}>
                      <View style={[styles.distDot, { backgroundColor: color }]} />
                      <Text style={styles.distLabel}>{label as string}</Text>
                    </View>
                    <View style={styles.distTrack}><View style={[styles.distFill, { width: `${pct}%`, backgroundColor: color }]} /></View>
                    <Text style={styles.distCount}>{count}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Quick stats */}
        {stats && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Quick Stats - {filtered.length} shown</Text>
            <View style={styles.quickStats}>
              <View style={styles.qStat}><Text style={styles.qVal}>{stats.avgHealth}%</Text><Text style={styles.qLabel}>Avg health</Text></View>
              <View style={styles.qStat}><Text style={styles.qVal}>{stats.nourishing}</Text><Text style={styles.qLabel}>Nourishing</Text></View>
              <View style={styles.qStat}><Text style={styles.qVal}>{stats.stale}</Text><Text style={styles.qLabel}>30d+ stale</Text></View>
              <View style={styles.qStat}><Text style={[styles.qVal, stats.critical>0 && { color: theme.colors.health.critical }]}>{stats.critical}</Text><Text style={styles.qLabel}>Needs care</Text></View>
            </View>
          </View>
        )}

        {/* Empty filtered */}
        {filtered.length===0 && contacts.length>0 && (
          <View style={{ marginTop: 20 }}>
            <EmptyState title="No matches" description={`No contacts match ${activeFilterCount} filter${activeFilterCount>1?'s':''}. Try clearing.`} icon="search" action={{ label: 'Clear filters', onPress: clearFilters }} />
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      <GroupDetailModal groupId={detailGroupId} onClose={()=> setDetailGroupId(null)} navigation={navigation} />
    </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  emptyContainer: { flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center' },
  content: { padding: theme.spacing.l, gap: theme.spacing.ml },
  header: { alignItems: 'center', gap: 4, paddingVertical: theme.spacing.m },
  title: { ...theme.typography.h1, color: theme.colors.text },
  sub: { ...theme.typography.caption, color: theme.colors.textSecondary, textAlign: 'center' as any },

  detailCard: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.l, padding: theme.spacing.ml, borderWidth: 1.5, borderColor: theme.colors.primary, ...theme.shadows.modal, gap: theme.spacing.s },
  detailHeader: { flexDirection: 'row', gap: theme.spacing.m, alignItems: 'center' },
  detailAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  detailAvatarText: { color: theme.colors.onPrimary, fontSize: 16, fontWeight: '800' as any },
  detailName: { ...theme.typography.h3, color: theme.colors.text },
  detailMeta: { ...theme.typography.micro, color: theme.colors.textSecondary, lineHeight: 13, marginTop: 2 },
  detailClose: { fontSize: 12, fontWeight: '700' as any, color: theme.colors.textTertiary, padding: 6 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.s, flexWrap: 'wrap' as any },
  healthBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.borderRadius.pill },
  healthBadgeText: { color: theme.colors.onPrimary, fontSize: 12, fontWeight: '700' as any },
  quadChip: { borderWidth: 1, borderRadius: theme.borderRadius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  quadChipText: { fontSize: 11, fontWeight: '700' as any },
  detailDesc: { ...theme.typography.micro, color: theme.colors.textTertiary, fontStyle: 'italic' as any },
  groupPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: theme.borderRadius.pill, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: theme.colors.surfaceMuted },
  groupPillText: { fontSize: 11, fontWeight: '600' as any, color: theme.colors.text },
  groupDotSmall: { width: 8, height: 8, borderRadius: 4 },

  filtersCard: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.l, padding: theme.spacing.m, borderWidth: 1, borderColor: theme.colors.border, ...theme.shadows.card, gap: 8 },
  searchInput: { backgroundColor: theme.colors.surfaceMuted, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.m, paddingHorizontal: theme.spacing.m, paddingVertical: 10, fontSize: 14, color: theme.colors.text },
  filterLabel: { ...theme.typography.label, color: theme.colors.textSecondary, marginTop: 2 },
  chipRow: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  chip: { backgroundColor: theme.colors.surfaceMuted, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.pill, paddingHorizontal: 12, paddingVertical: 7 },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { fontSize: 11, fontWeight: '600' as any, color: theme.colors.textSecondary },
  chipTextActive: { color: theme.colors.onPrimary },
  countBadge: { backgroundColor: theme.colors.surfaceHover, borderRadius: theme.borderRadius.pill, paddingHorizontal: 5, paddingVertical: 1, minWidth: 18, alignItems: 'center' },
  countBadgeText: { fontSize: 10, fontWeight: '700' as any, color: theme.colors.textSecondary },
  activeFiltersRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, borderTopWidth: 1, borderTopColor: theme.colors.borderLight, paddingTop: 8 },
  activeFiltersText: { ...theme.typography.caption, color: theme.colors.textSecondary },
  clearBtn: { backgroundColor: theme.colors.surfaceHover, borderRadius: theme.borderRadius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  clearText: { fontSize: 11, fontWeight: '600' as any, color: theme.colors.text },

  card: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.l, padding: theme.spacing.ml, borderWidth: 1, borderColor: theme.colors.border, ...theme.shadows.card },
  cardTitle: { ...theme.typography.h3, color: theme.colors.text, marginBottom: 4 },
  cardHint: { ...theme.typography.micro, color: theme.colors.textTertiary, marginBottom: theme.spacing.m, fontStyle: 'italic' as any },

  quadrantGrid: { flexDirection: 'row', flexWrap: 'wrap' as any, gap: theme.spacing.s },
  quadrantCell: { width: '48%' as any, borderWidth: 1.5, borderRadius: theme.borderRadius.m, padding: theme.spacing.m, gap: 4, minHeight: 110 },
  quadrantDot: { width: 8, height: 8, borderRadius: 4 },
  quadrantLabel: { ...theme.typography.bodySmall, fontWeight: '700' as any, color: theme.colors.text, fontSize: 12 },
  quadrantDesc: { ...theme.typography.micro, color: theme.colors.textTertiary, fontSize: 10 },
  quadrantCount: { fontSize: 20, fontWeight: '800' as any, color: theme.colors.text, marginTop: 2 },
  quadrantBubbles: { flexDirection: 'row', flexWrap: 'wrap' as any, gap: 4, marginTop: 6, alignItems: 'center' },
  qMiniBubble: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  qMiniText: { color: theme.colors.onPrimary, fontSize: 9, fontWeight: '700' as any },
  qMore: { fontSize: 10, color: theme.colors.textTertiary, fontWeight: '600' as any },
  axisRow: { marginTop: theme.spacing.s, alignItems: 'center' },
  axisLabel: { fontSize: 9, color: theme.colors.textMuted, letterSpacing: 0.5 },

  groupCluster: { marginTop: theme.spacing.m, backgroundColor: theme.colors.surfaceMuted, borderRadius: theme.borderRadius.m, padding: theme.spacing.m, borderWidth: 1, borderColor: theme.colors.borderLight, gap: theme.spacing.s },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  groupDot: { width: 10, height: 10, borderRadius: 5 },
  groupTitle: { ...theme.typography.bodySmall, fontWeight: '600' as any, color: theme.colors.text, flex: 1 },
  groupAvg: { ...theme.typography.micro, color: theme.colors.textTertiary },
  groupActiveHint: { backgroundColor: theme.colors.surfaceHover, borderRadius: theme.borderRadius.pill, paddingHorizontal: 8, paddingVertical: 3 },
  groupActiveHintText: { fontSize: 10, fontWeight: '600' as any, color: theme.colors.textTertiary },
  emptyGroupHint: { ...theme.typography.caption, color: theme.colors.textTertiary, fontStyle: 'italic' as any, marginTop: theme.spacing.s },

  cloudRow: { flexDirection: 'row', gap: theme.spacing.s, paddingVertical: 4 },
  bubble: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', ...theme.shadows.chip },
  bubbleText: { color: theme.colors.onPrimary, fontWeight: '700' as any, fontSize: 14 },
  bubbleHealthDot: { position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: theme.colors.surface },
  group: { marginTop: theme.spacing.m },
  bubbleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  miniBubble: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', ...theme.shadows.chip },
  miniBubbleText: { color: theme.colors.onPrimary, fontWeight: '700' as any, fontSize: 12 },
  moreText: { fontSize: 11, color: theme.colors.textTertiary, alignSelf: 'center', marginLeft: 4 },

  distList: { gap: theme.spacing.s, marginTop: theme.spacing.s },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.s },
  distLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, width: 118 },
  distDot: { width: 8, height: 8, borderRadius: 4 },
  distLabel: { ...theme.typography.caption, color: theme.colors.textSecondary, flex: 1 },
  distTrack: { flex: 1, height: 8, backgroundColor: theme.colors.surfaceHover, borderRadius: theme.borderRadius.full, overflow: 'hidden' },
  distFill: { height: '100%', borderRadius: theme.borderRadius.full },
  distCount: { ...theme.typography.caption, color: theme.colors.text, width: 22, textAlign: 'right', fontWeight: '600' as any },
  distAvg: { ...theme.typography.caption, color: theme.colors.textTertiary, width: 32, textAlign: 'right' },

  quickStats: { flexDirection: 'row', gap: theme.spacing.m, marginTop: theme.spacing.s },
  qStat: { flex: 1, alignItems: 'center', backgroundColor: theme.colors.surfaceMuted, borderRadius: theme.borderRadius.m, padding: theme.spacing.m, borderWidth: 1, borderColor: theme.colors.borderLight },
  qVal: { ...theme.typography.h2, color: theme.colors.text },
  qLabel: { ...theme.typography.micro, color: theme.colors.textSecondary, marginTop: 2, textAlign: 'center' },
  axisRowVertical: { height: 0 },
});
