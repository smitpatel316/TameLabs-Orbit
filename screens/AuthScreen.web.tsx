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
        <TextInput style={styles.input} placeholder="you@example.com" placeholderTextColor="#888" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
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
  container: { flex: 1, padding: 20, gap: 16, backgroundColor: theme.colors?.background || '#FFFFFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  muted: { color: '#888' },
  title: { fontSize: 18, fontWeight: '800' as const, letterSpacing: -0.5, textAlign: 'center' },
  sub: { fontSize: 13, color: '#666', textAlign: 'center', lineHeight: 18 },
  card: { backgroundColor: (theme.colors as any)?.surface || '#F9F9F9', borderRadius: 16, padding: 20, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: (theme.colors as any)?.border || '#EEE' },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#000', color: '#FFF', textAlign: 'center', textAlignVertical: 'center' as any, lineHeight: 56, fontSize: 22, fontWeight: '700' as const },
  name: { fontSize: 16, fontWeight: '700' as const },
  email: { fontSize: 13, color: '#666' },
  id: { fontSize: 10, color: '#999', fontFamily: 'monospace' as any, marginTop: 4 },
  badge: { backgroundColor: '#000', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 4 },
  badgeText: { color: '#FFF', fontSize: 11, fontWeight: '600' as const },
  hint: { fontSize: 11, color: '#888', marginTop: 4, fontStyle: 'italic' },
  inputCard: { backgroundColor: (theme.colors as any)?.surface || '#F9F9F9', borderRadius: 12, padding: 16, gap: 10, borderWidth: 1, borderColor: (theme.colors as any)?.border || '#EEE' },
  label: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.5, color: '#666' },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#000' },
  link: { fontSize: 12, color: '#666', textAlign: 'center', textDecorationLine: 'underline' },
  providerCard: { backgroundColor: '#F2F2F7', borderRadius: 10, padding: 12, gap: 6 },
  providerTitle: { fontSize: 12, fontWeight: '700' as const },
  providerDesc: { fontSize: 11, color: '#666', lineHeight: 15 },
  footer: { fontSize: 10, color: '#AAA', textAlign: 'center', marginTop: 8 },
});
