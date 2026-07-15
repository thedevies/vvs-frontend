import React from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  ImageBackground,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";
import { useLanguage } from "@/context/LanguageContext";
import { useAppTheme } from "@/context/ThemeContext";
import { testimonials } from "./index";

const DARK = "#0B0B0D";
const CARD = "#17171C";
const CARD2 = "#1A1A24";
const WHITE = "#FFFFFF";
const PINK = "#FF4D8D";

export default function SuccessStoriesScreen() {
  const { language } = useLanguage();
  const { colors, isDark } = useAppTheme();
  const isMr = language === "mr";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      {/* Header bar */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: colors.text }]}>
          {isMr ? "यशस्वी कथा" : "Success Stories"}
        </ThemedText>
        <View style={styles.headerRightPlaceholder} />
      </View>

      {/* Stories list */}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText style={[styles.subtitle, { color: colors.muted }]}>
          {isMr
            ? "वासुदेव विवाह सोहळा च्या माध्यमातून एकत्र आलेल्या जोडप्यांचे अनुभव."
            : "Beautiful matches united through Vasudev Vivah Sohala."}
        </ThemedText>

        <View style={styles.listContainer}>
          {testimonials.map((t, i) => (
            <View key={i} style={[styles.testimonialCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.testimonialTop}>
                <View>
                  <ImageBackground
                    source={{ uri: t.avatar }}
                    style={styles.testimonialAvatar}
                    imageStyle={{ borderRadius: 30 }}
                  />
                  <View style={[styles.heartBadge, { backgroundColor: colors.card2 }]}>
                    <ThemedText style={{ fontSize: 11 }}>💍</ThemedText>
                  </View>
                </View>
                <View style={styles.testimonialMeta}>
                  <ThemedText style={[styles.testimonialCouple, { color: colors.text }]}>
                    {isMr ? t.coupleMr : t.coupleEn}
                  </ThemedText>
                  <ThemedText style={styles.testimonialCity}>
                    📍 {t.cityMr}
                  </ThemedText>
                  <ThemedText style={styles.testimonialMarried}>
                    {t.married}
                  </ThemedText>
                </View>
              </View>
              <ThemedText style={styles.testimonialQuote}>
                "{isMr ? t.quoteMr : t.quoteEn}"
              </ThemedText>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK,
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 77, 141, 0.15)",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: WHITE,
    fontSize: 20,
    fontWeight: "800",
  },
  headerRightPlaceholder: {
    width: 40,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  subtitle: {
    color: "#8E8E95",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 24,
  },
  listContainer: {
    gap: 18,
  },
  testimonialCard: {
    backgroundColor: CARD,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  testimonialTop: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 14,
  },
  testimonialAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  heartBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: CARD2,
    borderRadius: 99,
    width: 22,
    height: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  testimonialMeta: {
    flex: 1,
    justifyContent: "center",
  },
  testimonialCouple: {
    color: WHITE,
    fontSize: 18,
    fontWeight: "800",
  },
  testimonialCity: {
    color: PINK,
    fontSize: 13,
    marginTop: 3,
  },
  testimonialMarried: {
    color: "#3BFF87",
    fontSize: 12,
    marginTop: 3,
    fontWeight: "600",
  },
  testimonialQuote: {
    color: "#D0D0DC",
    fontSize: 14,
    lineHeight: 22,
    fontStyle: "italic",
  },
});
