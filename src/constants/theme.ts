import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#111111',
    background: '#FFFFFF',
    backgroundElement: '#F4F4F6',
    backgroundSelected: '#E8E9ED',
    textSecondary: '#6B7280',

    primary: '#FF4D8D',
    secondary: '#7C3AED',
    border: '#E5E7EB',

    success: '#22C55E',
    warning: '#F59E0B',
    danger: '#EF4444',
  },

  dark: {
    text: '#FFFFFF',
    background: '#0F0F12',
    backgroundElement: '#17171C',
    backgroundSelected: '#23232B',
    textSecondary: '#9CA3AF',

    primary: '#FF4D8D',
    secondary: '#8B5CF6',
    border: 'rgba(255,255,255,0.06)',

    success: '#22C55E',
    warning: '#F59E0B',
    danger: '#EF4444',
  },

  landing: {
    heroBackground: '#0B0B0F',
    heroOverlay: 'rgba(0,0,0,0.60)',

    card: '#17171C',
    cardBorder: 'rgba(255,255,255,0.06)',

    primaryButton: '#FF4D8D',
    secondaryButton: '#8B5CF6',

    title: '#FFFFFF',
    subtitle: '#B1B1B7',

    statCard: '#1C1C22',

    online: '#3BFF87',

    gradientStart: '#FF4D8D',
    gradientEnd: '#7C3AED',
  },

  profile: {
    background: '#0F0F12',

    profileCard: '#17171C',
    statsCard: '#1B1B22',

    chipBackground: '#26262D',

    title: '#FFFFFF',
    subtitle: '#A1A1AA',

    accent: '#FF4D8D',

    border: 'rgba(255,255,255,0.05)',

    editButton: '#FF4D8D',

    compatibility: '#8B5CF6',
    success: '#3BFF87',
  },
} as const;

export type ThemeColor =
  keyof typeof Colors.light &
  keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },

  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },

  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
  seven: 80,
  eight: 120,
} as const;

export const Radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  full: 999,
} as const;

export const BottomTabInset =
  Platform.select({
    ios: 50,
    android: 80,
  }) ?? 0;

export const MaxContentWidth = 800;