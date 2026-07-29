import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useOrbitStore, RELATIONSHIP_TYPES, ENERGY_LEVELS } from '../stores/orbitStore';
import { formatDistanceToNow } from 'date-fns';

export default function ContactDetailScreen({ route, navigation }: any) {
  const { id } = route.params;
  const contacts = useOrbitStore(s => s.contacts);
  const interactions = useOrbitStore(s => s.interactions);
  const deleteContact = useOrbitStore(s => s.deleteContact);
  const calculateHealthScore = useOrbitStore(s => s.calculateHealthScore);
  const contact = contacts.find(c=>c.id===id);
  const contactInteractions = interactions.filter(i=>i.contactId===id).sort((a:any,b:any)=>b.createdAt.localeCompare(a.createdAt));

  if (!contact) return <SafeAreaView style={styles.container}><Text style={styles.error}>Not found</Text></SafeAreaView>;

  const type = (RELATIONSHIP_TYPES as any)[contact.type] || RELATIONSHIP_TYPES.acquaintance;
  const health = calculateHealthScore(id);
  const energy = (ENERGY_LEVELS as any)[contact.energy] || ENERGY_LEVELS.neutral;

  const handleDelete = () => {
    Alert.alert('Delete?', 'This removes contact and all interactions', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: ()=>{ deleteContact(id); navigation.goBack(); } },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: type.color }]}><Text style={styles.avatarText}>{contact.name[0].toUpperCase()}</Text></View>
          <Text style={styles.name}>{contact.name}</Text>
          <Text style={styles.type}>{type.emoji} {type.label} - {contact.tags?.join(', ') || 'No tags'}</Text>
          {contact.birthday && <Text style={styles.birthday}>Birthday {contact.birthday}</Text>}
        </View>
        <View style={styles.stats}>
          <View style={styles.stat}><Text style={styles.statV}>{health}%</Text><Text style={styles.statL}>Health</Text></View>
          <View style={styles.stat}><Text style={[styles.statV, { color: energy.color }]}>{energy.label}</Text><Text style={styles.statL}>Energy</Text></View>
          <View style={styles.stat}><Text style={styles.statV}>{contactInteractions.length}</Text><Text style={styles.statL}>Logs</Text></View>
        </View>
        {contact.notes ? <View style={styles.section}><Text style={styles.sectionTitle}>Notes</Text><Text style={styles.notes}>{contact.notes}</Text></View> : null}
        <View style={styles.section}>
          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Recent Interactions</Text><TouchableOpacity onPress={()=>navigation.navigate('JourneyMapping',{id})}><Text style={styles.link}>Journey</Text></TouchableOpacity></View>
          {contactInteractions.length===0 ? <Text style={styles.empty}>No interactions yet. Log one!</Text> : contactInteractions.slice(0,10).map((i:any)=><View key={i.id} style={styles.interaction}><View style={styles.interactionHeader}><Text style={styles.interactionType}>{i.type}</Text><Text style={styles.interactionDate}>{formatDistanceToNow(new Date(i.createdAt),{addSuffix:true})}</Text></View><Text style={styles.interactionSummary}>{i.summary}</Text><View style={styles.interactionMeta}><Text style={[styles.energyBadge, { color: (ENERGY_LEVELS as any)[i.energy]?.color }]}>{i.energy} - {i.sentiment}</Text></View></View>)}
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionPrimary} onPress={()=>navigation.navigate('AddInteraction',{contactId:id})}><Text style={styles.actionPrimaryText}>+ Log Interaction</Text></TouchableOpacity>
          <TouchableOpacity style={styles.actionSecondary} onPress={()=>navigation.navigate('Sentiment',{id})}><Text style={styles.actionSecondaryText}>Sentiment</Text></TouchableOpacity>
          <TouchableOpacity style={styles.delete} onPress={handleDelete}><Text style={styles.deleteText}>Delete Contact</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1117' },
  content: { padding: 16, gap: 16 },
  error: { color: '#FFF', textAlign: 'center', marginTop: 40 },
  header: { alignItems: 'center', paddingVertical: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontSize: 32, fontWeight: '700' },
  name: { color: '#FFF', fontSize: 22, fontWeight: '800', marginTop: 12 },
  type: { color: '#9CA3AF', marginTop: 4 },
  birthday: { color: '#E53E3E', marginTop: 4, fontWeight: '600' },
  stats: { flexDirection: 'row', backgroundColor: '#1A1D27', borderRadius: 14, padding: 16, justifyContent: 'space-around', borderWidth: 1, borderColor: '#2D3243' },
  stat: { alignItems: 'center' },
  statV: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  statL: { color: '#9CA3AF', fontSize: 11, marginTop: 4, textTransform: 'uppercase' },
  section: { backgroundColor: '#1A1D27', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#2D3243' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { color: '#FFF', fontWeight: '700', fontSize: 13, textTransform: 'uppercase' },
  link: { color: '#E53E3E', fontWeight: '600', fontSize: 12 },
  notes: { color: '#D1D5DB', lineHeight: 20 },
  empty: { color: '#6B7280', fontStyle: 'italic', textAlign: 'center', padding: 12 },
  interaction: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#262A38' },
  interactionHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  interactionType: { color: '#FFF', fontWeight: '600', fontSize: 12, textTransform: 'uppercase' },
  interactionDate: { color: '#6B7280', fontSize: 11 },
  interactionSummary: { color: '#D1D5DB', marginTop: 4, fontSize: 13 },
  interactionMeta: { marginTop: 4 },
  energyBadge: { fontSize: 11, fontWeight: '600' },
  actions: { gap: 10 },
  actionPrimary: { backgroundColor: '#E53E3E', padding: 16, borderRadius: 12, alignItems: 'center' },
  actionPrimaryText: { color: '#FFF', fontWeight: '700' },
  actionSecondary: { backgroundColor: '#1A1D27', padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#2D3243' },
  actionSecondaryText: { color: '#FFF', fontWeight: '600' },
  delete: { padding: 14, alignItems: 'center' },
  deleteText: { color: '#E53E3E' },
});
