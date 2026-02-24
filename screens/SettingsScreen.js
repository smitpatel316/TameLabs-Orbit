// Settings Screen - Export/Import and App Info
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, Share } from 'react-native';
import { useOrbitStore } from '../stores/orbitStore';

export default function SettingsScreen() {
  const contacts = useOrbitStore((state) => state.contacts);
  const interactions = useOrbitStore((state) => state.interactions);
  const tags = useOrbitStore((state) => state.tags);

  const exportData = async () => {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      contacts,
      interactions,
      tags,
    };
    
    try {
      await Share.share({
        message: JSON.stringify(data, null, 2),
        title: 'Orbit Data Export',
      });
    } catch (error) {
      Alert.alert('Export Failed', error.message);
    }
  };

  const clearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all contacts and interactions. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete All', 
          style: 'destructive',
          onPress: () => {
            // This would need to be implemented in the store
            Alert.alert('Not Implemented', 'Clear data feature needs store implementation');
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📤 Export Data</Text>
        <TouchableOpacity style={styles.button} onPress={exportData}>
          <Text style={styles.buttonText}>Export Contacts & Interactions</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>Share your data as JSON</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Statistics</Text>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Total Contacts</Text>
          <Text style={styles.statValue}>{contacts.length}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Total Interactions</Text>
          <Text style={styles.statValue}>{interactions.length}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Tags</Text>
          <Text style={styles.statValue}>{tags.length}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🗑️ Data Management</Text>
        <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={clearAllData}>
          <Text style={styles.dangerButtonText}>Clear All Data</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ℹ️ About</Text>
        <Text style={styles.aboutText}>Orbit - Relationship Manager</Text>
        <Text style={styles.versionText}>Version 1.0.0</Text>
        <Text style={styles.hint}>Map your relationships. Prune the noise.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#16213e', padding: 16 },
  section: { marginBottom: 32 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  button: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16 },
  dangerButton: { backgroundColor: '#742a2a' },
  dangerButtonText: { color: '#fc8181', fontSize: 16 },
  hint: { color: '#718096', fontSize: 12, marginTop: 8, textAlign: 'center' },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2D3748' },
  statLabel: { color: '#A0AEC0' },
  statValue: { color: '#fff', fontWeight: 'bold' },
  aboutText: { color: '#fff', fontSize: 16, textAlign: 'center' },
  versionText: { color: '#718096', fontSize: 14, textAlign: 'center', marginTop: 4 },
});
