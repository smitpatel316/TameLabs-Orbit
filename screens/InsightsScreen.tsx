
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { useOrbitStore, RELATIONSHIP_TYPES, ENERGY_LEVELS } from '../stores/orbitStore';

export default function InsightsScreen({ navigation }: any) {
  const contacts = useOrbitStore(s => s.contacts);
  const interactions = useOrbitStore(s => s.interactions);
  const calculateHealthScore = useOrbitStore(s => s.calculateHealthScore);
  const getNeedingAttention = useOrbitStore(s => s.getNeedingAttention);
  const getStats = useOrbitStore(s => s.getStats);
  const stats = getStats();
  const needingAttention = getNeedingAttention();

  const upcomingBirthdays = useMemo(() => {
    const today = new Date();
    const in30 = new Date(today.getTime() + 30*24*60*60*1000);
    return contacts.filter(c=>c.birthday).map(c=>{
      try{
        const [m,d] = c.birthday!.split('/').map(Number);
        let bday = new Date(today.getFullYear(), m-1, d);
        if (bday < today) bday.setFullYear(today.getFullYear()+1);
        return { ...c, birthdayDate: bday };
      } catch { return null; }
    }).filter(Boolean).filter((c:any)=>c.birthdayDate>=today && c.birthdayDate<=in30).sort((a:any,b:any)=>a.birthdayDate-b.birthdayDate).slice(0,5);
  }, [contacts]);

  const recent = useMemo(() => {
    const now = new Date();
    return contacts.map(c=>{
      const last = c.lastInteraction ? new Date(c.lastInteraction) : null;
      const days = last ? Math.floor((now.getTime()-last.getTime())/86400000) : 999;
      return { ...c, daysSince: days, health: calculateHealthScore(c.id) };
    }).sort((a,b)=>a.daysSince-b.daysSince).slice(0,5);
  }, [contacts, calculateHealthScore]);

  const energyDist = useMemo(()=>{
    const dist: Record<string, number> = {};
    contacts.forEach(c=>{ dist[c.energy] = (dist[c.energy]||0)+1; });
    return dist;
  }, [contacts]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>Overview</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}><Text style={styles.statV}>{stats.totalContacts}</Text><Text style={styles.statL}>Contacts</Text></View>
            <View style={styles.stat}><Text style={styles.statV}>{stats.totalInteractions}</Text><Text style={styles.statL}>Interactions</Text></View>
            <View style={styles.stat}><Text style={styles.statV}>{needingAttention.length}</Text><Text style={styles.statL}>Need attention</Text></View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Energy Distribution</Text>
          {Object.entries(energyDist).map(([k,v])=>(
            <View key={k} style={styles.row}><View style={[styles.dot, {backgroundColor: (ENERGY_LEVELS as any)[k]?.color || '#6B7280'}]} /><Text style={styles.rowLabel}>{k}</Text><Text style={styles.rowVal}>{v}</Text></View>
          ))}
          {contacts.length===0 && <Text style={styles.muted}>No data</Text>}
        </View>

        {upcomingBirthdays.length>0 && (
          <View style={styles.card}>
            <Text style={styles.title}>Upcoming Birthdays (30d)</Text>
            {(upcomingBirthdays as any[]).map((c:any)=><View key={c.id} style={styles.row}><Text style={styles.rowLabel}>{c.name}</Text><Text style={styles.rowVal}>{c.birthday}</Text></View>)}
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.title}>Recent Contact</Text>
          {recent.map((c:any)=><TouchableOpacity key={c.id} style={styles.row} onPress={()=>navigation.navigate('ContactDetail',{id:c.id})}><Text style={styles.rowLabel}>{c.name}</Text><Text style={[styles.rowVal, {color: c.daysSince>30?'#E53E3E':'#38A169'}]}>{c.daysSince===0?'Today':c.daysSince===999?'Never':c.daysSince+'d ago'}</Text></TouchableOpacity>)}
          {recent.length===0 && <Text style={styles.muted}>No contacts</Text>}
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>By Type</Text>
          {Object.entries(RELATIONSHIP_TYPES).map(([k,v]:any)=><View key={k} style={styles.row}><Text style={{fontSize:18, marginRight:8}}>{v.emoji}</Text><Text style={styles.rowLabel}>{v.label}</Text><Text style={styles.rowVal}>{(stats.byType as any)[k]||0}</Text></View>)}
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Needs Attention {'<70% health'}</Text>
          {needingAttention.length===0 ? <Text style={styles.good}>All healthy</Text> : needingAttention.slice(0,5).map((c:any)=><TouchableOpacity key={c.id} style={styles.row} onPress={()=>navigation.navigate('ContactDetail',{id:c.id})}><Text style={styles.rowLabel}>{c.name}</Text><Text style={[styles.rowVal, {color:'#E53E3E'}]}>{c.healthScore}%</Text></TouchableOpacity>)}
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Suggestions</Text>
          <Text style={styles.sug}>Reach out to 2 people you haven't talked to in 30d</Text>
          <Text style={styles.sug}>After each interaction, log energy+sentiment</Text>
          <Text style={styles.sug}>Use Tags to find patterns (Work draining? Family nourishing?)</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1117' },
  content: { padding: 16, gap: 16 },
  card: { backgroundColor: '#1A1D27', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#2D3243' },
  title: { color: '#FFF', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statV: { color: '#FFF', fontSize: 28, fontWeight: '800' },
  statL: { color: '#9CA3AF', fontSize: 11, marginTop: 4, textTransform: 'uppercase' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#262A38' },
  rowLabel: { flex: 1, color: '#FFF', fontSize: 14 },
  rowVal: { color: '#9CA3AF', fontWeight: '600', fontSize: 13 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  muted: { color: '#6B7280', fontStyle: 'italic' },
  good: { color: '#38A169', textAlign: 'center', padding: 12 },
  sug: { color: '#9CA3AF', marginBottom: 6, fontSize: 13, lineHeight: 18 },
});
