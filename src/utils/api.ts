import Constants from 'expo-constants';
import { storage } from './storage';
import type {
  SendOtpRequest,
  SendOtpResponse,
  VerifyOtpRequest,
  AuthResponse,
  User,
  UserProfile,
  UserPhoto,
  Biodata,
  ApiResponse,
  CreateProfileRequest,
  UpdateProfileRequest,
} from './types';

// Auto-detect backend URL from Expo dev server host
function getBaseUrl(): string {
  // Allow explicit override
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;

  // In Expo Go, Constants.expoConfig?.hostUri gives us "192.168.x.x:8081"
  // We extract just the IP and use port 3000 (backend port)
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:3000/api`;
  }

  // Fallback for web or production
  return 'http://localhost:3000/api';
}

const BASE_URL = getBaseUrl();

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;
let cachedToken: string | null = null;
let sessionExpiredCallback: (() => void) | null = null;

export function setCachedToken(token: string | null) {
  cachedToken = token;
}

export function registerSessionExpiredCallback(cb: () => void) {
  sessionExpiredCallback = cb;
}

async function refreshAccessToken(): Promise<string | null> {
  try {
    const refreshToken = await storage.getRefreshToken();
    if (!refreshToken) return null;

    const response = await fetch(`${BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (response.status === 401 || response.status === 400) {
      // The refresh token itself is invalid or expired
      return 'AUTH_FAILED';
    }

    if (!response.ok) {
      // Server error or other transient issue
      return null;
    }

    const data = await response.json();
    if (data.accessToken) {
      await storage.setAccessToken(data.accessToken);
      setCachedToken(data.accessToken); // Update cache
      return data.accessToken;
    }
    return null;
  } catch {
    // Network error
    return null;
  }
}

async function getValidToken(): Promise<string | null> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }
  if (cachedToken) {
    return cachedToken;
  }
  const token = await storage.getAccessToken();
  cachedToken = token;
  return token;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  requiresAuth = true,
  retried = false,
): Promise<T> {
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  // Don't set Content-Type for FormData (multipart)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (requiresAuth) {
    const token = await getValidToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const url = `${BASE_URL}${endpoint}`;
  console.log(`[API] ${options.method || 'GET'} ${url}`);
  console.log(`[API] Headers:`, JSON.stringify(headers));

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 — try refresh token once
  if (response.status === 401 && requiresAuth && !retried) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshAccessToken();
    }

    const newToken = await refreshPromise;
    isRefreshing = false;
    refreshPromise = null;

    if (newToken && newToken !== 'AUTH_FAILED') {
      return request<T>(endpoint, options, requiresAuth, true);
    }

    if (newToken === 'AUTH_FAILED') {
      // Refresh failed permanently — clear tokens and trigger logout
      await storage.clearAll();
      setCachedToken(null);
      if (sessionExpiredCallback) {
        sessionExpiredCallback();
      }
      throw new Error('SESSION_EXPIRED');
    }

    // If newToken is null, it was a transient network error.
    // We do NOT clear tokens, keeping the user logged in for retry.
    throw new Error('UNAUTHORIZED');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data as T;
}

// ─── Auth API ─────────────────────────────────────────────────────────────────

export const authApi = {
  sendOtp: (body: SendOtpRequest) =>
    request<SendOtpResponse>('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify(body),
    }, false),

  verifyOtp: (body: VerifyOtpRequest) =>
    request<Partial<AuthResponse> & { message: string }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(body),
    }, false),

  getMe: () =>
    request<{ message: string; user: User }>('/auth/me'),

  logout: (sessionId: number) =>
    request<{ message: string }>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    }, false),

  refreshToken: (refreshToken: string) =>
    request<{ accessToken: string }>('/auth/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }, false),
};

// ─── Profile API ──────────────────────────────────────────────────────────────

