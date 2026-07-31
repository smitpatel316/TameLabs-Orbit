import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '@tamelabs/theme';
import { Button } from './Button';

interface ErrorViewProps {
    title: string;
    message: string;
    onRetry?: () => void;
}

export const ErrorView = ({ title, message, onRetry }: ErrorViewProps) => {
    return (
        <View style={styles.container}>
            <Text style={styles.icon}>⚠️</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
            {onRetry && (
                <Button 
                    title="Retry" 
                    onPress={onRetry} 
                    variant="primary" 
                    style={{ marginTop: theme.spacing.m }} 
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.xl,
    },
    icon: {
        fontSize: 48,
        marginBottom: theme.spacing.m,
    },
    title: {
        fontSize: theme.typography.h3.fontSize,
        fontWeight: '600',
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: theme.spacing.s,
    },
    message: {
        fontSize: theme.typography.body.fontSize,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: theme.spacing.l,
    },
});
