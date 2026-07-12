import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';

import CustomButton from '@/components/ui/CustomButton';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/AuthContext';

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

  const handleVerify = async () => {
    if (otp.length !== 6) return;
    
    setError('');
    setLoading(true);

    try {
      const result = await login(contact || '', otp);
      
      if (result.success) {
        // Auth guard in _layout.tsx will auto-redirect to (app)
        // If user has no profile → edit-profile, otherwise → home
      } else {
        setError(result.error || 'Invalid OTP. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!contact) return;

    setResending(true);
    setError('');

    try {
      const result = await sendOtp(contact);
      if (result.success && result.otp) {
        // Update displayed OTP with the new one from backend
        setCurrentOtp(result.otp);
        setOtp(''); // Clear the input so user enters the new OTP
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
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View>
          <ThemedText style={styles.title}>Enter OTP</ThemedText>
          <ThemedText style={styles.subtitle}>
            We've sent a 6-digit verification code to{' '}
            <ThemedText style={styles.contactHighlight}>{contact || 'your mobile'}</ThemedText>.
          </ThemedText>
        </View>

        {/* Dev mode OTP display — shows OTP from backend */}
        {currentOtp ? (
          <View style={styles.otpCard}>
            <View style={styles.otpCardHeader}>
              <ThemedText style={styles.otpCardIcon}>🔑</ThemedText>
              <ThemedText style={styles.otpCardTitle}>Your OTP (Dev Mode)</ThemedText>
            </View>
            <ThemedText style={styles.otpCardValue}>{currentOtp}</ThemedText>
            <ThemedText style={styles.otpCardNote}>
              No SMS gateway configured yet. Enter this code below to verify.
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
              placeholderTextColor="#555"
              autoFocus
            />
          </View>

          <CustomButton
            title={loading ? "Verifying..." : "Verify & Continue"}
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
              {resending ? 'Resending...' : (
                <>Didn't receive code? <ThemedText style={styles.resendLink}>Resend OTP</ThemedText></>
              )}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F12',
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
    color: '#fff',
    fontSize: 34,
    fontWeight: '800',
  },
  subtitle: {
    color: '#9B9BA1',
    marginTop: 12,
    lineHeight: 24,
    fontSize: 16,
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
    color: '#3BFF87',
    fontSize: 14,
    fontWeight: '700',
  },
  otpCardValue: {
    color: '#3BFF87',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 10,
    textAlign: 'center',
  },
  otpCardNote: {
    color: '#8E8E95',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  formContainer: {
    gap: 24,
  },
  otpInputContainer: {
    backgroundColor: '#17171C',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  otpInput: {
    color: '#fff',
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
    color: '#8B8B91',
    fontSize: 14,
  },
  resendLink: {
    color: '#FF4D8D',
    fontWeight: '600',
  },
});
