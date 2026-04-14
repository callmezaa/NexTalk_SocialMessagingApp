import { Tabs } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { MessageSquare, UserCircle, Compass, Bot } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { StyleSheet, Platform } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: Colors.primary,
      tabBarInactiveTintColor: Colors.textMuted,
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '700',
        marginBottom: 4,
      },
      tabBarStyle: {
        position: 'absolute',
        borderTopWidth: 0,
        elevation: 0,
        height: Platform.OS === 'ios' ? 88 : 64,
        paddingTop: 8,
        backgroundColor: 'transparent',
      },
      tabBarBackground: () => (
        <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
      ),
      headerStyle: {
        backgroundColor: Colors.background,
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
      },
      headerTitleStyle: {
        fontWeight: '800',
        color: Colors.black,
      }
    }}>
      <Tabs.Screen 
        name="index" 
        options={{
          title: 'Chats',
          tabBarIcon: ({ color, focused }) => (
            <MessageSquare color={color} size={focused ? 26 : 22} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen 
        name="explore" 
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, focused }) => (
            <Compass color={color} size={focused ? 26 : 22} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen 
        name="nexbot" 
        options={{
          title: 'NexBot',
          tabBarIcon: ({ color, focused }) => (
            <Bot color={color} size={focused ? 26 : 22} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen 
        name="profile" 
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <UserCircle color={color} size={focused ? 26 : 22} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
    </Tabs>
  );
}
