import React, { useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useOrbitStore } from '../stores/orbitStore';

export default function SentimentScreen({ route }: any) {
  const { id } = route.params;
  const getContactWithInteractions = useOrbitStore(s => (s as any).getContactWithInteractions);
  const result = getContactWithInteractions(id);
  const contact = result?.contact;
  const interactions = result?.interactions;

  const stats = useMemo(()=>{
    if (!interactions) return { pos:0, neu:0, neg:0, total:0 };
    const pos = interactions.filter((i:any)=>i.sentiment==='positive').length;
    const neu = interactions.filter((i:any)=>i.sentiment==='neutral').length;
    const neg = interactions.filter((i:any)=>i.sentiment==='negative').length;
    return { pos, neu, neg, total: interactions.length };
  }, [interactions]);

  if (!contact) return <SafeAreaView style={styles.container}><Text style={styles.error}>Not found</Text></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Sentiment - {contact.name}</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Breakdown</Text>
          <View style={styles.row}><Text style={styles.label}>Positive</Text><Text style={styles.val}>{stats.pos} ({stats.total?Math.round(stats.pos/stats.total*100):0}%)</Text></View>
          <View style={styles.row}><Text style={styles.label}>Neutral</Text><Text style={styles.val}>{stats.neu} ({stats.total?Math.round(stats.neu/stats.total*100):0}%)</Text></View>
          <View style={styles.row}><Text style={styles.label}>Negative</Text><Text style={styles.val}>{stats.neg} ({stats.total?Math.round(stats.neg/stats.total*100):0}%)</Text></View>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Insight</Text>
          <Text style={styles.body}>
            {stats.total===0 ? 'Log interactions with sentiment to see patterns.' :
             (stats as any).neg/stats.total>0.5 ? 'Mostly negative. Is this relationship draining? Consider boundary.' :
             (stats as any).pos/stats.total>0.6 ? 'Mostly positive! Nourishing relationship - invest more.' :
             'Mixed sentiment. Normal for close relationships.'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1117' },
  content: { padding: 16, gap: 16 },
  error: { color: '#FFF', textAlign: 'center', marginTop: 40 },
  title: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  card: { backgroundColor: '#1A1D27', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#2D3243' },
  cardTitle: { color: '#FFF', fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#262A38' },
  label: { color: '#D1D5DB' },
  val: { color: '#FFF', fontWeight: '600' },
  body: { color: '#9CA3AF', lineHeight: 20 },
});
