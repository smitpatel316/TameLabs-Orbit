import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../theme';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: string;
  action?: { label: string; onPress: () => void };
  compact?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, icon, action, compact }) => (
  <View style={[styles.container, compact && styles.compact]} accessibilityRole="text">
    {icon ? <Text style={styles.icon}>{iconLabel(icon)}</Text> : null}
    <Text style={styles.title}>{title}</Text>
    {description ? <Text style={styles.description}>{description}</Text> : null}
    {action ? (
      <TouchableOpacity style={styles.actionButton} onPress={action.onPress} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={action.label}>
        <Text style={styles.actionText}>{action.label}</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

function iconLabel(i: string): string {
  switch(i) {
    case 'search': return 'Search';
    case 'contacts': return 'People';
    case 'map': return 'Map';
    case 'reminder': return 'Bell';
    case 'chart': return 'Chart';
    case 'timeline': return 'Timeline';
    case 'heart': return 'Heart';
    default: return i;
  }
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center', alignItems: 'center', padding: theme.spacing.xl, gap: theme.spacing.s, paddingVertical: 64 },
  compact: { paddingVertical: 24 },
  icon: { fontSize: 32, marginBottom: 4, color: theme.colors.textTertiary },
  title: { ...theme.typography.h3, color: theme.colors.text, textAlign: 'center' },
  description: { ...theme.typography.bodySmall, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 20, maxWidth: 300 },
  actionButton: { marginTop: theme.spacing.m, backgroundColor: theme.colors.primary, paddingHorizontal: theme.spacing.l, paddingVertical: theme.spacing.s, borderRadius: theme.borderRadius.pill },
  actionText: { color: theme.colors.onPrimary, fontWeight: '600' as any, fontSize: 13 },
});
