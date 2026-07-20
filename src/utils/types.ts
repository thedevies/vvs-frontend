// Backend API response types for VVS Matrimony

export interface User {
  id: number;
  mobile: string;
  email?: string | null;
  isMobileVerified: boolean;
  isEmailVerified: boolean;
  profile?: UserProfile | null;
  photos?: UserPhoto[];
  biodata?: Biodata | null;
  personalInformation?: any;
  successStory?: any;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: number;
  userId: number;
  fullName: string;
  gender: string;
  lookingFor: string;
  maritalStatus: string;
  dateOfBirth: string;
  height: string;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  profession?: string | null;
  education?: string | null;
  bio?: string | null;
  profilePhoto?: string | null;
  interest?: string[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserPhoto {
  id: number;
  userId: number;
  photoUrl: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Biodata {
  id: number;
  userId: number;
  biodataType: string;
  biodataUrl?: string | null;
  isGenerated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: number;
  userId: number;
  token: string;
  refreshToken?: string | null;
  deviceId: string;
  ipAddress?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// API Request types
export interface SendOtpRequest {
  mobile: string;
  deviceId: string;
  email?: string;
}

export interface VerifyOtpRequest {
  mobile: string;
  otp: string;
  deviceId: string;
  ipAddress: string;
}

export interface CreateProfileRequest {
  fullName: string;
  gender: 'male' | 'female';
  height: string;
  maritalStatus: 'never_married' | 'divorced' | 'widowed';
  dateOfBirth: string;
  country?: string;
  state?: string;
  city?: string;
  profession?: string;
  education?: string;
  bio?: string;
  profilePhoto?: string;
  interest?: string[];
}

export interface UpdateProfileRequest {
  fullName?: string;
  gender?: 'male' | 'female';
  height?: string;
  maritalStatus?: 'never_married' | 'divorced' | 'widowed';
  dateOfBirth?: string;
  country?: string;
  state?: string;
  city?: string;
  profession?: string;
  education?: string;
  bio?: string;
  profilePhoto?: string;
  interest?: string[];
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// API Response types
export interface ApiResponse<T = any> {
  message: string;
  data?: T;
  accessToken?: string;
  token?: string;
  refreshToken?: string;
  sessionId?: number;
  user?: User;
  success?: boolean;
  pagination?: PaginationInfo;
}

export interface AuthResponse {
  message: string;
  accessToken: string;
  token: string;
  refreshToken: string;
  sessionId: number;
  user: User;
}

export interface SendOtpResponse {
  message: string;
  data: {
    mobile: string;
    otp: string; // DEV only — backend returns OTP directly
  };
}
