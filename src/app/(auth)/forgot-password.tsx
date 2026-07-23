import React from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import CustomButton from '@/components/ui/CustomButton';
import CustomInput from '@/components/ui/CustomInput';
import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

export default function ForgotPasswordScreen() {
  const { colors, isDark } = useAppTheme();
  const { t } = useLanguage();

  const styles = getStyles(colors, isDark);

  return (
    <ImageBackground
      source={{
        uri: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1200&auto=format&fit=crop',
      }}
      style={styles.background}>
      <View style={styles.overlay}>
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
            <View>
              <ThemedText style={styles.title}>{t('resetPassword')}</ThemedText>

              <ThemedText style={styles.subtitle}>
                {t('resetSub')}
              </ThemedText>
            </View>

            <View style={styles.formContainer}>
              <CustomInput placeholder={t('emailAddress')} />

              <CustomButton
                title={t('sendResetLink')}
                onPress={() => router.push('/(auth)/mobile')}
              />
            </View>

            <TouchableOpacity onPress={() => router.push('/(auth)/mobile')}>
              <ThemedText style={styles.bottomText}>
                {t('rememberPassword')}
              </ThemedText>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    background: {
      flex: 1,
    },
    overlay: {
      flex: 1,
      backgroundColor: isDark ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.85)',
    },
    container: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
      gap: 32,
    },
    title: {
      color: isDark ? '#fff' : colors.text,
      fontSize: 38,
      fontWeight: '800',
    },
    subtitle: {
      color: colors.textSecondary,
      marginTop: 12,
      lineHeight: 24,
    },
    formContainer: {
      gap: 18,
    },
    bottomText: {
      color: '#FF4D8D',
      textAlign: 'center',
      fontWeight: '600',
    },
  });
