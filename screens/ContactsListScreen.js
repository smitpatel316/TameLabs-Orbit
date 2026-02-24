// Contacts List Screen
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, TextInput, ScrollView
} from 'react-native';
import { useOrbitStore, RELATIONSHIP_TYPES } from '../stores/orbitStore';

export default function ContactsListScreen({ navigation }) {
  const contacts = useOrbitStore((state) => state.contacts);
  const tags = useOrbitStore((state) => state.tags);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);
  
  // Enhanced search - search by name, notes, tags
  const filteredContacts = contacts.filter(c => {
    const searchLower = search.toLowerCase();
    const matchesSearch = !search || 
      c.name.toLowerCase().includes(searchLower) ||
      (c.notes && c.notes.toLowerCase().includes(searchLower)) ||
      (c.tags && c.tags.some(t => t.toLowerCase().includes(searchLower)));
    const matchesTag = !selectedTag || (c.tags && c.tags.includes(selectedTag));
    return matchesSearch && matchesTag;
  });

  const renderContact = ({ item }) => {
    const type = RELATIONSHIP_TYPES[item.type] || RELATIONSHIP_TYPES.acquaintance;
    const healthScore = item.healthScore || 100;
    
    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('ContactDetail', { id: item.id })}
      >
        <View style={[styles.avatar, { backgroundColor: type.color }]}>
          <Text style={styles.avatarText}>{item.name[0].toUpperCase()}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.detail}>{type.label}</Text>
          {item.tags && item.tags.length > 0 && (
            <View style={styles.tagRow}>
              {item.tags.slice(0, 3).map(tag => (
                <View key={tag} style={styles.miniTag}>
                  <Text style={styles.miniTagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        <View style={styles.healthContainer}>
          <View style={[
            styles.healthBadge,
            { backgroundColor: getHealthColor(healthScore) }
          ]}>
            <Text style={styles.healthText}>{healthScore}%</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.search}
          placeholder="Search by name, notes, tags..."
          placeholderTextColor="#718096"
          value={search}
          onChangeText={setSearch}
        />
      </View>
      
      {/* Tag Filter */}
      <View style={styles.tagFilterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.tagChip, !selectedTag && styles.tagChipActive]}
            onPress={() => setSelectedTag(null)}
          >
            <Text style={[styles.tagChipText, !selectedTag && styles.tagChipTextActive]}>All</Text>
          </TouchableOpacity>
          {tags.map(tag => (
            <TouchableOpacity
              key={tag}
              style={[styles.tagChip, selectedTag === tag && styles.tagChipActive]}
              onPress={() => setSelectedTag(selectedTag === tag ? null : tag)}
            >
              <Text style={[styles.tagChipText, selectedTag === tag && styles.tagChipTextActive]}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      <FlatList
        data={filteredContacts}
        keyExtractor={(item) => item.id}
        renderItem={renderContact}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>👥</Text>
            <Text style={styles.emptyText}>No contacts found</Text>
            <Text style={styles.emptySubtext}>
              {selectedTag ? `No contacts with tag "${selectedTag}"` : 'Add people to start mapping your relationships'}
            </Text>
          </View>
        }
      />
      
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddContact')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function getHealthColor(score) {
  if (score >= 80) return '#38A169';
  if (score >= 60) return '#68D391';
  if (score >= 40) return '#ECC94B';
  if (score >= 20) return '#ED8936';
  return '#E53E3E';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#16213e' },
  searchContainer: { padding: 16, paddingBottom: 8 },
  search: {
    backgroundColor: '#1a1a2e',
    color: '#fff',
    padding: 12,
    borderRadius: 12,
    fontSize: 16,
  },
  tagFilterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  tagChip: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  tagChipActive: {
    backgroundColor: '#E53E3E',
  },
  tagChipText: {
    color: '#A0AEC0',
    fontSize: 14,
  },
  tagChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  list: { padding: 16, paddingTop: 0 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  info: { flex: 1, marginLeft: 12 },
  name: { color: '#fff', fontSize: 16, fontWeight: '600' },
  detail: { color: '#A0AEC0', fontSize: 14, marginTop: 2 },
  tagRow: { flexDirection: 'row', marginTop: 4, flexWrap: 'wrap' },
  miniTag: {
    backgroundColor: '#2D3748',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 4,
    marginTop: 4,
  },
  miniTagText: { color: '#A0AEC0', fontSize: 10 },
  healthBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  healthText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  emptySubtext: { color: '#A0AEC0', marginTop: 8, textAlign: 'center' },
  fab: {
    position: 'absolute', right: 20, bottom: 20,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#E53E3E', justifyContent: 'center', alignItems: 'center',
  },
  fabText: { color: '#fff', fontSize: 30, fontWeight: '300' },
});
