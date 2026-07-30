import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text } from 'react-native';
import ContactsListScreen from './screens/ContactsListScreen';
import ContactDetailScreen from './screens/ContactDetailScreen';
import AddContactScreen from './screens/AddContactScreen';
import AddInteractionScreen from './screens/AddInteractionScreen';
import InsightsScreen from './screens/InsightsScreen';
import MapScreen from './screens/MapScreen';
import RemindersScreen from './screens/RemindersScreen';
import SettingsScreen from './screens/SettingsScreen';
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
function ContactsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ContactsList" component={ContactsListScreen} options={{ title: 'Orbit' }} />
      <Stack.Screen name="ContactDetail" component={ContactDetailScreen} options={{ title: 'Contact' }} />
      <Stack.Screen name="AddContact" component={AddContactScreen} options={{ title: 'New Contact' }} />
      <Stack.Screen name="AddInteraction" component={AddInteractionScreen} options={{ title: 'Log Interaction' }} />
    </Stack.Navigator>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator screenOptions={{ headerShown:false }}>
          <Tab.Screen name="Contacts" component={ContactsStack} options={{ tabBarLabel:'Contacts', tabBarIcon:()=> <Text>CO</Text> }} />
          <Tab.Screen name="Insights" component={InsightsScreen} options={{ tabBarLabel:'Insights', tabBarIcon:()=> <Text>IN</Text> }} />
          <Tab.Screen name="Map" component={MapScreen} options={{ tabBarLabel:'Map', tabBarIcon:()=> <Text>MA</Text> }} />
          <Tab.Screen name="Reminders" component={RemindersScreen} options={{ tabBarLabel:'Reminders', tabBarIcon:()=> <Text>RE</Text> }} />
          <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel:'Settings', tabBarIcon:()=> <Text>SE</Text> }} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
