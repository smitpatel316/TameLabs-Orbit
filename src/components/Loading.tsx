import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { theme } from '../theme';

export const Loading: React.FC = () => (
  <View style={styles.center}>
    <ActivityIndicator color={theme.colors.primary} size="large" />
  </View>
);

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
