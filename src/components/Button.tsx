import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { theme } from '../theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 's' | 'm' | 'l';

interface Props {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
}

export const Button: React.FC<Props> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'm',
  disabled = false,
  loading = false,
  style,
  textStyle,
  accessibilityLabel,
}) => {
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled }}
      style={[
        styles.base,
        styles[size],
        styles[variant],
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant==='primary' ? theme.colors.onPrimary : theme.colors.text} size="small" />
      ) : (
        <Text style={[styles.text, styles[`text_${variant}` as keyof typeof styles] as any, styles[`text_${size}` as keyof typeof styles] as any, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: { borderRadius: theme.borderRadius.m, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  s: { minHeight: 36, paddingHorizontal: theme.spacing.m },
  m: { minHeight: 44, paddingHorizontal: theme.spacing.ml },
  l: { minHeight: 52, paddingHorizontal: theme.spacing.l },
  primary: { backgroundColor: theme.colors.primary },
  secondary: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: theme.colors.dangerBg, borderWidth: 1, borderColor: theme.colors.dangerBorder },
  disabled: { opacity: 0.45 },
  text: { fontWeight: '600' as const },
  text_primary: { color: theme.colors.onPrimary },
  text_secondary: { color: theme.colors.text },
  text_ghost: { color: theme.colors.text },
  text_danger: { color: theme.colors.danger },
  text_s: { fontSize: 13 },
  text_m: { fontSize: 15 },
  text_l: { fontSize: 16 },
});
