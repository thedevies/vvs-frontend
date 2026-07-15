import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

type Theme = 'light' | 'dark';

export const ThemeColors = {
  dark: {
    // Standard keys
    text: '#FFFFFF',
    background: '#0B0B0D',
    backgroundElement: '#17171C',
    backgroundSelected: '#23232B',
    textSecondary: '#9CA3AF',
    primary: '#FF4D8D',
    secondary: '#8B5CF6',
    border: 'rgba(255, 255, 255, 0.08)',
    success: '#22C55E',
    warning: '#F59E0B',
    danger: '#EF4444',

    // Extra custom keys
    card: '#17171C',
    card2: '#1A1A24',
    muted: '#8E8E95',
    pink: '#FF4D8D',
    white: '#FFFFFF',
    modalOverlay: 'rgba(0, 0, 0, 0.75)',
    inputBg: '#1A1A22',
  },
  light: {
    // Standard keys
    text: '#111111',
    background: '#F5F5F7',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E8E9ED',
    textSecondary: '#6B7280',
    primary: '#FF4D8D',
    secondary: '#7C3AED',
    border: 'rgba(0, 0, 0, 0.1)',
    success: '#22C55E',
    warning: '#F59E0B',
    danger: '#EF4444',

    // Extra custom keys
    card: '#FFFFFF',
    card2: '#EAEAEA',
    muted: '#6C6C70',
    pink: '#FF4D8D',
    white: '#111111',
    modalOverlay: 'rgba(0, 0, 0, 0.5)',
    inputBg: '#FFFFFF',
  },
};

type ThemeContextType = {
  theme: Theme;
  isDark: boolean;
  colors: typeof ThemeColors.dark;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  isDark: true,
  colors: ThemeColors.dark,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');

  useEffect(() => {
    SecureStore.getItemAsync('app_theme').then((savedTheme) => {
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setThemeState(savedTheme);
      }
    });
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setThemeState(nextTheme);
    SecureStore.setItemAsync('app_theme', nextTheme);
  };

  const isDark = theme === 'dark';
  const colors = isDark ? ThemeColors.dark : ThemeColors.light;

  return (
    <ThemeContext.Provider value={{ theme, isDark, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useAppTheme = () => useContext(ThemeContext);
