import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { theme } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 's' | 'm' | 'l';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'm',
  loading = false,
  disabled = false,
  style,
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'secondary': return { backgroundColor: theme.colors.surfaceHover, borderColor: theme.colors.border };
      case 'ghost': return { backgroundColor: 'transparent', borderColor: 'transparent' };
      case 'danger': return { backgroundColor: theme.colors.danger, borderColor: theme.colors.danger };
      default: return { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary };
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'ghost': return { color: theme.colors.textSecondary };
      default: return { color: theme.colors.text };
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 's': return { paddingVertical: 6, paddingHorizontal: 12, borderRadius: theme.borderRadius.s };
      case 'm': return { paddingVertical: 10, paddingHorizontal: 16, borderRadius: theme.borderRadius.m };
      case 'l': return { paddingVertical: 14, paddingHorizontal: 20, borderRadius: theme.borderRadius.l };
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.base,
        getVariantStyle(),
        getSizeStyle(),
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? <ActivityIndicator color={theme.colors.text} size="small" /> : <Text style={[styles.text, getTextStyle()]}>{title}</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
});
