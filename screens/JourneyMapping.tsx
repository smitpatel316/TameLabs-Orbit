import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useOrbitStore } from '../stores/orbitStore';
import { theme, formatTimeAgo, formatDate, formatFullDate } from '../src/theme';
import { EmptyState } from '../src/components/EmptyState';
import { logger } from '../src/utils/logger';

export default function JourneyMappingScreen({ route, navigation }: any) {
  const { id } = route.params;
  const getContactWithInteractions = useOrbitStore(s => (s as any).getContactWithInteractions);
  const result = getContactWithInteractions(id);
  const contact = result?.contact;
  const interactions = result?.interactions;
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(()=>{
    setRefreshing(true);
    logger.info('Journey','pull to refresh',{id});
    setTimeout(()=> setRefreshing(false), 600);
  }, [id]);

  const timeline = useMemo(()=>{
    if (!interactions) return [];
    return [...interactions].sort((a:any,b:any)=>a.createdAt.localeCompare(b.createdAt));
  }, [interactions]);

  if (!contact) {
    return (
      <View style={styles.errorContainer}>
        <EmptyState title="Not found" description="Contact no longer exists." icon="search" action={{ label: 'Go back', onPress: ()=>navigation?.goBack?.() }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.text} />} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Journey</Text>
          <Text style={styles.sub}>{contact.name} • {timeline.length} interactions over time</Text>
        </View>

        {timeline.length===0 ? (
          <EmptyState title="No journey yet" description="Log interactions to see a vertical timeline with energy and sentiment trends." icon="timeline" />
        ) : (
          timeline.map((i:any, idx:number)=>(
            <View key={i.id} style={styles.item}>
              <View style={styles.lineContainer}>
                <View style={[styles.dot, { backgroundColor: i.sentiment==='positive' ? theme.colors.success : i.sentiment==='negative' ? theme.colors.danger : theme.colors.textTertiary }]} />
                {idx < timeline.length-1 && <View style={styles.line} />}
              </View>
              <View style={styles.itemContent}>
                <View style={styles.itemHeader}>
                  <Text style={styles.date}>{formatDate(i.createdAt)}</Text>
                  <Text style={styles.timeAgo}>{formatTimeAgo(i.createdAt)}</Text>
                </View>
                <Text style={styles.summary}>{i.summary}</Text>
                <View style={styles.metaRow}>
                  <View style={styles.metaChip}><Text style={styles.metaChipText}>{i.type}</Text></View>
                  <View style={styles.metaChip}><Text style={styles.metaChipText}>{i.energy || 'neutral'}</Text></View>
                  <View style={[styles.metaChip, i.sentiment==='positive' && styles.metaChipPos, i.sentiment==='negative' && styles.metaChipNeg]}><Text style={styles.metaChipText}>{i.sentiment || 'neutral'}</Text></View>
                </View>
                <Text style={styles.fullDate}>{formatFullDate(i.createdAt)}</Text>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  errorContainer: { flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center' },
  content: { padding: theme.spacing.l, gap: 2 },
  header: { marginBottom: theme.spacing.ml, gap: 4 },
  title: { ...theme.typography.h1, color: theme.colors.text },
  sub: { ...theme.typography.bodySmall, color: theme.colors.textSecondary },
  item: { flexDirection: 'row', gap: theme.spacing.m },
  lineContainer: { alignItems: 'center', width: 20 },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: theme.colors.background, ...theme.shadows.chip },
  line: { flex: 1, width: 2, backgroundColor: theme.colors.border, marginTop: 4, opacity: 0.6 },
  itemContent: { flex: 1, backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.l, padding: theme.spacing.m, marginBottom: theme.spacing.m, borderWidth: 1, borderColor: theme.colors.border, ...theme.shadows.card, gap: 6 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { ...theme.typography.caption, color: theme.colors.textSecondary, fontWeight: '600' as any },
  timeAgo: { ...theme.typography.micro, color: theme.colors.textTertiary },
  summary: { ...theme.typography.bodySmall, color: theme.colors.text },
  metaRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 2 },
  metaChip: { backgroundColor: theme.colors.surfaceMuted, paddingHorizontal: 8, paddingVertical: 2, borderRadius: theme.borderRadius.pill, borderWidth: 1, borderColor: theme.colors.borderLight },
  metaChipPos: { backgroundColor: theme.colors.success+'22', borderColor: theme.colors.success+'40' },
  metaChipNeg: { backgroundColor: theme.colors.danger+'22', borderColor: theme.colors.danger+'40' },
  metaChipText: { fontSize: 10, color: theme.colors.textSecondary, fontWeight: '600' as any, textTransform: 'capitalize' as any },
  fullDate: { ...theme.typography.micro, color: theme.colors.textTertiary, marginTop: 2, fontStyle: 'italic' as any },
});
