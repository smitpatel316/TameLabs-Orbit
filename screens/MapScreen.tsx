import React, { useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useOrbitStore, RELATIONSHIP_TYPES, ENERGY_LEVELS } from '../stores/orbitStore';

export default function MapScreen({ navigation }: any) {
  const contacts = useOrbitStore(s => s.contacts);
  const calculateHealthScore = useOrbitStore(s => s.calculateHealthScore);

  const byType = useMemo(()=>{
    const m: any = {};
    Object.keys(RELATIONSHIP_TYPES).forEach(t=> m[t]=contacts.filter(c=>c.type===t));
    return m;
  }, [contacts]);

  const energyList = useMemo(()=>{
    return contacts.map(c=>({ ...c, health: calculateHealthScore(c.id), energyVal: (ENERGY_LEVELS as any)[c.energy]?.value ?? 0 }));
  }, [contacts, calculateHealthScore]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Relationship Map</Text>
        <Text style={styles.sub}>Circles - energy vs health</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Energy Cloud</Text>
          <View style={styles.cloud}>
            {energyList.sort((a,b)=>b.energyVal-a.energyVal).map(c=>(
              <TouchableOpacity key={c.id} style={[styles.bubble, { backgroundColor: (ENERGY_LEVELS as any)[c.energy]?.color || '#6B7280', opacity: 0.3 + (c.health/100)*0.7 }]} onPress={()=>navigation.navigate('ContactDetail',{id:c.id})}>
                <Text style={styles.bubbleText}>{c.name[0]}</Text>
              </TouchableOpacity>
            ))}
            {contacts.length===0 && <Text style={styles.muted}>Add contacts</Text>}
          </View>
        </View>

        {Object.entries(byType).map(([type, list]: any)=>{
          const info = (RELATIONSHIP_TYPES as any)[type];
          if (!list.length) return null;
          return (
            <View key={type} style={styles.group}>
              <Text style={styles.groupTitle}>{info.emoji} {info.label} - {list.length}</Text>
              <View style={styles.bubbleRow}>
                {list.map((c:any)=><TouchableOpacity key={c.id} style={[styles.miniBubble, { backgroundColor: info.color }]} onPress={()=>navigation.navigate('ContactDetail',{id:c.id})}><Text style={styles.miniBubbleText}>{c.name[0]}</Text></TouchableOpacity>)}
              </View>
            </View>
          );
        })}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Health Distribution</Text>
          {[['<20', (c:any)=>c.health<20], ['20-40', (c:any)=>c.health>=20&&c.health<40], ['40-60', (c:any)=>c.health>=40&&c.health<60], ['60-80', (c:any)=>c.health>=60&&c.health<80], ['80-100', (c:any)=>c.health>=80]].map(([label, fn]: any)=>{
            const count = energyList.filter(fn).length;
            return <View key={label as string} style={styles.distRow}><Text style={styles.distLabel}>{label as string}</Text><View style={styles.distTrack}><View style={[styles.distFill, { width: `${contacts.length? (count/contacts.length)*100:0}%` }]} /></View><Text style={styles.distCount}>{count}</Text></View>;
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1117' },
  content: { padding: 16, gap: 16 },
  title: { color: '#FFF', fontSize: 22, fontWeight: '800', textAlign: 'center' },
  sub: { color: '#9CA3AF', textAlign: 'center', marginBottom: 8 },
  card: { backgroundColor: '#1A1D27', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#2D3243' },
  cardTitle: { color: '#FFF', fontWeight: '600', marginBottom: 12 },
  cloud: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bubble: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  bubbleText: { color: '#FFF', fontWeight: '700' },
  group: { backgroundColor: '#1A1D27', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#2D3243' },
  groupTitle: { color: '#FFF', fontWeight: '600', marginBottom: 10 },
  bubbleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  miniBubble: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  miniBubbleText: { color: '#FFF', fontWeight: '700', fontSize: 12 },
  muted: { color: '#6B7280' },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  distLabel: { color: '#9CA3AF', width: 50, fontSize: 12 },
  distTrack: { flex: 1, height: 8, backgroundColor: '#262A38', borderRadius: 4, overflow: 'hidden' },
  distFill: { height: '100%', backgroundColor: '#E53E3E' },
  distCount: { color: '#FFF', width: 20, fontSize: 12, textAlign: 'right' },
});
