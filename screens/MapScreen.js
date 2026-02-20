// Map Screen - Relationship visualization
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useOrbitStore, RELATIONSHIP_TYPES } from '../stores/orbitStore';

export default function MapScreen() {
  const contacts = useOrbitStore((state) => state.contacts);
  
  // Group contacts by type
  const byType = {};
  Object.keys(RELATIONSHIP_TYPES).forEach(type => {
    byType[type] = contacts.filter(c => c.type === type);
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>🗺️ Relationship Map</Text>
        <Text style={styles.subtitle}>Your circle of connections</Text>
        
        {Object.entries(byType).map(([type, typeContacts]) => {
          const typeInfo = RELATIONSHIP_TYPES[type];
          if (typeContacts.length === 0) return null;
          
          return (
            <View key={type} style={styles.group}>
              <Text style={styles.groupTitle}>
                {typeInfo.emoji} {typeInfo.label}
              </Text>
              <View style={styles.contacts}>
                {typeContacts.map(contact => (
                  <View 
                    key={contact.id} 
                    style={[styles.bubble, { backgroundColor: typeInfo.color }]}
                  >
                    <Text style={styles.bubbleText}>{contact.name[0]}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.count}>{typeContacts.length} people</Text>
            </View>
          );
        })}
        
        {contacts.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🗺️</Text>
            <Text style={styles.emptyText}>Add contacts to see your relationship map</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#16213e' },
  content: { padding: 20 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  subtitle: { color: '#A0AEC0', textAlign: 'center', marginBottom: 24 },
  group: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, marginBottom: 16 },
  groupTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 12 },
  contacts: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  bubble: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', margin: 4 },
  bubbleText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  count: { color: '#A0AEC0', fontSize: 12 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyText: { color: '#A0AEC0' },
});
