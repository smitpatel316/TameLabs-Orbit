import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ScrollView, RefreshControl, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useOrbitStore, RELATIONSHIP_TYPES } from '../stores/orbitStore';
import { theme, formatTimeAgo } from '../src/theme';
import { logger } from '../src/utils/logger';

export default function ContactsListScreen({ navigation }: any) {
  const contacts = useOrbitStore((s) => s.contacts);
  const tags = useOrbitStore((s) => s.tags);
  const calculateHealthScore = useOrbitStore((s) => s.calculateHealthScore);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'health' | 'recent' | 'name'>('recent');
  const [refreshing, setRefreshing] = useState(false);

  React.useEffect(()=>{ logger.info('ContactsList', 'mounted', { count: contacts.length }); }, []);

  const onRefresh = useCallback(()=>{
    setRefreshing(true);
    logger.info('ContactsList', 'pull to refresh');
    setTimeout(()=> setRefreshing(false), 600);
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = contacts.filter(c => {
      const matchesSearch = !q || c.name.toLowerCase().includes(q) || (c.notes && c.notes.toLowerCase().includes(q)) || (c.tags && c.tags.some((t:string) => t.toLowerCase().includes(q)));
      const matchesTag = !selectedTag || (c.tags && c.tags.includes(selectedTag));
      const matchesType = !filterType || c.type === filterType;
      return matchesSearch && matchesTag && matchesType;
    });
    if (sortBy === 'health') list = [...list].sort((a,b) => calculateHealthScore(a.id) - calculateHealthScore(b.id));
    else if (sortBy === 'recent') list = [...list].sort((a,b) => (b.lastInteraction || b.createdAt).localeCompare(a.lastInteraction || a.createdAt));
    else list = [...list].sort((a,b) => a.name.localeCompare(b.name));
    return list;
  }, [contacts, search, selectedTag, filterType, sortBy, calculateHealthScore]);

  const renderContact = ({ item }: any) => {
    const type = (RELATIONSHIP_TYPES as any)[item.type] || RELATIONSHIP_TYPES.acquaintance;
    const health = calculateHealthScore(item.id);
    const last = item.lastInteraction ? formatTimeAgo(item.lastInteraction) : 'never';
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
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.detail} numberOfLines={1}>{type.emoji} {type.label} • {item.energy||'neutral'} • {last}</Text>
          {item.tags?.length ? (
            <View style={styles.tagRow}>{item.tags.slice(0,3).map((t:string)=><View key={t} style={styles.miniTag}><Text style={styles.miniTagText}>{t}</Text></View>)}{item.tags.length>3 ? <Text style={styles.moreTags}>+{item.tags.length-3}</Text> : null}</View>
          ):null}
        </View>
        <View style={[styles.healthBadge, { backgroundColor: health>=80?'#38A169':health>=60?'#68D391':health>=40?'#ECC94B':health>=20?'#ED8936':'#E53E3E' }]}><Text style={styles.healthText}>{health}%</Text></View>
      </TouchableOpacity>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <TextInput 
            style={styles.search} 
            placeholder="Search name, notes, tags..." 
            placeholderTextColor="#6B7280" 
            value={search} 
            onChangeText={setSearch}
            clearButtonMode="while-editing"
            returnKeyType="search"
            accessibilityLabel="Search contacts"
          />
        </View>
        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
            <TouchableOpacity style={[styles.chip, !selectedTag && !filterType && styles.chipActive]} onPress={()=>{setSelectedTag(null); setFilterType(null);}}><Text style={[styles.chipText, !selectedTag && !filterType && styles.chipTextActive]}>All</Text></TouchableOpacity>
            {tags.map((tag:string)=><TouchableOpacity key={tag} style={[styles.chip, selectedTag===tag && styles.chipActive]} onPress={()=>setSelectedTag(selectedTag===tag?null:tag)} accessibilityRole="button" accessibilityState={{ selected: selectedTag===tag }}><Text style={[styles.chipText, selectedTag===tag && styles.chipTextActive]}>{tag}</Text></TouchableOpacity>)}
          </ScrollView>
        </View>
        <View style={styles.sortRow}>
          {(['recent','health','name'] as const).map(s=><TouchableOpacity key={s} style={[styles.sortChip, sortBy===s && styles.sortChipActive]} onPress={()=>setSortBy(s)} accessibilityRole="button" accessibilityState={{ selected: sortBy===s }}><Text style={[styles.sortText, sortBy===s && styles.sortTextActive]}>{s}</Text></TouchableOpacity>)}
        </View>
        <FlatList 
          data={filtered} 
          keyExtractor={(i)=>i.id} 
          renderItem={renderContact} 
          contentContainerStyle={styles.list} 
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E53E3E" />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>{search||selectedTag ? '🔍' : '👥'}</Text>
              <Text style={styles.emptyTitle}>{search||selectedTag ? 'No matches' : 'No contacts yet'}</Text>
              <Text style={styles.emptyText}>{search||selectedTag ? `No contacts match "${search||selectedTag}". Try different search.` : 'Add your first contact to start mapping relationships.'}</Text>
              {search||selectedTag ? <TouchableOpacity style={styles.emptyAction} onPress={()=>{ setSearch(''); setSelectedTag(null); setFilterType(null); }}><Text style={styles.emptyActionText}>Clear filters</Text></TouchableOpacity> : null}
            </View>
          }
        />
        <TouchableOpacity style={styles.fab} onPress={()=>navigation.navigate('AddContact')} accessibilityLabel="Add contact" accessibilityRole="button"><Text style={styles.fabText}>+</Text></TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  searchContainer: { padding: 16, paddingBottom: 8 },
  search: { backgroundColor: theme.colors.surface, color: theme.colors.text, padding: 14, borderRadius: 12, fontSize: 15, borderWidth: 1, borderColor: theme.colors.border },
  filterRow: { paddingBottom: 8 },
  chip: { backgroundColor: theme.colors.surface, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { color: theme.colors.textSecondary, fontSize: 13 },
  chipTextActive: { color: '#FFF', fontWeight: '600' as any },
  sortRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 10 },
  sortChip: { backgroundColor: theme.colors.surface, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border },
  sortChipActive: { backgroundColor: theme.colors.surfaceHover, borderColor: theme.colors.textSecondary },
  sortText: { color: theme.colors.textTertiary, fontSize: 11, textTransform: 'uppercase' as any },
  sortTextActive: { color: theme.colors.text },
  list: { padding: 16, paddingTop: 4, flexGrow: 1 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, padding: 14, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.border },
  avatar: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontSize: 18, fontWeight: '700' as any },
  info: { flex: 1, marginLeft: 12 },
  name: { color: theme.colors.text, fontSize: 15, fontWeight: '600' as any },
  detail: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 2 },
  tagRow: { flexDirection: 'row', marginTop: 4, flexWrap: 'wrap', gap: 4, alignItems: 'center' },
  miniTag: { backgroundColor: theme.colors.surfaceHover, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  miniTagText: { color: theme.colors.textSecondary, fontSize: 10 },
  moreTags: { color: theme.colors.textTertiary, fontSize: 10, marginLeft: 2 },
  healthBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  healthText: { color: '#FFF', fontWeight: '700' as any, fontSize: 11 },
  empty: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 32, gap: 8 },
  emptyIcon: { fontSize: 42, marginBottom: 8 },
  emptyTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '700' as any },
  emptyText: { color: theme.colors.textSecondary, textAlign: 'center', fontSize: 13, lineHeight: 18 },
  emptyAction: { marginTop: 12, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: theme.colors.surface, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.border },
  emptyActionText: { color: theme.colors.text, fontSize: 13, fontWeight: '600' as any },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  fabText: { color: '#FFF', fontSize: 28, fontWeight: '300' as any, marginTop: -2 },
});
