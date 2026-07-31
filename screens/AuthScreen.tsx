import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useIdentity } from '../src/utils/useIdentity';
import { theme } from '../src/theme';
import { Button } from '../src/components/Button';
import { logger } from '../src/utils/logger';

export default function AuthScreen() {
  const { user, provider, loading, signIn, signInWithOtp, signOut } = useIdentity();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const handleMockSignIn = async () => {
    const e = email.trim() || 'you@tamelabs.local';
    if (!e.includes('@')) { Alert.alert('Invalid email'); return; }
    setBusy(true);
    try {
      await signIn(e);
      logger.info('Auth', 'signed in', { email: e, provider });
    } catch (err:any) {
      logger.logError(err, { screen: 'Auth' });
      Alert.alert('Sign in failed', err.message||String(err));
    } finally { setBusy(false); }
  };

  const handleSignOut = async () => {
    try { await signOut(); logger.info('Auth','signed out'); } catch (e:any){ logger.logError(e,{screen:'Auth'}); }
  };

  if (loading) return <View style={styles.center}><Text style={styles.muted}>Loading identity...</Text></View>;

  if (user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>IDENTITY</Text>
        <View style={styles.card}>
          <Text style={styles.avatar}>{(user.displayName?.[0] || user.email?.[0] || 'Y').toUpperCase()}</Text>
          <Text style={styles.name}>{user.displayName || 'You'}</Text>
          <Text style={styles.email}>{user.email || user.id}</Text>
          <View style={styles.badge}><Text style={styles.badgeText}>{provider} • {user.provider}</Text></View>
          <Text style={styles.hint}>Same account across Hubble • Orbit • Quiet</Text>
          <Text style={styles.id}>ID: {user.id}</Text>
        </View>
        <View style={styles.providerCard}>
          <Text style={styles.providerTitle}>Provider: {provider}</Text>
          <Text style={styles.providerDesc}>
            {provider==='mock' ? 'Local-first mock. No server. Same localStorage key tamelabs-identity-mock-v1 across all 3 apps on this device. For prod, set EXPO_PUBLIC_SUPABASE_URL+ANON_KEY or KEYCLOAK_URL.' : provider==='supabase' ? 'Supabase Auth — shared JWT, RLS enabled, ready for Tame Cloud E2E.' : 'Keycloak OIDC — enterprise SSO, realm tame, clients hubble/orbit/quiet.'}
          </Text>
        </View>
        <Button title="Sign Out" variant="secondary" onPress={handleSignOut} />
        <Text style={styles.footer}>Tame Identity v1 — Supabase abstraction, Keycloak-ready v2. See TameLabs-Cloud/README.md</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CONNECT YOUR TAMELABS ID</Text>
      <Text style={styles.sub}>One account across Hubble, Orbit, Quiet. Local-first mock until Supabase/Keycloak configured.</Text>
      <View style={styles.inputCard}>
        <Text style={styles.label}>EMAIL (for mock or OTP)</Text>
        <TextInput style={styles.input} placeholder="you@example.com" placeholderTextColor={theme.colors.textMuted} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <Button title={busy ? 'Signing in...' : 'Continue with Mock ID'} onPress={handleMockSignIn} disabled={busy} loading={busy} />
        <View style={{height:8}} />
        <TouchableOpacity onPress={async()=>{ try{ await signInWithOtp(email||'you@tamelabs.local'); Alert.alert('OTP sent (mock auto-signs in)'); }catch(e:any){ Alert.alert('OTP failed', e.message); } }}><Text style={styles.link}>Or use Email OTP (Supabase when configured)</Text></TouchableOpacity>
      </View>
      <View style={styles.providerCard}>
        <Text style={styles.providerTitle}>Current: {provider} (mock)</Text>
        <Text style={styles.providerDesc}>No env needed for dev. Set EXPO_PUBLIC_SUPABASE_URL for Supabase. Set EXPO_PUBLIC_KEYCLOAK_URL for Keycloak (future: https://github.com/keycloak/keycloak). Same TameUser.id used in all 3 stores for cross-app reputation.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: theme.spacing.l, gap: theme.spacing.ml, backgroundColor: theme.colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  muted: { color: theme.colors.textTertiary },
  title: { ...theme.typography.h1, textAlign: 'center' as const },
  sub: { ...theme.typography.bodySmall, color: theme.colors.textSecondary, textAlign: 'center' as const },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.l, padding: theme.spacing.l, alignItems: 'center', gap: theme.spacing.s, borderWidth: 1, borderColor: theme.colors.border },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: theme.colors.primary, color: theme.colors.onPrimary, textAlign: 'center', textAlignVertical: 'center' as any, lineHeight: 56, fontSize: 22, fontWeight: '700' as const },
  name: { ...theme.typography.h3 },
  email: { fontSize: 13, color: theme.colors.textSecondary },
  id: { fontSize: 10, color: theme.colors.textTertiary, fontFamily: 'monospace' as any, marginTop: 4 },
  badge: { backgroundColor: theme.colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.borderRadius.ml, marginTop: 4 },
  badgeText: { color: theme.colors.onPrimary, fontSize: 11, fontWeight: '600' as const },
  hint: { fontSize: 11, color: theme.colors.textTertiary, marginTop: 4, fontStyle: 'italic' as const },
  inputCard: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.ml, padding: theme.spacing.ml, gap: theme.spacing.s, borderWidth: 1, borderColor: theme.colors.border },
  label: { ...theme.typography.label, color: theme.colors.textSecondary },
  input: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.m, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: theme.colors.text },
  link: { fontSize: 12, color: theme.colors.textSecondary, textAlign: 'center', textDecorationLine: 'underline' },
  providerCard: { backgroundColor: theme.colors.surfaceMuted, borderRadius: theme.borderRadius.m, padding: theme.spacing.m, gap: theme.spacing.s },
  providerTitle: { fontSize: 12, fontWeight: '700' as const, color: theme.colors.text },
  providerDesc: { fontSize: 11, color: theme.colors.textSecondary, lineHeight: 15 },
  footer: { fontSize: 10, color: theme.colors.textTertiary, textAlign: 'center', marginTop: 8 },
});
