import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useOrbitStore } from '../stores/orbitStore';

export default function JourneyMappingScreen({ route }: any) {
  const { id } = route.params;
  const getContactWithInteractions = useOrbitStore(s => (s as any).getContactWithInteractions);
  const result = getContactWithInteractions(id);
  const contact = result?.contact;
  const interactions = result?.interactions;

  const timeline = useMemo(()=>{
    if (!interactions) return [];
    return [...interactions].sort((a:any,b:any)=>a.createdAt.localeCompare(b.createdAt));
  }, [interactions]);

  if (!contact) return <View style={styles.container}><Text style={styles.error}>Not found</Text></View>;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Journey - {contact.name}</Text>
        <Text style={styles.sub}>{timeline.length} interactions over time</Text>
        {timeline.map((i:any)=><View key={i.id} style={styles.item}><View style={styles.lineContainer}><View style={styles.dot} /><View style={styles.line} /></View><View style={styles.itemContent}><Text style={styles.date}>{new Date(i.createdAt).toLocaleDateString()}</Text><Text style={styles.summary}>{i.summary}</Text><Text style={styles.meta}>{i.type} - {i.energy} - {i.sentiment}</Text></View></View>)}
        {timeline.length===0 && <Text style={styles.empty}>No journey yet. Log interactions to see timeline.</Text>}
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1117' },
  content: { padding: 16 },
  error: { color: '#FFF', textAlign: 'center', marginTop: 40 },
  title: { color: '#FFF', fontSize: 20, fontWeight: '800', marginBottom: 4 },
  sub: { color: '#9CA3AF', marginBottom: 20 },
  item: { flexDirection: 'row', gap: 12 },
  lineContainer: { alignItems: 'center', width: 20 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#E53E3E' },
  line: { flex: 1, width: 2, backgroundColor: '#2D3243', marginTop: 4 },
  itemContent: { flex: 1, backgroundColor: '#1A1D27', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#2D3243' },
  date: { color: '#6B7280', fontSize: 11 },
  summary: { color: '#FFF', marginTop: 4, fontSize: 14 },
  meta: { color: '#9CA3AF', fontSize: 11, marginTop: 4 },
  empty: { color: '#6B7280', textAlign: 'center', marginTop: 40 },
});
