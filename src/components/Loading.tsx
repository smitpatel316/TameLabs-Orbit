import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { theme } from '../theme';

export const Loading: React.FC<{ message?: string }> = ({ message }) => (
  <View style={styles.center}>
    <ActivityIndicator color={theme.colors.text} size="large" />
    {message ? <Text style={styles.msg}>{message}</Text> : null}
  </View>
);

export const SkeletonCard: React.FC = () => (
  <View style={styles.card}>
    <View style={styles.skelAvatar} />
    <View style={styles.skelLines}>
      <View style={[styles.skelLine, { width: '60%' }]} />
      <View style={[styles.skelLine, { width: '90%', height: 10 }]} />
      <View style={[styles.skelLine, { width: '40%', height: 10 }]} />
    </View>
  </View>
);

export const SkeletonList: React.FC<{ count?: number }> = ({ count=3 }) => (
  <View style={{ gap: 12, padding: 16 }}>
    {Array.from({length: count}).map((_,i)=><SkeletonCard key={i} />)}
  </View>
);

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.xl, gap: theme.spacing.m },
  msg: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: theme.spacing.s },
  card: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.ml,
    borderRadius: theme.borderRadius.l,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.m,
    alignItems: 'center',
  },
  skelAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.skeleton },
  skelLines: { flex: 1, gap: 8 },
  skelLine: { height: 14, borderRadius: 6, backgroundColor: theme.colors.skeleton },
});
