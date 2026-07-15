import { Stack } from 'expo-router';
import { useAppTheme } from '@/context/ThemeContext';

export default function AppLayout() {
  const { colors } = useAppTheme();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />;
}
