// Add Contact Screen
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Alert
} from 'react-native';
import { useOrbitStore, RELATIONSHIP_TYPES, ENERGY_LEVELS } from '../stores/orbitStore';

export default function AddContactScreen({ navigation }) {
  const addContact = useOrbitStore((state) => state.addContact);
  const [name, setName] = useState('');
  const [type, setType] = useState('friend');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState([]);

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a name');
      return;
    }
    
    addContact({
      name: name.trim(),
      type,
      notes,
      tags,
    });
    
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter name"
            placeholderTextColor="#718096"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Relationship Type</Text>
          <View style={styles.types}>
            {Object.entries(RELATIONSHIP_TYPES).map(([key, value]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.typeButton,
                  type === key && { backgroundColor: value.color }
                ]}
                onPress={() => setType(key)}
              >
                <Text style={styles.typeEmoji}>{value.emoji}</Text>
                <Text style={[
                  styles.typeLabel,
                  type === key && styles.typeLabelActive
                ]}>{value.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="How do you know them? Common interests?"
            placeholderTextColor="#718096"
            value={notes}
            onChangeText={setNotes}
            multiline
          />
        </View>

        <TouchableOpacity style={styles.submit} onPress={handleSubmit}>
          <Text style={styles.submitText}>Add Contact</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#16213e' },
  content: { padding: 20 },
  section: { marginBottom: 24 },
  label: { color: '#A0AEC0', fontSize: 14, marginBottom: 8 },
  input: {
    backgroundColor: '#1a1a2e',
    color: '#fff',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2D3748',
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  types: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 4,
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2D3748',
  },
  typeEmoji: { fontSize: 16, marginRight: 6 },
  typeLabel: { color: '#A0AEC0', fontSize: 12 },
  typeLabelActive: { color: '#fff' },
  submit: {
    backgroundColor: '#E53E3E',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  submitText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
