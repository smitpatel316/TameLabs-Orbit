import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, StyleSheet, Platform } from 'react-native';
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
import { ContactsIcon, InsightsIcon, MapIcon, RemindersIcon, SettingsIcon } from './src/components/TabIcons';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIconWrap({ focused, children }: { focused: boolean; children: React.ReactNode }) {
  return <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>{children}</View>;
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
  const baseBottomPad = Platform.OS === 'web' ? 28 : 36;
  const bottomPad = insets.bottom + baseBottomPad;

  return (
    <Tab.Navigator
      screenOptions={() => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopWidth: 1,
          borderTopColor: theme.colors.borderLight,
          height: 70 + bottomPad,
          paddingTop: 10,
          paddingBottom: bottomPad,
          paddingHorizontal: theme.spacing.s,
          ...theme.shadows.card,
          ...(Platform.OS === 'web' ? { backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } as any : {}),
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' as const, letterSpacing: 0.3, marginTop: 4, marginBottom: 2 },
        tabBarHideOnKeyboard: true,
      })}
    >
      <Tab.Screen name="Contacts" component={ContactsStack} options={{ tabBarLabel: 'Contacts', tabBarIcon: ({ focused }) => <TabIconWrap focused={focused}><ContactsIcon focused={focused} /></TabIconWrap> }} />
      <Tab.Screen name="Insights" component={InsightsScreen} options={{ tabBarLabel: 'Insights', tabBarIcon: ({ focused }) => <TabIconWrap focused={focused}><InsightsIcon focused={focused} /></TabIconWrap> }} />
      <Tab.Screen name="Map" component={MapScreen} options={{ tabBarLabel: 'Map', tabBarIcon: ({ focused }) => <TabIconWrap focused={focused}><MapIcon focused={focused} /></TabIconWrap> }} />
      <Tab.Screen name="Reminders" component={RemindersScreen} options={{ tabBarLabel: 'Reminders', tabBarIcon: ({ focused }) => <TabIconWrap focused={focused}><RemindersIcon focused={focused} /></TabIconWrap> }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: 'Settings', tabBarIcon: ({ focused }) => <TabIconWrap focused={focused}><SettingsIcon focused={focused} /></TabIconWrap> }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconWrap: { width: 36, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  iconWrapActive: { backgroundColor: theme.colors.primary },
});

export default function App() {
  useEffect(() => {
    logger.init();
    logger.info('App', 'Orbit started', { v: '2.1' });
    // @ts-ignore
    const handler = (e: any) => { logger.logError(e?.reason || e?.error || e, { tag: 'unhandledrejection' }); };
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
