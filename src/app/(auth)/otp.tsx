import React, { useState, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View, TextInput, BackHandler } from 'react-native';
import { Feather } from '@expo/vector-icons';

import CustomButton from '@/components/ui/CustomButton';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

import { CustomAlert as Alert } from '@/utils/alert';

export default function OTPScreen() {
  const { type, contact, devOtp } = useLocalSearchParams<{
    type?: string;
    contact?: string;
    devOtp?: string;
  }>();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [currentOtp, setCurrentOtp] = useState(devOtp || '');
  const { login, sendOtp } = useAuth();
  const { colors, isDark } = useAppTheme();
  const { t } = useLanguage();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(app)');
    }
  };

  useEffect(() => {
    const onBackPress = () => {
      handleBack();
      return true;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, []);

  const styles = getStyles(colors, isDark);

  const executeLogin = async (confirmNewDevice = false) => {
    if (otp.length !== 6) return;

    setError('');
    setLoading(true);

    try {
      const result = await login(contact || '', otp, confirmNewDevice);

      if (result.success) {
        // Redirect handled by AuthContext / root layout
      } else if (result.hasActiveSession) {
        Alert.alert(
          'Active Session Detected',
          'Previous session to previous device is active. If you login here, previous session will be logged out.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'OK',
              onPress: () => executeLogin(true),
            },
          ]
        );
      } else {
        setError(result.error || t('invalidOtpError'));
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = () => executeLogin(false);

  const handleResend = async () => {
    if (!contact) return;

    setResending(true);
    setError('');

    try {
      const result = await sendOtp(contact);
      if (result.success && result.otp) {
        setCurrentOtp(result.otp);
        setOtp('');
      } else {
        setError(result.error || 'Failed to resend OTP.');
      }
    } catch (err: any) {
      setError('Failed to resend. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {!loading && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Feather name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View>
          <ThemedText style={styles.title}>{t('enterOtp')}</ThemedText>
          <ThemedText style={styles.subtitle}>
            {t('otpSub')}{' '}
            <ThemedText style={styles.contactHighlight}>{contact || t('yourMobile')}</ThemedText>.
          </ThemedText>
        </View>

        {/* Dev mode OTP display */}
        {currentOtp ? (
          <View style={styles.otpCard}>
            <View style={styles.otpCardHeader}>
              <ThemedText style={styles.otpCardIcon}>🔑</ThemedText>
              <ThemedText style={styles.otpCardTitle}>{t('yourOtpDev')}</ThemedText>
            </View>
            <ThemedText style={styles.otpCardValue}>{currentOtp}</ThemedText>
            <ThemedText style={styles.otpCardNote}>
              {t('otpCardDevNote')}
            </ThemedText>
          </View>
        ) : null}

        <View style={styles.formContainer}>
          <View style={styles.otpInputContainer}>
            <TextInput
              style={styles.otpInput}
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={(text) => {
                setOtp(text);
                setError('');
              }}
              placeholder="------"
              placeholderTextColor={colors.muted}
              autoFocus
            />
          </View>

          <CustomButton
            title={loading ? t('verifying') : t('verifyAndContinue')}
            onPress={handleVerify}
            disabled={otp.length !== 6 || loading}
          />

          {loading && (
            <ActivityIndicator size="small" color="#FF4D8D" style={{ marginTop: 4 }} />
          )}

          {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

          <TouchableOpacity
            style={styles.resendContainer}
            onPress={handleResend}
            disabled={resending}
          >
            <ThemedText style={styles.resendText}>
              {resending ? t('resending') : (
                <>{t('didntReceiveCode')} <ThemedText style={styles.resendLink}>{t('resendOtp')}</ThemedText></>
              )}
            </ThemedText>
          </TouchableOpacity>
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
      gap: 24,
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
    contactHighlight: {
      color: '#FF4D8D',
      fontWeight: '700',
    },
    otpCard: {
      backgroundColor: 'rgba(59, 255, 135, 0.06)',
      borderRadius: 20,
      padding: 20,
      borderWidth: 1.5,
      borderColor: 'rgba(59, 255, 135, 0.25)',
      alignItems: 'center',
      gap: 10,
    },
    otpCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    otpCardIcon: {
      fontSize: 20,
    },
    otpCardTitle: {
      color: '#22C55E',
      fontSize: 14,
      fontWeight: '700',
    },
    otpCardValue: {
      color: '#22C55E',
      fontSize: 36,
      fontWeight: '900',
      letterSpacing: 10,
      textAlign: 'center',
    },
    otpCardNote: {
      color: colors.textSecondary,
      fontSize: 12,
      lineHeight: 18,
      textAlign: 'center',
    },
    formContainer: {
      gap: 24,
    },
    otpInputContainer: {
      backgroundColor: colors.inputBg,
      borderRadius: 16,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    otpInput: {
      color: colors.text,
      fontSize: 32,
      fontWeight: '700',
      letterSpacing: 16,
      textAlign: 'center',
      width: '100%',
    },
    errorText: {
      color: '#FF7A7A',
      fontSize: 13,
      lineHeight: 18,
      textAlign: 'center',
    },
    resendContainer: {
      alignItems: 'center',
      marginTop: 10,
    },
    resendText: {
      color: colors.textSecondary,
      fontSize: 14,
    },
    resendLink: {
      color: '#FF4D8D',
      fontWeight: '600',
    },
  });