export const profileApi = {
  setupProfile: async (data: CreateProfileRequest) => {
    return request<ApiResponse<User>>('/profile/setup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getMyProfile: () =>
    request<ApiResponse<User>>('/profile/myProfile'),

  getUserProfile: async (userId: number) => {
    const response = await request<ApiResponse<User>>(`/profile/user/${userId}`);
    if (!response.data) {
      console.warn(`[ProfileAPI] getUserProfile(${userId}) returned no data:`, response.message || response);
    }
    return response;
  },

  getAllProfiles: (page: number, limit: number) =>
    request<ApiResponse<UserProfile[]>>(`/profile/getAllProfiles?page=${page}&limit=${limit}`),

  searchProfiles: (body: {
    search?: string;
    gender?: string;
    maritalStatus?: string;
    country?: string;
    state?: string;
    city?: string;
    education?: string;
    profession?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) =>
    request<ApiResponse<UserProfile[]>>('/common/profiles/search', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateProfile: (data: UpdateProfileRequest) =>
    request<ApiResponse<UserProfile>>('/profile/update', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  uploadProfilePhoto: async (photoUri: string) => {
    const formData = new FormData();
    const filename = photoUri.split('/').pop() || 'photo.jpg';
    const match = /\.([\w]+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    formData.append('photo', {
      uri: photoUri,
      name: filename,
      type,
    } as any);

    return request<ApiResponse<{ photoUrl: string }>>('/profile/upload-profile-photo', {
      method: 'POST',
      body: formData,
    });
  },

  uploadPhoto: async (photoUri: string) => {
    const formData = new FormData();
    const filename = photoUri.split('/').pop() || 'photo.jpg';
    const match = /\.([\w]+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    formData.append('photo', {
      uri: photoUri,
      name: filename,
      type,
    } as any);

    return request<ApiResponse<UserPhoto>>('/profile/upload-photo', {
      method: 'POST',
      body: formData,
    });
  },

  getMyPhotos: () =>
    request<ApiResponse<UserPhoto[]>>('/profile/photos'),

  deletePhoto: (photoId: number) =>
    request<ApiResponse<any>>(`/profile/deletePhoto/${photoId}`, {
      method: 'POST',
    }),

  uploadBiodata: async (fileUri: string, biodataType: 'uploaded' | 'generated') => {
    const formData = new FormData();
    const filename = fileUri.split('/').pop() || 'biodata.pdf';
    formData.append('biodata', {
      uri: fileUri,
      name: filename,
      type: 'application/pdf',
    } as any);
    formData.append('biodataType', biodataType);

    return request<ApiResponse<Biodata>>('/profile/biodata', {
      method: 'POST',
      body: formData,
    });
  },
  generateBiodata: (data: {
    fullName: string;
    gender: 'male' | 'female';
    maritalStatus: 'never_married' | 'divorced' | 'widowed';
    dateOfBirth: string;
    city?: string;
    profession?: string;
    education?: string;
    religion?: string;
    caste?: string;
    fatherName?: string;
    motherName?: string;
    bio?: string;
  }) =>
    request<ApiResponse<Biodata>>('/profile/biodata/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),



  getPartnerPreferenceProfiles: (page: number, limit: number) =>
    request<ApiResponse<UserProfile[]>>(`/profile/getPartnerPreferenceProfiles?page=${page}&limit=${limit}`),

  getPublicProfiles: (page: number, limit: number) =>
    request<ApiResponse<UserProfile[]>>(`/profile/public/list?page=${page}&limit=${limit}`, {}, false),

  deletedOrDeactivateProfile: (flag: 'deactive' | 'delete') =>
    request<ApiResponse>(`/profile/deletedOrDeactivateProfile?flag=${flag}`, {
      method: 'GET',
    }),

  deleteAccount: () =>
    request<ApiResponse>('/profile/account', {
      method: 'DELETE',
    }),
};

// ─── Interest API ─────────────────────────────────────────────────────────────

export const interestApi = {
  sendInterest: (receiverId: number) =>
    request<{ message: string; data: { interestId: number; status: string } }>('/interest/send', {
      method: 'POST',
      body: JSON.stringify({ receiverId }),
    }),

  acceptInterest: (interestId: number) =>
    request<{ message: string; data: any }>(`/interest/accept/${interestId}`, {
      method: 'PATCH',
    }),

  cancelInterest: (interestId: number) =>
    request<{ message: string; data: any }>(`/interest/cancel/${interestId}`, {
      method: 'PATCH',
    }),

  getReceivedInterests: (page: number, limit: number, search?: string) => {
    const safeLimit = Math.min(limit || 20, 100);
    let url = `/interest/received?page=${page}&limit=${safeLimit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    return request<ApiResponse>(url);
  },
};

// ─── Notification API ─────────────────────────────────────────────────────────

export const notificationApi = {
  registerDevice: (body: { deviceId: string; fcmToken: string; platform: 'ANDROID' | 'IOS' }) =>
    request<ApiResponse>('/notification/register-device', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getNotifications: (page = 1, limit = 20) =>
    request<ApiResponse>(`/notification?page=${page}&limit=${limit}`),

  getUnreadCount: () =>
    request<ApiResponse>('/notification/unread-count'),

  markAsRead: (id: number) =>
    request<ApiResponse>(`/notification/${id}/read`, {
      method: 'PATCH',
    }),

  getNotificationSender: (id: number) =>
    request<ApiResponse<{ senderId: number | null }>>(`/notification/${id}/sender`),

  markAllAsRead: () =>
    request<ApiResponse>('/notification/read-all', {
      method: 'PATCH',
    }),

  testNotification: () =>
    request<ApiResponse>('/notification/test', {
      method: 'POST',
      body: JSON.stringify({}),
    }),
};

// ─── Personal Information API ──────────────────────────────────────────────────

export interface PersonalInformationData {
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  fatherName?: string;
  fatherMobileNumber?: string;
  fatherOccupation?: string;
  motherName?: string;
  motherOccupation?: string;
  numberOfBrothers?: number;
  marriedBrothers?: number;
  numberOfSisters?: number;
  marriedSisters?: number;
}

export const personalInformationApi = {
  add: (data: PersonalInformationData) =>
    request<ApiResponse>('/personalinformation/add', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getDetails: () =>
    request<ApiResponse>('/personalinformation/details'),

  update: (data: PersonalInformationData) =>
    request<ApiResponse>('/personalinformation/update', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// Export base URL for debugging
export { BASE_URL };

// ─── Success Story API ─────────────────────────────────────────────────────────

export interface SuccessStoryData {
  partnerName?: string;
  marriageDate?: string;
  title: string;
  story: string;
  rating?: number;
  wouldRecommend?: boolean;
}

export const successStoryApi = {
  addStory: (data: SuccessStoryData) =>
    request<ApiResponse>('/success-story/addStory', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  uploadPhotos: async (uris: string[]): Promise<ApiResponse> => {
    const token = await storage.getAccessToken();
    const formData = new FormData();
    uris.forEach((uri, idx) => {
      const filename = uri.split('/').pop() || `photo_${idx}.jpg`;
      const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
      const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
      formData.append('photos', { uri, name: filename, type: mimeType } as any);
    });
    const res = await fetch(`${BASE_URL}/success-story/photos`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    return res.json();
  },

  myStory: () =>
    request<ApiResponse>('/success-story/myStory'),

  getAllStories: (page = 1, limit = 20) =>
    request<ApiResponse>(`/success-story/getAllStories?page=${page}&limit=${limit}`),

  updateStory: (data: Partial<SuccessStoryData>) =>
    request<ApiResponse>('/success-story/updateStory', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deletePhoto: (photoId: number) =>
    request<ApiResponse>(`/success-story/photo/${photoId}`, {
      method: 'DELETE',
    }),

  deleteStory: () =>
    request<ApiResponse>('/success-story/deleteStory', {
      method: 'DELETE',
    }),
};

