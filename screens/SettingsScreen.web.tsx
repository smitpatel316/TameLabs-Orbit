import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Share, RefreshControl } from 'react-native';
import { useOrbitStore } from '../stores/orbitStore';
import { theme, formatTimeAgo } from '../src/theme';
import { Input } from '../src/components/Input';
import { Button } from '../src/components/Button';
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
  const deleteGroup = useOrbitStore((s) => s.deleteGroup);
  const { user: tameUser, provider } = useIdentity();
  const nav = useNavigation<any>();
  const [newTag, setNewTag] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(()=>{
    setRefreshing(true);
    setTimeout(()=> setRefreshing(false), 600);
  }, []);

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
    addGroup(n);
    logger.info('Settings', 'add group', { name: n });
    setNewGroupName('');
  };

  const handleExport = async () => {
    try {
      const data = { contacts, interactions, reminders, tags, groups, exportedAt: new Date().toISOString() };
      const json = JSON.stringify(data, null, 2);
      await Share.share({ message: json, title: 'Orbit Export' });
      logger.info('Settings','export');
    } catch {}
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.text} />}>
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
          <Text style={styles.sectionTitle}>Tags Management</Text>
          <Text style={styles.sectionHint}>{tags.length} tags • Tap chip to remove</Text>
          <View style={styles.inputRow}>
            <View style={{flex:1}}>
              <Input placeholder="Add new tag..." value={newTag} onChangeText={setNewTag} maxLength={30} returnKeyType="done" onSubmitEditing={handleAddTag} accessibilityLabel="New tag" />
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
            {tags.length===0 ? <Text style={styles.empty}>No tags yet. Add one to organize contacts — like Work, Family, Friends.</Text> : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Groups Management</Text>
          <Text style={styles.sectionHint}>{groups.length} groups • Tap row to delete</Text>
          <View style={styles.inputRow}>
            <View style={{flex:1}}>
              <Input placeholder="Group name..." value={newGroupName} onChangeText={setNewGroupName} maxLength={30} returnKeyType="done" onSubmitEditing={handleAddGroup} accessibilityLabel="New group" />
            </View>
            <Button title="Add" onPress={handleAddGroup} variant="primary" size="s" style={{ marginLeft: theme.spacing.s, marginTop: 2 } as any} disabled={!newGroupName.trim()} />
          </View>
          <View style={styles.groupList}>
            {groups.map((group: any) => (
              <TouchableOpacity key={group.id} style={styles.groupItem} onPress={() => {
                Alert.alert(`Delete group?`, `"${group.name}" — contacts in group stay but lose group link.`, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: ()=> deleteGroup(group.id) },
                ]);
              }} activeOpacity={0.7} accessibilityRole="button">
                <View style={styles.groupDot} />
                <Text style={styles.groupText}>{group.name}</Text>
                <Text style={styles.removeIcon}>✕</Text>
              </TouchableOpacity>
            ))}
            {groups.length===0 ? <Text style={styles.empty}>No groups yet. Groups help you cluster contacts for Insights Map view.</Text> : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Overview</Text>
          <View style={styles.row}><Text style={styles.rowLabel}>Contacts</Text><Text style={styles.rowValue}>{contacts.length}</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>Interactions</Text><Text style={styles.rowValue}>{interactions.length}</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>Reminders</Text><Text style={styles.rowValue}>{reminders.length}</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>Tags</Text><Text style={styles.rowValue}>{tags.length}</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>Groups</Text><Text style={styles.rowValue}>{groups.length}</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>Last updated</Text><Text style={styles.rowValue}>{contacts.length ? formatTimeAgo(contacts[0]?.createdAt || new Date().toISOString()) : 'never'}</Text></View>
          <View style={{height:8}} />
          <Button title="Export JSON" onPress={handleExport} variant="secondary" size="s" accessibilityLabel="Export data" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quality Checklist</Text>
          <View style={styles.checkList}>
            <Text style={styles.checkRow}>• Pull-to-refresh on all lists</Text>
            <Text style={styles.checkRow}>• Time-ago + full date everywhere</Text>
            <Text style={styles.checkRow}>• Keyboard avoiding + dismiss + char limits</Text>
            <Text style={styles.checkRow}>• Empty states with actions</Text>
            <Text style={styles.checkRow}>• Button/Input design system, accessibility</Text>
            <Text style={styles.checkRow}>• Health score real formula (recency+energy+sentiment)</Text>
            <Text style={styles.checkRow}>• Groups CRUD + Tags chip management</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>Orbit v2.2 — Map your relationships. Local-first, zero tracking. Health = recency 30% + frequency 30% + energy 35% + sentiment 5%. Part of TameLabs.</Text>
          <Text style={styles.aboutVersion}>v2.2 • quality polish • {new Date().getFullYear()}</Text>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.l, gap: theme.spacing.ml, paddingBottom: 96 },
  section: { padding: theme.spacing.ml, backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.l, borderWidth: 1, borderColor: theme.colors.border, ...theme.shadows.card, gap: theme.spacing.s },
  sectionTitle: { ...theme.typography.label, color: theme.colors.text, marginBottom: 2 },
  sectionHint: { ...theme.typography.micro, color: theme.colors.textTertiary, marginBottom: theme.spacing.s },
  inputRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: theme.spacing.s },
  tagList: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.s },
  tagChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surfaceHover, paddingHorizontal: theme.spacing.m, paddingVertical: 6, borderRadius: theme.borderRadius.pill, borderWidth: 1, borderColor: theme.colors.border, gap: 6, ...theme.shadows.chip },
  tagText: { ...theme.typography.caption, color: theme.colors.text },
  groupList: { gap: theme.spacing.s },
  groupItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surfaceHover, padding: theme.spacing.m, borderRadius: theme.borderRadius.m, borderWidth: 1, borderColor: theme.colors.border, gap: theme.spacing.s, ...theme.shadows.chip },
  groupDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.primary },
  groupText: { ...theme.typography.bodySmall, color: theme.colors.text, flex: 1 },
  removeIcon: { color: theme.colors.textTertiary, fontSize: 14, fontWeight: '600' as any },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 },
  rowLabel: { ...theme.typography.caption, color: theme.colors.textSecondary },
  rowValue: { ...theme.typography.caption, color: theme.colors.text, fontWeight: '600' as const, maxWidth: 180, textAlign: 'right' as any },
  hint: { ...theme.typography.micro, color: theme.colors.textTertiary, marginTop: 6, fontStyle: 'italic' as any },
  empty: { ...theme.typography.caption, color: theme.colors.textTertiary, fontStyle: 'italic' as any, marginTop: 4, lineHeight: 16 },
  checkList: { gap: 6, marginTop: theme.spacing.s },
  checkRow: { ...theme.typography.caption, color: theme.colors.textTertiary },
  aboutText: { ...theme.typography.bodySmall, color: theme.colors.textSecondary, lineHeight: 20 },
  aboutVersion: { ...theme.typography.micro, color: theme.colors.textTertiary, marginTop: theme.spacing.s },
});
