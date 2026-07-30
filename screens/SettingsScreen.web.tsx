import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
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
  const addTag = useOrbitStore((s) => s.addTag);
  const removeTag = useOrbitStore((s) => s.removeTag);
  const addGroup = useOrbitStore((s) => s.addGroup);
  const deleteGroup = useOrbitStore((s) => s.deleteGroup);
  const { user: tameUser, provider } = useIdentity();
  const nav = useNavigation<any>();

  const [newTag, setNewTag] = useState('');
  const [newGroupName, setNewGroupName] = useState('');

  const handleAddTag = () => {
    if (newTag.trim()) {
      addTag(newTag.trim());
      logger.info('Settings', 'add tag', { tag: newTag.trim() });
      setNewTag('');
    }
  };

  const handleAddGroup = () => {
    if (newGroupName.trim()) {
      addGroup(newGroupName.trim());
      logger.info('Settings', 'add group', { name: newGroupName.trim() });
      setNewGroupName('');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tame ID</Text>
        <View style={styles.row}><Text style={styles.rowLabel}>Provider</Text><Text style={styles.rowValue}>{provider || 'mock'}</Text></View>
        <View style={styles.row}><Text style={styles.rowLabel}>User</Text><Text style={styles.rowValue} numberOfLines={1}>{tameUser?.email || tameUser?.id || 'Not signed in'}</Text></View>
        <View style={styles.row}><Text style={styles.rowLabel}>Same ID</Text><Text style={styles.rowValue}>Across 3 apps</Text></View>
        <Text style={styles.hint}>Supabase v1 now, Keycloak-ready v2. One login Hubble•Orbit•Quiet.</Text>
        <View style={{height:10}} />
        <Button title={tameUser ? 'Manage Tame ID' : 'Connect Tame ID'} variant="secondary" onPress={()=> (navigation || nav).navigate('Auth')} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tags Management</Text>
        <View style={styles.inputRow}>
          <Input placeholder="Add New Tag..." value={newTag} onChangeText={setNewTag} style={{ flex: 1 } as any} />
          <Button title="Add" onPress={handleAddTag} variant="primary" size="s" style={{ marginLeft: 12 } as any} />
        </View>
        <View style={styles.tagList}>
          {tags.map((tag: string) => (
            <TouchableOpacity key={tag} style={styles.tagChip} onPress={() => removeTag(tag)} accessibilityRole="button" accessibilityLabel={`Remove tag ${tag}`}>
              <Text style={styles.tagText}>{tag}</Text>
              <Text style={styles.removeIcon}>✕</Text>
            </TouchableOpacity>
          ))}
          {tags.length===0 ? <Text style={styles.empty}>No tags yet. Add one to organize contacts.</Text> : null}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Groups Management</Text>
        <View style={styles.inputRow}>
          <Input placeholder="Group Name..." value={newGroupName} onChangeText={setNewGroupName} style={{ flex: 1 } as any} />
          <Button title="Add" onPress={handleAddGroup} variant="primary" size="s" style={{ marginLeft: 12 } as any} />
        </View>
        <View style={styles.groupList}>
          {groups.map((group: any) => (
            <TouchableOpacity key={group.id} style={styles.groupItem} onPress={() => deleteGroup(group.id)} accessibilityRole="button">
              <Text style={styles.groupText}>{group.name}</Text>
              <Text style={styles.removeIcon}>✕</Text>
            </TouchableOpacity>
          ))}
          {groups.length===0 ? <Text style={styles.empty}>No groups yet.</Text> : null}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data</Text>
        <View style={styles.row}><Text style={styles.rowLabel}>Contacts</Text><Text style={styles.rowValue}>{contacts.length}</Text></View>
        <View style={styles.row}><Text style={styles.rowLabel}>Tags</Text><Text style={styles.rowValue}>{tags.length}</Text></View>
        <View style={styles.row}><Text style={styles.rowLabel}>Groups</Text><Text style={styles.rowValue}>{groups.length}</Text></View>
        <View style={styles.row}><Text style={styles.rowLabel}>Last updated</Text><Text style={styles.rowValue}>{contacts.length ? formatTimeAgo(contacts[0]?.createdAt || new Date().toISOString()) : 'never'}</Text></View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <TouchableOpacity style={styles.settingItem}><Text style={styles.settingText}>Export Tame ID data</Text><Text style={styles.settingValue}>JSON</Text></TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}><Text style={styles.settingText}>Privacy</Text><Text style={styles.settingValue}>Local-first</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: 16 },
  section: { marginBottom: 24, padding: 16, backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.l, borderWidth: 1, borderColor: theme.colors.border },
  sectionTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '600' as const, marginBottom: 14 },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  tagList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surfaceHover, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border },
  tagText: { color: theme.colors.text, fontSize: 14, marginRight: 6 },
  groupList: { gap: 8 },
  groupItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.colors.surfaceHover, padding: 12, borderRadius: theme.borderRadius.m, borderWidth: 1, borderColor: theme.colors.border },
  groupText: { color: theme.colors.text, fontSize: 14 },
  removeIcon: { color: theme.colors.textTertiary, fontSize: 14, fontWeight: '600' as any },
  settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  settingText: { color: theme.colors.text, fontSize: 14 },
  settingValue: { color: theme.colors.textTertiary, fontSize: 13 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  rowLabel: { color: theme.colors.textSecondary, fontSize: 13 },
  rowValue: { color: theme.colors.text, fontSize: 13, fontWeight: '600' as const, maxWidth: 180 },
  hint: { fontSize: 11, color: theme.colors.textTertiary, marginTop: 6, fontStyle: 'italic' as any },
  empty: { color: theme.colors.textTertiary, fontSize: 12, fontStyle: 'italic' as any, marginTop: 4 },
});
