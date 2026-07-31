
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from './Button';
import { theme } from '@tamelabs/theme';

interface Props {
  title: string;
  subtitle?: string;
  icon?: string;
  actionTitle?: string;
  onAction?: () => void;
}

export function EmptyState({ title, subtitle, icon='—', actionTitle, onAction }: Props) {
  return (
    <View style={styles.container} accessible>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {actionTitle && onAction ? <View style={styles.action}><Button title={actionTitle} onPress={onAction} variant="secondary" size="s" /></View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingTop: 64, paddingHorizontal: 32, gap: 8 },
  icon: { fontSize: 32, color: theme.colors.textTertiary },
  title: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  subtitle: { fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 18 },
  action: { marginTop: 12 },
});
