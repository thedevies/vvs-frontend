import React, { useState, useEffect } from "react";
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
  BackHandler,
} from "react-native";
import { Feather, FontAwesome } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";

export default function WelcomeScreen() {
  const [showLoginOptions, setShowLoginOptions] = useState(false);
  const [fontsLoaded] = useFonts({
    YatraOne: require("@/assets/fonts/YatraOne-Regular.ttf"),
  });
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

  const handleShowLogin = () => {
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
          <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleBack}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(0,0,0,0.4)',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Feather name="arrow-left" size={22} color="#FFF" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.headerContainer}>
              <ThemedText style={styles.title}>
                {t('welcomeTo')}{"\n"}
                <ThemedText style={styles.brandTitle}>
                  {t('brandTitle')}
                </ThemedText>
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                {t('welcomeSub')}
              </ThemedText>
            </View>

            <View style={styles.buttonContainer}>
              {!showLoginOptions ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.mainLoginButton}
                  onPress={handleShowLogin}
                >
                  <ThemedText style={styles.mainLoginText}>{t('logIn')}</ThemedText>
                  <Feather name="arrow-right" size={20} color={isDark ? "#fff" : colors.text} />
                </TouchableOpacity>
              ) : (
                <View style={styles.loginOptionsWrapper}>
                  {/* Back Button */}
                  {/* Google */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={[styles.optionButton, styles.googleButton]}
                    onPress={handleGoogleSignUp}
                  >
                    <View style={styles.googleIconContainer}>
                      <FontAwesome name="google" size={18} color="#EA4335" />
                    </View>
                    <ThemedText style={styles.googleButtonText}>
                      {t('continueWithGoogle')}
                    </ThemedText>
                  </TouchableOpacity>

                  {/* Email */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.optionButton}
                    onPress={handleEmailLogin}
                  >
                    <View style={styles.iconContainer}>
                      <Feather name="mail" size={18} color={isDark ? "#fff" : colors.text} />
                    </View>
                    <ThemedText style={styles.optionButtonText}>
                      {t('continueWithEmail')}
                    </ThemedText>
                  </TouchableOpacity>

                  {/* Mobile — Active */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={[styles.optionButton, styles.mobileActiveButton]}
                    onPress={() => router.push("/(auth)/mobile")}
                  >
                    <View style={[styles.iconContainer, styles.mobileIconActive]}>
                      <Feather name="smartphone" size={18} color="#FF4D8D" />
                    </View>
                    <ThemedText style={styles.mobileOptionText}>
                      {t('continueWithMobile')}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.footerContainer}>
              <ThemedText style={styles.termsText}>
                {t('byContinuingAgree')}{" "}
                <ThemedText style={styles.termsLink}>{t('termsOfService')}</ThemedText>{" "}
                {t('and')}{" "}
                <ThemedText style={styles.termsLink}>{t('privacyPolicy')}</ThemedText>.
              </ThemedText>
            </View>
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
      backgroundColor: isDark ? "rgba(0, 0, 0, 0.65)" : "rgba(255, 255, 255, 0.88)",
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
      color: "#FF4D8D",
      fontSize: 38,
      textAlign: "center",
      lineHeight: 48,
      letterSpacing: 0.6,
      textShadowColor: isDark ? "rgba(0, 0, 0, 0.38)" : "rgba(255, 255, 255, 0.5)",
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
      height: 48,
      borderRadius: 18,
      backgroundColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)",
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.12)",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 22,
    },
    mainLoginText: {
      color: isDark ? "#fff" : colors.text,
      fontSize: 17,
      fontWeight: "700",
      letterSpacing: 0.3,
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
      height: 46,
      borderRadius: 18,
      backgroundColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.05)",
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
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
      backgroundColor: "rgba(255, 77, 141, 0.2)",
    },
    iconContainer: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 14,
    },
    optionButtonText: {
      color: isDark ? "#fff" : colors.text,
      fontSize: 15,
      fontWeight: "600",
    },
    mobileOptionText: {
      color: "#FF4D8D",
      fontSize: 15,
      fontWeight: "700",
    },
    title: {
      color: isDark ? "#fff" : colors.text,
      fontSize: 32,
      fontWeight: "800",
      textAlign: "center",
      letterSpacing: -0.5,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 15,
      textAlign: "center",
      lineHeight: 23,
      paddingHorizontal: 20,
    },
    footerContainer: {
      marginTop: 8,
    },
    termsText: {
      color: colors.textSecondary,
      textAlign: "center",
      fontSize: 12,
      lineHeight: 18,
    },
    termsLink: {
      color: "#FF4D8D",
      fontWeight: "700",
      fontSize: 12,
    },
  });
