// Contact Detail Screen
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useOrbitStore, RELATIONSHIP_TYPES, ENERGY_LEVELS } from '../stores/orbitStore';
import { formatDistanceToNow } from 'date-fns';

export default function ContactDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const contacts = useOrbitStore((state) => state.contacts);
  const interactions = useOrbitStore((state) => state.interactions);
  const deleteContact = useOrbitStore((state) => state.deleteContact);
  const calculateHealthScore = useOrbitStore((state) => state.calculateHealthScore);
  
  const contact = contacts.find((c) => c.id === id);
  const contactInteractions = interactions.filter((i) => i.contactId === id);
  
  if (!contact) {
    return <SafeAreaView style={styles.container}><Text style={styles.error}>Contact not found</Text></SafeAreaView>;
  }
  
  const type = RELATIONSHIP_TYPES[contact.type] || RELATIONSHIP_TYPES.acquaintance;
  const healthScore = calculateHealthScore(id);
  const energy = ENERGY_LEVELS[contact.energy] || ENERGY_LEVELS.neutral;

  const handleDelete = () => {
    Alert.alert('Delete Contact', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        deleteContact(id);
        navigation.goBack();
      }},
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: type.color }]}>
            <Text style={styles.avatarText}>{contact.name[0].toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{contact.name}</Text>
          <Text style={styles.type}>{type.label}</Text>
        </View>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{healthScore}%</Text>
            <Text style={styles.statLabel}>Health</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: energy.color }]}>{energy.label}</Text>
            <Text style={styles.statLabel}>Energy</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{contactInteractions.length}</Text>
            <Text style={styles.statLabel}>Interactions</Text>
          </View>
        </View>

        {contact.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notes}>{contact.notes}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Interactions</Text>
          {contactInteractions.length === 0 ? (
            <Text style={styles.empty}>No interactions yet</Text>
          ) : (
            contactInteractions.slice(0, 5).map((interaction) => (
              <View key={interaction.id} style={styles.interaction}>
                <Text style={styles.interactionType}>{interaction.type}</Text>
                <Text style={styles.interactionSummary}>{interaction.summary}</Text>
                <Text style={styles.interactionDate}>
                  {formatDistanceToNow(new Date(interaction.createdAt), { addSuffix: true })}
                </Text>
              </View>
            ))
          )}
        </View>

        <TouchableOpacity style={styles.delete} onPress={handleDelete}>
          <Text style={styles.deleteText}>Delete Contact</Text>
        </TouchableOpacity>
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddInteraction', { contactId: id })}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#16213e' },
  content: { padding: 20 },
  error: { color: '#fff', textAlign: 'center', marginTop: 40 },
  header: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  name: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  type: { color: '#A0AEC0', fontSize: 16, marginTop: 4 },
  stats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 24 },
  stat: { alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  statLabel: { color: '#A0AEC0', fontSize: 12, marginTop: 4 },
  section: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 12 },
  notes: { color: '#A0AEC0', lineHeight: 22 },
  empty: { color: '#718096', fontStyle: 'italic' },
  interaction: { borderBottomWidth: 1, borderBottomColor: '#2D3748', paddingVertical: 12 },
  interactionType: { color: '#E53E3E', fontWeight: '600', fontSize: 14 },
  interactionSummary: { color: '#fff', marginTop: 4 },
  interactionDate: { color: '#718096', fontSize: 12, marginTop: 4 },
  delete: { alignItems: 'center', marginTop: 20 },
  deleteText: { color: '#E53E3E', fontSize: 14 },
  fab: {
    position: 'absolute', right: 20, bottom: 20,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#E53E3E', justifyContent: 'center', alignItems: 'center',
  },
  fabText: { color: '#fff', fontSize: 30, fontWeight: '300' },
});
