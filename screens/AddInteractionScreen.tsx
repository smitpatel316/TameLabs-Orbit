import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Alert } from 'react-native';
import { useOrbitStore, ENERGY_LEVELS } from '../stores/orbitStore';
import { theme } from '../src/theme';
import { Input } from '../src/components/Input';
import { Button } from '../src/components/Button';
import { logger } from '../src/utils/logger';

export default function AddInteractionScreen({ route, navigation }: any) {
  const { contactId } = route.params;
  const addInteraction = useOrbitStore(s => s.addInteraction);
  const contacts = useOrbitStore(s => s.contacts);
  const contact = contacts.find(c=>c.id===contactId);
  const [type, setType] = useState<'call'|'text'|'in-person'|'email'|'other'>('text');
  const [summary, setSummary] = useState('');
  const [energy, setEnergy] = useState('neutral');
  const [sentiment, setSentiment] = useState<'positive'|'neutral'|'negative'>('neutral');
  const [saving, setSaving] = useState(false);

  const maxSummary = 500;
  const summaryLen = summary.length;

  const handleSubmit = async () => {
    if (!summary.trim()) { Alert.alert('Required','Add a short summary'); return; }
    if (summary.trim().length < 3) { Alert.alert('Too short','At least 3 characters'); return; }
    setSaving(true);
    try {
      addInteraction({ contactId, type, summary: summary.trim(), energy: energy as any, sentiment } as any);
      logger.info('AddInteraction','created',{contactId, type, energy, sentiment});
      await new Promise(r=>setTimeout(r,150));
      navigation.goBack();
    } finally { setSaving(false); }
  };

  const charHint = summaryLen===0 ? `Add details — ${maxSummary} max` : summaryLen<10 ? `${10-summaryLen} more for context` : summaryLen>maxSummary*0.8 ? `${maxSummary-summaryLen} left` : `${summaryLen} chars`;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS==='ios'?'padding':undefined} keyboardVerticalOffset={80}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Log interaction</Text>
            <Text style={styles.headerSub}>with {contact?.name || 'contact'}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Type</Text>
            <View style={styles.row}>
              {(['call','text','in-person','email','other'] as const).map(t=>
                <TouchableOpacity key={t} style={[styles.chip, type===t && styles.chipActive]} onPress={()=>setType(t)} activeOpacity={0.7} accessibilityRole="button" accessibilityState={{ selected: type===t }}>
                  <Text style={[styles.chipText, type===t && styles.chipTextActive]}>{t}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Input label={`Summary *`} placeholder="What happened? Quick notes, vibe, takeaway..." value={summary} onChangeText={setSummary} multiline numberOfLines={3} style={styles.multiline} maxLength={maxSummary} accessibilityLabel="Interaction summary" />
            <View style={styles.charRow}><Text style={[styles.charCount, summaryLen>maxSummary*0.8 && styles.charLong]}>{charHint}</Text></View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Energy</Text>
            <View style={styles.row}>
              {Object.entries(ENERGY_LEVELS).map(([k,v]:any)=>
                <TouchableOpacity key={k} style={[styles.energyChip, { borderColor: v.color }, energy===k && { backgroundColor: v.color, borderColor: v.color }]} onPress={()=>setEnergy(k)} activeOpacity={0.7} accessibilityRole="button" accessibilityState={{ selected: energy===k }}>
                  <View style={[styles.energyDot, { backgroundColor: energy===k ? '#FFF' : v.color }]} />
                  <Text style={[styles.chipText, energy===k && styles.chipTextActive]}>{v.label}</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.hint}>How did this interaction leave you feeling? Used for health score.</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Sentiment</Text>
            <View style={styles.row}>
              {(['positive','neutral','negative'] as const).map(s=>
                <TouchableOpacity key={s} style={[styles.chip, sentiment===s && styles.chipActive, s==='positive' && sentiment===s && { backgroundColor: theme.colors.success, borderColor: theme.colors.success }, s==='negative' && sentiment===s && { backgroundColor: theme.colors.danger, borderColor: theme.colors.danger }]} onPress={()=>setSentiment(s)} activeOpacity={0.7} accessibilityRole="button" accessibilityState={{ selected: sentiment===s }}>
                  <Text style={[styles.chipText, sentiment===s && styles.chipTextActive]}>{s}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.actions}>
            <Button title="Log Interaction" onPress={handleSubmit} loading={saving} disabled={saving || summary.trim().length<3} variant="primary" size="l" accessibilityLabel="Log interaction" />
            <Button title="Cancel" onPress={()=>navigation.goBack()} variant="ghost" size="m" />
          </View>

          <View style={styles.footerNote}><Text style={styles.footerText}>Health score = recency 30% + frequency 30% + energy 35% + sentiment 5%. Nourishing interactions boost health.</Text></View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.l, gap: theme.spacing.m, paddingBottom: 96 },
  header: { marginBottom: theme.spacing.s },
  headerTitle: { ...theme.typography.h1, color: theme.colors.text },
  headerSub: { ...theme.typography.bodySmall, color: theme.colors.textSecondary, marginTop: 2 },
  section: { marginBottom: theme.spacing.s },
  label: { ...theme.typography.label, color: theme.colors.textSecondary, marginBottom: theme.spacing.s },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.s },
  chip: { backgroundColor: theme.colors.surface, paddingHorizontal: theme.spacing.m, paddingVertical: theme.spacing.s, borderRadius: theme.borderRadius.pill, borderWidth: 1, borderColor: theme.colors.border, ...theme.shadows.chip },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { ...theme.typography.caption, color: theme.colors.textSecondary, textTransform: 'capitalize' as any },
  chipTextActive: { color: '#FFF', fontWeight: '600' as any },
  energyChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, paddingHorizontal: theme.spacing.m, paddingVertical: 6, borderRadius: theme.borderRadius.pill, borderWidth: 1, gap: 6, ...theme.shadows.chip },
  energyDot: { width: 8, height: 8, borderRadius: 4 },
  hint: { ...theme.typography.micro, color: theme.colors.textTertiary, marginTop: theme.spacing.s, fontStyle: 'italic' as any },
  multiline: { minHeight: 80, textAlignVertical: 'top' as any },
  charRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 },
  charCount: { ...theme.typography.micro, color: theme.colors.textTertiary },
  charLong: { color: theme.colors.warning },
  actions: { gap: theme.spacing.s, marginTop: theme.spacing.m },
  footerNote: { marginTop: theme.spacing.m, backgroundColor: theme.colors.surfaceMuted, padding: theme.spacing.m, borderRadius: theme.borderRadius.l, borderWidth: 1, borderColor: theme.colors.borderLight },
  footerText: { ...theme.typography.caption, color: theme.colors.textTertiary, textAlign: 'center', lineHeight: 16 },
});
