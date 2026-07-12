import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';

function RootLayoutNav() {
  const { isAuthenticated, isLoading, profileCompleted } = useAuth();
  const segments = useSegments();
  const segs = segments as string[];
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segs[0] === '(auth)';
    const isRoot = segs.length === 0 || 
                   (segs.length === 1 && (segs[0] === '(app)' || segs[0] === 'index')) || 
                   (segs.length === 2 && segs[0] === '(app)' && segs[1] === 'index');

    if (!isAuthenticated && !inAuthGroup && !isRoot) {
      router.replace('/(auth)/welcome');
    } else if (isAuthenticated && inAuthGroup) {
      // After login, redirect based on profile status
      if (profileCompleted) {
        router.replace('/(app)');
      } else {
        router.replace('/(app)/edit-profile');
      }
    }
  }, [isAuthenticated, isLoading, segments, profileCompleted]);

  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: '#0F0F12' },
        }}>
        <Stack.Screen name="(app)"  options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </LanguageProvider>
  );
}