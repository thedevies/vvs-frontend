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

export default function ForgotPasswordScreen() {
  return (
    <ImageBackground
      source={{
        uri: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1200&auto=format&fit=crop',
      }}
      style={styles.background}>
      <View style={styles.overlay}>
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.container}>
            <View>
              <ThemedText style={styles.title}>Reset Password</ThemedText>

              <ThemedText style={styles.subtitle}>
                Enter your email address and we will send you a link to reset your password.
              </ThemedText>
            </View>

            <View style={styles.formContainer}>
              <CustomInput placeholder="Email Address" />

              <CustomButton
                title="Send Reset Link"
                onPress={() => router.push('/login')}
              />
            </View>

            <TouchableOpacity onPress={() => router.push('/login')}>
              <ThemedText style={styles.bottomText}>
                Remember your password? Login
              </ThemedText>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 32,
  },
  title: {
    color: '#fff',
    fontSize: 42,
    fontWeight: '800',
  },
  subtitle: {
    color: '#B1B1B7',
    marginTop: 12,
    lineHeight: 24,
  },
  formContainer: {
    gap: 18,
  },
  bottomText: {
    color: '#FF4D8D',
    textAlign: 'center',
  },
});
