import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useOrbitStore, RELATIONSHIP_TYPES, GROUP_COLORS } from '../stores/orbitStore';
import { theme } from '../src/theme';
import { Input } from '../src/components/Input';
import { Button } from '../src/components/Button';
import { logger } from '../src/utils/logger';

export default function AddContactScreen({ navigation }: any) {
  const addContact = useOrbitStore(s => s.addContact);
  const tags = useOrbitStore(s => s.tags);
  const groups = useOrbitStore(s => s.groups);
  const addGroup = useOrbitStore(s => s.addGroup);
  const getGroupCounts = useOrbitStore(s => s.getGroupCounts);
  const [name, setName] = useState('');
  const [type, setType] = useState('friend');
  const [notes, setNotes] = useState('');
  const [birthday, setBirthday] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(undefined);
  const [newGroupName, setNewGroupName] = useState('');
  const [showGroupCreator, setShowGroupCreator] = useState(false);
  const [saving, setSaving] = useState(false);

  const nameLen = name.trim().length;
  const notesLen = notes.length;
  const maxName = 40;
  const maxNotes = 500;

  const groupCounts = useMemo(()=>{ try{ return getGroupCounts(); }catch{ return {} as Record<string,number>; } }, [groups]);

  const toggleTag = (tag: string) => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t=>t!==tag) : [...prev, tag]);

  const handleCreateGroup = () => {
    const trimmed = newGroupName.trim();
    if (!trimmed) { Alert.alert('Name required', 'Group needs a name'); return; }
    if (trimmed.length > 30) { Alert.alert('Too long', 'Max 30 chars'); return; }
    const g = addGroup(trimmed);
    if (g && g.id) {
      setSelectedGroupId(g.id);
      setNewGroupName('');
      setShowGroupCreator(false);
      logger.info('AddContact', 'created group inline', { name: trimmed });
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) { Alert.alert('Required','Enter name'); return; }
    if (name.trim().length > maxName) { Alert.alert('Too long', `Name max ${maxName} chars`); return; }
    if (notes.length > maxNotes) { Alert.alert('Too long', `Notes max ${maxNotes} chars`); return; }
    setSaving(true);
    try {
      addContact({ name: name.trim(), type: type as any, notes, tags: selectedTags, birthday: birthday||null, groupId: selectedGroupId } as any);
      logger.info('AddContact', 'created', { name: name.trim(), type, groupId: selectedGroupId });
      await new Promise(r => setTimeout(r, 150));
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  const discardGuard = () => {
    if (name || notes || selectedTags.length || selectedGroupId) {
      Alert.alert('Discard?', 'You have unsaved changes.', [
        { text: 'Keep editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
      ]);
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>New Contact</Text>
            <Text style={styles.headerSub}>Add someone to your relationship map — group them to cluster Insights/Map</Text>
          </View>

          <View style={styles.section}>
            <Input label="Name *" placeholder="Full name" value={name} onChangeText={setName} maxLength={maxName} returnKeyType="next" accessibilityLabel="Contact name" />
            <View style={styles.charRow}>
              <Text style={[styles.charCount, nameLen===0 && styles.charShort, nameLen>maxName*0.8 && styles.charLong]}>{nameLen}/{maxName}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Relationship Type</Text>
            <View style={styles.types}>
              {Object.entries(RELATIONSHIP_TYPES).map(([k,v]:any)=>
                <TouchableOpacity key={k} style={[styles.typeBtn, type===k && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]} onPress={()=>setType(k)} activeOpacity={0.7} accessibilityRole="button" accessibilityState={{ selected: type===k }} accessibilityLabel={`Type ${v.label}`}>
                  <Text style={styles.typeEmoji}>{v.emoji}</Text>
                  <Text style={[styles.typeLabel, type===k && styles.typeLabelActive]}>{v.label}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.label}>Group</Text>
              <Text style={styles.sectionHint}>{groups.length} groups • {selectedGroupId ? groups.find((g:any)=>g.id===selectedGroupId)?.name : 'None yet'}</Text>
            </View>
            <View style={styles.groupsRow}>
              <TouchableOpacity style={[styles.groupChip, !selectedGroupId && styles.groupChipActive]} onPress={()=>setSelectedGroupId(undefined)} activeOpacity={0.7} accessibilityLabel="No group">
                <Text style={[styles.groupChipText, !selectedGroupId && styles.groupChipTextActive]}>No group</Text>
              </TouchableOpacity>
              {groups.map((g:any)=>
                <TouchableOpacity key={g.id} style={[styles.groupChip, { borderColor: g.color || theme.colors.border }, selectedGroupId===g.id && { backgroundColor: g.color || theme.colors.primary, borderColor: g.color || theme.colors.primary }]} onPress={()=>setSelectedGroupId(selectedGroupId===g.id ? undefined : g.id)} activeOpacity={0.7} accessibilityRole="button" accessibilityState={{ selected: selectedGroupId===g.id }} accessibilityLabel={`Group ${g.name} ${groupCounts[g.id]||0}`}>
                  <View style={[styles.groupDot, { backgroundColor: selectedGroupId===g.id ? theme.colors.onPrimary : g.color || theme.colors.primary }]} />
                  <Text style={[styles.groupChipText, selectedGroupId===g.id && styles.groupChipTextActive]} numberOfLines={1}>{g.name}</Text>
                  <View style={[styles.countPill, selectedGroupId===g.id && styles.countPillActive]}><Text style={[styles.countText, selectedGroupId===g.id && styles.countTextActive]}>{groupCounts[g.id]||0}</Text></View>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.createGroupLink} onPress={()=>setShowGroupCreator(!showGroupCreator)} activeOpacity={0.7} accessibilityLabel="Create new group">
                <Text style={styles.createGroupText}>{showGroupCreator ? 'Cancel' : '+ New group'}</Text>
              </TouchableOpacity>
            </View>
            {showGroupCreator ? (
              <View style={styles.inlineGroupCreator}>
                <View style={{ flex: 1 }}><Input placeholder="Group name e.g. Gym, Book club" value={newGroupName} onChangeText={setNewGroupName} maxLength={30} returnKeyType="done" onSubmitEditing={handleCreateGroup} accessibilityLabel="New group name" /></View>
                <Button title="Create" onPress={handleCreateGroup} size="s" variant="primary" disabled={!newGroupName.trim()} style={{ marginTop: 2 } as any} />
              </View>
            ) : null}
            {selectedGroupId ? <Text style={styles.hint}>Will be in {groups.find((g:any)=>g.id===selectedGroupId)?.name} — used in Map clusters + Insights by-type filters</Text> : <Text style={styles.hint}>Groups cluster contacts in Map view & Settings management — create one to start</Text>}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Tags</Text>
            <View style={styles.tags}>
              {tags.map((t:string)=>
                <TouchableOpacity key={t} style={[styles.tag, selectedTags.includes(t) && styles.tagActive]} onPress={()=>toggleTag(t)} activeOpacity={0.7} accessibilityRole="button" accessibilityState={{ selected: selectedTags.includes(t) }}>
                  <Text style={[styles.tagText, selectedTags.includes(t) && styles.tagTextActive]}>{t}</Text>
                </TouchableOpacity>
              )}
            </View>
            {selectedTags.length>0 && (
              <View style={styles.selectedTagsPreview}>
                <Text style={styles.selectedLabel}>Selected: </Text>
                <View style={styles.tagPreviewRow}>{selectedTags.map(tt=> <View key={tt} style={styles.previewTag}><Text style={styles.previewTagText}>{tt}</Text></View>)}</View>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Input label="Birthday (MM/DD)" placeholder="e.g. 12/25" value={birthday} onChangeText={setBirthday} maxLength={10} keyboardType="numbers-and-punctuation" accessibilityLabel="Birthday" />
            <Text style={styles.hint}>We will remind you 30 days before in Insights — 60d window</Text>
          </View>

          <View style={styles.section}>
            <Input label="Notes" placeholder="How did you meet? What matters to them..." value={notes} onChangeText={setNotes} multiline numberOfLines={3} style={styles.multiline} maxLength={maxNotes} accessibilityLabel="Notes" />
            <View style={styles.charRow}>
              <Text style={[styles.charCount, notesLen>maxNotes*0.8 && styles.charLong]}>{notesLen}/{maxNotes}</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <Button title="Add Contact" onPress={handleSubmit} loading={saving} variant="primary" size="l" disabled={saving || nameLen===0} accessibilityLabel="Add contact" />
            <Button title="Cancel" onPress={discardGuard} variant="ghost" size="m" />
          </View>

          <View style={styles.footerNote}>
            <Text style={styles.footerText}>Contacts are stored locally. Health score = recency 30% + frequency 30% + energy 35% + sentiment 5%. Groups: Map clusters + Contacts filter.</Text>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.l, gap: theme.spacing.m, paddingBottom: 96 },
  header: { marginBottom: theme.spacing.m },
  headerTitle: { ...theme.typography.h1, color: theme.colors.text },
  headerSub: { ...theme.typography.bodySmall, color: theme.colors.textSecondary, marginTop: 4 },
  section: { marginBottom: theme.spacing.s },
  label: { ...theme.typography.label, color: theme.colors.textSecondary, marginBottom: theme.spacing.s },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.s },
  sectionHint: { ...theme.typography.micro, color: theme.colors.textTertiary },
  types: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.s },
  typeBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, paddingHorizontal: theme.spacing.ml, paddingVertical: theme.spacing.s, borderRadius: theme.borderRadius.pill, borderWidth: 1, borderColor: theme.colors.border, gap: 6, ...theme.shadows.chip },
  typeEmoji: { fontSize: 14 },
  typeLabel: { ...theme.typography.caption, color: theme.colors.textSecondary },
  typeLabelActive: { color: theme.colors.onPrimary, fontWeight: '700' as any },
  groupsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.s, alignItems: 'center' },
  groupChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, paddingHorizontal: 10, paddingVertical: 6, borderRadius: theme.borderRadius.pill, borderWidth: 1, borderColor: theme.colors.border, gap: 6, maxWidth: 170, ...theme.shadows.chip },
  groupChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  groupChipText: { ...theme.typography.caption, color: theme.colors.textSecondary, flexShrink: 1 },
  groupChipTextActive: { color: theme.colors.onPrimary, fontWeight: '600' as any },
  groupDot: { width: 8, height: 8, borderRadius: 4 },
  countPill: { backgroundColor: theme.colors.surfaceHover, paddingHorizontal: 5, paddingVertical: 1, borderRadius: theme.borderRadius.pill, borderWidth: 1, borderColor: theme.colors.borderLight },
  countPillActive: { backgroundColor: 'rgba(255,255,255,0.22)', borderColor: 'transparent' },
  countText: { fontSize: 10, color: theme.colors.textTertiary, fontWeight: '600' as any },
  countTextActive: { color: theme.colors.onPrimary },
  createGroupLink: { paddingHorizontal: 10, paddingVertical: 6 },
  createGroupText: { color: theme.colors.text, fontSize: 12, fontWeight: '600' as any },
  inlineGroupCreator: { flexDirection: 'row', gap: theme.spacing.s, alignItems: 'flex-start', marginTop: theme.spacing.s },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.s },
  tag: { backgroundColor: theme.colors.surface, paddingHorizontal: theme.spacing.m, paddingVertical: 6, borderRadius: theme.borderRadius.pill, borderWidth: 1, borderColor: theme.colors.border, ...theme.shadows.chip },
  tagActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  tagText: { ...theme.typography.caption, color: theme.colors.textSecondary },
  tagTextActive: { color: theme.colors.onPrimary, fontWeight: '600' as any },
  selectedTagsPreview: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: theme.spacing.s, gap: 6 },
  selectedLabel: { ...theme.typography.caption, color: theme.colors.textTertiary },
  tagPreviewRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  previewTag: { backgroundColor: theme.colors.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: theme.borderRadius.pill },
  previewTagText: { color: theme.colors.onPrimary, fontSize: 10, fontWeight: '600' as any },
  hint: { ...theme.typography.micro, color: theme.colors.textTertiary, marginTop: 4, fontStyle: 'italic' as any },
  multiline: { minHeight: 80, textAlignVertical: 'top' as any },
  charRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 },
  charCount: { ...theme.typography.micro, color: theme.colors.textTertiary },
  charShort: { color: theme.colors.warning },
  charLong: { color: theme.colors.danger },
  actions: { gap: theme.spacing.s, marginTop: theme.spacing.m },
  footerNote: { marginTop: theme.spacing.m, backgroundColor: theme.colors.surfaceMuted, padding: theme.spacing.m, borderRadius: theme.borderRadius.l, borderWidth: 1, borderColor: theme.colors.borderLight },
  footerText: { ...theme.typography.caption, color: theme.colors.textTertiary, textAlign: 'center', lineHeight: 16 },
});
