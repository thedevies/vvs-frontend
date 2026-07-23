import React, { useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';

import CustomButton from '@/components/ui/CustomButton';
import CustomInput from '@/components/ui/CustomInput';
import { ThemedText } from '@/components/themed-text';

import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

export default function MobileScreen() {
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const { sendOtp } = useAuth();
  const { colors, isDark } = useAppTheme();
  const { t } = useLanguage();

  const styles = getStyles(colors, isDark);

  const requestPermissionsAndToken = async () => {
    try {
      console.log('[Permissions] Requesting Storage, Camera, and Notifications permissions...');

      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      console.log('[Permissions] Camera status:', cameraStatus.status);

      const mediaStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('[Permissions] Media Library status:', mediaStatus.status);

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      console.log('[Permissions] Notification status:', finalStatus);

      if (finalStatus === 'granted') {
        try {
          const tokenResult = await Notifications.getDevicePushTokenAsync();
          const fcmToken = tokenResult.data;
          await SecureStore.setItemAsync('vvs_fcm_token', fcmToken);
          console.log('[Push] Device Push Token saved:', fcmToken);
        } catch (tokenErr: any) {
          const mockToken = 'dev-mock-fcm-token-' + Math.random().toString(36).substring(7);
          await SecureStore.setItemAsync('vvs_fcm_token', mockToken);
          console.log('[Push] Using fallback token:', mockToken);
        }
      }
    } catch (err) {
      console.warn('[Push] Error requesting permissions:', err);
    }
  };

  const handleSendOtp = async () => {
    setError('');
    setGeneratedOtp(null);

    const trimmedMobile = mobile.trim();
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(trimmedMobile)) {
      setError(t('mobileErrorDigits'));
      return;
    }
    if (!acceptedTerms) {
      setError(t('termsError'));
      return;
    }

    setLoading(true);
    try {
      const result = await sendOtp(trimmedMobile);
      if (result.success) {
        setGeneratedOtp(result.otp || null);
        router.push({
          pathname: '/(auth)/otp',
          params: {
            type: 'mobile',
            contact: trimmedMobile,
            devOtp: result.otp || '',
          },
        });
      } else {
        setError(result.error || 'Failed to send OTP.');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = !mobile.trim() || mobile.trim().length !== 10 || loading;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {!loading && (
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View>
          <ThemedText style={styles.title}>{t('whatsYourNumber')}</ThemedText>
          <ThemedText style={styles.subtitle}>
            {t('mobileSub')}
          </ThemedText>
        </View>

        <View style={styles.formContainer}>
          <CustomInput
            placeholder={t('mobilePlaceholder')}
            keyboardType="phone-pad"
            value={mobile}
            maxLength={10}
            onChangeText={(text) => {
              const numericText = text.replace(/[^0-9]/g, '');
              setMobile(numericText);
              setGeneratedOtp(null);
              setError('');
            }}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Terms Checkbox */}
          <View style={styles.termsCheckboxRow}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={async () => {
                const nextVal = !acceptedTerms;
                setAcceptedTerms(nextVal);
                setError('');
                if (nextVal) {
                  await requestPermissionsAndToken();
                }
              }}
            >
              <Feather
                name={acceptedTerms ? 'check-square' : 'square'}
                size={20}
                color={acceptedTerms ? '#FF4D8D' : colors.muted}
              />
            </TouchableOpacity>
            <View style={styles.termsTextRow}>
              <ThemedText style={styles.termsNormalText}>{t('iAgreeTo')}</ThemedText>
              <TouchableOpacity onPress={() => setShowTermsModal(true)}>
                <ThemedText style={styles.termsLinkText}>{t('termsAndConditions')}</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          <CustomButton
            title={loading ? t('sendingOtp') : t('sendOtp')}
            onPress={handleSendOtp}
            disabled={isDisabled}
          />

          {loading && (
            <ActivityIndicator size="small" color="#FF4D8D" style={{ marginTop: 8 }} />
          )}

          {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

          {/* Dev Mode OTP Display */}
          {generatedOtp && (
            <View style={styles.otpCard}>
              <View style={styles.otpCardHeader}>
                <ThemedText style={styles.otpCardIcon}>🔑</ThemedText>
                <ThemedText style={styles.otpCardTitle}>{t('otpGeneratedDev')}</ThemedText>
              </View>
              <ThemedText style={styles.otpCardValue}>{generatedOtp}</ThemedText>
              <ThemedText style={styles.otpCardNote}>
                {t('otpDevNote')}
              </ThemedText>
            </View>
          )}
        </View>

        <View style={styles.hintContainer}>
          <ThemedText style={styles.hintText}>
            {t('mobileHint')}
          </ThemedText>
        </View>
      </ScrollView>

      {/* Terms Modal */}
      <Modal
        visible={showTermsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTermsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>{t('termsAndConditions')}</ThemedText>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowTermsModal(false)}
              >
                <Feather name="x" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <ThemedText style={styles.termsParagraph}>
                Welcome to Vasudev Vivah Sohala (VVS Matrimony). By using our app, you agree to comply with and be bound by the following terms and conditions:
              </ThemedText>

              <ThemedText style={styles.termsSectionTitle}>1. Eligibility</ThemedText>
              <ThemedText style={styles.termsParagraph}>
                You must be of legal marriageable age as per Indian laws (18 years for females and 21 years for males) to register and use VVS Matrimony.
              </ThemedText>

              <ThemedText style={styles.termsSectionTitle}>2. Content and Information</ThemedText>
              <ThemedText style={styles.termsParagraph}>
                All information, data, biodata, photos, and credentials submitted by you must be accurate, truthful, and up-to-date.
              </ThemedText>

              <ThemedText style={styles.termsSectionTitle}>3. Account Safety</ThemedText>
              <ThemedText style={styles.termsParagraph}>
                You are responsible for maintaining the confidentiality of your account credentials.
              </ThemedText>
            </ScrollView>

            <TouchableOpacity
              style={styles.modalAcceptButton}
              onPress={async () => {
                setAcceptedTerms(true);
                setShowTermsModal(false);
                setError('');
                await requestPermissionsAndToken();
              }}
            >
              <ThemedText style={styles.modalAcceptButtonText}>{t('acceptAndAgree')}</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
      gap: 20,
    },
    errorText: {
      color: '#FF7A7A',
      fontSize: 13,
      lineHeight: 18,
      textAlign: 'center',
      marginTop: -6,
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
    hintContainer: {
      backgroundColor: isDark ? 'rgba(255, 77, 141, 0.08)' : 'rgba(255, 77, 141, 0.05)',
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: 'rgba(255, 77, 141, 0.2)',
    },
    hintText: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 20,
      textAlign: 'center',
    },
    termsCheckboxRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginVertical: 4,
      paddingHorizontal: 4,
    },
    checkboxContainer: {
      padding: 2,
    },
    termsTextRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      flex: 1,
    },
    termsNormalText: {
      color: colors.textSecondary,
      fontSize: 14,
    },
    termsLinkText: {
      color: '#FF4D8D',
      fontSize: 14,
      fontWeight: '600',
      textDecorationLine: 'underline',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.modalOverlay,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: 24,
      width: '100%',
      maxHeight: '85%',
      padding: 24,
      borderWidth: 1.5,
      borderColor: colors.border,
      gap: 18,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: 14,
    },
    modalTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '800',
    },
    modalCloseBtn: {
      padding: 4,
    },
    modalBody: {
      flexGrow: 1,
    },
    termsParagraph: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 22,
      marginBottom: 16,
    },
    termsSectionTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 8,
      marginTop: 6,
    },
    modalAcceptButton: {
      backgroundColor: '#FF4D8D',
      borderRadius: 16,
      height: 52,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 8,
    },
    modalAcceptButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
    },
  });
