import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useOrbitStore, ENERGY_LEVELS } from '../stores/orbitStore';

export default function AddInteractionScreen({ route, navigation }: any) {
  const { contactId } = route.params;
  const addInteraction = useOrbitStore(s => s.addInteraction);
  const contacts = useOrbitStore(s => s.contacts);
  const contact = contacts.find(c=>c.id===contactId);
  const [type, setType] = useState<'call'|'text'|'in-person'|'email'|'other'>('text');
  const [summary, setSummary] = useState('');
  const [energy, setEnergy] = useState('neutral');
  const [sentiment, setSentiment] = useState<'positive'|'neutral'|'negative'>('neutral');

  const handleSubmit = () => {
    if (!summary.trim()) return;
    addInteraction({ contactId, type, summary: summary.trim(), energy: energy as any, sentiment } as any);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>Log interaction with {contact?.name || 'contact'}</Text>
        <View style={styles.section}><Text style={styles.label}>Type</Text><View style={styles.row}>{(['call','text','in-person','email','other'] as const).map(t=><TouchableOpacity key={t} style={[styles.chip, type===t && styles.chipActive]} onPress={()=>setType(t)}><Text style={[styles.chipText, type===t && styles.chipTextActive]}>{t}</Text></TouchableOpacity>)}</View></View>
        <View style={styles.section}><Text style={styles.label}>Summary</Text><TextInput style={[styles.input, { minHeight: 80 }]} placeholder="What happened?" placeholderTextColor="#6B7280" value={summary} onChangeText={setSummary} multiline /></View>
        <View style={styles.section}><Text style={styles.label}>Energy</Text><View style={styles.row}>{Object.entries(ENERGY_LEVELS).map(([k,v]:any)=><TouchableOpacity key={k} style={[styles.energyChip, { borderColor: v.color }, energy===k && { backgroundColor: v.color }]} onPress={()=>setEnergy(k)}><Text style={[styles.chipText, energy===k && styles.chipTextActive]}>{v.label}</Text></TouchableOpacity>)}</View></View>
        <View style={styles.section}><Text style={styles.label}>Sentiment</Text><View style={styles.row}>{(['positive','neutral','negative'] as const).map(s=><TouchableOpacity key={s} style={[styles.chip, sentiment===s && styles.chipActive]} onPress={()=>setSentiment(s)}><Text style={[styles.chipText, sentiment===s && styles.chipTextActive]}>{s}</Text></TouchableOpacity>)}</View></View>
        <TouchableOpacity style={styles.submit} onPress={handleSubmit}><Text style={styles.submitText}>Log Interaction</Text></TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1117' },
  content: { padding: 16, gap: 16 },
  header: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  section: {},
  label: { color: '#9CA3AF', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', marginBottom: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#1A1D27', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: '#2D3243' },
  chipActive: { backgroundColor: '#E53E3E', borderColor: '#E53E3E' },
  chipText: { color: '#9CA3AF', fontSize: 12 },
  chipTextActive: { color: '#FFF' },
  energyChip: { backgroundColor: '#1A1D27', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  input: { backgroundColor: '#1A1D27', color: '#FFF', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#2D3243' },
  submit: { backgroundColor: '#E53E3E', padding: 16, borderRadius: 12, alignItems: 'center' },
  submitText: { color: '#FFF', fontWeight: '700' },
});
