
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { logger } from '../utils/logger';
import { theme } from '../theme';

interface Props { children: ReactNode }
interface State { hasError: boolean; error: Error | null; errorId: string | null; }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorId: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error, errorId: Date.now().toString(36) };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.logError(error, { tag: 'ErrorBoundary', componentStack: errorInfo.componentStack, errorId: this.state.errorId });
    console.error('Uncaught:', error, errorInfo);
  }

  handleReset = () => {
    logger.info('ErrorBoundary', 'user reset error boundary', { errorId: this.state.errorId });
    this.setState({ hasError: false, error: null, errorId: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.sub}>We've logged this error for the nightly fix run.</Text>
          <Text style={styles.errorId}>ID: {this.state.errorId}</Text>
          <Text style={styles.message}>{this.state.error?.message || 'Unknown error'}</Text>
          <TouchableOpacity style={styles.btn} onPress={this.handleReset}>
            <Text style={styles.btnText}>Try Again</Text>
          </TouchableOpacity>
          <Text style={styles.hint}>If this keeps happening, export logs in Settings and report.</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: theme.colors.onPrimary, gap: 12 },
  title: { fontSize: 20, fontWeight: '800' },
  sub: { fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center' },
  errorId: { fontSize: 11, color: theme.colors.textTertiary, fontFamily: 'monospace' as any },
  message: { fontSize: 12, color: theme.colors.dangerText, textAlign: 'center', marginTop: 8 },
  btn: { backgroundColor: theme.colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, marginTop: 12 },
  btnText: { color: theme.colors.onPrimary, fontWeight: '600' },
  hint: { fontSize: 11, color: theme.colors.textMuted, marginTop: 8, textAlign: 'center' },
});
