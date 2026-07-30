
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../theme';

export const ErrorView: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <View style={styles.container}>
    <Text style={styles.title}>Something went wrong</Text>
    <Text style={styles.message}>{message}</Text>
    <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
      <Text style={styles.retryText}>Try Again</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: theme.colors.background },
  title: { color: theme.colors.text, fontSize: 20, fontWeight: '600' as any, marginBottom: 8 },
  message: { color: theme.colors.textSecondary, fontSize: 16, textAlign: 'center', marginBottom: 24 },
  retryButton: { backgroundColor: theme.colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  retryText: { color: '#FFF', fontWeight: '600' as any },
});
