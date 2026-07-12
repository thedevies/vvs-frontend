import * as SecureStore from 'expo-secure-store';

const KEYS = {
  ACCESS_TOKEN: 'vvs_access_token',
  REFRESH_TOKEN: 'vvs_refresh_token',
  SESSION_ID: 'vvs_session_id',
  USER_DATA: 'vvs_user_data',
} as const;

export const storage = {
  // Token management
  async saveTokens(accessToken: string, refreshToken: string, sessionId: number): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, accessToken),
      SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, refreshToken),
      SecureStore.setItemAsync(KEYS.SESSION_ID, String(sessionId)),
    ]);
  },

  async getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
  },

  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
  },

  async getSessionId(): Promise<number | null> {
    const val = await SecureStore.getItemAsync(KEYS.SESSION_ID);
    return val ? Number(val) : null;
  },

  async setAccessToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, token);
  },

  async clearTokens(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN),
      SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN),
      SecureStore.deleteItemAsync(KEYS.SESSION_ID),
    ]);
  },

  // User data (cached for offline display)
  async saveUserData(user: any): Promise<void> {
    await SecureStore.setItemAsync(KEYS.USER_DATA, JSON.stringify(user));
  },

  async getUserData(): Promise<any | null> {
    const val = await SecureStore.getItemAsync(KEYS.USER_DATA);
    return val ? JSON.parse(val) : null;
  },

  // Clear everything
  async clearAll(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN),
      SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN),
      SecureStore.deleteItemAsync(KEYS.SESSION_ID),
      SecureStore.deleteItemAsync(KEYS.USER_DATA),
    ]);
  },
};
