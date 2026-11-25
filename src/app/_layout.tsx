import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { InspectionProvider } from '@/features/inspections';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <InspectionProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#f1f5f9' },
          }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="inspection/[id]" />
          <Stack.Screen name="outbox" />
          <Stack.Screen name="settings" />
        </Stack>
      </InspectionProvider>
    </SafeAreaProvider>
  );
}
