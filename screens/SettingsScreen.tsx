import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, Share, ScrollView } from 'react-native';
import { useOrbitStore } from '../stores/orbitStore';

export default function SettingsScreen() {
  const contacts = useOrbitStore(s => s.contacts);
  const interactions = useOrbitStore(s => s.interactions);
  const tags = useOrbitStore(s => s.tags);
  const groups = useOrbitStore(s => s.groups);
  const reminders = useOrbitStore(s => s.reminders);

  const exportData = async () => {
    const data = { version: '2.0', exportedAt: new Date().toISOString(), contacts, interactions, tags, groups, reminders };
    try { await Share.share({ message: JSON.stringify(data,null,2), title: 'Orbit Export' }); } catch (e:any) { Alert.alert('Export failed', e.message); }
  };

  const clearAll = () => {
    Alert.alert('Clear all?', 'Deletes all contacts, interactions, reminders. Unrecoverable.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete All', style: 'destructive', onPress: async () => {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        await AsyncStorage.removeItem('orbit-contacts-v2');
        Alert.alert('Cleared', 'Restart app to see empty state.');
      }}
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stats</Text>
          <View style={styles.row}><Text style={styles.label}>Contacts</Text><Text style={styles.val}>{contacts.length}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Interactions</Text><Text style={styles.val}>{interactions.length}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Tags</Text><Text style={styles.val}>{tags.length}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Reminders</Text><Text style={styles.val}>{reminders.length}</Text></View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <TouchableOpacity style={styles.btn} onPress={exportData}><Text style={styles.btnText}>Export JSON</Text></TouchableOpacity>
          <Text style={styles.hint}>Share contacts+interactions as JSON. Keep private.</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger</Text>
          <TouchableOpacity style={[styles.btn, styles.btnDanger]} onPress={clearAll}><Text style={styles.btnDangerText}>Clear All Data</Text></TouchableOpacity>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.about}>Orbit v2.0 - Map your relationships. Prune the noise.</Text>
          <Text style={styles.version}>Part of Tame Labs. Local-first.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1117' },
  content: { padding: 16, gap: 20 },
  section: { backgroundColor: '#1A1D27', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#2D3243' },
  sectionTitle: { color: '#FFF', fontWeight: '700', marginBottom: 12, fontSize: 13, textTransform: 'uppercase' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#262A38' },
  label: { color: '#9CA3AF' },
  val: { color: '#FFF', fontWeight: '700' },
  btn: { backgroundColor: '#262A38', padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#2D3243' },
  btnText: { color: '#FFF', fontWeight: '600' },
  btnDanger: { backgroundColor: '#2F1A1A', borderColor: '#742A2A' },
  btnDangerText: { color: '#FC8181', fontWeight: '600' },
  hint: { color: '#6B7280', fontSize: 11, marginTop: 8, textAlign: 'center' },
  about: { color: '#FFF', textAlign: 'center' },
  version: { color: '#6B7280', textAlign: 'center', marginTop: 4, fontSize: 12 },
});
