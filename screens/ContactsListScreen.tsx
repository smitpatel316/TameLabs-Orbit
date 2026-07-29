import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, TextInput, ScrollView } from 'react-native';
import { useOrbitStore, RELATIONSHIP_TYPES } from '../stores/orbitStore';

export default function ContactsListScreen({ navigation }: any) {
  const contacts = useOrbitStore((s) => s.contacts);
  const tags = useOrbitStore((s) => s.tags);
  const calculateHealthScore = useOrbitStore((s) => s.calculateHealthScore);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'health' | 'recent' | 'name'>('recent');

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
    return (
      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ContactDetail', { id: item.id })}>
        <View style={[styles.avatar, { backgroundColor: type.color }]}><Text style={styles.avatarText}>{item.name[0].toUpperCase()}</Text></View>
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.detail}>{type.emoji} {type.label} - {item.energy}</Text>
          {item.tags?.length ? (
            <View style={styles.tagRow}>{item.tags.slice(0,3).map((t:string)=><View key={t} style={styles.miniTag}><Text style={styles.miniTagText}>{t}</Text></View>)}</View>
          ):null}
        </View>
        <View style={[styles.healthBadge, { backgroundColor: health>=80?'#38A169':health>=60?'#68D391':health>=40?'#ECC94B':health>=20?'#ED8936':'#E53E3E' }]}><Text style={styles.healthText}>{health}%</Text></View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput style={styles.search} placeholder="Search name, notes, tags..." placeholderTextColor="#6B7280" value={search} onChangeText={setSearch} />
      </View>
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
          <TouchableOpacity style={[styles.chip, !selectedTag && !filterType && styles.chipActive]} onPress={()=>{setSelectedTag(null); setFilterType(null);}}><Text style={[styles.chipText, !selectedTag && !filterType && styles.chipTextActive]}>All</Text></TouchableOpacity>
          {tags.map((tag:string)=><TouchableOpacity key={tag} style={[styles.chip, selectedTag===tag && styles.chipActive]} onPress={()=>setSelectedTag(selectedTag===tag?null:tag)}><Text style={[styles.chipText, selectedTag===tag && styles.chipTextActive]}>{tag}</Text></TouchableOpacity>)}
        </ScrollView>
      </View>
      <View style={styles.sortRow}>
        {(['recent','health','name'] as const).map(s=><TouchableOpacity key={s} style={[styles.sortChip, sortBy===s && styles.sortChipActive]} onPress={()=>setSortBy(s)}><Text style={[styles.sortText, sortBy===s && styles.sortTextActive]}>{s}</Text></TouchableOpacity>)}
      </View>
      <FlatList data={filtered} keyExtractor={(i)=>i.id} renderItem={renderContact} contentContainerStyle={styles.list} ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>No contacts yet. Add one!</Text></View>} />
      <TouchableOpacity style={styles.fab} onPress={()=>navigation.navigate('AddContact')}><Text style={styles.fabText}>+</Text></TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1117' },
  searchContainer: { padding: 16, paddingBottom: 8 },
  search: { backgroundColor: '#1A1D27', color: '#FFF', padding: 14, borderRadius: 12, fontSize: 15, borderWidth: 1, borderColor: '#2D3243' },
  filterRow: { paddingBottom: 8 },
  chip: { backgroundColor: '#1A1D27', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#2D3243' },
  chipActive: { backgroundColor: '#E53E3E', borderColor: '#E53E3E' },
  chipText: { color: '#9CA3AF', fontSize: 13 },
  chipTextActive: { color: '#FFF', fontWeight: '600' as any },
  sortRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 10 },
  sortChip: { backgroundColor: '#1A1D27', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#2D3243' },
  sortChipActive: { backgroundColor: '#262A38' },
  sortText: { color: '#6B7280', fontSize: 11, textTransform: 'uppercase' as any },
  sortTextActive: { color: '#FFF' },
  list: { padding: 16, paddingTop: 4 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1D27', padding: 14, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: '#2D3243' },
  avatar: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontSize: 18, fontWeight: '700' as any },
  info: { flex: 1, marginLeft: 12 },
  name: { color: '#FFF', fontSize: 15, fontWeight: '600' as any },
  detail: { color: '#9CA3AF', fontSize: 12, marginTop: 2 },
  tagRow: { flexDirection: 'row', marginTop: 4, flexWrap: 'wrap', gap: 4 },
  miniTag: { backgroundColor: '#262A38', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  miniTagText: { color: '#9CA3AF', fontSize: 10 },
  healthBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  healthText: { color: '#FFF', fontWeight: '700' as any, fontSize: 11 },
  empty: { alignItems: 'center', paddingVertical: 80 },
  emptyText: { color: '#6B7280' },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#E53E3E', justifyContent: 'center', alignItems: 'center' },
  fabText: { color: '#FFF', fontSize: 28, fontWeight: '300' as any },
});
