import React from 'react';
import { Modal, StyleSheet, TouchableOpacity, View, Pressable, Alert } from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ThemedText } from '../themed-text';

type AuthModalProps = {
  visible: boolean;
  onClose: () => void;
};

export default function AuthModal({ visible, onClose }: AuthModalProps) {
  const handleMobileLogin = () => {
    onClose();
    router.push('/(auth)/mobile');
  };

  const handleGoogleLogin = () => {
    Alert.alert(
      "Coming Soon",
      "Google login will be available in a future update. Please use mobile number to continue.",
      [{ text: "OK" }]
    );
  };

  const handleEmailLogin = () => {
    Alert.alert(
      "Coming Soon",
      "Email login will be available in a future update. Please use mobile number to continue.",
      [{ text: "OK" }]
    );
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Feather name="x" size={20} color="#fff" />
          </TouchableOpacity>

          <ThemedText style={styles.emoji}>🦚</ThemedText>
          
          <ThemedText style={styles.title}>Join VVS Matrimony</ThemedText>
          
          <ThemedText style={styles.subtitle}>
            Create an account or login to browse full profiles, send connection requests, and connect with matches.
          </ThemedText>

          <View style={styles.buttonContainer}>
            {/* Mobile login option */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.button, styles.mobileActiveButton]}
              onPress={handleMobileLogin}
            >
              <Feather name="smartphone" size={18} color="#fff" style={styles.buttonIcon} />
              <ThemedText style={styles.buttonText}>Continue with Mobile</ThemedText>
            </TouchableOpacity>

            {/* Google option */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.button, styles.googleButton]}
              onPress={handleGoogleLogin}
            >
              <FontAwesome name="google" size={18} color="#EA4335" style={styles.buttonIcon} />
              <ThemedText style={styles.googleButtonText}>Continue with Google</ThemedText>
            </TouchableOpacity>

            {/* Email option */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.button}
              onPress={handleEmailLogin}
            >
              <Feather name="mail" size={18} color="#fff" style={styles.buttonIcon} />
              <ThemedText style={styles.buttonText}>Continue with Email</ThemedText>
            </TouchableOpacity>
          </View>

          <ThemedText style={styles.footerText}>
            By continuing, you agree to our Terms of Service & Privacy Policy.
          </ThemedText>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: '#17171C',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 24,
    width: '100%',
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  emoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#9B9BA1',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 20,
  },
  button: {
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  mobileActiveButton: {
    borderColor: 'rgba(255, 77, 141, 0.4)',
    backgroundColor: 'rgba(255, 77, 141, 0.15)',
  },
  googleButton: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  googleButtonText: {
    color: '#111',
    fontSize: 15,
    fontWeight: '700',
  },
  footerText: {
    color: '#555',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
});
