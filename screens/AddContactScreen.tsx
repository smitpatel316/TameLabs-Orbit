import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Alert } from 'react-native';
import { useOrbitStore, RELATIONSHIP_TYPES } from '../stores/orbitStore';

export default function AddContactScreen({ navigation }: any) {
  const addContact = useOrbitStore(s => s.addContact);
  const tags = useOrbitStore(s => s.tags);
  const [name, setName] = useState('');
  const [type, setType] = useState('friend');
  const [notes, setNotes] = useState('');
  const [birthday, setBirthday] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const toggleTag = (tag: string) => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t=>t!==tag) : [...prev, tag]);

  const handleSubmit = () => {
    if (!name.trim()) { Alert.alert('Required','Enter name'); return; }
    addContact({ name: name.trim(), type: type as any, notes, tags: selectedTags, birthday: birthday||null } as any);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}><Text style={styles.label}>Name *</Text><TextInput style={styles.input} placeholder="Enter name" placeholderTextColor="#6B7280" value={name} onChangeText={setName} /></View>
        <View style={styles.section}><Text style={styles.label}>Relationship Type</Text><View style={styles.types}>{Object.entries(RELATIONSHIP_TYPES).map(([k,v]:any)=><TouchableOpacity key={k} style={[styles.typeBtn, type===k && { backgroundColor: v.color }]} onPress={()=>setType(k)}><Text style={styles.typeEmoji}>{v.emoji}</Text><Text style={[styles.typeLabel, type===k && styles.typeLabelActive]}>{v.label}</Text></TouchableOpacity>)}</View></View>
        <View style={styles.section}><Text style={styles.label}>Tags</Text><View style={styles.tags}>{tags.map((t:string)=><TouchableOpacity key={t} style={[styles.tag, selectedTags.includes(t) && styles.tagActive]} onPress={()=>toggleTag(t)}><Text style={[styles.tagText, selectedTags.includes(t) && styles.tagTextActive]}>{t}</Text></TouchableOpacity>)}</View></View>
        <View style={styles.section}><Text style={styles.label}>Birthday (MM/DD)</Text><TextInput style={styles.input} placeholder="e.g. 12/25" placeholderTextColor="#6B7280" value={birthday} onChangeText={setBirthday} /></View>
        <View style={styles.section}><Text style={styles.label}>Notes</Text><TextInput style={[styles.input, styles.multiline]} placeholder="How did you meet?..." placeholderTextColor="#6B7280" value={notes} onChangeText={setNotes} multiline numberOfLines={3} /></View>
        <TouchableOpacity style={styles.submit} onPress={handleSubmit}><Text style={styles.submitText}>Add Contact</Text></TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1117' },
  content: { padding: 16, gap: 16 },
  section: {},
  label: { color: '#9CA3AF', fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' },
  input: { backgroundColor: '#1A1D27', color: '#FFF', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#2D3243', fontSize: 15 },
  multiline: { minHeight: 80, textAlignVertical: 'top' as any },
  types: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1D27', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#2D3243', gap: 6 },
  typeEmoji: { fontSize: 14 },
  typeLabel: { color: '#9CA3AF', fontSize: 13 },
  typeLabelActive: { color: '#FFF', fontWeight: '600' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: '#1A1D27', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#2D3243' },
  tagActive: { backgroundColor: '#E53E3E', borderColor: '#E53E3E' },
  tagText: { color: '#9CA3AF', fontSize: 12 },
  tagTextActive: { color: '#FFF' },
  submit: { backgroundColor: '#E53E3E', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  submitText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});
