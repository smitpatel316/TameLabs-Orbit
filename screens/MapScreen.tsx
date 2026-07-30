import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useOrbitStore, RELATIONSHIP_TYPES, ENERGY_LEVELS } from '../stores/orbitStore';
import { theme, formatTimeAgo, getHealthColor, formatDate } from '../src/theme';
import { EmptyState } from '../src/components/EmptyState';
import { logger } from '../src/utils/logger';

export default function MapScreen({ navigation }: any) {
  const contacts = useOrbitStore(s => s.contacts);
  const calculateHealthScore = useOrbitStore(s => s.calculateHealthScore);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(()=>{
    setRefreshing(true);
    logger.info('Map','pull to refresh',{ count: contacts.length });
    setTimeout(()=> setRefreshing(false), 600);
  }, [contacts.length]);

  const byType = useMemo(()=>{
    const m: any = {};
    Object.keys(RELATIONSHIP_TYPES).forEach(t=> m[t]=contacts.filter(c=>c.type===t));
    return m;
  }, [contacts]);

  const energyList = useMemo(()=>{
    return contacts.map(c=>({ ...c, health: calculateHealthScore(c.id), energyVal: (ENERGY_LEVELS as any)[c.energy]?.value ?? 0 }));
  }, [contacts, calculateHealthScore]);

  const healthBuckets = useMemo(()=>{
    return [
      { label: '<20 critical', fn: (c:any)=>c.health<20, color: theme.colors.health.critical },
      { label: '20-40 poor', fn: (c:any)=>c.health>=20&&c.health<40, color: theme.colors.health.poor },
      { label: '40-60 okay', fn: (c:any)=>c.health>=40&&c.health<60, color: theme.colors.health.okay },
      { label: '60-80 good', fn: (c:any)=>c.health>=60&&c.health<80, color: theme.colors.health.good },
      { label: '80-100 excellent', fn: (c:any)=>c.health>=80, color: theme.colors.health.excellent },
    ];
  }, []);

  if (contacts.length===0) {
    return (
      <View style={styles.emptyContainer}>
        <EmptyState title="Map empty" description="Add contacts to see energy cloud and health distribution." icon="map" action={{ label: 'Add contact', onPress: ()=>navigation.navigate('ContactsTab', { screen: 'AddContact' } ) }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.text} />} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Relationship Map</Text>
          <Text style={styles.sub}>{contacts.length} contacts • energy vs health</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Energy Cloud</Text>
          <Text style={styles.cardHint}>Opacity = health • Color = energy • Tap to open</Text>
          <View style={styles.cloud}>
            {energyList.sort((a,b)=>b.energyVal-a.energyVal).map(c=>(
              <TouchableOpacity key={c.id} style={[styles.bubble, { backgroundColor: (ENERGY_LEVELS as any)[c.energy]?.color || theme.colors.textTertiary, opacity: 0.35 + (c.health/100)*0.65 }]} onPress={()=>navigation.navigate('ContactDetail',{id:c.id})} activeOpacity={0.7} accessibilityLabel={`Contact ${c.name} health ${c.health}%`}>
                <Text style={styles.bubbleText}>{(c.name?.[0]||'?').toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {Object.entries(byType).map(([type, list]: any)=>{
          const info = (RELATIONSHIP_TYPES as any)[type];
          if (!list.length) return null;
          return (
            <View key={type} style={styles.group}>
              <View style={styles.groupHeader}>
                <View style={[styles.groupDot, { backgroundColor: info.color }]} />
                <Text style={styles.groupTitle}>{info.emoji} {info.label} • {list.length}</Text>
              </View>
              <View style={styles.bubbleRow}>
                {list.map((c:any)=>
                  <TouchableOpacity key={c.id} style={[styles.miniBubble, { backgroundColor: info.color }]} onPress={()=>navigation.navigate('ContactDetail',{id:c.id})} activeOpacity={0.7} accessibilityLabel={c.name}>
                    <Text style={styles.miniBubbleText}>{(c.name?.[0]||'?').toUpperCase()}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Health Distribution</Text>
          <View style={styles.distList}>
            {healthBuckets.map(({label, fn, color}: any)=>{
              const count = energyList.filter(fn).length;
              const pct = contacts.length ? (count/contacts.length)*100 : 0;
              return (
                <View key={label as string} style={styles.distRow}>
                  <View style={styles.distLabelRow}>
                    <View style={[styles.distDot, { backgroundColor: color }]} />
                    <Text style={styles.distLabel}>{label as string}</Text>
                  </View>
                  <View style={styles.distTrack}><View style={[styles.distFill, { width: `${pct}%`, backgroundColor: color }]} /></View>
                  <Text style={styles.distCount}>{count}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Stats</Text>
          <View style={styles.quickStats}>
            <View style={styles.qStat}><Text style={styles.qVal}>{energyList.filter((c:any)=>c.health>=80).length}</Text><Text style={styles.qLabel}>Excellent</Text></View>
            <View style={styles.qStat}><Text style={styles.qVal}>{energyList.filter((c:any)=>c.health<40).length}</Text><Text style={styles.qLabel}>Needs care</Text></View>
            <View style={styles.qStat}><Text style={styles.qVal}>{contacts.filter(c=>c.lastInteraction && Date.now() - new Date(c.lastInteraction).getTime() > 30*86400000).length}</Text><Text style={styles.qLabel}>30d no contact</Text></View>
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  emptyContainer: { flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center' },
  content: { padding: theme.spacing.l, gap: theme.spacing.ml },
  header: { alignItems: 'center', gap: 4, paddingVertical: theme.spacing.m },
  title: { ...theme.typography.h1, color: theme.colors.text },
  sub: { ...theme.typography.caption, color: theme.colors.textSecondary },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.l, padding: theme.spacing.ml, borderWidth: 1, borderColor: theme.colors.border, ...theme.shadows.card },
  cardTitle: { ...theme.typography.h3, color: theme.colors.text, marginBottom: 4 },
  cardHint: { ...theme.typography.micro, color: theme.colors.textTertiary, marginBottom: theme.spacing.m, fontStyle: 'italic' as any },
  cloud: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.s },
  bubble: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', ...theme.shadows.chip },
  bubbleText: { color: '#FFF', fontWeight: '700' as any, fontSize: 14 },
  group: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.l, padding: theme.spacing.m, borderWidth: 1, borderColor: theme.colors.border, ...theme.shadows.card },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: theme.spacing.s },
  groupDot: { width: 10, height: 10, borderRadius: 5 },
  groupTitle: { ...theme.typography.bodySmall, fontWeight: '600' as any, color: theme.colors.text },
  bubbleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  miniBubble: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', ...theme.shadows.chip },
  miniBubbleText: { color: '#FFF', fontWeight: '700' as any, fontSize: 12 },
  distList: { gap: theme.spacing.s, marginTop: theme.spacing.s },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.s },
  distLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, width: 120 },
  distDot: { width: 8, height: 8, borderRadius: 4 },
  distLabel: { ...theme.typography.caption, color: theme.colors.textSecondary },
  distTrack: { flex: 1, height: 8, backgroundColor: theme.colors.surfaceHover, borderRadius: theme.borderRadius.full, overflow: 'hidden' },
  distFill: { height: '100%', borderRadius: theme.borderRadius.full },
  distCount: { ...theme.typography.caption, color: theme.colors.text, width: 24, textAlign: 'right', fontWeight: '600' as any },
  quickStats: { flexDirection: 'row', gap: theme.spacing.m, marginTop: theme.spacing.s },
  qStat: { flex: 1, alignItems: 'center', backgroundColor: theme.colors.surfaceMuted, borderRadius: theme.borderRadius.m, padding: theme.spacing.m, borderWidth: 1, borderColor: theme.colors.borderLight },
  qVal: { ...theme.typography.h2, color: theme.colors.text },
  qLabel: { ...theme.typography.micro, color: theme.colors.textSecondary, marginTop: 2, textAlign: 'center' },
});
