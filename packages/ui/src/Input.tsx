
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, StyleProp, ViewStyle } from 'react-native';
import { theme } from '@tamelabs/theme';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export function Input({ label, error, hint, containerStyle, style, onFocus, onBlur, ...props }: Props) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        {...props}
        style={[
          styles.input,
          focused && styles.inputFocused,
          error && styles.inputError,
          style,
        ]}
        placeholderTextColor={theme.colors.textTertiary}
        onFocus={(e)=>{ setFocused(true); onFocus?.(e); }}
        onBlur={(e)=>{ setFocused(false); onBlur?.(e); }}
        accessibilityLabel={label}
      />
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6, width: '100%' },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: theme.colors.textSecondary, textTransform: 'uppercase' as const },
  input: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.m, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: theme.colors.text, minHeight: 44 },
  inputFocused: { borderColor: theme.colors.focus, backgroundColor: theme.colors.background },
  inputError: { borderColor: theme.colors.danger },
  error: { fontSize: 12, color: theme.colors.danger },
  hint: { fontSize: 11, color: theme.colors.textTertiary },
});
