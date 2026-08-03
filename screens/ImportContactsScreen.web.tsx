import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, ScrollView, RefreshControl, TouchableWithoutFeedback, Keyboard,  } from 'react-native';
import { useOrbitStore } from '../stores/orbitStore';
import { theme } from '../src/theme';
import { Button } from '../src/components/Button';
import { EmptyState } from '../src/components/EmptyState';
import {
  requestContactsPermission,
  fetchSystemContacts,
  buildImportCandidates,
  filterCandidates,
  ImportCandidate,
  SystemContact,
} from '../src/services/contactsImport';
import { logger } from '../src/utils/logger';

export default function ImportContactsScreen({ navigation }: any) {
  const contacts = useOrbitStore((s) => s.contacts);
  const bulkImportContacts = useOrbitStore((s) => s.bulkImportContacts);

  const [permStatus, setPermStatus] = useState<string>('checking');
  const [candidates, setCandidates] = useState<ImportCandidate[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [importing, setImporting] = useState(false);

  const existingNames = useMemo(() => contacts.map((c: any) => c.name), [contacts]);

  const loadCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const perm = await requestContactsPermission();
      setPermStatus(perm.status);
      if (!perm.granted) {
        setCandidates([]);
        setLoading(false);
        return;
      }
      const system = await fetchSystemContacts();
      const cands = buildImportCandidates(system, existingNames);
      setCandidates(cands);
      // auto-select all new (not duplicates)
      const newIds = new Set(cands.filter((c) => !c.alreadyExists).map((c) => c.id));
      setSelectedIds(newIds);
      logger.info('ImportContacts', `loaded ${system.length} system, ${cands.length} candidates`);
    } catch (e: any) {
      logger.error('ImportContacts', 'load failed', e);
    } finally {
      setLoading(false);
    }
  }, [existingNames]);

  useEffect(() => {
    loadCandidates();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCandidates();
    setRefreshing(false);
  }, [loadCandidates]);

  const filtered = useMemo(() => filterCandidates(candidates, search), [candidates, search]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    const newOnes = filtered.filter((c) => !c.alreadyExists);
    const allSelected = newOnes.every((c) => selectedIds.has(c.id));
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        newOnes.forEach((c) => next.delete(c.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        newOnes.forEach((c) => next.add(c.id));
        return next;
      });
    }
  };

  const handleImport = async () => {
    const toImport = filtered.filter((c) => selectedIds.has(c.id) && !c.alreadyExists);
    if (!toImport.length) {
      Alert.alert('Nothing selected', 'Select at least one new contact to import.');
      return;
    }
    setImporting(true);
    await new Promise((r) => setTimeout(r, 200));
    try {
      const payload = toImport.map((c) => ({
        name: c.name,
        birthday: c.birthday,
        notes: [c.note, c.emails?.length ? `Emails: ${c.emails.join(', ')}` : '', c.phoneNumbers?.length ? `Phones: ${c.phoneNumbers.join(', ')}` : '']
          .filter(Boolean)
          .join('\n')
          .slice(0, 500),
        tags: [] as string[],
      }));
      const result = bulkImportContacts(payload);
      logger.info('ImportContacts', `imported ${result.imported} skipped ${result.skipped}`);
      Alert.alert('Imported', `${result.imported} contacts imported${result.skipped ? `, ${result.skipped} skipped (duplicates)` : ''}`, [
        { text: 'View contacts', onPress: () => navigation.navigate('ContactsList') },
        { text: 'Stay here', style: 'cancel', onPress: () => {
          // reload candidates so newly imported become dup
          loadCandidates();
        }},
      ]);
    } catch (e: any) {
      logger.error('ImportContacts', 'import failed', e);
      Alert.alert('Import failed', e?.message || 'Unknown error');
    } finally {
      setImporting(false);
    }
  };

  const newCount = candidates.filter((c) => !c.alreadyExists).length;
  const selectedNewCount = filtered.filter((c) => selectedIds.has(c.id) && !c.alreadyExists).length;
  const dupCount = candidates.filter((c) => c.alreadyExists).length;

  const renderItem = ({ item }: { item: ImportCandidate }) => {
    const isSelected = selectedIds.has(item.id);
    const isDup = item.alreadyExists;
    return (
      <TouchableOpacity
        style={[styles.row, isDup && styles.rowDup, isSelected && !isDup && styles.rowSelected]}
        onPress={() => !isDup && toggleSelect(item.id)}
        activeOpacity={isDup ? 1 : 0.7}
        disabled={isDup}
        accessibilityRole="button"
        accessibilityLabel={`${item.name}${isDup ? ' duplicate' : ''}`}
        accessibilityState={{ selected: isSelected, disabled: isDup }}
      >
        <View style={[styles.check, isSelected && !isDup && styles.checkActive, isDup && styles.checkDup]}>
          {isSelected && !isDup ? <Text style={styles.checkMark}>✓</Text> : null}
          {isDup ? <Text style={styles.checkDupText}>—</Text> : null}
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(item.name[0] || '?').toUpperCase()}</Text>
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, isDup && styles.nameDup]} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.metaLine}>
            {item.birthday ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>BD {item.birthday}</Text>
              </View>
            ) : null}
            {item.emails?.[0] ? (
              <Text style={styles.meta} numberOfLines={1}>
                {item.emails[0]}
              </Text>
            ) : item.phoneNumbers?.[0] ? (
              <Text style={styles.meta}>{item.phoneNumbers[0]}</Text>
            ) : null}
          </View>
          {isDup ? <Text style={styles.dupHint}>Already in Orbit as {item.duplicateOf}</Text> : null}
        </View>
      </TouchableOpacity>
    );
  };

  // Permission denied / unavailable UI
  if (permStatus !== 'granted' && permStatus !== 'web-mock' && !loading) {
    const isUnavailable = permStatus === 'unavailable';
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.permContainer} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          <View style={styles.permCard}>
            <Text style={styles.permTitle}>{isUnavailable ? 'Install expo-contacts' : 'Contacts permission needed'}</Text>
            <Text style={styles.permBody}>
              {isUnavailable
                ? 'expo-contacts package not installed. Run: npx expo install expo-contacts. On web, mock demo contacts are available after you allow.'
                : `Status: ${permStatus}. Orbit needs access to your phone contacts to import. Your contacts never leave your device — local-first.`}
            </Text>
            <View style={{ height: 12 }} />
            <Button title="Request permission" onPress={loadCandidates} accessibilityLabel="Request contacts permission" />
            <View style={{ height: 8 }} />
            <Button title="Go back" variant="ghost" onPress={() => navigation.goBack()} />
            <View style={{ height: 16 }} />
            <Text style={styles.hint}>
              Privacy: Import runs entirely on-device. Orbit does not upload your address book. Duplicates are detected by name normalization. Birthdays (MM/DD) are imported if present.
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.search}
              placeholder="Search phone contacts..."
              placeholderTextColor={theme.colors.textTertiary}
              value={search}
              onChangeText={setSearch}
              clearButtonMode="while-editing"
              returnKeyType="search"
              accessibilityLabel="Search system contacts"
            />
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statChip}>
              <Text style={styles.statLabel}>NEW</Text>
              <Text style={styles.statValue}>{newCount}</Text>
            </View>
            <View style={styles.statChip}>
              <Text style={styles.statLabel}>DUP</Text>
              <Text style={styles.statValue}>{dupCount}</Text>
            </View>
            <View style={styles.statChipActive}>
              <Text style={styles.statLabelActive}>SELECTED</Text>
              <Text style={styles.statValueActive}>{selectedNewCount}</Text>
            </View>
            <TouchableOpacity style={styles.linkBtn} onPress={toggleAll} activeOpacity={0.7}>
              <Text style={styles.linkText}>{filtered.filter((c) => !c.alreadyExists && selectedIds.has(c.id)).length === filtered.filter((c) => !c.alreadyExists).length ? 'Deselect all' : 'Select all new'}</Text>
            </TouchableOpacity>
          </View>
          {permStatus === 'web-mock' ? (
            <View style={styles.webBanner}>
              <Text style={styles.webBannerText}>Web demo mode — showing 10 mock contacts for UI testing. Install mobile build for real device contacts + birthday calendar sync.</Text>
            </View>
          ) : null}
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing || loading} onRefresh={onRefresh} />}
          ListEmptyComponent={
            loading ? (
              <View style={styles.loadingBox}>
                <Text style={styles.loadingText}>Loading phone contacts...</Text>
              </View>
            ) : (
              <EmptyState
                icon="contacts"
                title={search ? 'No matches' : 'No contacts found'}
                description={search ? `No phone contacts match "${search}"` : 'Your phone has no contacts, or permission was denied.'}
                action={search ? { label: 'Clear search', onPress: () => setSearch('') } : { label: 'Reload', onPress: () => loadCandidates() }}
              />
            )
          }
        />

        <View style={styles.footer}>
          <Button
            title={importing ? 'Importing...' : `Import ${selectedNewCount} ${selectedNewCount === 1 ? 'contact' : 'contacts'}`}
            onPress={handleImport}
            loading={importing}
            disabled={selectedNewCount === 0}
            accessibilityLabel="Import selected contacts"
          />
          <Text style={styles.footerHint}>Duplicates detected by normalized name — accents trimmed, case-insensitive. Birthdays brought over as MM/DD for upcoming birthdays view.</Text>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { paddingHorizontal: theme.spacing.l, paddingTop: theme.spacing.s, gap: theme.spacing.s },
  searchRow: { marginTop: 2 },
  search: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    fontSize: 15,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.s, flexWrap: 'wrap', paddingBottom: 4 },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.surfaceHover,
    paddingHorizontal: theme.spacing.s,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statChipActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.text,
    paddingHorizontal: theme.spacing.s,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.pill,
  },
  statLabel: { ...theme.typography.labelSmall, color: theme.colors.textTertiary },
  statValue: { ...theme.typography.caption, color: theme.colors.text, fontWeight: '700' as any },
  statLabelActive: { ...theme.typography.labelSmall, color: theme.colors.textMuted },
  statValueActive: { ...theme.typography.caption, color: theme.colors.onPrimary, fontWeight: '700' as any },
  linkBtn: { marginLeft: 'auto', paddingVertical: 4 },
  linkText: { ...theme.typography.caption, color: theme.colors.textSecondary, textDecorationLine: 'underline' as any },
  webBanner: { backgroundColor: theme.colors.warningBg, borderWidth: 1, borderColor: theme.colors.warningBorder, borderRadius: theme.borderRadius.m, padding: theme.spacing.s },
  webBannerText: { ...theme.typography.caption, color: theme.colors.warningText, lineHeight: 16 },

  permContainer: { flexGrow: 1, padding: theme.spacing.l, justifyContent: 'center' },
  permCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.l,
    ...theme.shadows.card,
    gap: 4,
  },
  permTitle: { ...theme.typography.h2, color: theme.colors.text },
  permBody: { ...theme.typography.bodySmall, color: theme.colors.textSecondary, lineHeight: 20, marginTop: 4 },
  hint: { ...theme.typography.micro, color: theme.colors.textTertiary, fontStyle: 'italic' as any, lineHeight: 14 },

  list: { padding: theme.spacing.m, paddingBottom: 120, gap: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 6,
    gap: theme.spacing.s,
    ...theme.shadows.sm,
  },
  rowDup: { opacity: 0.55, backgroundColor: theme.colors.surfaceMuted },
  rowSelected: { borderColor: theme.colors.text, borderWidth: 1.5, backgroundColor: theme.colors.surfaceHover },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: theme.colors.borderStrong,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  checkActive: { backgroundColor: theme.colors.text, borderColor: theme.colors.text },
  checkDup: { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceMuted },
  checkMark: { color: theme.colors.onPrimary, fontSize: 12, fontWeight: '800' as any },
  checkDupText: { color: theme.colors.textTertiary, fontSize: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.surfaceHover, borderWidth: 1, borderColor: theme.colors.border, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: theme.colors.textSecondary, fontSize: 14, fontWeight: '700' as any },
  info: { flex: 1, gap: 2 },
  name: { ...theme.typography.bodySmall, color: theme.colors.text, fontWeight: '600' as any },
  nameDup: { color: theme.colors.textTertiary },
  metaLine: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  meta: { ...theme.typography.micro, color: theme.colors.textSecondary },
  badge: { backgroundColor: theme.colors.surfaceHover, paddingHorizontal: 6, paddingVertical: 2, borderRadius: theme.borderRadius.pill, borderWidth: 1, borderColor: theme.colors.border },
  badgeText: { ...theme.typography.micro, color: theme.colors.textSecondary, fontSize: 10, fontWeight: '600' as any },
  dupHint: { ...theme.typography.micro, color: theme.colors.textTertiary, fontStyle: 'italic' as any },

  loadingBox: { paddingVertical: 80, alignItems: 'center' },
  loadingText: { ...theme.typography.bodySmall, color: theme.colors.textTertiary },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    padding: theme.spacing.l,
    paddingBottom: 24,
    gap: theme.spacing.s,
    ...theme.shadows.modal,
  },
  footerHint: { ...theme.typography.micro, color: theme.colors.textTertiary, lineHeight: 13 },
});
