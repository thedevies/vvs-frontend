import React from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import CustomButton from '@/components/ui/CustomButton';
import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

export default function EmailScreen() {
  const { colors, isDark } = useAppTheme();
  const { t } = useLanguage();

  const styles = getStyles(colors, isDark);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View>
          <ThemedText style={styles.title}>{t('emailLogin')}</ThemedText>
          <ThemedText style={styles.subtitle}>
            {t('emailSub')}
          </ThemedText>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.comingSoonCard}>
            <ThemedText style={styles.comingSoonEmoji}>🚧</ThemedText>
            <ThemedText style={styles.comingSoonTitle}>{t('comingSoon')}</ThemedText>
            <ThemedText style={styles.comingSoonDesc}>
              {t('comingSoonDesc')}
            </ThemedText>
          </View>

          <CustomButton
            title={t('continueWithMobile')}
            onPress={() => router.replace('/(auth)/mobile')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 10,
    },
    backButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'flex-start',
    },
    scrollContainer: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingTop: 20,
      gap: 32,
    },
    title: {
      color: colors.text,
      fontSize: 32,
      fontWeight: '800',
    },
    subtitle: {
      color: colors.textSecondary,
      marginTop: 12,
      lineHeight: 24,
      fontSize: 15,
    },
    formContainer: {
      gap: 24,
    },
    comingSoonCard: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 32,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    comingSoonEmoji: {
      fontSize: 48,
      marginBottom: 16,
    },
    comingSoonTitle: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '800',
      marginBottom: 8,
    },
    comingSoonDesc: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 22,
      textAlign: 'center',
    },
  });
