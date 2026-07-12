import React from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import CustomButton from '@/components/ui/CustomButton';
import { ThemedText } from '@/components/themed-text';

export default function EmailScreen() {
  const handleContinue = () => {
    Alert.alert(
      'Coming Soon',
      'Email login is not yet supported. Please use your mobile number to sign in.',
      [
        { text: 'Go to Mobile Login', onPress: () => router.replace('/(auth)/mobile') },
        { text: 'Cancel', onPress: () => router.back() },
      ]
    );
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
          <ThemedText style={styles.title}>Email Login</ThemedText>
          <ThemedText style={styles.subtitle}>
            Email authentication is coming soon. Please use your mobile number to sign in for now.
          </ThemedText>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.comingSoonCard}>
            <ThemedText style={styles.comingSoonEmoji}>🚧</ThemedText>
            <ThemedText style={styles.comingSoonTitle}>Coming Soon</ThemedText>
            <ThemedText style={styles.comingSoonDesc}>
              We're working on adding email-based authentication. For now, you can sign in using your mobile number.
            </ThemedText>
          </View>

          <CustomButton
            title="Continue with Mobile"
            onPress={() => router.replace('/(auth)/mobile')}
          />
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
    gap: 24,
  },
  comingSoonCard: {
    backgroundColor: '#17171C',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  comingSoonEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  comingSoonTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  comingSoonDesc: {
    color: '#9B9BA1',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
});
