import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Alert, RefreshControl } from 'react-native';
import { useOrbitStore } from '../stores/orbitStore';
import { theme, formatTimeAgo, formatDate } from '../src/theme';
import { Input } from '../src/components/Input';
import { Button } from '../src/components/Button';
import { EmptyState } from '../src/components/EmptyState';
import { logger } from '../src/utils/logger';

export default function RemindersScreen() {
  const contacts = useOrbitStore(s => s.contacts);
  const reminders = useOrbitStore(s => s.reminders);
  const addReminder = useOrbitStore(s => s.addReminder);
  const toggleReminder = useOrbitStore(s => s.toggleReminder);
  const deleteReminder = useOrbitStore(s => s.deleteReminder);
  const [text, setText] = useState('');
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(()=>{
    setRefreshing(true);
    logger.info('Reminders','pull to refresh',{ count: reminders.length });
    setTimeout(()=> setRefreshing(false), 600);
  }, [reminders.length]);

  const maxReminder = 200;
  const textLen = text.length;

  const handleAdd = () => {
    if (!text.trim() || !selectedContact) { Alert.alert('Required','Enter message and pick contact'); return; }
    if (text.trim().length>maxReminder) { Alert.alert('Too long', `Max ${maxReminder} chars`); return; }
    addReminder({ contactId: selectedContact, message: text.trim() });
    logger.info('Reminders','added',{ contactId: selectedContact });
    setText('');
  };

  const renderItem = ({ item }: any) => {
    const contact = contacts.find(c => c.id === item.contactId);
    const isOverdue = !item.done && new Date(item.dueDate).getTime() < Date.now();
    return (
      <View style={[styles.card, item.done && styles.cardDone, isOverdue && styles.cardOverdue]}>
        <TouchableOpacity onPress={()=>toggleReminder(item.id)} style={styles.checkBtn} accessibilityRole="checkbox" accessibilityState={{ checked: item.done }} accessibilityLabel={item.done ? 'Mark incomplete' : 'Mark done'}>
          <View style={[styles.checkBox, item.done && styles.checkBoxDone]}>
            {item.done && <Text style={styles.checkMark}>✓</Text>}
          </View>
        </TouchableOpacity>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[styles.msg, item.done && styles.msgDone]} numberOfLines={2}>{item.message}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.contactName}>{contact?.name || 'Unknown'}</Text>
            <Text style={styles.dotSep}>•</Text>
            <Text style={[styles.dueDate, isOverdue && styles.dueOverdue]}>{isOverdue ? 'Overdue' : 'Due'} {formatTimeAgo(item.dueDate)} • {formatDate(item.dueDate)}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={()=>{
          Alert.alert('Delete reminder?', item.message, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: ()=> deleteReminder(item.id) },
          ]);
        }} style={styles.delBtn} accessibilityLabel="Delete reminder" hitSlop={8}>
          <Text style={styles.delText}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS==='ios'?'padding':undefined} keyboardVerticalOffset={80}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ flex: 1 }}>
          <View style={styles.inputSection}>
            <Text style={styles.sectionTitle}>New Reminder</Text>
            <Input placeholder="Reminder... e.g. Check in, send birthday text" value={text} onChangeText={setText} maxLength={maxReminder} returnKeyType="done" accessibilityLabel="Reminder message" />
            <View style={styles.charRow}><Text style={[styles.charCount, textLen>maxReminder*0.8 && styles.charLong]}>{textLen}/{maxReminder}</Text></View>
            <Text style={styles.label}>Contact</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
              {contacts.slice(0,10).map(c=><TouchableOpacity key={c.id} style={[styles.chip, selectedContact===c.id && styles.chipActive]} onPress={()=>setSelectedContact(c.id)} activeOpacity={0.7} accessibilityRole="button" accessibilityState={{ selected: selectedContact===c.id }}><Text style={[styles.chipText, selectedContact===c.id && styles.chipTextActive]}>{c.name}</Text></TouchableOpacity>)}
              {contacts.length===0 && <Text style={styles.noContactsHint}>Add contacts first</Text>}
            </ScrollView>
            <Button title="Add Reminder" onPress={handleAdd} variant="primary" size="m" disabled={!text.trim() || !selectedContact} style={{marginTop: 8} as any} accessibilityLabel="Add reminder" />
          </View>
          <FlatList
            data={[...reminders].sort((a:any,b:any)=> (a.done===b.done ? a.dueDate.localeCompare(b.dueDate) : a.done ? 1 : -1))}
            keyExtractor={(i:any)=>i.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.text} />}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <EmptyState title="No reminders" description="Add a reminder with a contact to stay on top of relationships." icon="reminder" />
              </View>
            }
          />
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  inputSection: { padding: theme.spacing.l, gap: theme.spacing.s, backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border, ...theme.shadows.sm },
  sectionTitle: { ...theme.typography.label, color: theme.colors.text },
  label: { ...theme.typography.label, color: theme.colors.textSecondary, marginTop: 4 },
  charRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: -4 },
  charCount: { ...theme.typography.micro, color: theme.colors.textTertiary },
  charLong: { color: theme.colors.warning },
  chip: { backgroundColor: theme.colors.surface, paddingHorizontal: theme.spacing.m, paddingVertical: 6, borderRadius: theme.borderRadius.pill, borderWidth: 1, borderColor: theme.colors.border, ...theme.shadows.chip },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { ...theme.typography.caption, color: theme.colors.textSecondary },
  chipTextActive: { color: '#FFF', fontWeight: '600' as any },
  noContactsHint: { ...theme.typography.caption, color: theme.colors.textTertiary, fontStyle: 'italic' as any, paddingVertical: 6 },
  list: { padding: theme.spacing.l, gap: theme.spacing.s, flexGrow: 1 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, padding: theme.spacing.m, borderRadius: theme.borderRadius.l, borderWidth: 1, borderColor: theme.colors.border, gap: theme.spacing.s, ...theme.shadows.card },
  cardDone: { opacity: 0.5 },
  cardOverdue: { borderColor: theme.colors.danger+'60', borderWidth: 1.5 },
  checkBtn: { padding: 4 },
  checkBox: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: theme.colors.borderStrong, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.surface },
  checkBoxDone: { backgroundColor: theme.colors.success, borderColor: theme.colors.success },
  checkMark: { color: '#FFF', fontSize: 12, fontWeight: '800' as any },
  msg: { ...theme.typography.bodySmall, color: theme.colors.text, fontWeight: '500' as any },
  msgDone: { textDecorationLine: 'line-through', color: theme.colors.textTertiary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  contactName: { ...theme.typography.caption, color: theme.colors.textSecondary, fontWeight: '600' as any },
  dotSep: { color: theme.colors.textMuted, fontSize: 10 },
  dueDate: { ...theme.typography.micro, color: theme.colors.textTertiary },
  dueOverdue: { color: theme.colors.danger, fontWeight: '600' as any },
  delBtn: { padding: 6 },
  delText: { color: theme.colors.textTertiary, fontSize: 14, fontWeight: '600' as any },
  emptyWrap: { paddingTop: 40 },
});
