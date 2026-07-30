import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../theme';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: { title: string; onPress: () => void };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, action }) => (
  <View style={styles.container}>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.description}>{description}</Text>
    {action && (
      <TouchableOpacity style={styles.actionButton} onPress={action.onPress}>
        <Text style={styles.actionText}>{action.title}</Text>
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, textAlign: 'center' },
  title: { color: theme.colors.text, fontSize: 20, fontWeight: '600', marginBottom: 8 },
  description: { color: theme.colors.textSecondary, fontSize: 16, textAlign: 'center', marginBottom: 24 },
  actionButton: { backgroundColor: theme.colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  actionText: { color: theme.colors.text, fontWeight: '600' },
});
