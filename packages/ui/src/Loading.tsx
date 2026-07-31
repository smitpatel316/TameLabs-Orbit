
import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { theme } from '@tamelabs/theme';

export function Loading({ text }: { text?: string }) {
  return (
    <View style={styles.container} accessible accessibilityLabel={text || 'Loading'}>
      <ActivityIndicator size="small" color={theme.colors.textSecondary} />
      {text ? <Text style={styles.text}>{text}</Text> : null}
    </View>
  );
}

export function SkeletonCard() {
  return (
    <View style={styles.skeleton}>
      <View style={styles.skelLineShort} />
      <View style={styles.skelLine} />
      <View style={styles.skelLine} />
      <View style={[styles.skelLine, { width: '60%' }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  text: { fontSize: 13, color: theme.colors.textSecondary },
  skeleton: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, padding: 16, gap: 10 },
  skelLine: { height: 12, backgroundColor: theme.colors.skeleton, borderRadius: 6 },
  skelLineShort: { height: 12, width: '30%', backgroundColor: theme.colors.skeleton, borderRadius: 6 },
});
