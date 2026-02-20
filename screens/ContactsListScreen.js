// Contacts List Screen
import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, TextInput
} from 'react-native';
import { useOrbitStore, RELATIONSHIP_TYPES } from '../stores/orbitStore';

export default function ContactsListScreen({ navigation }) {
  const contacts = useOrbitStore((state) => state.contacts);
  const [search, setSearch] = useState('');
  
  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const renderContact = ({ item }) => {
    const type = RELATIONSHIP_TYPES[item.type] || RELATIONSHIP_TYPES.acquaintance;
    const healthScore = navigation.state?.params?.healthScores?.[item.id] || 100;
    
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
          placeholder="Search contacts..."
          placeholderTextColor="#718096"
          value={search}
          onChangeText={setSearch}
        />
      </View>
      
      <FlatList
        data={filteredContacts}
        keyExtractor={(item) => item.id}
        renderItem={renderContact}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>👥</Text>
            <Text style={styles.emptyText}>No contacts yet</Text>
            <Text style={styles.emptySubtext}>
              Add people to start mapping your relationships
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
  searchContainer: { padding: 16 },
  search: {
    backgroundColor: '#1a1a2e',
    color: '#fff',
    padding: 12,
    borderRadius: 12,
    fontSize: 16,
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
  healthBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  healthText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  emptySubtext: { color: '#A0AEC0', marginTop: 8 },
  fab: {
    position: 'absolute', right: 20, bottom: 20,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#E53E3E', justifyContent: 'center', alignItems: 'center',
  },
  fabText: { color: '#fff', fontSize: 30, fontWeight: '300' },
});

import { useState } from 'react';
