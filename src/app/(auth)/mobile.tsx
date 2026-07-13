import React, { useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';

import CustomButton from '@/components/ui/CustomButton';
import CustomInput from '@/components/ui/CustomInput';
import { ThemedText } from '@/components/themed-text';

import { useAuth } from '@/context/AuthContext';

export default function MobileScreen() {
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const { sendOtp } = useAuth();

  const handleSendOtp = async () => {
    setError('');
    setGeneratedOtp(null);

    const trimmedMobile = mobile.trim();
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(trimmedMobile)) {
      setError('Mobile number must be exactly 10 digits (e.g. 9876543210).');
      return;
    }
    if (!acceptedTerms) {
      setError('Please accept terms and conditions');
      return;
    }

    setLoading(true);
    try {
      const result = await sendOtp(trimmedMobile);
      if (result.success) {
        // Show OTP on this screen first, then navigate
        setGeneratedOtp(result.otp || null);
        
        // Navigate to OTP screen with mobile and dev OTP
        router.push({
          pathname: '/(auth)/otp',
          params: {
            type: 'mobile',
            contact: trimmedMobile,
            // In dev mode, backend returns the OTP — pass it for display
            devOtp: result.otp || '',
          },
        });
      } else {
        setError(result.error || 'Failed to send OTP. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Make sure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = !mobile.trim() || mobile.trim().length !== 10 || loading;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View>
          <ThemedText style={styles.title}>What's your number?</ThemedText>
          <ThemedText style={styles.subtitle}>
            We'll send a 6-digit OTP to verify your mobile number. If you're new, an account will be created automatically.
          </ThemedText>
        </View>

        <View style={styles.formContainer}>
          <CustomInput 
            placeholder="Mobile Number (10 digits)" 
            keyboardType="phone-pad"
            value={mobile}
            maxLength={10}
            onChangeText={(text) => {
              // Strip non-numeric characters for safety
              const numericText = text.replace(/[^0-9]/g, '');
              setMobile(numericText);
              setGeneratedOtp(null);
              setError('');
            }}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Terms and Conditions Checkbox */}
          <View style={styles.termsCheckboxRow}>
            <TouchableOpacity 
              style={styles.checkboxContainer} 
              onPress={() => {
                setAcceptedTerms(prev => !prev);
                setError('');
              }}
            >
              <Feather 
                name={acceptedTerms ? "check-square" : "square"} 
                size={20} 
                color={acceptedTerms ? "#FF4D8D" : "#9B9BA1"} 
              />
            </TouchableOpacity>
            <View style={styles.termsTextRow}>
              <ThemedText style={styles.termsNormalText}>I agree to the </ThemedText>
              <TouchableOpacity onPress={() => setShowTermsModal(true)}>
                <ThemedText style={styles.termsLinkText}>Terms and Conditions</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          <CustomButton
            title={loading ? "Sending OTP..." : "Send OTP"}
            onPress={handleSendOtp}
            disabled={isDisabled}
          />

          {loading && (
            <ActivityIndicator size="small" color="#FF4D8D" style={{ marginTop: 8 }} />
          )}

          {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

          {/* Show generated OTP from backend (dev mode) */}
          {generatedOtp && (
            <View style={styles.otpCard}>
              <View style={styles.otpCardHeader}>
                <ThemedText style={styles.otpCardIcon}>🔑</ThemedText>
                <ThemedText style={styles.otpCardTitle}>OTP Generated (Dev Mode)</ThemedText>
              </View>
              <ThemedText style={styles.otpCardValue}>{generatedOtp}</ThemedText>
              <ThemedText style={styles.otpCardNote}>
                This OTP is shown here because no SMS gateway is configured yet. Use this code on the next screen.
              </ThemedText>
            </View>
          )}
        </View>

        <View style={styles.hintContainer}>
          <ThemedText style={styles.hintText}>
            💡 Both new and existing users can continue with their mobile number.
          </ThemedText>
        </View>
      </ScrollView>

      {/* Terms and Conditions Modal */}
      <Modal
        visible={showTermsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTermsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Terms & Conditions</ThemedText>
              <TouchableOpacity 
                style={styles.modalCloseBtn}
                onPress={() => setShowTermsModal(false)}
              >
                <Feather name="x" size={22} color="#fff" />
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
                All information, data, biodata, photos, and credentials submitted by you must be accurate, truthful, and up-to-date. Misrepresentation of any details will lead to immediate account suspension.
              </ThemedText>

              <ThemedText style={styles.termsSectionTitle}>3. Account Safety</ThemedText>
              <ThemedText style={styles.termsParagraph}>
                You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account.
              </ThemedText>

              <ThemedText style={styles.termsSectionTitle}>4. User Conduct</ThemedText>
              <ThemedText style={styles.termsParagraph}>
                VVS Matrimony is strictly for matrimonial matchmaking purposes. Any misuse of contact information, harassment, or abusive behavior will not be tolerated and may result in legal action.
              </ThemedText>

              <ThemedText style={styles.termsSectionTitle}>5. Verification</ThemedText>
              <ThemedText style={styles.termsParagraph}>
                While VVS Matrimony takes measures to verify profiles, we recommend that users perform their own background verification before making any commitments.
              </ThemedText>

              <ThemedText style={styles.termsSectionTitle}>6. Privacy Policy</ThemedText>
              <ThemedText style={styles.termsParagraph}>
                Your data and photos are collected and stored securely in accordance with our Privacy Policy.
              </ThemedText>
            </ScrollView>
            
            <TouchableOpacity 
              style={styles.modalAcceptButton} 
              onPress={() => {
                setAcceptedTerms(true);
                setShowTermsModal(false);
                setError('');
              }}
            >
              <ThemedText style={styles.modalAcceptButtonText}>Accept & Agree</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    gap: 32,
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
  hintContainer: {
    backgroundColor: 'rgba(255, 77, 141, 0.08)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 141, 0.15)',
  },
  hintText: {
    color: '#B0B0BE',
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
    color: '#9B9BA1',
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
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#17171C',
    borderRadius: 24,
    width: '100%',
    maxHeight: '85%',
    padding: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 77, 141, 0.2)',
    gap: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    paddingBottom: 14,
  },
  modalTitle: {
    color: '#fff',
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
    color: '#B0B0BE',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  termsSectionTitle: {
    color: '#fff',
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
