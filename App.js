// Orbit - Main App
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text } from 'react-native';

import ContactsListScreen from './screens/ContactsListScreen';
import ContactDetailScreen from './screens/ContactDetailScreen';
import AddContactScreen from './screens/AddContactScreen';
import AddInteractionScreen from './screens/AddInteractionScreen';
import InsightsScreen from './screens/InsightsScreen';
import MapScreen from './screens/MapScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function ContactsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1a1a2e' },
        headerTintColor: '#fff',
        contentStyle: { backgroundColor: '#16213e' },
      }}
    >
      <Stack.Screen 
        name="ContactsList" 
        component={ContactsListScreen}
        options={{ title: '👥 Orbit' }}
      />
      <Stack.Screen 
        name="ContactDetail" 
        component={ContactDetailScreen}
        options={{ title: 'Contact' }}
      />
      <Stack.Screen 
        name="AddContact" 
        component={AddContactScreen}
        options={{ title: 'New Contact' }}
      />
      <Stack.Screen 
        name="AddInteraction" 
        component={AddInteractionScreen}
        options={{ title: 'Log Interaction' }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: { backgroundColor: '#1a1a2e', borderTopColor: '#2D3748' },
            tabBarActiveTintColor: '#E53E3E',
            tabBarInactiveTintColor: '#718096',
          }}
        >
          <Tab.Screen 
            name="Contacts" 
            component={ContactsStack}
            options={{ 
              tabBarLabel: 'Contacts',
              tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>👥</Text>
            }}
          />
          <Tab.Screen 
            name="Insights" 
            component={InsightsScreen}
            options={{ 
              tabBarLabel: 'Insights',
              tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📊</Text>
            }}
          />
          <Tab.Screen 
            name="Map" 
            component={MapScreen}
            options={{ 
              tabBarLabel: 'Map',
              tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🗺️</Text>
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
