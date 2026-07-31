import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, RefreshControl } from 'react-native';
import { useOrbitStore } from '../stores/orbitStore';
import { theme, formatTimeAgo, formatDate } from '../src/theme';
import { Input } from '../src/components/Input';
import { Button } from '../src/components/Button';
import { EmptyState } from '../src/components/EmptyState';
import { logger } from '../src/utils/logger';

type DuePreset = { label: string; days: number; emoji: string };
const DUE_PRESETS: DuePreset[] = [
  { label: 'Later today', days: 0, emoji: 'T' },
  { label: 'Tomorrow', days: 1, emoji: 'T+' },
  { label: 'In 3 days', days: 3, emoji: '3d' },
  { label: 'In 7 days', days: 7, emoji: '7d' },
];

export default function RemindersScreen() {
  const contacts = useOrbitStore(s => s.contacts);
  const reminders = useOrbitStore(s => s.reminders);
  const addReminder = useOrbitStore(s => s.addReminder);
  const updateReminder = useOrbitStore(s => (s as any).updateReminder);
  const toggleReminder = useOrbitStore(s => s.toggleReminder);
  const deleteReminder = useOrbitStore(s => s.deleteReminder);
  const snoozeReminder = useOrbitStore(s => (s as any).snoozeReminder);
  const getReminderGroups = useOrbitStore(s => (s as any).getReminderGroups);

  const [text, setText] = useState('');
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [dueDays, setDueDays] = useState(3);
  const [contactSearch, setContactSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showDone, setShowDone] = useState(false);

  const onRefresh = useCallback(()=>{
    setRefreshing(true);
    logger.info('Reminders','pull to refresh',{ count: reminders.length });
    setTimeout(()=> setRefreshing(false), 600);
  }, [reminders.length]);

  const groups: { overdue: any[]; today: any[]; upcoming: any[]; done: any[] } = useMemo(()=>{
    if (typeof getReminderGroups === 'function') return getReminderGroups();
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
    const tomorrowStart = new Date(todayStart); tomorrowStart.setDate(tomorrowStart.getDate()+1);
    const overdue: any[]=[]; const today: any[]=[]; const upcoming: any[]=[]; const done: any[]=[];
    for (const r of reminders) {
      if (r.done) { done.push(r); continue; }
      const d = new Date(r.dueDate).getTime();
      if (d < todayStart.getTime()) overdue.push(r);
      else if (d < tomorrowStart.getTime()) today.push(r);
      else upcoming.push(r);
    }
    const sf = (a:any,b:any)=> new Date(a.dueDate).getTime()-new Date(b.dueDate).getTime();
    return { overdue: overdue.sort(sf), today: today.sort(sf), upcoming: upcoming.sort(sf), done: done.sort(sf) };
  }, [reminders, getReminderGroups]);

  const maxReminder = 200;
  const textLen = text.length;

  const filteredContacts = useMemo(()=>{
    const q = contactSearch.trim().toLowerCase();
    const list = q ? contacts.filter(c=> c.name.toLowerCase().includes(q)) : contacts;
    return list.slice(0, 20);
  }, [contacts, contactSearch]);

  const handleAdd = () => {
    if (!text.trim() || !selectedContact) { Alert.alert('Required','Enter message and pick contact'); return; }
    if (text.trim().length>maxReminder) { Alert.alert('Too long', `Max ${maxReminder} chars`); return; }
    const dueDate = new Date(Date.now()+86400000*dueDays).toISOString();
    addReminder({ contactId: selectedContact, message: text.trim(), dueDate });
    logger.info('Reminders','added',{ contactId: selectedContact, dueDays });
    setText('');
  };

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setEditingText(item.message);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const t = editingText.trim();
    if (!t) { Alert.alert('Empty','Message cannot be empty'); return; }
    if (t.length>maxReminder) { Alert.alert('Too long', `Max ${maxReminder} chars`); return; }
    if (typeof updateReminder === 'function') updateReminder(editingId, { message: t });
    setEditingId(null); setEditingText('');
    logger.info('Reminders','edited',{ id: editingId });
  };

  const renderItem = (item: any) => {
    const contact = contacts.find(c => c.id === item.contactId);
    const isOverdue = !item.done && new Date(item.dueDate).getTime() < Date.now() - 3600000;
    const isEditing = editingId === item.id;

    if (isEditing) {
      return (
        <View style={[styles.card, styles.cardEditing]}>
          <View style={{ flex: 1, gap: 8 }}>
            <Input value={editingText} onChangeText={setEditingText} maxLength={maxReminder} multiline autoFocus placeholder="Reminder message" accessibilityLabel="Edit reminder" />
            <View style={styles.charRow}><Text style={[styles.charCount, editingText.length>maxReminder*0.8 && styles.charLong]}>{editingText.length}/{maxReminder}</Text></View>
            <View style={styles.editActions}>
              <Button title="Save" onPress={saveEdit} variant="primary" size="s" disabled={!editingText.trim()} style={{ flex: 1 } as any} accessibilityLabel="Save reminder edit" />
              <Button title="Cancel" onPress={()=>{setEditingId(null); setEditingText('');}} variant="ghost" size="s" style={{ flex: 1 } as any} accessibilityLabel="Cancel edit" />
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.card, item.done && styles.cardDone, isOverdue && styles.cardOverdue]} accessibilityLabel={`Reminder for ${contact?.name || 'contact'}`}>
        <TouchableOpacity onPress={()=>toggleReminder(item.id)} style={styles.checkBtn} accessibilityRole="checkbox" accessibilityState={{ checked: item.done }} accessibilityLabel={item.done ? 'Mark incomplete' : 'Mark done'}>
          <View style={[styles.checkBox, item.done && styles.checkBoxDone, isOverdue && !item.done && styles.checkBoxOverdue]}>
            {item.done ? <Text style={styles.checkMark}>✓</Text> : isOverdue ? <Text style={styles.checkMarkOverdue}>!</Text> : null}
          </View>
        </TouchableOpacity>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[styles.msg, item.done && styles.msgDone]} numberOfLines={2}>{item.message}</Text>
          <View style={styles.metaRow}>
            <View style={styles.contactPill}><Text style={styles.contactPillText}>{contact?.name || 'Unknown'}</Text></View>
            <Text style={styles.dotSep}>•</Text>
            <View style={[styles.duePill, isOverdue && styles.duePillOverdue]}>
              <Text style={[styles.dueText, isOverdue && styles.dueTextOverdue]}>{isOverdue ? 'Overdue' : formatTimeAgo(item.dueDate)} - {formatDate(item.dueDate)}</Text>
            </View>
          </View>
          {!item.done && (
            <View style={styles.actionRow}>
              <TouchableOpacity onPress={()=> startEdit(item)} style={styles.actionBtn} hitSlop={8} accessibilityLabel="Edit reminder"><Text style={styles.actionBtnText}>Edit</Text></TouchableOpacity>
              <TouchableOpacity onPress={()=>{ if (typeof snoozeReminder==='function') { snoozeReminder(item.id, 1); logger.info('Reminders','snoozed 1d',{id:item.id}); } }} style={styles.actionBtn} hitSlop={8} accessibilityLabel="Snooze 1 day"><Text style={styles.actionBtnText}>Tomorrow</Text></TouchableOpacity>
              <TouchableOpacity onPress={()=>{ if (typeof snoozeReminder==='function') { snoozeReminder(item.id, 7); logger.info('Reminders','snoozed 7d',{id:item.id}); } }} style={styles.actionBtn} hitSlop={8} accessibilityLabel="Snooze 7 days"><Text style={styles.actionBtnText}>+7d</Text></TouchableOpacity>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={()=>{
          Alert.alert('Delete reminder?', item.message.slice(0,80), [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: ()=> deleteReminder(item.id) },
          ]);
        }} style={styles.delBtn} accessibilityLabel="Delete reminder" hitSlop={8}>
          <Text style={styles.delText}>X</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const Section = (props: { title: string; data: any[]; color?: string; hint?: string; defaultOpen?: boolean }) => {
    const [open, setOpen] = useState(props.defaultOpen ?? true);
    if (!props.data.length) return null;
    return (
      <View style={styles.sectionBlock}>
        <TouchableOpacity onPress={()=>setOpen(!open)} style={styles.sectionHeader} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={`Toggle ${props.title}`}>
          <View style={[styles.sectionDot, props.color ? { backgroundColor: props.color } as any : null]} />
          <Text style={styles.sectionTitle}>{props.title}</Text>
          <View style={styles.countBadge}><Text style={styles.countBadgeText}>{props.data.length}</Text></View>
          <Text style={styles.sectionToggle}>{open ? '-' : '+'}</Text>
        </TouchableOpacity>
        {props.hint && open && <Text style={styles.sectionHint}>{props.hint}</Text>}
        {open && props.data.map((it:any)=><View key={it.id} style={styles.sectionItemWrap}>{renderItem(it)}</View>)}
      </View>
    );
  };

  const allActive = groups.overdue.length + groups.today.length + groups.upcoming.length;

  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
          <View style={styles.inputSection}>
            <Text style={styles.addTitle}>New Reminder</Text>
            <Input placeholder="e.g. Check in, birthday text, call about project" value={text} onChangeText={setText} maxLength={maxReminder} returnKeyType="done" accessibilityLabel="Reminder message" />
            <View style={styles.charRow}>
              <Text style={[styles.charCount, textLen>maxReminder*0.8 && styles.charLong, textLen===0 && styles.charMuted] as any}>{textLen===0 ? maxReminder + ' chars max' : textLen + '/' + maxReminder}</Text>
              <Text style={styles.charMeta}>{dueDays===0 ? 'Due today' : dueDays===1 ? 'Due tomorrow' : 'Due in ' + dueDays + 'd'}</Text>
            </View>

            <Text style={styles.label}>When?</Text>
            <View style={styles.dueRow}>
              {DUE_PRESETS.map(p=>(
                <TouchableOpacity key={p.label} onPress={()=>setDueDays(p.days)} style={[styles.dueChip, dueDays===p.days && styles.dueChipActive]} activeOpacity={0.7} accessibilityRole="button" accessibilityState={{ selected: dueDays===p.days }}>
                  <Text style={[styles.dueChipText, dueDays===p.days && styles.dueChipTextActive]}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Contact</Text>
            <Input placeholder="Search contacts..." value={contactSearch} onChangeText={setContactSearch} maxLength={40} returnKeyType="search" clearButtonMode="while-editing" accessibilityLabel="Search contacts" containerStyle={{ marginBottom: 6 } as any} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
              {filteredContacts.map(c=>(
                <TouchableOpacity key={c.id} style={[styles.contactChip, selectedContact===c.id && styles.contactChipActive]} onPress={()=>setSelectedContact(c.id)} activeOpacity={0.7} accessibilityRole="button" accessibilityState={{ selected: selectedContact===c.id }} accessibilityLabel={`Select ${c.name}`}>
                  <View style={[styles.contactAvatar, selectedContact===c.id && styles.contactAvatarActive]}><Text style={[styles.contactAvatarText, selectedContact===c.id && styles.contactAvatarTextActive]}>{c.name.charAt(0).toUpperCase()}</Text></View>
                  <Text style={[styles.contactChipText, selectedContact===c.id && styles.contactChipTextActive]} numberOfLines={1}>{c.name}</Text>
                </TouchableOpacity>
              ))}
              {filteredContacts.length===0 && <Text style={styles.noContactsHint}>{contactSearch ? 'No matches for "' + contactSearch + '"' : 'Add contacts first to set reminders'}</Text>}
            </ScrollView>

            <View style={styles.addFooter}>
              <Button title={'Add - Due ' + (dueDays===0?'today':dueDays===1?'tomorrow':'in '+dueDays+'d')} onPress={handleAdd} variant="primary" size="m" disabled={!text.trim() || !selectedContact} style={{ flex: 1 } as any} accessibilityLabel="Add reminder" />
              <Button title="Clear" onPress={()=>{setText(''); setSelectedContact(null); setContactSearch(''); setDueDays(3);}} variant="ghost" size="s" accessibilityLabel="Clear form" />
            </View>

            {contacts.length>0 && <Text style={styles.formHint}>Groups: overdue / today / upcoming. Edit inline, snooze 1d or 7d. Overdue shows red badge. Search contacts to filter quickly.</Text>}
          </View>

          <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.text} />} showsVerticalScrollIndicator={false}>
            {groups.overdue.length===0 && groups.today.length===0 && groups.upcoming.length===0 && groups.done.length===0 ? (
              <View style={styles.emptyWrap}>
                <EmptyState title="No reminders yet" description="Add a reminder for a contact with a due date. Grouped by overdue / today / upcoming to stay on top of relationships." icon="reminder" />
              </View>
            ) : (
              <>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryPill}><Text style={styles.summaryPillText}>{allActive} active</Text></View>
                  {groups.overdue.length>0 && <View style={[styles.summaryPill, styles.summaryPillDanger]}><Text style={[styles.summaryPillText, styles.summaryPillTextDanger]}>{groups.overdue.length} overdue</Text></View>}
                  <View style={styles.summaryPill}><Text style={styles.summaryPillText}>{groups.done.length} done</Text></View>
                  <TouchableOpacity onPress={()=>setShowDone(!showDone)} style={styles.showDoneToggle} hitSlop={8} accessibilityRole="button">
                    <Text style={styles.showDoneText}>{showDone ? 'Hide done' : 'Show done'}</Text>
                  </TouchableOpacity>
                </View>

                <Section title="Overdue" data={groups.overdue} color={theme.colors.danger} hint="Past due - reach out or snooze" />
                <Section title="Today" data={groups.today} color={theme.colors.warning} hint="Due today" />
                <Section title="Upcoming" data={groups.upcoming} color={theme.colors.success} hint="Future reminders sorted by due date" />
                {showDone && <Section title="Done" data={groups.done} color={theme.colors.textTertiary} hint={groups.done.length + ' completed - tap checkbox to reopen'} defaultOpen={false} />}
              </>
            )}
            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  inputSection: { padding: theme.spacing.l, gap: theme.spacing.s, backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border, ...theme.shadows.sm },
  addTitle: { ...theme.typography.label, color: theme.colors.text },
  label: { ...theme.typography.label, color: theme.colors.textSecondary, marginTop: 4 },
  charRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -2, alignItems: 'center' },
  charCount: { ...theme.typography.micro, color: theme.colors.textTertiary },
  charMuted: { color: theme.colors.textMuted },
  charLong: { color: theme.colors.warning, fontWeight: '600' as any },
  charMeta: { ...theme.typography.micro, color: theme.colors.textSecondary, fontWeight: '600' as any },
  dueRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dueChip: { backgroundColor: theme.colors.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: theme.borderRadius.pill, borderWidth: 1, borderColor: theme.colors.border, ...theme.shadows.chip },
  dueChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  dueChipText: { ...theme.typography.caption, color: theme.colors.textSecondary, fontWeight: '500' as any },
  dueChipTextActive: { color: theme.colors.onPrimary, fontWeight: '600' as any },
  contactChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.colors.surface, paddingHorizontal: 10, paddingVertical: 6, borderRadius: theme.borderRadius.pill, borderWidth: 1, borderColor: theme.colors.border, maxWidth: 160, ...theme.shadows.chip },
  contactChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  contactAvatar: { width: 20, height: 20, borderRadius: 10, backgroundColor: theme.colors.surfaceMuted, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  contactAvatarActive: { backgroundColor: theme.colors.onPrimary, borderColor: theme.colors.onPrimary },
  contactAvatarText: { fontSize: 10, fontWeight: '700' as any, color: theme.colors.textSecondary },
  contactAvatarTextActive: { color: theme.colors.primary },
  contactChipText: { ...theme.typography.caption, color: theme.colors.textSecondary, fontWeight: '500' as any },
  contactChipTextActive: { color: theme.colors.onPrimary, fontWeight: '600' as any },
  noContactsHint: { ...theme.typography.caption, color: theme.colors.textTertiary, fontStyle: 'italic' as any, paddingVertical: 6 },
  addFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  formHint: { ...theme.typography.micro, color: theme.colors.textTertiary, fontStyle: 'italic' as any, marginTop: 6, lineHeight: 14 },
  list: { padding: theme.spacing.l, gap: theme.spacing.s, flexGrow: 1, paddingBottom: 24 },
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 4 },
  summaryPill: { backgroundColor: theme.colors.surface, paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.borderRadius.pill, borderWidth: 1, borderColor: theme.colors.border, ...theme.shadows.chip },
  summaryPillDanger: { backgroundColor: theme.colors.danger+'14', borderColor: theme.colors.danger+'30' },
  summaryPillText: { ...theme.typography.micro, color: theme.colors.textSecondary, fontWeight: '600' as any },
  summaryPillTextDanger: { color: theme.colors.danger },
  showDoneToggle: { marginLeft: 'auto', paddingHorizontal: 8, paddingVertical: 4 },
  showDoneText: { ...theme.typography.micro, color: theme.colors.textTertiary, fontWeight: '600' as any, textDecorationLine: 'underline' as any },
  sectionBlock: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.l, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.m, gap: theme.spacing.s, ...theme.shadows.card },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.textTertiary },
  sectionTitle: { ...theme.typography.label, color: theme.colors.text, flex: 1 },
  countBadge: { backgroundColor: theme.colors.surfaceMuted, paddingHorizontal: 8, paddingVertical: 2, borderRadius: theme.borderRadius.pill, borderWidth: 1, borderColor: theme.colors.borderLight, minWidth: 22, alignItems: 'center' },
  countBadgeText: { ...theme.typography.micro, color: theme.colors.textSecondary, fontWeight: '700' as any },
  sectionToggle: { ...theme.typography.body, color: theme.colors.textTertiary, fontWeight: '600' as any, minWidth: 16, textAlign: 'center' },
  sectionHint: { ...theme.typography.micro, color: theme.colors.textTertiary, fontStyle: 'italic' as any },
  sectionItemWrap: { marginTop: 2 },
  card: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: theme.colors.surface, padding: theme.spacing.m, borderRadius: theme.borderRadius.l, borderWidth: 1, borderColor: theme.colors.border, gap: theme.spacing.s, ...theme.shadows.card },
  cardEditing: { borderColor: theme.colors.text, borderWidth: 1.5, backgroundColor: theme.colors.surface, ...theme.shadows.md },
  cardDone: { opacity: 0.5 },
  cardOverdue: { borderColor: theme.colors.danger+'60', borderWidth: 1.5, backgroundColor: theme.colors.danger+'06' },
  checkBtn: { padding: 4, paddingTop: 2 },
  checkBox: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: theme.colors.borderStrong, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.surface },
  checkBoxDone: { backgroundColor: theme.colors.success, borderColor: theme.colors.success },
  checkBoxOverdue: { borderColor: theme.colors.danger, backgroundColor: theme.colors.danger+'14' },
  checkMark: { color: '#FFF', fontSize: 12, fontWeight: '800' as any },
  checkMarkOverdue: { color: theme.colors.danger, fontSize: 12, fontWeight: '800' as any },
  msg: { ...theme.typography.bodySmall, color: theme.colors.text, fontWeight: '500' as any },
  msgDone: { textDecorationLine: 'line-through', color: theme.colors.textTertiary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  contactPill: { backgroundColor: theme.colors.surfaceMuted, paddingHorizontal: 8, paddingVertical: 2, borderRadius: theme.borderRadius.pill, borderWidth: 1, borderColor: theme.colors.borderLight },
  contactPillText: { ...theme.typography.micro, color: theme.colors.textSecondary, fontWeight: '600' as any },
  dotSep: { color: theme.colors.textMuted, fontSize: 10 },
  duePill: { backgroundColor: theme.colors.surfaceMuted, paddingHorizontal: 8, paddingVertical: 2, borderRadius: theme.borderRadius.pill, borderWidth: 1, borderColor: theme.colors.borderLight },
  duePillOverdue: { backgroundColor: theme.colors.danger+'14', borderColor: theme.colors.danger+'30' },
  dueText: { ...theme.typography.micro, color: theme.colors.textTertiary },
  dueTextOverdue: { color: theme.colors.danger, fontWeight: '600' as any },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 2 },
  actionBtn: { paddingVertical: 2 },
  actionBtnText: { ...theme.typography.micro, color: theme.colors.textTertiary, fontWeight: '600' as any, textDecorationLine: 'underline' as any },
  editActions: { flexDirection: 'row', gap: 8 },
  delBtn: { padding: 6, paddingTop: 2 },
  delText: { color: theme.colors.textTertiary, fontSize: 14, fontWeight: '600' as any },
  emptyWrap: { paddingTop: 40 },
});
