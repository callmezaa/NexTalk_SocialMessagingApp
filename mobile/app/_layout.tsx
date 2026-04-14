import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { Colors } from '../constants/Colors';

export default function RootLayout() {
  const hydrate = useAuthStore(state => state.hydrate);
  
  useEffect(() => {
    hydrate();
  }, []);

  return (
    <Stack screenOptions={{ 
      headerShown: false,
      contentStyle: { backgroundColor: Colors.background },
      animation: 'fade',
    }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}
