import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useOrbitStore, RELATIONSHIP_TYPES } from '../stores/orbitStore';
import { theme } from '../src/theme';
import { Input } from '../src/components/Input';
import { Button } from '../src/components/Button';
import { logger } from '../src/utils/logger';

export default function AddContactScreen({ navigation }: any) {
  const addContact = useOrbitStore(s => s.addContact);
  const tags = useOrbitStore(s => s.tags);
  const [name, setName] = useState('');
  const [type, setType] = useState('friend');
  const [notes, setNotes] = useState('');
  const [birthday, setBirthday] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const nameLen = name.trim().length;
  const notesLen = notes.length;
  const maxName = 40;
  const maxNotes = 500;

  const toggleTag = (tag: string) => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t=>t!==tag) : [...prev, tag]);

  const handleSubmit = async () => {
    if (!name.trim()) { Alert.alert('Required','Enter name'); return; }
    if (name.trim().length > maxName) { Alert.alert('Too long', `Name max ${maxName} chars`); return; }
    if (notes.length > maxNotes) { Alert.alert('Too long', `Notes max ${maxNotes} chars`); return; }
    setSaving(true);
    try {
      addContact({ name: name.trim(), type: type as any, notes, tags: selectedTags, birthday: birthday||null } as any);
      logger.info('AddContact', 'created', { name: name.trim(), type });
      // optimistic 150ms for polish
      await new Promise(r => setTimeout(r, 150));
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  const discardGuard = () => {
    if (name || notes || selectedTags.length) {
      Alert.alert('Discard?', 'You have unsaved changes.', [
        { text: 'Keep editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
      ]);
    } else {
      navigation.goBack();
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS==='ios' ? 'padding' : undefined} keyboardVerticalOffset={80}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>New Contact</Text>
            <Text style={styles.headerSub}>Add someone to your relationship map</Text>
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
            <Text style={styles.hint}>We will remind you 30 days before</Text>
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
            <Text style={styles.footerText}>Contacts are stored locally. Health score uses recency + energy + sentiment.</Text>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
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
  types: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.s },
  typeBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, paddingHorizontal: theme.spacing.ml, paddingVertical: theme.spacing.s, borderRadius: theme.borderRadius.pill, borderWidth: 1, borderColor: theme.colors.border, gap: 6, ...theme.shadows.chip },
  typeEmoji: { fontSize: 14 },
  typeLabel: { ...theme.typography.caption, color: theme.colors.textSecondary },
  typeLabelActive: { color: '#FFF', fontWeight: '700' as any },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.s },
  tag: { backgroundColor: theme.colors.surface, paddingHorizontal: theme.spacing.m, paddingVertical: 6, borderRadius: theme.borderRadius.pill, borderWidth: 1, borderColor: theme.colors.border, ...theme.shadows.chip },
  tagActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  tagText: { ...theme.typography.caption, color: theme.colors.textSecondary },
  tagTextActive: { color: '#FFF', fontWeight: '600' as any },
  selectedTagsPreview: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: theme.spacing.s, gap: 6 },
  selectedLabel: { ...theme.typography.caption, color: theme.colors.textTertiary },
  tagPreviewRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  previewTag: { backgroundColor: theme.colors.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: theme.borderRadius.pill },
  previewTagText: { color: '#FFF', fontSize: 10, fontWeight: '600' as any },
  hint: { ...theme.typography.micro, color: theme.colors.textTertiary, marginTop: 4, fontStyle: 'italic' as any },
  multiline: { minHeight: 80, textAlignVertical: 'top' as any },
  charRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 },
  charCount: { ...theme.typography.micro, color: theme.colors.textTertiary },
  charShort: { color: theme.colors.warning },
  charLong: { color: theme.colors.danger },
  actions: { gap: theme.spacing.s, marginTop: theme.spacing.m },
  footerNote: { marginTop: theme.spacing.m, backgroundColor: theme.colors.surfaceMuted, padding: theme.spacing.m, borderRadius: theme.borderRadius.l, borderWidth: 1, borderColor: theme.colors.borderLight },
  footerText: { ...theme.typography.caption, color: theme.colors.textTertiary, textAlign: 'center' },
});
