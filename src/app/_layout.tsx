import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { useColorScheme, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as ScreenCapture from 'expo-screen-capture';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';
import CustomAlertRenderer from '@/components/ui/CustomAlertRenderer';
import { ThemeProvider as AppThemeProvider, useAppTheme } from '@/context/ThemeContext';
import { notificationApi } from '@/utils/api';

// Configure notification behavior for heads-up alert, sound & badge
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  } as any),
});

function RootLayoutNav() {
  const { isAuthenticated, isLoading, profileCompleted } = useAuth();
  const segments = useSegments();
  const segs = segments as string[];
  const router = useRouter();
  const prevUnreadCount = useRef<number>(0);

  useEffect(() => {
    // 1. Enforce app-wide screenshot & screen recording restriction
    ScreenCapture.preventScreenCaptureAsync();

    // 2. Register high-priority notification channel for Android system popups
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'VVS Notifications',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF4D8D',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
    }

    return () => {
      ScreenCapture.allowScreenCaptureAsync();
    };
  }, []);

  // Poll for new unread notifications and trigger native system popups
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkNotifications = async () => {
      try {
        const res = await notificationApi.getUnreadCount();
        if (res && typeof res.count === 'number') {
          const currentCount = res.count;
          if (currentCount > prevUnreadCount.current && prevUnreadCount.current !== 0) {
            // Trigger native mobile system pop-up notification
            await Notifications.scheduleNotificationAsync({
              content: {
                title: 'VVS Matrimony',
                body: `You have ${currentCount} new notification${currentCount > 1 ? 's' : ''}!`,
                sound: 'default',
                priority: Notifications.AndroidNotificationPriority.MAX,
              },
              trigger: null, // show immediately
            });
          }
          prevUnreadCount.current = currentCount;
        }
      } catch (err) {
        // Silent fail for polling
      }
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 15000); // check every 15s

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segs[0] === '(auth)';
    const isRoot = segs.length === 0 || 
                   (segs.length === 1 && (segs[0] === '(app)' || segs[0] === 'index')) || 
                   (segs.length === 2 && segs[0] === '(app)' && (segs[1] === 'index' || segs[1] === 'explore'));

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
  const { colors } = useAppTheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: colors.background },
        }}>
        <Stack.Screen name="(app)"  options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack>
      <CustomAlertRenderer />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </LanguageProvider>
    </AppThemeProvider>
  );
}