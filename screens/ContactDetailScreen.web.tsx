import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl, Share, ScrollView as RNScroll } from 'react-native';
import { useOrbitStore, RELATIONSHIP_TYPES, ENERGY_LEVELS } from '../stores/orbitStore';
import { theme, formatTimeAgo, formatDate, getHealthColor, formatFullDate } from '../src/theme';
import { Button } from '../src/components/Button';
import { EmptyState } from '../src/components/EmptyState';
import { logger } from '../src/utils/logger';

export default function ContactDetailScreen({ route, navigation }: any) {
  const { id } = route.params;
  const contacts = useOrbitStore(s => s.contacts);
  const interactions = useOrbitStore(s => s.interactions);
  const groups = useOrbitStore(s => s.groups);
  const deleteContact = useOrbitStore(s => s.deleteContact);
  const updateContact = useOrbitStore(s => s.updateContact);
  const calculateHealthScore = useOrbitStore(s => s.calculateHealthScore);
  const contact = contacts.find(c=>c.id===id);
  const contactInteractions = interactions.filter(i=>i.contactId===id).sort((a:any,b:any)=>b.createdAt.localeCompare(a.createdAt));
  const [refreshing, setRefreshing] = useState(false);
  const [showGroupPicker, setShowGroupPicker] = useState(false);

  const onRefresh = useCallback(()=>{
    setRefreshing(true);
    logger.info('ContactDetail','pull to refresh', { id });
    setTimeout(()=> setRefreshing(false), 600);
  }, [id]);

  if (!contact) {
    return (
      <View style={styles.containerError}>
        <EmptyState title="Not found" description="Contact no longer exists." icon="search" action={{ label: 'Go back', onPress: ()=>navigation.goBack() } as any} />
      </View>
    );
  }

  const type = (RELATIONSHIP_TYPES as any)[contact.type] || RELATIONSHIP_TYPES.acquaintance;
  const health = calculateHealthScore(id);
  const energy = (ENERGY_LEVELS as any)[contact.energy] || ENERGY_LEVELS.neutral;
  const group = groups.find((g:any)=> g.id === contact.groupId);

  const handleDelete = () => {
    Alert.alert('Delete contact?', `${contact.name} and all ${contactInteractions.length} interactions will be removed. This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: ()=>{
        logger.info('ContactDetail','delete',{ id });
        deleteContact(id);
        navigation.goBack();
      }},
    ]);
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: `${contact.name} - ${type.label}${group ? ` - ${group.name}` : ''} - Health ${health}% - Orbit relationship map` });
    } catch {}
  };

  const handleChangeGroup = (groupId?: string) => {
    updateContact(id, { groupId } as any);
    setShowGroupPicker(false);
    logger.info('ContactDetail', 'changed group', { id, groupId });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.text} />} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: type.color }]}>
            <Text style={styles.avatarText}>{(contact.name?.[0]||'?').toUpperCase()}</Text>
          </View>
          <Text style={styles.name} numberOfLines={2}>{contact.name}</Text>
          <View style={styles.metaRow}>
            <View style={styles.typeBadge}><Text style={styles.typeBadgeText}>{type.emoji} {type.label}</Text></View>
            <View style={[styles.healthBadge, { backgroundColor: getHealthColor(health) }]}><Text style={styles.healthBadgeText}>{health}% health</Text></View>
            {group ? (
              <View style={[styles.groupBadge, { borderColor: group.color || theme.colors.border }]}>
                <View style={[styles.groupDotSmall, { backgroundColor: group.color || theme.colors.primary }]} />
                <Text style={styles.groupBadgeText}>{group.name}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.created}>Added {formatTimeAgo(contact.createdAt)} • {formatDate(contact.createdAt)}</Text>
          {contact.birthday ? <Text style={styles.birthday}>Birthday {contact.birthday}</Text> : null}
          <View style={styles.tagWrap}>
            {(contact.tags||[]).map((t:string)=>
              <View key={t} style={styles.miniTag}><Text style={styles.miniTagText}>{t}</Text></View>
            )}
          </View>
          <View style={styles.headerActions}>
            <Button title="Share" onPress={handleShare} variant="secondary" size="s" />
            <Button title={group ? `Group: ${group.name}` : 'Add to group'} onPress={()=>setShowGroupPicker(!showGroupPicker)} variant={group ? 'primary' : 'secondary'} size="s" accessibilityLabel="Change group" />
          </View>

          {showGroupPicker ? (
            <View style={styles.groupPickerSection}>
              <Text style={styles.groupPickerTitle}>Change group — tap to assign</Text>
              <View style={styles.groupPickerRow}>
                <TouchableOpacity style={[styles.groupPickChip, !contact.groupId && styles.groupPickChipActive]} onPress={()=>handleChangeGroup(undefined)} activeOpacity={0.7} accessibilityLabel="Remove from group">
                  <Text style={[styles.groupPickText, !contact.groupId && styles.groupPickTextActive]}>No group</Text>
                </TouchableOpacity>
                {groups.map((g:any)=>
                  <TouchableOpacity key={g.id} style={[styles.groupPickChip, { borderColor: g.color || theme.colors.border }, contact.groupId===g.id && { backgroundColor: g.color || theme.colors.primary, borderColor: g.color || theme.colors.primary }]} onPress={()=>handleChangeGroup(g.id)} activeOpacity={0.7} accessibilityLabel={`Assign to ${g.name}`}>
                    <View style={[styles.groupDotSmall, { backgroundColor: contact.groupId===g.id ? '#FFF' : g.color || theme.colors.primary }]} />
                    <Text style={[styles.groupPickText, contact.groupId===g.id && styles.groupPickTextActive]} numberOfLines={1}>{g.name}</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.groupPickerHint}>Group appears in Contacts filter + Map clusters • Manage groups in Settings</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{health}%</Text>
            <Text style={styles.statLabel}>Health</Text>
            <View style={[styles.healthDot, { backgroundColor: getHealthColor(health) }]} />
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: energy.color }]}>{energy.label}</Text>
            <Text style={styles.statLabel}>Energy</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{contactInteractions.length}</Text>
            <Text style={styles.statLabel}>Logs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{contact.lastInteraction ? formatTimeAgo(contact.lastInteraction) : 'never'}</Text>
            <Text style={styles.statLabel}>Last contact</Text>
          </View>
        </View>

        {contact.notes ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notes}>{contact.notes}</Text>
            <Text style={styles.notesMeta}>Stored locally • {formatFullDate(contact.createdAt)}{group ? ` • ${group.name}` : ''}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Interactions • {contactInteractions.length}</Text>
            <TouchableOpacity onPress={()=>navigation.navigate('JourneyMapping',{id})} accessibilityRole="button"><Text style={styles.link}>Journey →</Text></TouchableOpacity>
          </View>
          {contactInteractions.length===0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No interactions yet.</Text>
              <Text style={styles.emptySub}>Log your first interaction to see health trend.</Text>
            </View>
          ) : contactInteractions.slice(0,10).map((i:any)=>(
            <View key={i.id} style={styles.interactionCard}>
              <View style={styles.interactionHeader}>
                <View style={styles.interactionTypeBadge}><Text style={styles.interactionTypeText}>{i.type}</Text></View>
                <Text style={styles.interactionDate}>{formatTimeAgo(i.createdAt)}</Text>
              </View>
              <Text style={styles.interactionSummary} numberOfLines={3}>{i.summary}</Text>
              <View style={styles.interactionMeta}>
                <View style={[styles.energyDot, { backgroundColor: (ENERGY_LEVELS as any)[i.energy]?.color || theme.colors.textTertiary }]} />
                <Text style={styles.energyLabel}>{i.energy || 'neutral'}</Text>
                <Text style={styles.dotSep}>•</Text>
                <Text style={[styles.sentimentLabel, i.sentiment==='positive' && styles.sentimentPos, i.sentiment==='negative' && styles.sentimentNeg]}>{i.sentiment || 'neutral'}</Text>
                <Text style={styles.dotSep}>•</Text>
                <Text style={styles.interactionFullDate}>{formatDate(i.createdAt)}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <Button title="+ Log Interaction" onPress={()=>navigation.navigate('AddInteraction',{contactId:id})} variant="primary" size="l" accessibilityLabel="Log interaction" />
          <View style={styles.actionsRow}>
            <Button title="Sentiment" onPress={()=>navigation.navigate('Sentiment',{id})} variant="secondary" size="m" style={{flex:1} as any} />
            <Button title="Journey" onPress={()=>navigation.navigate('JourneyMapping',{id})} variant="secondary" size="m" style={{flex:1} as any} />
          </View>
          <Button title="Delete Contact" onPress={handleDelete} variant="danger" size="m" accessibilityLabel="Delete contact" />
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  containerError: { flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center' },
  content: { padding: theme.spacing.l, gap: theme.spacing.ml, paddingBottom: 96 },
  header: { alignItems: 'center', paddingVertical: theme.spacing.l, gap: 6, backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.l, borderWidth: 1, borderColor: theme.colors.border, ...theme.shadows.card },
  avatar: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', ...theme.shadows.sm },
  avatarText: { color: '#FFF', fontSize: 28, fontWeight: '800' as any },
  name: { ...theme.typography.h1, color: theme.colors.text, textAlign: 'center', marginTop: theme.spacing.s },
  metaRow: { flexDirection: 'row', gap: theme.spacing.s, marginTop: 4, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' },
  typeBadge: { backgroundColor: theme.colors.surfaceMuted, paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.borderRadius.pill, borderWidth: 1, borderColor: theme.colors.border },
  typeBadgeText: { ...theme.typography.caption, color: theme.colors.textSecondary },
  healthBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.borderRadius.pill },
  healthBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' as any },
  groupBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.colors.surfaceMuted, paddingHorizontal: 8, paddingVertical: 4, borderRadius: theme.borderRadius.pill, borderWidth: 1 },
  groupBadgeText: { fontSize: 11, color: theme.colors.textSecondary, fontWeight: '600' as any },
  groupDotSmall: { width: 8, height: 8, borderRadius: 4 },
  created: { ...theme.typography.caption, color: theme.colors.textTertiary, marginTop: 2 },
  birthday: { color: theme.colors.warning, fontWeight: '600' as any, fontSize: 12, marginTop: 2 },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: theme.spacing.s, justifyContent: 'center' },
  miniTag: { backgroundColor: theme.colors.tagBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: theme.borderRadius.pill, borderWidth: 1, borderColor: theme.colors.borderLight },
  miniTagText: { fontSize: 11, color: theme.colors.tagText, fontWeight: '500' as any },
  headerActions: { flexDirection: 'row', gap: theme.spacing.s, marginTop: theme.spacing.s, flexWrap: 'wrap', justifyContent: 'center' },

  groupPickerSection: { width: '100%', backgroundColor: theme.colors.surfaceMuted, borderRadius: theme.borderRadius.m, padding: theme.spacing.m, borderWidth: 1, borderColor: theme.colors.borderLight, gap: theme.spacing.s, marginTop: theme.spacing.s },
  groupPickerTitle: { ...theme.typography.labelSmall, color: theme.colors.textSecondary },
  groupPickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.s },
  groupPickChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, paddingHorizontal: 10, paddingVertical: 6, borderRadius: theme.borderRadius.pill, borderWidth: 1, borderColor: theme.colors.border, gap: 6, ...theme.shadows.chip },
  groupPickChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  groupPickText: { ...theme.typography.caption, color: theme.colors.textSecondary, maxWidth: 100 },
  groupPickTextActive: { color: '#FFF', fontWeight: '600' as any },
  groupPickerHint: { ...theme.typography.micro, color: theme.colors.textTertiary, fontStyle: 'italic' as any },

  statsRow: { flexDirection: 'row', gap: theme.spacing.s },
  statCard: { flex: 1, alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.l, padding: theme.spacing.m, borderWidth: 1, borderColor: theme.colors.border, ...theme.shadows.card, gap: 2 },
  statValue: { color: theme.colors.text, fontSize: 18, fontWeight: '800' as any },
  statLabel: { ...theme.typography.micro, color: theme.colors.textTertiary, textTransform: 'uppercase' as any },
  healthDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  section: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.l, padding: theme.spacing.ml, borderWidth: 1, borderColor: theme.colors.border, ...theme.shadows.card },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.s },
  sectionTitle: { ...theme.typography.label, color: theme.colors.text },
  link: { color: theme.colors.text, fontWeight: '600' as any, fontSize: 12 },
  notes: { ...theme.typography.body, color: theme.colors.text, lineHeight: 22, marginTop: theme.spacing.s },
  notesMeta: { ...theme.typography.micro, color: theme.colors.textTertiary, marginTop: theme.spacing.s, fontStyle: 'italic' as any },
  emptyBox: { alignItems: 'center', paddingVertical: theme.spacing.l, gap: 4 },
  emptyText: { ...theme.typography.bodySmall, color: theme.colors.textSecondary },
  emptySub: { ...theme.typography.caption, color: theme.colors.textTertiary },
  interactionCard: { paddingVertical: theme.spacing.m, borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight, gap: 6 },
  interactionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  interactionTypeBadge: { backgroundColor: theme.colors.surfaceHover, paddingHorizontal: 8, paddingVertical: 2, borderRadius: theme.borderRadius.pill, borderWidth: 1, borderColor: theme.colors.borderLight },
  interactionTypeText: { fontSize: 10, fontWeight: '700' as any, textTransform: 'uppercase' as any, color: theme.colors.textSecondary, letterSpacing: 0.6 },
  interactionDate: { ...theme.typography.micro, color: theme.colors.textTertiary },
  interactionSummary: { ...theme.typography.bodySmall, color: theme.colors.text },
  interactionMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  energyDot: { width: 8, height: 8, borderRadius: 4 },
  energyLabel: { ...theme.typography.micro, color: theme.colors.textSecondary, textTransform: 'capitalize' as any },
  dotSep: { color: theme.colors.textMuted, fontSize: 10 },
  sentimentLabel: { ...theme.typography.micro, color: theme.colors.textSecondary },
  sentimentPos: { color: theme.colors.success },
  sentimentNeg: { color: theme.colors.danger },
  interactionFullDate: { ...theme.typography.micro, color: theme.colors.textTertiary },
  actions: { gap: theme.spacing.s },
  actionsRow: { flexDirection: 'row', gap: theme.spacing.s },
});
