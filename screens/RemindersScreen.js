// Reminders Screen
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, TextInput, Alert } from 'react-native';
import { useOrbitStore } from '../stores/orbitStore';

export default function RemindersScreen({ navigation }) {
  const contacts = useOrbitStore((state) => state.contacts);
  const [reminders, setReminders] = useState([]);
  const [newReminder, setNewReminder] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);

  const addReminder = () => {
    if (!newReminder.trim()) return;
    if (!selectedContact) {
      Alert.alert('Select Contact', 'Please select a contact for this reminder');
      return;
    }
    
    const reminder = {
      id: Date.now().toString(),
      text: newReminder.trim(),
      contactId: selectedContact,
      contactName: contacts.find(c => c.id === selectedContact)?.name || 'Unknown',
      dueDate: new Date().toISOString(),
      completed: false,
    };
    
    setReminders([...reminders, reminder]);
    setNewReminder('');
  };

  const toggleComplete = (id) => {
    setReminders(reminders.map(r => 
      r.id === id ? { ...r, completed: !r.completed } : r
    ));
  };

  const deleteReminder = (id) => {
    setReminders(reminders.filter(r => r.id !== id));
  };

  const renderReminder = ({ item }) => (
    <View style={[styles.card, item.completed && styles.cardCompleted]}>
      <TouchableOpacity onPress={() => toggleComplete(item.id)} style={styles.checkbox}>
        <Text style={styles.checkboxText}>{item.completed ? '✅' : '⬜'}</Text>
      </TouchableOpacity>
      <View style={styles.reminderContent}>
        <Text style={[styles.reminderText, item.completed && styles.textCompleted]}>
          {item.text}
        </Text>
        <Text style={styles.contactName}>👤 {item.contactName}</Text>
      </View>
      <TouchableOpacity onPress={() => deleteReminder(item.id)}>
        <Text style={styles.delete}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inputSection}>
        <TextInput
          style={styles.input}
          placeholder="Reminder..."
          placeholderTextColor="#718096"
          value={newReminder}
          onChangeText={setNewReminder}
        />
        
        <View style={styles.contactPicker}>
          {contacts.slice(0, 5).map(c => (
            <TouchableOpacity
              key={c.id}
              style={[styles.chip, selectedContact === c.id && styles.chipActive]}
              onPress={() => setSelectedContact(c.id)}
            >
              <Text style={[styles.chipText, selectedContact === c.id && styles.chipTextActive]}>
                {c.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <TouchableOpacity style={styles.addButton} onPress={addReminder}>
          <Text style={styles.addButtonText}>Add Reminder</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={reminders}
        keyExtractor={(item) => item.id}
        renderItem={renderReminder}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>⏰</Text>
            <Text style={styles.emptyText}>No reminders yet</Text>
            <Text style={styles.emptySubtext}>Set reminders to follow up with contacts</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#16213e' },
  inputSection: { padding: 16 },
  input: {
    backgroundColor: '#1a1a2e',
    color: '#fff',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  contactPicker: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  chip: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: { backgroundColor: '#E53E3E' },
  chipText: { color: '#A0AEC0' },
  chipTextActive: { color: '#fff' },
  addButton: {
    backgroundColor: '#E53E3E',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  list: { padding: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardCompleted: { opacity: 0.6 },
  checkbox: { marginRight: 12 },
  checkboxText: { fontSize: 20 },
  reminderContent: { flex: 1 },
  reminderText: { color: '#fff', fontSize: 16 },
  textCompleted: { textDecorationLine: 'line-through', color: '#A0AEC0' },
  contactName: { color: '#A0AEC0', fontSize: 12, marginTop: 4 },
  delete: { fontSize: 18, padding: 8 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  emptySubtext: { color: '#A0AEC0', marginTop: 8 },
});
