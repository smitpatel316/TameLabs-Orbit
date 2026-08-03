import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ScrollView, RefreshControl, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useOrbitStore, RELATIONSHIP_TYPES } from '../stores/orbitStore';
import { theme, formatTimeAgo, getHealthColor } from '../src/theme';
import { logger } from '../src/utils/logger';

export default function ContactsListScreen({ navigation }: any) {
  const contacts = useOrbitStore((s) => s.contacts);
  const tags = useOrbitStore((s) => s.tags);
  const groups = useOrbitStore((s) => s.groups);
  const calculateHealthScore = useOrbitStore((s) => s.calculateHealthScore);
  const getGroupCounts = useOrbitStore((s) => s.getGroupCounts);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'health' | 'recent' | 'name'>('recent');
  const [refreshing, setRefreshing] = useState(false);

  React.useEffect(()=>{ logger.info('ContactsList', 'mounted', { count: contacts.length, groups: groups.length }); }, []);

  const onRefresh = useCallback(()=>{
    setRefreshing(true);
    logger.info('ContactsList', 'pull to refresh');
    setTimeout(()=> setRefreshing(false), 600);
  }, []);

  const groupCounts = useMemo(()=> {
    try { return getGroupCounts(); } catch { return {} as Record<string, number>; }
  }, [contacts, getGroupCounts]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = contacts.filter(c => {
      const matchesSearch = !q || c.name.toLowerCase().includes(q) || (c.notes && c.notes.toLowerCase().includes(q)) || (c.tags && c.tags.some((t:string) => t.toLowerCase().includes(q)));
      const matchesTag = !selectedTag || (c.tags && c.tags.includes(selectedTag));
      const matchesType = !filterType || c.type === filterType;
      const matchesGroup = !selectedGroupId || c.groupId === selectedGroupId;
      return matchesSearch && matchesTag && matchesType && matchesGroup;
    });
    if (sortBy === 'health') list = [...list].sort((a,b) => calculateHealthScore(a.id) - calculateHealthScore(b.id));
    else if (sortBy === 'recent') list = [...list].sort((a,b) => (b.lastInteraction || b.createdAt).localeCompare(a.lastInteraction || a.createdAt));
    else list = [...list].sort((a,b) => a.name.localeCompare(b.name));
    return list;
  }, [contacts, search, selectedTag, filterType, selectedGroupId, sortBy, calculateHealthScore]);

  const hasActiveFilters = !!(search || selectedTag || selectedGroupId || filterType);

  const renderContact = ({ item }: any) => {
    const type = (RELATIONSHIP_TYPES as any)[item.type] || RELATIONSHIP_TYPES.acquaintance;
    const health = calculateHealthScore(item.id);
    const last = item.lastInteraction ? formatTimeAgo(item.lastInteraction) : 'never';
    const group = groups.find((g: any)=> g.id === item.groupId);
    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => navigation.navigate('ContactDetail', { id: item.id })}
        activeOpacity={0.7}
        accessibilityLabel={`Contact ${item.name}`}
        accessibilityRole="button"
      >
        <View style={[styles.avatar, { backgroundColor: type.color }]}><Text style={styles.avatarText}>{(item.name?.[0]||'?').toUpperCase()}</Text></View>
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            {group ? (
              <View style={[styles.groupPill, { borderColor: group.color || theme.colors.border }]} accessibilityLabel={`Group ${group.name}`}>
                <View style={[styles.groupDot, { backgroundColor: group.color || theme.colors.primary }]} />
                <Text style={styles.groupPillText} numberOfLines={1}>{group.name}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.detail} numberOfLines={1}>{type.emoji} {type.label} • {item.energy||'neutral'} • {last}</Text>
          {item.tags?.length ? (
            <View style={styles.tagRow}>{item.tags.slice(0,3).map((t:string)=><View key={t} style={styles.miniTag}><Text style={styles.miniTagText}>{t}</Text></View>)}{item.tags.length>3 ? <Text style={styles.moreTags}>+{item.tags.length-3}</Text> : null}</View>
          ):null}
        </View>
        <View style={[styles.healthBadge, { backgroundColor: getHealthColor(health) }]}><Text style={styles.healthText}>{health}%</Text></View>
      </TouchableOpacity>
    );
  };

  const activeCount = filtered.length;
  const totalCount = contacts.length;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <TextInput 
            style={styles.search} 
            placeholder="Search name, notes, tags..." 
            placeholderTextColor={theme.colors.textTertiary} 
            value={search} 
            onChangeText={setSearch}
            clearButtonMode="while-editing"
            returnKeyType="search"
            accessibilityLabel="Search contacts"
          />
        </View>

        {/* Tags filter row */}
        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll} keyboardShouldPersistTaps="handled">
            <TouchableOpacity style={[styles.chip, !selectedTag && !filterType && !selectedGroupId && styles.chipActive]} onPress={()=>{setSelectedTag(null); setFilterType(null); setSelectedGroupId(null);}} accessibilityLabel="Show all contacts">
              <Text style={[styles.chipText, !selectedTag && !filterType && !selectedGroupId && styles.chipTextActive]}>All</Text>
            </TouchableOpacity>
            {tags.map((tag:string)=><TouchableOpacity key={tag} style={[styles.chip, selectedTag===tag && styles.chipActive]} onPress={()=>setSelectedTag(selectedTag===tag?null:tag)} accessibilityRole="button" accessibilityState={{ selected: selectedTag===tag }} accessibilityLabel={`Filter by ${tag}`}>
              <Text style={[styles.chipText, selectedTag===tag && styles.chipTextActive]}>{tag}</Text>
            </TouchableOpacity>)}
          </ScrollView>
          <TouchableOpacity style={styles.importLink} onPress={()=>navigation.navigate('ImportContacts')} accessibilityLabel="Import phone contacts" accessibilityRole="button"><Text style={styles.importLinkText}>Import</Text></TouchableOpacity>
        </View>

        {/* Groups filter row */}
        {groups.length > 0 ? (
          <View style={styles.groupFilterRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll} keyboardShouldPersistTaps="handled">
              <TouchableOpacity style={[styles.groupChip, !selectedGroupId && styles.groupChipActive]} onPress={()=>setSelectedGroupId(null)} accessibilityLabel="All groups">
                <View style={[styles.groupDot, { backgroundColor: !selectedGroupId ? theme.colors.onPrimary : theme.colors.textTertiary }]} />
                <Text style={[styles.groupChipText, !selectedGroupId && styles.groupChipTextActive]}>All groups</Text>
                <View style={[styles.countPill, !selectedGroupId && styles.countPillActive]}><Text style={[styles.countText, !selectedGroupId && styles.countTextActive]}>{totalCount}</Text></View>
              </TouchableOpacity>
              {groups.map((g: any)=>(
                <TouchableOpacity key={g.id} style={[styles.groupChip, selectedGroupId===g.id && styles.groupChipActiveAll]} onPress={()=>setSelectedGroupId(selectedGroupId===g.id ? null : g.id)} accessibilityRole="button" accessibilityState={{ selected: selectedGroupId===g.id }} accessibilityLabel={`Filter group ${g.name}`}>
                  <View style={[styles.groupDot, { backgroundColor: selectedGroupId===g.id ? theme.colors.onPrimary : (g.color || theme.colors.primary) }]} />
                  <Text style={[styles.groupChipText, selectedGroupId===g.id && styles.groupChipTextActive]} numberOfLines={1}>{g.name}</Text>
                  <View style={[styles.countPill, selectedGroupId===g.id && styles.countPillActive]}><Text style={[styles.countText, selectedGroupId===g.id && styles.countTextActive]}>{groupCounts[g.id]||0}</Text></View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Sort row + active hint */}
        <View style={styles.sortContainer}>
          <View style={styles.sortRow}>
            {(['recent','health','name'] as const).map(s=><TouchableOpacity key={s} style={[styles.sortChip, sortBy===s && styles.sortChipActive]} onPress={()=>setSortBy(s)} accessibilityRole="button" accessibilityState={{ selected: sortBy===s }} accessibilityLabel={`Sort by ${s}`}>
              <Text style={[styles.sortText, sortBy===s && styles.sortTextActive]}>{s}</Text>
            </TouchableOpacity>)}
          </View>
          <View style={styles.metaHint}>
            <Text style={styles.metaText}>{hasActiveFilters ? `${activeCount} of ${totalCount}` : `${totalCount} contacts`}{selectedGroupId ? ` • ${groups.find((g:any)=>g.id===selectedGroupId)?.name||''}` : ''}{selectedTag ? ` • #${selectedTag}` : ''}</Text>
            {hasActiveFilters ? <TouchableOpacity onPress={()=>{ setSearch(''); setSelectedTag(null); setSelectedGroupId(null); setFilterType(null); }} hitSlop={6}><Text style={styles.clearText}>Clear</Text></TouchableOpacity> : null}
          </View>
        </View>

        <FlatList 
          data={filtered} 
          keyExtractor={(i)=>i.id} 
          renderItem={renderContact} 
          contentContainerStyle={[styles.list, { paddingBottom: 120 }]} 
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.text} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>{search||selectedTag||selectedGroupId ? '🔍' : '👥'}</Text>
              <Text style={styles.emptyTitle}>{search||selectedTag||selectedGroupId ? 'No matches' : 'No contacts yet'}</Text>
              <Text style={styles.emptyText}>{search||selectedTag||selectedGroupId ? `No contacts match.${selectedGroupId ? ' Try other group.' : ''}${selectedTag ? ' Try other tag.' : ''}` : 'Add your first contact to start mapping relationships. Groups help cluster your map.'}</Text>
              {search||selectedTag||selectedGroupId ? <TouchableOpacity style={styles.emptyAction} onPress={()=>{ setSearch(''); setSelectedTag(null); setSelectedGroupId(null); setFilterType(null); }} accessibilityLabel="Clear filters"><Text style={styles.emptyActionText}>Clear filters</Text></TouchableOpacity> : null}
            </View>
          }
        />
        <TouchableOpacity style={styles.fab} onPress={()=>navigation.navigate('AddContact')} accessibilityLabel="Add contact" accessibilityRole="button" activeOpacity={0.8}><Text style={styles.fabText}>+</Text></TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  searchContainer: { padding: theme.spacing.ml, paddingBottom: theme.spacing.s },
  search: { backgroundColor: theme.colors.surface, color: theme.colors.text, padding: 14, borderRadius: theme.borderRadius.l, fontSize: 15, borderWidth: 1, borderColor: theme.colors.border },
  filterRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing.ml, paddingBottom: theme.spacing.s, gap: theme.spacing.s },
  groupFilterRow: { paddingHorizontal: theme.spacing.ml, paddingBottom: theme.spacing.s },
  chipScroll: { gap: theme.spacing.s, paddingRight: 12, alignItems: 'center' },
  chip: { backgroundColor: theme.colors.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: theme.borderRadius.pill, borderWidth: 1, borderColor: theme.colors.border, ...theme.shadows.chip },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: '500' as any },
  chipTextActive: { color: theme.colors.onPrimary, fontWeight: '600' as any },
  groupChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, paddingHorizontal: 10, paddingVertical: 6, borderRadius: theme.borderRadius.pill, borderWidth: 1, borderColor: theme.colors.border, gap: 6, maxWidth: 160, ...theme.shadows.chip },
  groupChipActive: { backgroundColor: theme.colors.surfaceHover, borderColor: theme.colors.textSecondary },
  groupChipActiveAll: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  groupChipText: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: '500' as any, flexShrink: 1 },
  groupChipTextActive: { color: theme.colors.onPrimary, fontWeight: '600' as any },
  groupDot: { width: 8, height: 8, borderRadius: 4 },
  countPill: { backgroundColor: theme.colors.surfaceHover, paddingHorizontal: 6, paddingVertical: 1, borderRadius: theme.borderRadius.pill, borderWidth: 1, borderColor: theme.colors.borderLight, marginLeft: 2 },
  countPillActive: { backgroundColor: 'rgba(255,255,255,0.22)', borderColor: 'transparent' },
  countText: { fontSize: 10, color: theme.colors.textTertiary, fontWeight: '600' as any },
  countTextActive: { color: theme.colors.onPrimary },
  importLink: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 12, paddingVertical: 6, borderRadius: theme.borderRadius.pill, ...theme.shadows.chip, marginLeft: 'auto' },
  importLinkText: { color: theme.colors.text, fontSize: 12, fontWeight: '600' as any },
  sortContainer: { paddingHorizontal: theme.spacing.ml, paddingBottom: 10, gap: 6 },
  sortRow: { flexDirection: 'row', gap: theme.spacing.s },
  sortChip: { backgroundColor: theme.colors.surface, paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.borderRadius.pill, borderWidth: 1, borderColor: theme.colors.border, ...theme.shadows.chip },
  sortChipActive: { backgroundColor: theme.colors.surfaceHover, borderColor: theme.colors.textSecondary },
  sortText: { color: theme.colors.textTertiary, fontSize: 11, textTransform: 'uppercase' as any, fontWeight: '500' as any },
  sortTextActive: { color: theme.colors.text, fontWeight: '600' as any },
  metaHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  metaText: { color: theme.colors.textTertiary, fontSize: 11, fontStyle: 'italic' as any },
  clearText: { color: theme.colors.danger, fontSize: 11, fontWeight: '600' as any },
  list: { padding: theme.spacing.ml, paddingTop: 4, flexGrow: 1 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, padding: 14, borderRadius: theme.borderRadius.l, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.border, ...theme.shadows.card },
  avatar: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: theme.colors.onPrimary, fontSize: 18, fontWeight: '700' as any },
  info: { flex: 1, marginLeft: 12, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' as any },
  name: { color: theme.colors.text, fontSize: 15, fontWeight: '600' as any, flexShrink: 1 },
  groupPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.colors.surfaceMuted, paddingHorizontal: 6, paddingVertical: 2, borderRadius: theme.borderRadius.pill, borderWidth: 1, maxWidth: 110 },
  groupPillText: { fontSize: 10, color: theme.colors.textSecondary, fontWeight: '600' as any },
  detail: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 2 },
  tagRow: { flexDirection: 'row', marginTop: 4, flexWrap: 'wrap', gap: 4, alignItems: 'center' },
  miniTag: { backgroundColor: theme.colors.tagBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: theme.borderRadius.s, borderWidth: 1, borderColor: theme.colors.borderLight },
  miniTagText: { color: theme.colors.tagText, fontSize: 10, fontWeight: '500' as any },
  moreTags: { color: theme.colors.textTertiary, fontSize: 10, marginLeft: 2 },
  healthBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.borderRadius.pill },
  healthText: { color: theme.colors.onPrimary, fontWeight: '700' as any, fontSize: 11 },
  empty: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 32, gap: 8 },
  emptyIcon: { fontSize: 42, marginBottom: 8 },
  emptyTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '700' as any },
  emptyText: { color: theme.colors.textSecondary, textAlign: 'center', fontSize: 13, lineHeight: 18 },
  emptyAction: { marginTop: 12, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.m, borderWidth: 1, borderColor: theme.colors.border, ...theme.shadows.chip },
  emptyActionText: { color: theme.colors.text, fontSize: 13, fontWeight: '600' as any },
  fab: { position: 'absolute', right: theme.spacing.ml, bottom: 96, width: theme.sizes.fab, height: theme.sizes.fab, borderRadius: theme.sizes.fab/2, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', zIndex: 10, ...theme.shadows.fab },
  fabText: { color: theme.colors.onPrimary, fontSize: 28, fontWeight: '300' as any, marginTop: -2 },
});
