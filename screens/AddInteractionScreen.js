// Add Interaction Screen
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Alert } from 'react-native';
import { useOrbitStore } from '../stores/orbitStore';

const INTERACTION_TYPES = [
  { id: 'call', emoji: '📞', label: 'Phone Call' },
  { id: 'text', emoji: '💬', label: 'Text/Chat' },
  { id: 'in_person', emoji: '🤝', label: 'In Person' },
  { id: 'email', emoji: '📧', label: 'Email' },
  { id: 'video', emoji: '📹', label: 'Video Call' },
  { id: 'other', emoji: '📝', label: 'Other' },
];

export default function AddInteractionScreen({ route, navigation }) {
  const { contactId } = route.params;
  const addInteraction = useOrbitStore((state) => state.addInteraction);
  
  const [type, setType] = useState('in_person');
  const [summary, setSummary] = useState('');
  const [topics, setTopics] = useState('');
  const [mood, setMood] = useState('neutral');

  const handleSubmit = () => {
    if (!summary.trim()) {
      Alert.alert('Required', 'Please add a summary');
      return;
    }
    
    addInteraction({
      contactId,
      type: INTERACTION_TYPES.find(t => t.id === type)?.emoji + ' ' + INTERACTION_TYPES.find(t => t.id === type).label,
      summary: summary.trim(),
      topics: topics.split(',').map(t => t.trim()).filter(Boolean),
      mood,
    });
    
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.label}>How did you connect?</Text>
          <View style={styles.types}>
            {INTERACTION_TYPES.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[styles.typeButton, type === t.id && styles.typeButtonActive]}
                onPress={() => setType(t.id)}
              >
                <Text style={styles.typeEmoji}>{t.emoji}</Text>
                <Text style={[styles.typeLabel, type === t.id && styles.typeLabelActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Summary</Text>
          <TextInput
            style={styles.input}
            placeholder="What did you talk about?"
            placeholderTextColor="#718096"
            value={summary}
            onChangeText={setSummary}
            multiline
          />
        </View>

        .section}>
          <Text style={styles.label}>Topics (<View style={stylescomma separated)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., work, family, hobbies"
            placeholderTextColor="#718096"
            value={topics}
            onChangeText={setTopics}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>How do you feel after?</Text>
          <View style={styles.moods}>
            {['negative', 'neutral', 'positive'].map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.moodButton, mood === m && styles.moodButtonActive]}
                onPress={() => setMood(m)}
              >
                <Text style={styles.moodEmoji}>
                  {m === 'negative' ? '😔' : m === 'neutral' ? '😐' : '😊'}
                </Text>
                <Text style={[styles.moodLabel, mood === m && styles.moodLabelActive]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.submit} onPress={handleSubmit}>
          <Text style={styles.submitText}>Log Interaction</Text>
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
  input: { backgroundColor: '#1a1a2e', color: '#fff', padding: 16, borderRadius: 12, fontSize: 16, minHeight: 100, textAlignVertical: 'top', borderWidth: 1, borderColor: '#2D3748' },
  types: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  typeButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, margin: 4, backgroundColor: '#1a1a2e', borderRadius: 20, borderWidth: 1, borderColor: '#2D3748' },
  typeButtonActive: { backgroundColor: '#E53E3E', borderColor: '#E53E3E' },
  typeEmoji: { fontSize: 16, marginRight: 6 },
  typeLabel: { color: '#A0AEC0', fontSize: 12 },
  typeLabelActive: { color: '#fff' },
  moods: { flexDirection: 'row', justifyContent: 'space-around' },
  moodButton: { alignItems: 'center', padding: 16, backgroundColor: '#1a1a2e', borderRadius: 12, flex: 1, marginHorizontal: 4 },
  moodButtonActive: { backgroundColor: '#E53E3E' },
  moodEmoji: { fontSize: 24 },
  moodLabel: { color: '#A0AEC0', fontSize: 12, marginTop: 4 },
  moodLabelActive: { color: '#fff' },
  submit: { backgroundColor: '#E53E3E', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  submitText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
