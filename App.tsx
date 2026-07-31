import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, View, StyleSheet, Platform } from 'react-native';
import ContactsListScreen from './screens/ContactsListScreen';
import ContactDetailScreen from './screens/ContactDetailScreen';
import AddContactScreen from './screens/AddContactScreen';
import AddInteractionScreen from './screens/AddInteractionScreen';
import InsightsScreen from './screens/InsightsScreen';
import MapScreen from './screens/MapScreen';
import RemindersScreen from './screens/RemindersScreen';
import SettingsScreen from './screens/SettingsScreen';
import ImportContactsScreen from './screens/ImportContactsScreen';
import AuthScreen from './screens/AuthScreen';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { IdentityProvider as TameIdentityProvider } from './src/utils/useIdentity';
import { logger } from './src/utils/logger';
import { theme } from './src/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

type TabConfig = { label: string; icon: string; activeIcon: string };
const TABS: Record<string, TabConfig> = {
  Contacts: { label: 'Contacts', icon: '◯', activeIcon: '⬤' },
  Insights: { label: 'Insights', icon: '◍', activeIcon: '●' },
  Map: { label: 'Map', icon: '◎', activeIcon: '◉' },
  Reminders: { label: 'Reminders', icon: '◔', activeIcon: '◑' },
  Settings: { label: 'Settings', icon: '⚙', activeIcon: '⚙' },
};

function TabIcon({ routeName, focused }: { routeName: string; focused: boolean }) {
  const cfg = TABS[routeName] || { label: routeName, icon: '•', activeIcon: '•' };
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Text style={[styles.icon, focused && styles.iconActive]}>{focused ? cfg.activeIcon : cfg.icon}</Text>
      {focused ? <View style={styles.activeDot} /> : null}
    </View>
  );
}

function ContactsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: theme.colors.background }, headerTintColor: theme.colors.text, headerTitleStyle: { fontWeight: '700' as const }, contentStyle: { backgroundColor: theme.colors.background } }}>
      <Stack.Screen name="ContactsList" component={ContactsListScreen} options={{ title: 'Orbit' }} />
      <Stack.Screen name="ContactDetail" component={ContactDetailScreen} options={{ title: 'Contact' }} />
      <Stack.Screen name="AddContact" component={AddContactScreen} options={{ title: 'New Contact' }} />
      <Stack.Screen name="AddInteraction" component={AddInteractionScreen} options={{ title: 'Log Interaction' }} />
      <Stack.Screen name="ImportContacts" component={ImportContactsScreen} options={{ title: 'Import Contacts' }} />
      <Stack.Screen name="Auth" component={AuthScreen} options={{ title: 'Tame ID' }} />
    </Stack.Navigator>
  );
}

function OrbitTabs() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, Platform.OS === 'web' ? 8 : 6);
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopWidth: 1,
          borderTopColor: theme.colors.borderLight,
          height: 56 + bottomPad,
          paddingTop: 6,
          paddingBottom: bottomPad,
          paddingHorizontal: theme.spacing.s,
          ...theme.shadows.card,
          ...(Platform.OS === 'web' ? { backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } as any : {}),
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600' as const,
          letterSpacing: 0.3,
          marginTop: 2,
        },
        tabBarIcon: ({ focused }) => <TabIcon routeName={route.name} focused={focused} />,
        tabBarHideOnKeyboard: true,
      })}
    >
      <Tab.Screen name="Contacts" component={ContactsStack} options={{ tabBarLabel: 'Contacts' }} />
      <Tab.Screen name="Insights" component={InsightsScreen} options={{ tabBarLabel: 'Insights' }} />
      <Tab.Screen name="Map" component={MapScreen} options={{ tabBarLabel: 'Map' }} />
      <Tab.Screen name="Reminders" component={RemindersScreen} options={{ tabBarLabel: 'Reminders' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: 'Settings' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 28,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  iconWrapActive: {
    backgroundColor: theme.colors.primary,
  },
  icon: {
    fontSize: 14,
    color: theme.colors.textTertiary,
    fontWeight: '600' as const,
  },
  iconActive: {
    color: theme.colors.onPrimary,
    fontSize: 12,
  },
  activeDot: {
    position: 'absolute',
    bottom: -6,
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
  },
});

export default function App() {
  useEffect(()=>{
    logger.init();
    logger.info('App', 'Orbit started', { v: '2.1' });
    // @ts-ignore
    const handler = (e: any) => { logger.logError(e?.reason||e?.error||e, { tag: 'unhandledrejection' }); };
    if (typeof window !== 'undefined') window.addEventListener('unhandledrejection', handler);
    return () => { if (typeof window !== 'undefined') window.removeEventListener('unhandledrejection', handler); };
  }, []);

  return (
    <ErrorBoundary>
      <TameIdentityProvider><SafeAreaProvider>
        <NavigationContainer>
          <OrbitTabs />
        </NavigationContainer>
      </SafeAreaProvider></TameIdentityProvider>
    </ErrorBoundary>
  );
}
