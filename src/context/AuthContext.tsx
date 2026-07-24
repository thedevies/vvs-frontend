import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { storage } from '@/utils/storage';
import { authApi, profileApi, BASE_URL, setCachedToken, registerSessionExpiredCallback, notificationApi } from '@/utils/api';
import type { User } from '@/utils/types';

type AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  profileCompleted: boolean;
  sendOtp: (mobile: string) => Promise<{ success: boolean; otp?: string; error?: string }>;
  login: (mobile: string, otp: string, confirmNewDevice?: boolean) => Promise<{ success: boolean; hasActiveSession?: boolean; message?: string; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  completeProfile: () => void;
};

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  profileCompleted: false,
  sendOtp: async () => ({ success: false }),
  login: async () => ({ success: false }),
  logout: async () => {},
  refreshUser: async () => {},
  completeProfile: () => {},
});

// Get a unique device identifier
function getDeviceId(): string {
  const brand = Device.brand || 'unknown';
  const model = Device.modelName || 'device';
  const os = Platform.OS;
  return `${brand}-${model}-${os}-${Device.osVersion || '0'}`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const syncDeviceTokenWithBackend = async () => {
    try {
      // 1. Check and request notification permissions dynamically
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('[Push] Notification permission not granted. Cannot sync token.');
        return;
      }

      // 2. Fetch the Expo Push Token dynamically
      const tokenResult = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId || '50be3265-a42d-4cb9-9032-4a0d56c6fc7c',
      });
      const fcmToken = tokenResult.data;

      if (!fcmToken) {
        console.warn('[Push] Failed to retrieve dynamic push token.');
        return;
      }

      // 3. Cache it locally in SecureStore
      await SecureStore.setItemAsync('vvs_fcm_token', fcmToken);

      const deviceId = getDeviceId();
      const platform = Platform.OS === 'ios' ? 'IOS' : 'ANDROID';

      console.log('[Push] Registering device with backend...', { deviceId, fcmToken, platform });
      const response = await notificationApi.registerDevice({
        deviceId,
        fcmToken,
        platform,
      });
      console.log('[Push] Device registered successfully:', response?.message || 'Success');
    } catch (err: any) {
      console.warn('[Push] Failed to register device with backend:', err.message);
    }
  };

  const profileCompleted = !!(user?.profile);

  // On mount: check for saved tokens and validate
  useEffect(() => {
    registerSessionExpiredCallback(() => {
      console.log('[Auth] Session expired globally. Logging out...');
      setUser(null);
      setIsAuthenticated(false);
    });
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = await storage.getAccessToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Sync the loaded token to the API client memory cache
      setCachedToken(token);

      console.log('[Auth] Found saved token, validating...');
      console.log('[Auth] API Base URL:', BASE_URL);

      // Try to get current user from backend
      const response = await profileApi.getMyProfile();
      if (response.data) {
        setUser(response.data);
        setIsAuthenticated(true);
        await storage.saveUserData(response.data);
        console.log('[Auth] Token valid, user:', response.data.mobile);

        // Sync device token
        syncDeviceTokenWithBackend();
      }
    } catch (error: any) {
      console.log('[Auth] Token validation failed:', error.message);
      
      const isNetworkError = error.message && (
        error.message.includes('Network request failed') ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('network')
      );

      if (isNetworkError) {
        // Network error — try loading cached user data
        const cached = await storage.getUserData();
        if (cached) {
          setUser(cached);
          setIsAuthenticated(true);
          console.log('[Auth] Using cached user data');
        }
      } else {
        // Server rejected the token/request (e.g. database reset, user deleted, 401 Unauthorized, etc.)
        // Clear everything to force user login/signup
        console.log('[Auth] Stale or invalid session. Clearing storage...');
        await storage.clearAll();
        setCachedToken(null);
        setUser(null);
        setIsAuthenticated(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const sendOtp = useCallback(async (mobile: string) => {
    try {
      const deviceId = getDeviceId();
      console.log('[Auth] Sending OTP to', mobile, 'deviceId:', deviceId);

      const response = await authApi.sendOtp({ mobile, deviceId });
      console.log('[Auth] OTP response:', JSON.stringify(response));

      // Backend returns errors as 200 OK — check if OTP data exists
      if (!response.data?.otp) {
        return {
          success: false,
          error: response.message || 'Failed to send OTP',
        };
      }

      // In dev mode, backend returns the OTP directly
      return {
        success: true,
        otp: response.data.otp,
      };
    } catch (error: any) {
      console.error('[Auth] Send OTP error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send OTP. Is the backend running?',
      };
    }
  }, []);

  const login = useCallback(async (mobile: string, otp: string, confirmNewDevice?: boolean) => {
    try {
      const deviceId = getDeviceId();

      // Get IP address — just pass a placeholder since backend requires it
      const ipAddress = '0.0.0.0';

      console.log('[Auth] Verifying OTP for', mobile, 'confirmNewDevice:', confirmNewDevice);

      const response: any = await authApi.verifyOtp({
        mobile,
        otp,
        deviceId,
        ipAddress,
        confirmNewDevice,
      });

      console.log('[Auth] Verify response:', JSON.stringify(response));

      // Active session warning on another device
      if (response?.hasActiveSession) {
        return {
          success: false,
          hasActiveSession: true,
          message: response.message || 'Previous session to previous device is active. If you login here, previous session will be logged out.',
        };
      }

      // Backend returns errors as 200 OK with just { message: '...' }
      // Must check if accessToken exists in the response
      if (!response.accessToken) {
        return {
          success: false,
          error: response.message || 'OTP verification failed. No token received.',
        };
      }

      // Store tokens — sessionId might be missing for same-device re-login
      await storage.saveTokens(
        response.accessToken,
        response.refreshToken || '',
        response.sessionId || 0,
      );

      // Verify token was actually stored
      const savedToken = await storage.getAccessToken();
      console.log('[Auth] Token saved successfully:', !!savedToken);

      // Instantly cache the accessToken in memory to prevent any asynchronous delay
      setCachedToken(response.accessToken);

      // Fetch full profile relation immediately
      let finalUser = response.user;
      try {
        const profileResponse = await profileApi.getMyProfile();
        if (profileResponse.data) {
          finalUser = profileResponse.data;
          console.log('[Auth] Profile fetched on login successfully.');
        }
      } catch (profileErr: any) {
        console.log('[Auth] Failed to load full user profile on login:', profileErr.message);
      }

      if (finalUser) {
        setUser(finalUser);
        await storage.saveUserData(finalUser);
        console.log('[Auth] Login successful, user ID:', finalUser.id);
      }
      
      setIsAuthenticated(true);

      // Sync device token
      syncDeviceTokenWithBackend();

      return { success: true };
    } catch (error: any) {
      console.error('[Auth] Login error:', error);
      return {
        success: false,
        error: error.message || 'OTP verification failed',
      };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const sessionId = await storage.getSessionId();
      if (sessionId) {
        await authApi.logout(sessionId).catch(() => {
          // Ignore logout API errors — still clear local state
        });
      }
    } catch (error) {
      console.log('[Auth] Logout API error (ignored):', error);
    } finally {
      await storage.clearAll();
      setCachedToken(null); // Clear cached token
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      // Fetch full profile from backend
      const profileResponse = await profileApi.getMyProfile();
      if (profileResponse.data) {
        setUser(profileResponse.data);
        await storage.saveUserData(profileResponse.data);
      }
    } catch (error: any) {
      console.log('[Auth] Refresh user error:', error.message);
      // Fallback: try getMe
      try {
        const meResponse = await authApi.getMe();
        if (meResponse.user) {
          setUser(meResponse.user);
          await storage.saveUserData(meResponse.user);
        }
      } catch {
        // Ignore
      }
    }
  }, []);

  const completeProfile = useCallback(() => {
    // Force refresh user data after profile completion
    refreshUser();
  }, [refreshUser]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        profileCompleted,
        sendOtp,
        login,
        logout,
        refreshUser,
        completeProfile,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
