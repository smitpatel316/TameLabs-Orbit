import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, ViewStyle, StyleProp } from 'react-native';
import { theme } from '../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  style,
  containerStyle,
  onFocus,
  onBlur,
  ...props
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[
          styles.input,
          focused && styles.inputFocused,
          error && styles.inputError,
          style,
        ]}
        placeholderTextColor={theme.colors.textTertiary}
        onFocus={(e)=>{ setFocused(true); onFocus?.(e); }}
        onBlur={(e)=>{ setFocused(false); onBlur?.(e); }}
        accessibilityLabel={label || props.placeholder || 'Input'}
        {...props}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {hint && !error ? <Text style={styles.hintText}>{hint}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: theme.spacing.m, width: '100%' },
  label: { ...theme.typography.label, color: theme.colors.textSecondary, marginBottom: theme.spacing.s },
  input: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.typography.body,
  },
  inputFocused: { borderColor: theme.colors.text, borderWidth: 1.5 },
  inputError: { borderColor: theme.colors.danger },
  errorText: { color: theme.colors.danger, fontSize: 12, marginTop: 4 },
  hintText: { color: theme.colors.textTertiary, fontSize: 11, marginTop: 4, fontStyle: 'italic' as any },
});
