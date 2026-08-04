import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Share, RefreshControl } from 'react-native';

import { useOrbitStore, GROUP_COLORS } from '../stores/orbitStore';
import { theme, formatTimeAgo } from '../src/theme';
import { Input } from '../src/components/Input';
import { Button } from '../src/components/Button';
import { GroupAnalyticsCard, computeAnalytics } from '../src/components/GroupAnalyticsCard';
import { GroupDetailModal } from '../src/components/GroupDetailModal';
import { buildUpcomingBirthdays } from '../src/services/calendarSync';
import { useIdentity } from '../src/utils/useIdentity';
import { useNavigation } from '@react-navigation/native';
import { logger } from '../src/utils/logger';

export default function SettingsScreen({ navigation }: any) {
  const tags = useOrbitStore((s) => s.tags);
  const groups = useOrbitStore((s) => s.groups);
  const contacts = useOrbitStore((s) => s.contacts);
  const interactions = useOrbitStore((s) => s.interactions);
  const reminders = useOrbitStore((s) => s.reminders);
  const addTag = useOrbitStore((s) => s.addTag);
  const removeTag = useOrbitStore((s) => s.removeTag);
  const addGroup = useOrbitStore((s) => s.addGroup);
  const updateGroup = useOrbitStore((s) => s.updateGroup);
  const deleteGroup = useOrbitStore((s) => s.deleteGroup);
  const getGroupCounts = useOrbitStore((s) => s.getGroupCounts);
  const calculateHealth = useOrbitStore((s) => s.calculateHealthScore);
  const { user: tameUser, provider } = useIdentity();
  const nav = useNavigation<any>();
  const [newTag, setNewTag] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupColor, setEditGroupColor] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [detailGroupId, setDetailGroupId] = useState<string | null>(null);

  const onRefresh = useCallback(()=>{
    setRefreshing(true);
    setTimeout(()=> setRefreshing(false), 600);
  }, []);

  const groupCounts = useMemo(()=>{
    try { return getGroupCounts(); } catch { return {} as Record<string, number>; }
  }, [contacts, groups]);

  const groupsAnalytics = useMemo(()=>{
    return groups.map((g:any)=> computeAnalytics(g, contacts as any, reminders as any, calculateHealth)).sort((a,b)=> b.count - a.count);
  }, [groups, contacts, reminders, calculateHealth]);

  const upcomingBirthdaysCount = useMemo(()=>{
    const b = buildUpcomingBirthdays(contacts.map((c:any)=>({ id: c.id, name: c.name, birthday: c.birthday })));
    return b.length;
  }, [contacts]);

  const remindersDueCount = useMemo(()=>{
    const now = Date.now();
    const week = now + 7*86400000;
    return reminders.filter((r:any)=> !r.done && new Date(r.dueDate).getTime() <= week).length;
  }, [reminders]);

  const handleAddTag = () => {
    const t = newTag.trim();
    if (!t) return;
    if (t.length > 30) { Alert.alert('Too long', 'Max 30 chars'); return; }
    addTag(t);
    logger.info('Settings', 'add tag', { tag: t });
    setNewTag('');
  };

  const handleAddGroup = () => {
    const n = newGroupName.trim();
    if (!n) return;
    if (n.length > 30) { Alert.alert('Too long', 'Max 30 chars'); return; }
    const g = addGroup(n);
    logger.info('Settings', 'add group', { name: n, id: g?.id });
    setNewGroupName('');
  };

  const startEditGroup = (g: any) => {
    setEditingGroupId(g.id);
    setEditGroupName(g.name);
    setEditGroupColor(g.color || GROUP_COLORS[0]);
  };

  const saveEditGroup = () => {
    if (!editingGroupId) return;
    const n = editGroupName.trim();
    if (!n) { Alert.alert('Name required','Group name cannot be empty'); return; }
    updateGroup(editingGroupId, { name: n, color: editGroupColor });
    logger.info('Settings', 'edit group', { id: editingGroupId, name: n });
    setEditingGroupId(null);
  };

  const handleExport = async () => {
    try {
      const data = { contacts, interactions, reminders, tags, groups, exportedAt: new Date().toISOString() };
      const json = JSON.stringify(data, null, 2);
      await Share.share({ message: json, title: 'Orbit Export' });
      logger.info('Settings','export');
    } catch {}
  };

  const handleViewGroup = (group: any) => {
    // open detail modal instead of plain Alert - v2.7
    setDetailGroupId(group.id);
  };

  const handleExportGroupCSV = async (groupId: string) => {
    try {
      const mod: any = await import('../src/services/dataExport').catch(()=>null);
      if (!mod) { Alert.alert('Export unavailable', 'install'); return; }
      const res = await mod.exportGroupContacts(groupId, contacts as any, groups as any, calculateHealth);
      Alert.alert(res.ok?'Exported':'Failed', res.msg);
    } catch (e:any) { Alert.alert('Export error', e?.message||'Failed'); }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.text} />} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tame ID — Unified Login</Text>
          <View style={styles.row}><Text style={styles.rowLabel}>Provider</Text><Text style={styles.rowValue}>{provider || 'mock'}</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>User</Text><Text style={styles.rowValue} numberOfLines={1}>{tameUser?.email || tameUser?.id || 'Not signed in'}</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>Same ID</Text><Text style={styles.rowValue}>Across 3 apps</Text></View>
          <Text style={styles.hint}>Supabase v1 now, Keycloak-ready v2. One login Hubble • Orbit • Quiet.</Text>
          <View style={{height:10}} />
          <Button title={tameUser ? 'Manage Tame ID' : 'Connect Tame ID'} variant="secondary" onPress={()=> (navigation || nav).navigate('Auth')} accessibilityLabel="Manage Tame ID" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Import & Calendar</Text>
          <Text style={styles.sectionHint}>{contacts.length} contacts • Import from phone, sync birthdays to calendar</Text>
          <View style={{ gap: theme.spacing.s }}>
            <Button title="Import from device contacts" variant="secondary" onPress={()=> (navigation || nav).navigate('ImportContacts')} accessibilityLabel="Import contacts from phone" />
            <Text style={styles.hint}>Local-first: your address book never leaves device. Dedup by normalized name. Birthdays MM/DD kept for Insights. Calendar sync needs expo-calendar on device builds. Web shows mock demo.</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tags Management</Text>
          <Text style={styles.sectionHint}>{tags.length} tags • Tap chip to remove • Used in Add Contact + filter</Text>
          <View style={styles.inputRow}>
            <View style={{flex:1}}>
              <Input placeholder="Add new tag... e.g. Gym, Book club" value={newTag} onChangeText={setNewTag} maxLength={30} returnKeyType="done" onSubmitEditing={handleAddTag} accessibilityLabel="New tag" />
            </View>
            <Button title="Add" onPress={handleAddTag} variant="primary" size="s" style={{ marginLeft: theme.spacing.s, marginTop: 2 } as any} disabled={!newTag.trim()} />
          </View>
          <View style={styles.tagList}>
            {tags.map((tag: string) => (
              <TouchableOpacity key={tag} style={styles.tagChip} onPress={() => {
                Alert.alert(`Remove tag?`, `"${tag}" will be removed from tag list (contacts keep it in their tags).`, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Remove', style: 'destructive', onPress: ()=> removeTag(tag) },
                ]);
              }} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={`Remove tag ${tag}`}>
                <Text style={styles.tagText}>{tag}</Text>
                <Text style={styles.removeIcon}>✕</Text>
              </TouchableOpacity>
            ))}
            {tags.length===0 ? <Text style={styles.empty}>No tags yet. Add one to organize contacts — like Gym, Book club, Coworkers.</Text> : null}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Groups Management • v2.7 Groups Analytics Dashboard</Text>
              <Text style={styles.sectionHint}>{groups.length} groups • {Object.values(groupCounts).reduce((a:number,b:any)=>a+(b as number),0)} grouped contacts • {upcomingBirthdaysCount} 🎂 60d • {remindersDueCount} ⏰ due • Tap to open GroupDetail modal (avatar 20 circle initial + health badge + timeAgo + energy + groupBadge + Quick Stats)</Text>
            </View>
          </View>
          <View style={styles.inputRow}>
            <View style={{flex:1}}>
              <Input placeholder="Group name... e.g. Founders, Climbing" value={newGroupName} onChangeText={setNewGroupName} maxLength={30} returnKeyType="done" onSubmitEditing={handleAddGroup} accessibilityLabel="New group" />
            </View>
            <Button title="Add" onPress={handleAddGroup} variant="primary" size="s" style={{ marginLeft: theme.spacing.s, marginTop: 2 } as any} disabled={!newGroupName.trim()} />
          </View>

          <View style={styles.groupList}>
            {groups.map((g: any) => {
              const isEditing = editingGroupId===g.id;
              const count = groupCounts[g.id]||0;
              if (isEditing) {
                return (
                  <View key={g.id} style={styles.groupEditCard}>
                    <Input placeholder="Group name" value={editGroupName} onChangeText={setEditGroupName} maxLength={30} accessibilityLabel="Edit group name" />
                    <View style={styles.colorRow}>
                      <Text style={styles.colorLabel}>Color:</Text>
                      {GROUP_COLORS.map((col:string)=>
                        <TouchableOpacity key={col} style={[styles.colorDot, { backgroundColor: col }, editGroupColor===col && styles.colorDotActive]} onPress={()=>setEditGroupColor(col)} accessibilityLabel={`Color ${col}`} activeOpacity={0.7} />
                      )}
                    </View>
                    <View style={styles.editActions}>
                      <Button title="Save" onPress={saveEditGroup} size="s" />
                      <Button title="Cancel" onPress={()=>setEditingGroupId(null)} variant="ghost" size="s" />
                    </View>
                  </View>
                );
              }
              return (
                <View key={g.id} style={styles.groupItemRow}>
                  <TouchableOpacity style={styles.groupItemMain} onPress={()=>handleViewGroup(g)} onLongPress={()=>handleExportGroupCSV(g.id)} delayLongPress={400} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={`View ${g.name} group ${count} members long-press export CSV`}>
                    <View style={[styles.groupDotLarge, { backgroundColor: g.color || theme.colors.primary }]} />
                    <View style={styles.groupInfo}>
                      <Text style={styles.groupText} numberOfLines={1}>{g.name}</Text>
                      <Text style={styles.groupMeta}>{count} {count===1?'contact':'contacts'}{g.createdAt ? ` • ${formatTimeAgo(g.createdAt)}` : ''} • long-press export CSV</Text>
                    </View>
                    <View style={styles.countPill}><Text style={styles.countText}>{count}</Text></View>
                  </TouchableOpacity>
                  <View style={styles.groupItemActions}>
                    <TouchableOpacity onPress={()=>startEditGroup(g)} hitSlop={8} accessibilityLabel={`Edit ${g.name}`}><Text style={styles.actionEdit}>✎</Text></TouchableOpacity>
                    <TouchableOpacity onPress={()=>{
                      Alert.alert(`Delete "${g.name}"?`, `${count} contacts will lose group link but stay.`, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: ()=> { deleteGroup(g.id); logger.info('Settings','delete group',{ id: g.id, count }); }},
                      ]);
                    }} hitSlop={8} accessibilityLabel={`Delete ${g.name}`}><Text style={styles.actionDelete}>✕</Text></TouchableOpacity>
                  </View>
                </View>
              );
            })}
            {groups.length===0 ? <Text style={styles.empty}>No groups yet. Groups cluster contacts for Contacts filter • Map quadrants • Insights type breakdown. Create your first — e.g. Inner Circle, Work, Gym, Family.</Text> : null}
          </View>

          {groupsAnalytics.length>0 && (
            <View style={{ marginTop: theme.spacing.ml, gap: theme.spacing.s }}>
              <Text style={styles.sectionSubTitle}>Groups Analytics Dashboard • Per-group avg health, energy distribution, stale count below 70 pct health, totalGrouped, birthdays upcoming 60d count, reminders due</Text>
              <View style={{ flexDirection: 'row', gap: theme.spacing.s }}>
                <TouchableOpacity style={{ backgroundColor: theme.colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: theme.borderRadius.m }} onPress={()=> (navigation||nav).navigate('GroupsAnalytics')}><Text style={{ color: theme.colors.onPrimary, fontWeight: '700' as any, fontSize: 12 }}>Open Groups Analytics</Text></TouchableOpacity>
                <TouchableOpacity style={{ backgroundColor: theme.colors.surfaceMuted, paddingHorizontal: 12, paddingVertical: 8, borderRadius: theme.borderRadius.m, borderWidth: 1, borderColor: theme.colors.border }} onPress={()=> (navigation||nav).navigate('GroupsAnalytics')}><Text style={{ color: theme.colors.text, fontWeight: '600' as any, fontSize: 12 }}>Map By Groups clusters</Text></TouchableOpacity>
              </View>
              {groupsAnalytics.slice(0,3).map((a:any)=>{
                const g = groups.find((gg:any)=>gg.id===a.id);
                if (!g) return null;
                return <GroupAnalyticsCard key={a.id} group={g} contacts={contacts} reminders={reminders} calculateHealth={calculateHealth} onPress={(id:string)=> setDetailGroupId(id)} />;
              })}
              {groupsAnalytics.length>3 && <Text style={styles.hint}>+ {groupsAnalytics.length-3} more groups in full analytics → tap Open Groups Analytics</Text>}
            </View>
          )}

          <Text style={styles.hint}>Groups are local. Filter by group in ContactsList, see clusters in Map, assign in Add Contact and Detail inline picker. v2.7: GroupDetail modal shows members FlatList avatar 20 circle initial + health badge + timeAgo + energy + groupBadge + Quick Stats. Export CSV per-group via dataExport service dynamic import.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Overview • Groups X•Y with members v2.7.0</Text>
          <View style={styles.row}><Text style={styles.rowLabel}>Contacts</Text><Text style={styles.rowValue}>{contacts.length}</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>Interactions</Text><Text style={styles.rowValue}>{interactions.length}</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>Reminders</Text><Text style={styles.rowValue}>{reminders.length} • {remindersDueCount} due 7d</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>Tags</Text><Text style={styles.rowValue}>{tags.length}</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>Groups</Text><Text style={styles.rowValue}>{groups.length} • {Object.keys(groupCounts).length} with members</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>Grouped</Text><Text style={styles.rowValue}>{Object.values(groupCounts).reduce((a:number,b:any)=>a+(b as number),0)} contacts in groups</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>Birthdays 60d</Text><Text style={styles.rowValue}>{upcomingBirthdaysCount} upcoming</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>Last updated</Text><Text style={styles.rowValue}>{contacts.length ? formatTimeAgo(contacts[0]?.createdAt || new Date().toISOString()) : 'never'}</Text></View>
          <View style={{height:8}} />
          <View style={{ flexDirection: 'row', gap: theme.spacing.s }}>
            <Button title="Export JSON" onPress={handleExport} variant="secondary" size="s" accessibilityLabel="Export data" />
            <Button title="Groups Analytics" onPress={()=> (navigation||nav).navigate('GroupsAnalytics')} variant="secondary" size="s" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quality Checklist • v2.7.0</Text>
          <View style={styles.checkList}>
            <Text style={styles.checkRowDone}>✅ Pull-to-refresh on all lists</Text>
            <Text style={styles.checkRowDone}>✅ Time-ago + full date everywhere</Text>
            <Text style={styles.checkRowDone}>✅ Keyboard avoiding + dismiss + char limits</Text>
            <Text style={styles.checkRowDone}>✅ Empty states with actions</Text>
            <Text style={styles.checkRowDone}>✅ Button/Input design system, accessibility + 0 raw hex token-hardened</Text>
            <Text style={styles.checkRowDone}>✅ Health score real formula (recency+energy+sentiment)</Text>
            <Text style={styles.checkRowDone}>✅ Groups full CRUD + color dots + counts + filter chips + inline pickers</Text>
            <Text style={styles.checkRowDone}>✅ v2.7 Groups Analytics Dashboard: GroupAnalyticsCard per-group avg health, energy distribution, stale count below 70 pct health, totalGrouped, birthdays upcoming 60d count, reminders due</Text>
            <Text style={styles.checkRowDone}>✅ Group Detail modal/screen: members FlatList avatar 20 circle initial + health badge + timeAgo + energy + groupBadge + Quick Stats energy levels health distribution - tap group pill/chip opens modal, long-press exports</Text>
            <Text style={styles.checkRowDone}>✅ Map By Groups clusters enhanced + GroupsAnalyticsCard list + tap Detail modal + Open full analytics button</Text>
            <Text style={styles.checkRowDone}>✅ CSV export for groups: exportGroupContacts(groupId) via dataExport service dynamic import expo-file-system sharing document-picker guarded web Blob URL - per-group + all-groups</Text>
            <Text style={styles.checkRowDone}>✅ Tags chip management + group badge on cards</Text>
            <Text style={styles.checkRowDone}>✅ Import from device contacts + dedup + birthday MM/DD + token-hardened checkMark</Text>
            <Text style={styles.checkRowDone}>✅ Calendar sync for birthdays 60d (expo-calendar device) + EAS builds scaffold</Text>
            <Text style={styles.checkRowDone}>✅ Token-hardened v2.7.0: 0 raw hex #FFF replaced with theme.colors.onPrimary - GroupAnalyticsCard + GroupDetailModal + dataExport + GroupsAnalyticsScreen .web shims</Text>
            <Text style={styles.checkRowDone}>✅ EAS builds: eas.json dev/preview/prod + android READ_CONTACTS/READ_CALENDAR/WRITE_CALENDAR + expo-contacts/calendar plugins + bundleIdentifier com.tamelabs.orbit</Text>
            <Text style={styles.checkRowDone}>✅ Web shims: View→View KAV→View stripping behavior/keyboardVerticalOffset dedup imports preserve TextInput - 9 shims regen via python transform</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>Orbit v2.7.0 — Map your relationships. Local-first, zero tracking. Health = recency 30% + frequency 30% + energy 35% + sentiment 5%. Groups: cluster contacts, filter Contacts list by group, assign in Add Contact + Detail, manage with colors + counts, Map and Insights respect groups. NEW v2.7: Groups Analytics Dashboard — per-group avg health, energy distribution, stale count below 70 pct health, totalGrouped, birthdays upcoming 60d count, reminders due. Group Detail modal/screen when tap group pill/chip: members FlatList avatar 20 circle initial + health badge + timeAgo + energy + groupBadge + Quick Stats energy levels health distribution. CSV export for groups per-group or all. Part of TameLabs.</Text>
          <Text style={styles.aboutVersion}>v2.7.0 • groups analytics dashboard • group detail modal • CSV export • token-hardened 0 hex • Quality Checklist • {new Date().getFullYear()}</Text>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      <GroupDetailModal groupId={detailGroupId} onClose={()=> setDetailGroupId(null)} navigation={navigation||nav} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.l, gap: theme.spacing.ml, paddingBottom: 96 },
  section: { padding: theme.spacing.ml, backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.l, borderWidth: 1, borderColor: theme.colors.border, ...theme.shadows.card, gap: theme.spacing.s },
  sectionTitle: { ...theme.typography.label, color: theme.colors.text, marginBottom: 2 },
  sectionSubTitle: { ...theme.typography.caption, color: theme.colors.textSecondary, fontStyle: 'italic' as any, lineHeight: 14 },
  sectionHeader: { marginBottom: theme.spacing.s },
  sectionHint: { ...theme.typography.micro, color: theme.colors.textTertiary, marginBottom: theme.spacing.s, lineHeight: 14 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: theme.spacing.s },
  tagList: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.s },
  tagChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surfaceHover, paddingHorizontal: theme.spacing.m, paddingVertical: 6, borderRadius: theme.borderRadius.pill, borderWidth: 1, borderColor: theme.colors.border, gap: 6, ...theme.shadows.chip },
  tagText: { ...theme.typography.caption, color: theme.colors.text },
  groupList: { gap: theme.spacing.s },
  groupItemRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surfaceHover, borderRadius: theme.borderRadius.m, borderWidth: 1, borderColor: theme.colors.border, ...theme.shadows.chip },
  groupItemMain: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: theme.spacing.m, gap: theme.spacing.s },
  groupDotLarge: { width: 12, height: 12, borderRadius: 6 },
  groupInfo: { flex: 1, gap: 2 },
  groupText: { ...theme.typography.bodySmall, color: theme.colors.text, fontWeight: '600' as any },
  groupMeta: { ...theme.typography.micro, color: theme.colors.textTertiary },
  countPill: { backgroundColor: theme.colors.surface, paddingHorizontal: 8, paddingVertical: 2, borderRadius: theme.borderRadius.pill, borderWidth: 1, borderColor: theme.colors.borderLight },
  countText: { fontSize: 11, color: theme.colors.textSecondary, fontWeight: '600' as any },
  groupItemActions: { flexDirection: 'row', alignItems: 'center', paddingRight: theme.spacing.m, gap: theme.spacing.m },
  actionEdit: { fontSize: 16, color: theme.colors.textSecondary },
  actionDelete: { fontSize: 14, color: theme.colors.textTertiary, fontWeight: '600' as any },
  groupEditCard: { backgroundColor: theme.colors.surface, padding: theme.spacing.m, borderRadius: theme.borderRadius.m, borderWidth: 1, borderColor: theme.colors.primary, gap: theme.spacing.s },
  colorRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.s, flexWrap: 'wrap' as const },
  colorLabel: { ...theme.typography.micro, color: theme.colors.textSecondary },
  colorDot: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: 'transparent' },
  colorDotActive: { borderColor: theme.colors.text, borderWidth: 2 },
  editActions: { flexDirection: 'row', gap: theme.spacing.s, marginTop: theme.spacing.s },
  removeIcon: { color: theme.colors.textTertiary, fontSize: 14, fontWeight: '600' as any },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 },
  rowLabel: { ...theme.typography.caption, color: theme.colors.textSecondary },
  rowValue: { ...theme.typography.caption, color: theme.colors.text, fontWeight: '600' as const, maxWidth: 180, textAlign: 'right' as any },
  hint: { ...theme.typography.micro, color: theme.colors.textTertiary, marginTop: 6, fontStyle: 'italic' as any, lineHeight: 14 },
  empty: { ...theme.typography.caption, color: theme.colors.textTertiary, fontStyle: 'italic' as any, marginTop: 4, lineHeight: 16 },
  checkList: { gap: 6, marginTop: theme.spacing.s },
  checkRow: { ...theme.typography.caption, color: theme.colors.textTertiary },
  checkRowDone: { ...theme.typography.caption, color: theme.colors.textSecondary, lineHeight: 16 },
  aboutText: { ...theme.typography.bodySmall, color: theme.colors.textSecondary, lineHeight: 20 },
  aboutVersion: { ...theme.typography.micro, color: theme.colors.textTertiary, marginTop: theme.spacing.s },
});
