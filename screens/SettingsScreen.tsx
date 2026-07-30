import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity } from 'react-native';
import { useOrbitStore } from '../stores/orbitStore';
import { theme } from '../src/theme';
import { Input } from '../src/components/Input';
import { Button } from '../src/components/Button';

export default function SettingsScreen() {
  const tags = useOrbitStore((s) => s.tags);
  const groups = useOrbitStore((s) => s.groups);
  const addTag = useOrbitStore((s) => s.addTag);
  const removeTag = useOrbitStore((s) => s.removeTag);
  const addGroup = useOrbitStore((s) => s.addGroup);
  const deleteGroup = useOrbitStore((s) => s.deleteGroup);

  const [newTag, setNewTag] = useState('');
  const [newGroupName, setNewGroupName] = useState('');

  const handleAddTag = () => {
    if (newTag.trim()) {
      addTag(newTag.trim());
      setNewTag('');
    }
  };

  const handleAddGroup = () => {
    if (newGroupName.trim()) {
      addGroup(newGroupName.trim());
      setNewGroupName('');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tags Management</Text>
        <View style={styles.inputRow}>
          <Input 
            placeholder="Add New Tag..." 
            value={newTag} 
            onChangeText={setNewTag} 
            style={{ flex: 1, marginBottom: 0 }} 
          />
          <Button title="Add" onPress={handleAddTag} variant="primary" size="s" style={{ marginLeft: 12, height: 48, justifyContent: 'center' }} />
        </View>
        <View style={styles.tagList}>
          {tags.map(tag => (
            <TouchableOpacity key={tag} style={styles.tagChip} onPress={() => removeTag(tag)}>
              <Text style={styles.tagText}>{tag}</Text>
              <Text style={styles.removeIcon}>✕</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Groups Management</Text>
        <View style={styles.inputRow}>
          <Input 
            placeholder="Group Name..." 
            value={newGroupName} 
            onChangeText={setNewGroupName} 
            style={{ flex: 1, marginBottom: 0 }} 
          />
          <Button title="Add" onPress={handleAddGroup} variant="primary" size="s" style={{ marginLeft: 12, height: 48, justifyContent: 'center' }} />
        </View>
        <View style={styles.groupList}>
          {groups.map(group => (
            <TouchableOpacity key={group.id} style={styles.groupItem} onPress={() => deleteGroup(group.id)}>
              <Text style={styles.groupText}>{group.name}</Text>
              <Text style={styles.removeIcon}>✕</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Settings</Text>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>Clear All Data</Text>
          <Text style={styles.settingValue}>Danger Zone</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: 16 },
  section: { marginBottom: 32, padding: 16, backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.l, borderWidth: 1, borderColor: theme.colors.border },
  sectionTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '600', marginBottom: 16 },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  tagList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surfaceHover, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border },
  tagText: { color: theme.colors.text, fontSize: 14, marginRight: 8 },
  groupList: { gap: 8 },
  groupItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.colors.surfaceHover, padding: 12, borderRadius: theme.borderRadius.m, borderWidth: 1, borderColor: theme.colors.border },
  groupText: { color: theme.colors.text, fontSize: 14 },
  removeIcon: { color: theme.colors.textTertiary, fontSize: 14, fontWeight: '600' as any },
  settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  settingText: { color: theme.colors.text, fontSize: 14 },
  settingValue: { color: theme.colors.textTertiary, fontSize: 14 },
});
