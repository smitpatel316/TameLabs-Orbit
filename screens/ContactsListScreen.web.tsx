import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useOrbitStore, RELATIONSHIP_TYPES } from '../stores/orbitStore';
export default function ContactsListScreen({ navigation }: any) {
  const contacts = useOrbitStore((s) => s.contacts);
  const calculateHealthScore = useOrbitStore((s) => s.calculateHealthScore);
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return contacts.filter((c: any) => !q || c.name.toLowerCase().includes(q));
  }, [contacts, search]);
  const renderContact = ({ item }: any) => {
    const type = (RELATIONSHIP_TYPES as any)[item.type] || RELATIONSHIP_TYPES.acquaintance;
    const health = calculateHealthScore(item.id);
    return (
      <TouchableOpacity style={styles.card} onPress={() => navigation?.navigate('ContactDetail', { id: item.id })}>
        <View style={[styles.avatar, { backgroundColor: type.color }]}><Text style={styles.avatarText}>{item.name[0]?.toUpperCase()}</Text></View>
        <View style={styles.info}><Text style={styles.name}>{item.name}</Text><Text style={styles.detail}>{type.label} - {item.energy}</Text></View>
        <View style={styles.healthBadge}><Text style={styles.healthText}>{health}%</Text></View>
      </TouchableOpacity>
    );
  };
  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}><TextInput style={styles.search} placeholder="Search..." value={search} onChangeText={setSearch} /></View>
      <FlatList data={filtered} keyExtractor={(i:any)=>i.id} renderItem={renderContact} contentContainerStyle={styles.list} ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>No contacts yet. Add one!</Text></View>} />
      <TouchableOpacity style={styles.fab} onPress={()=>navigation?.navigate('AddContact')}><Text style={styles.fabText}>+</Text></TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1117' },
  searchContainer: { padding: 16, paddingBottom: 8 },
  search: { backgroundColor: '#1A1D27', color: '#FFF', padding: 14, borderRadius: 12, fontSize: 15, borderWidth: 1, borderColor: '#2D3243' },
  card: { flexDirection:'row' as any, alignItems:'center' as any, backgroundColor:'#1A1D27', padding:12, borderRadius:12, marginBottom:10, borderWidth:1, borderColor:'#2D3243' },
  avatar: { width:40, height:40, borderRadius:20, justifyContent:'center', alignItems:'center', marginRight:12 } as any,
  avatarText: { color:'#FFF', fontWeight:'700' as any },
  info: { flex:1 },
  name: { color:'#FFF', fontWeight:'600' as any, fontSize:15 },
  detail: { color:'#9CA3AF', fontSize:12, marginTop:2 },
  healthBadge: { backgroundColor:'#38A169', paddingHorizontal:8, paddingVertical:4, borderRadius:8 },
  healthText: { color:'#FFF', fontSize:12, fontWeight:'600' as any },
  list: { padding: 16, paddingTop: 4 },
  empty: { padding:40, alignItems:'center' as any },
  emptyText: { color:'#6B7280' },
  fab: { position:'absolute' as any, bottom:80, right:20, width:56, height:56, borderRadius:28, backgroundColor:'#E53E3E', justifyContent:'center', alignItems:'center' },
  fabText: { color:'#FFF', fontSize:28, fontWeight:'600' as any },
});
