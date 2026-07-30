
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useOrbitStore } from '../stores/orbitStore';

export default function RemindersScreen() {
  const contacts = useOrbitStore(s => s.contacts);
  const reminders = useOrbitStore(s => s.reminders);
  const addReminder = useOrbitStore(s => s.addReminder);
  const toggleReminder = useOrbitStore(s => s.toggleReminder);
  const deleteReminder = useOrbitStore(s => s.deleteReminder);
  const [text, setText] = useState('');
  const [selectedContact, setSelectedContact] = useState<string | null>(null);

  const handleAdd = () => {
    if (!text.trim() || !selectedContact) return;
    addReminder({ contactId: selectedContact, message: text.trim() });
    setText('');
  };

  const renderItem = ({ item }: any) => {
    const contact = contacts.find(c => c.id === item.contactId);
    return (
      <View style={[styles.card, item.done && styles.cardDone]}>
        <TouchableOpacity onPress={()=>toggleReminder(item.id)} style={styles.check}><Text>{item.done?'[x]':'[ ]'}</Text></TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.msg, item.done && styles.msgDone]}>{item.message}</Text>
          <Text style={styles.contactName}>{contact?.name || 'Unknown'} - Due {new Date(item.dueDate).toLocaleDateString()}</Text>
        </View>
        <TouchableOpacity onPress={()=>deleteReminder(item.id)}><Text>Del</Text></TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputSection}>
        <TextInput style={styles.input} placeholder="Reminder... e.g. Check in" placeholderTextColor="#6B7280" value={text} onChangeText={setText} />
        <View style={styles.chipRow}>
          {contacts.slice(0,6).map(c=><TouchableOpacity key={c.id} style={[styles.chip, selectedContact===c.id && styles.chipActive]} onPress={()=>setSelectedContact(c.id)}><Text style={[styles.chipText, selectedContact===c.id && styles.chipTextActive]}>{c.name}</Text></TouchableOpacity>)}
        </View>
        <TouchableOpacity style={[styles.addBtn, (!text || !selectedContact) && styles.addBtnDisabled]} onPress={handleAdd}><Text style={styles.addBtnText}>Add Reminder</Text></TouchableOpacity>
      </View>
      <FlatList data={reminders} keyExtractor={(i:any)=>i.id} renderItem={renderItem} contentContainerStyle={styles.list} ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>No reminders</Text></View>} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1117' },
  inputSection: { padding: 16, gap: 10 },
  input: { backgroundColor: '#1A1D27', color: '#FFF', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#2D3243' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#1A1D27', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#2D3243' },
  chipActive: { backgroundColor: '#E53E3E', borderColor: '#E53E3E' },
  chipText: { color: '#9CA3AF', fontSize: 12 },
  chipTextActive: { color: '#FFF' },
  addBtn: { backgroundColor: '#E53E3E', padding: 14, borderRadius: 12, alignItems: 'center' },
  addBtnDisabled: { opacity: 0.5 },
  addBtnText: { color: '#FFF', fontWeight: '700' },
  list: { padding: 16, gap: 10 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1D27', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#2D3243', gap: 10 },
  cardDone: { opacity: 0.5 },
  check: { padding: 4 },
  msg: { color: '#FFF', fontSize: 14 },
  msgDone: { textDecorationLine: 'line-through', color: '#6B7280' },
  contactName: { color: '#6B7280', fontSize: 11, marginTop: 4 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: '#6B7280' },
});
