import React, { useState, useRef, useEffect } from "react";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Alert,
  ImageBackground,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Animated,
} from "react-native";
import { Feather, FontAwesome } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { ThemedText } from "@/components/themed-text";

export default function WelcomeScreen() {
  const [showLoginOptions, setShowLoginOptions] = useState(false);
  const [fontsLoaded] = useFonts({
    YatraOne: require("@/assets/fonts/YatraOne-Regular.ttf"),
  });

  // Bounce animation for scroll indicator
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const bounce = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: 10, duration: 600, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ])
    );
    bounce.start();
    return () => bounce.stop();
  }, []);

  const handleShowLogin = () => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    setShowLoginOptions(true);
  };

  if (!fontsLoaded) return null;

  const handleGoogleSignUp = () => {
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
    <ImageBackground
      source={{
        uri: "https://imgs.search.brave.com/Fd0NF4oH9SjDYO_Ooo1QUzLEugWEG4Q9PSz98pn5T-Y/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pLnBp/bmltZy5jb20vb3Jp/Z2luYWxzLzJiLzBk/LzE2LzJiMGQxNjVm/NzQ2NmM5OWY5Mjhj/NWU3OWI5YjMyMDlm/LmpwZw",
      }}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.headerContainer}>
              <ThemedText style={styles.title}>
                Welcome to{"\n"}
                <ThemedText style={styles.brandTitle}>
                  वासुदेव विवाह सोहळा
                </ThemedText>
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                Find someone who matches your energy, ambition, and lifestyle.
              </ThemedText>
            </View>

            <View style={styles.buttonContainer}>
              {!showLoginOptions ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.mainLoginButton}
                  onPress={handleShowLogin}
                >
                  <ThemedText style={styles.mainLoginText}>Log In</ThemedText>
                  <Feather name="arrow-right" size={20} color="#fff" />
                </TouchableOpacity>
              ) : (
                <View style={styles.loginOptionsWrapper}>
                  {/* Back Button */}
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => {
                      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
                      setShowLoginOptions(false);
                    }}
                  >
                    <Feather name="arrow-left" size={22} color="#fff" />
                  </TouchableOpacity>

                  {/* Google — Coming Soon */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={[styles.optionButton, styles.googleButton]}
                    onPress={handleGoogleSignUp}
                  >
                    <View style={styles.googleIconContainer}>
                      <FontAwesome name="google" size={18} color="#EA4335" />
                    </View>
                    <ThemedText style={styles.googleButtonText}>
                      Continue with Google
                    </ThemedText>
                  </TouchableOpacity>

                  {/* Email — Coming Soon */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.optionButton}
                    onPress={handleEmailLogin}
                  >
                    <View style={styles.iconContainer}>
                      <Feather name="mail" size={18} color="#fff" />
                    </View>
                    <ThemedText style={styles.optionButtonText}>
                      Continue with Email
                    </ThemedText>
                  </TouchableOpacity>

                  {/* Mobile — Active */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={[styles.optionButton, styles.mobileActiveButton]}
                    onPress={() => router.push("/(auth)/mobile")}
                  >
                    <View style={[styles.iconContainer, styles.mobileIconActive]}>
                      <Feather name="smartphone" size={18} color="#fff" />
                    </View>
                    <ThemedText style={styles.optionButtonText}>
                      Continue with Mobile
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Scroll-down bounce indicator */}
            <Animated.View
              style={[
                styles.scrollIndicator,
                { opacity: fadeAnim, transform: [{ translateY: bounceAnim }] },
              ]}
            >
              <Feather name="chevron-down" size={22} color="rgba(255,255,255,0.6)" />
              <Feather name="chevron-down" size={22} color="rgba(255,255,255,0.3)" style={{ marginTop: -12 }} />
            </Animated.View>

            <View style={styles.footerContainer}>
              <ThemedText style={styles.termsText}>
                By continuing, you agree to our{" "}
                <ThemedText style={styles.termsLink}>Terms of Service</ThemedText>{" "}
                and{" "}
                <ThemedText style={styles.termsLink}>Privacy Policy</ThemedText>.
              </ThemedText>
            </View>
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
    backgroundColor: "rgba(0, 0, 0, 0.54)",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "space-between",
    paddingHorizontal: 28,
    paddingTop: 80,
    paddingBottom: 20,
  },
  brandTitle: {
    fontFamily: "YatraOne",
    color: "#FF6EA8",
    fontSize: 40,
    textAlign: "center",
    lineHeight: 48,
    letterSpacing: 0.6,
    textShadowColor: "rgba(0, 0, 0, 0.38)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
  },
  headerContainer: {
    gap: 16,
    alignItems: "center",
  },
  buttonContainer: {
    marginTop: 45,
    minHeight: 185,
  },
  mainLoginButton: {
    height: 45,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
  },
  mainLoginText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  loginOptionsWrapper: {
    position: "absolute",
    width: "100%",
  },
  googleIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  googleButtonText: {
    color: "#222",
    fontSize: 15,
    fontWeight: "700",
  },
  optionButton: {
    height: 44,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  googleButton: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E5E5",
  },
  mobileActiveButton: {
    borderColor: "rgba(255, 77, 141, 0.4)",
    backgroundColor: "rgba(255, 77, 141, 0.12)",
  },
  mobileIconActive: {
    backgroundColor: "rgba(255, 77, 141, 0.3)",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  optionButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  title: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: "#B1B1B7",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  scrollIndicator: {
    alignItems: "center",
    paddingVertical: 14,
  },
  footerContainer: {
    marginTop: 8,
  },
  termsText: {
    color: "#8B8B91",
    textAlign: "center",
    fontSize: 12,
    lineHeight: 18,
  },
  termsLink: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },
});
