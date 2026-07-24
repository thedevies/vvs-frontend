import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Animated,
  Dimensions,
  ImageBackground,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
  BackHandler,
} from "react-native";
import { CustomAlert as Alert } from "@/utils/alert";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useFonts } from "expo-font";
import BottomNavigation from "@/components/navigation/BottomNavigation";
import { ThemedText } from "@/components/themed-text";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { profileApi, notificationApi, successStoryApi, BASE_URL } from "@/utils/api";
import AuthModal from "@/components/ui/AuthModal";
import { useAppTheme } from "@/context/ThemeContext";
import { pickImageWithPermissionCheck } from "@/utils/imagePicker";

const { width: SW, height: SH } = Dimensions.get("window");

const heroImageDark = require("@/assets/images/heroImageDark.jpg");
const heroImageLight = require("@/assets/images/heroImageLight.png");

// ─── Theme (same as profile.tsx / settings.tsx) ───────────────────────────────
const DARK = "#0B0B0D";
const CARD = "#17171C";
const CARD2 = "#1A1A24";
const WHITE = "#FFFFFF";
const MUTED = "#8E8E95";
const PINK = "#FF4D8D";

// ─── Static data ──────────────────────────────────────────────────────────────

const steps = [
  {
    number: "01",
    emoji: "📝",
    en: "Create Profile",
    mr: "प्रोफाइल तयार करा",
    descEn: "Fill in your details, family background and expectations.",
    descMr: "आपली माहिती, कौटुंबिक पार्श्वभूमी आणि अपेक्षा भरा.",
  },
  {
    number: "02",
    emoji: "🔍",
    en: "Discover Matches",
    mr: "जोडीदार शोधा",
    descEn: "Browse verified profiles from the VVS community.",
    descMr: "VVS समुदायातील सत्यापित प्रोफाइल पाहा.",
  },
  {
    number: "03",
    emoji: "💬",
    en: "Connect & Talk",
    mr: "संपर्क साधा",
    descEn: "Send interest and start a meaningful conversation.",
    descMr: "स्वारस्य पाठवा आणि अर्थपूर्ण संवाद सुरू करा.",
  },
  {
    number: "04",
    emoji: "💍",
    en: "Solemnize",
    mr: "विवाह सोहळा",
    descEn: "Meet families and complete your sacred union.",
    descMr: "कुटुंबाला भेटा आणि आपला पवित्र विवाह पूर्ण करा.",
  },
];

const events = [
  {
    emoji: "🪔",
    dateMr: "15 जून 2025",
    dateEn: "15 Jun 2025",
    titleMr: "VVS मेळावा — पुणे",
    titleEn: "VVS Gathering — Pune",
    descMr: "वार्षिक विवाह परिचय सोहळा",
    descEn: "Annual matrimonial introduction event",
    tagMr: "आगामी",
    tagEn: "Upcoming",
    color: "#F5A623",
  },
  {
    emoji: "🌸",
    dateMr: "22 जुलै 2025",
    dateEn: "22 Jul 2025",
    titleMr: "VVS मेळावा — नाशिक",
    titleEn: "VVS Gathering — Nashik",
    descMr: "समुदाय विवाह परिचय कार्यक्रम",
    descEn: "Community matrimonial introduction program",
    tagMr: "नोंदणी सुरू",
    tagEn: "Registering",
    color: "#4CD964",
  },
  {
    emoji: "🎊",
    dateMr: "10 ऑगस्ट 2025",
    dateEn: "10 Aug 2025",
    titleMr: "VVS मेळावा — मुंबई",
    titleEn: "VVS Gathering — Mumbai",
    descMr: "विशेष विवाह परिचय सत्र",
    descEn: "Special matrimonial introduction session",
    tagMr: "लवकरच",
    tagEn: "Coming Soon",
    color: "#5AC8FA",
  },
];

// ─── Sub-components (receive isMr so they re-render on language change) ────────

function SectionHeading({
  mr,
  en,
  isMr,
  rightAction,
}: {
  mr: string;
  en: string;
  isMr: boolean;
  rightAction?: React.ReactNode;
}) {
  return (
    <View style={styles.sectionHeading}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <ThemedText style={styles.sectionTitle}>{isMr ? mr : en}</ThemedText>
        {rightAction}
      </View>
      <View style={styles.sectionLine} />
    </View>
  );
}

function CollapsibleHeading({
  mr,
  en,
  isMr,
  expanded,
  onPress,
}: {
  mr: string;
  en: string;
  isMr: boolean;
  expanded: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <TouchableOpacity
      style={[
        styles.collapsibleHeading,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <ThemedText style={styles.sectionTitle}>{isMr ? mr : en}</ThemedText>
      <View style={[styles.chevronWrap, { backgroundColor: colors.border }]}>
        <Feather
          name={expanded ? "chevron-down" : "chevron-right"}
          size={18}
          color={colors.text}
        />
      </View>
    </TouchableOpacity>
  );
}

function AboutSection({ isMr }: { isMr: boolean }) {
  const { colors } = useAppTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.aboutIconRow}>
        <ThemedText style={styles.aboutIcon}>🦚</ThemedText>
        <View style={styles.pill}>
          <ThemedText style={styles.pillText}>
            {isMr ? "पिढ्यानपिढ्या" : "Since generations"}
          </ThemedText>
        </View>
      </View>
      <ThemedText style={styles.aboutTitle}>वासुदेव विवाह सोहळा</ThemedText>
      <ThemedText style={styles.aboutSub}>VVS Community</ThemedText>
      <ThemedText style={styles.aboutBody}>
        {isMr
          ? "वासुदेव विवाह सोहळा (VVS) ही एक विशेष समाजसेवी संस्था आहे जी वासुदेव समाजातील तरुण-तरुणींसाठी योग्य जीवनसाथी शोधण्यास मदत करते. आमचे उद्दिष्ट म्हणजे परंपरा जपत आधुनिक पद्धतीने विवाह जुळवणे."
          : "VVS is a dedicated platform exclusively for the Vasudev community, helping young individuals find the right life partner while honoring cultural traditions and values."}
      </ThemedText>
      <View style={styles.aboutStats}>
        {[
          { n: "12K+", labelMr: "प्रोफाइल", labelEn: "Profiles" },
          { n: "850+", labelMr: "विवाह", labelEn: "Marriages" },
          { n: "48+", labelMr: "शहरे", labelEn: "Cities" },
        ].map((s) => (
          <View key={s.n} style={styles.aboutStat}>
            <ThemedText style={styles.aboutStatNum}>{s.n}</ThemedText>
            <ThemedText style={styles.aboutStatLbl}>
              {isMr ? s.labelMr : s.labelEn}
            </ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

function HowItWorksSection({ isMr }: { isMr: boolean }) {
  const { colors } = useAppTheme();
  return (
    <View>
      {steps.map((s, i) => (
        <View key={i} style={styles.stepRow}>
          <View style={styles.stepLeft}>
            <View style={styles.stepNumBox}>
              <ThemedText style={styles.stepNum}>{s.number}</ThemedText>
            </View>
            {i < steps.length - 1 && <View style={styles.stepConnector} />}
          </View>
          <View
            style={[
              styles.card,
              styles.stepCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.stepEmojiRow}>
              <ThemedText style={styles.stepEmoji}>{s.emoji}</ThemedText>
              <ThemedText style={styles.stepTitle}>
                {isMr ? s.mr : s.en}
              </ThemedText>
            </View>
            <ThemedText style={styles.stepDesc}>
              {isMr ? s.descMr : s.descEn}
            </ThemedText>
          </View>
        </View>
      ))}
    </View>
  );
}

function EventsSection({ isMr }: { isMr: boolean }) {
  const { colors } = useAppTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.hScroll}
    >
      {events.map((e, i) => (
        <View
          key={i}
          style={[
            styles.card,
            styles.eventCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.eventTagRow}>
            <View
              style={[
                styles.eventTag,
                {
                  backgroundColor: e.color + "22",
                  borderColor: e.color + "55",
                },
              ]}
            >
              <ThemedText style={[styles.eventTagText, { color: e.color }]}>
                {isMr ? e.tagMr : e.tagEn}
              </ThemedText>
            </View>
            <ThemedText style={styles.eventEmoji}>{e.emoji}</ThemedText>
          </View>
          <ThemedText style={styles.eventDate}>
            {isMr ? e.dateMr : e.dateEn}
          </ThemedText>
          <ThemedText style={styles.eventTitle}>
            {isMr ? e.titleMr : e.titleEn}
          </ThemedText>
          <ThemedText style={styles.eventDesc}>
            {isMr ? e.descMr : e.descEn}
          </ThemedText>
          <TouchableOpacity style={styles.pinkBtn}>
            <ThemedText style={styles.pinkBtnText}>
              {isMr ? "नोंदणी करा" : "Register"}
            </ThemedText>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

function TestimonialsSection({
  isMr,
  stories,
}: {
  isMr: boolean;
  stories: any[];
}) {
  const { colors } = useAppTheme();
  const isNavigating = useRef(false);
  const navigateSafe = (route: any) => {
    if (isNavigating.current) return;
    isNavigating.current = true;
    setTimeout(() => {
      isNavigating.current = false;
    }, 1000);
    router.push(route);
  };

  const getStoryPhoto = (item: any): string => {
    if (item.photos && item.photos.length > 0 && item.photos[0].photoUrl) {
      const url = item.photos[0].photoUrl;
      return url.startsWith("http") ? url : `${BASE_URL.replace("/api", "")}${url.startsWith("/") ? url : `/${url}`}`;
    }
    if (item.user?.profile?.profilePhoto) {
      const url = item.user.profile.profilePhoto;
      return url.startsWith("http") ? url : `${BASE_URL.replace("/api", "")}${url.startsWith("/") ? url : `/${url}`}`;
    }
    return "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=400&auto=format&fit=crop";
  };

  if (!stories || stories.length === 0) {
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            padding: 20,
            alignItems: "center",
            gap: 8,
          },
        ]}
      >
        <ThemedText style={{ fontSize: 24 }}>💍</ThemedText>
        <ThemedText style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>
          {isMr ? "पहिली यशोगाथा बना!" : "Be the First Success Story!"}
        </ThemedText>
        <ThemedText
          style={{
            fontSize: 12,
            color: colors.muted,
            textAlign: "center",
            lineHeight: 18,
          }}
        >
          {isMr
            ? "तुमचा विवाह VVS मुळे जुळला आहे का? तुमची सुंदर कथा सर्वांसोबत शेअर करा."
            : "Found your soulmate on VVS? Share your beautiful wedding story with our community."}
        </ThemedText>
        <TouchableOpacity
          style={[styles.pinkBtn, styles.storyCtaButton, { marginTop: 6 }]}
          onPress={() => navigateSafe("/success-stories?action=add")}
        >  
          <ThemedText style={[styles.pinkBtnText, styles.storyCtaButtonText]}>
            {isMr ? "कथा जोडा +" : "Share Your Story +"}
          </ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingRight: 20, gap: 16 }}
    >
      {stories.slice(0, 6).map((t, i) => {
        const photoUrl = getStoryPhoto(t);
        const userName = t.user?.profile?.fullName || (isMr ? "सदस्य" : "Member");
        const partnerName = t.partnerName || (isMr ? "जोडीदार" : "Partner");
        const coupleTitle = `${userName} & ${partnerName}`;
        const city = t.user?.profile?.city || "Vasudev";
        const dateStr = t.marriageDate
          ? new Date(t.marriageDate).toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            })
          : "Married";

        const storyText =
          t.story && t.story.trim().toLowerCase() !== "story"
            ? t.story.trim()
            : t.title && t.title.trim().toLowerCase() !== "story"
              ? t.title.trim()
              : isMr
                ? "VVS ला आमचे मनःपूर्वक धन्यवाद!"
                : "Thank you VVS for completing our union!";

        return (
          <View
            key={t.id || i}
            style={[
              styles.testimonialHorizontalCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.testimonialTop}>
              <View>
                <ImageBackground
                  source={{ uri: photoUrl }}
                  style={styles.testimonialAvatar}
                  imageStyle={{ borderRadius: 30 }}
                />
                <View style={styles.heartBadge}>
                  <ThemedText style={{ fontSize: 11 }}>💍</ThemedText>
                </View>
              </View>
              <View style={styles.testimonialMeta}>
                <ThemedText style={styles.testimonialCouple} numberOfLines={1}>
                  {coupleTitle}
                </ThemedText>
                <ThemedText style={styles.testimonialCity}>
                  📍 {city}
                </ThemedText>
                <ThemedText style={styles.testimonialMarried}>
                  Married • {dateStr}
                </ThemedText>
              </View>
            </View>

            <View style={{ flex: 1, justifyContent: "center", marginTop: 8 }}>
              {t.title &&
                t.title.trim().toLowerCase() !== "story" &&
                t.story &&
                t.story.trim().toLowerCase() !== "story" &&
                t.title.trim() !== t.story.trim() && (
                  <ThemedText
                    style={{
                      fontSize: 12.5,
                      fontWeight: "700",
                      color: colors.text,
                      marginBottom: 3,
                    }}
                    numberOfLines={1}
                  >
                    {t.title.trim()}
                  </ThemedText>
                )}
              <ThemedText style={styles.testimonialQuote} numberOfLines={3}>
                "{storyText}"
              </ThemedText>
            </View>
          </View>
        );
      })}

      {/* 7th item: Explore All button card */}
      <TouchableOpacity
        style={[
          styles.exploreMoreStoriesCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
        onPress={() => navigateSafe("/success-stories")}
      >
        <View style={styles.exploreCirclePink}>
          <Feather name="arrow-right" size={24} color="#FF4D8D" />
        </View>
        <ThemedText style={styles.exploreTextLabel}>
          {isMr ? "सर्व कथा पाहा" : "View All Stories"}
        </ThemedText>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { language } = useLanguage();
  const { isAuthenticated, profileCompleted, user } = useAuth();
  const { colors, isDark } = useAppTheme();
  const isMr = language === "mr";
  const [fontsLoaded] = useFonts({
    GrandHotel: require("@/assets/fonts/GrandHotel-Regular.ttf"),
    YatraOne: require("@/assets/fonts/YatraOne-Regular.ttf"),
  });
  const scrollY = useRef(new Animated.Value(0)).current;
  const [aboutOpen, setAboutOpen] = useState(false);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [eventsOpen, setEventsOpen] = useState(false);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [realMatches, setRealMatches] = useState<any[]>([]);
  const [realStories, setRealStories] = useState<any[]>([]);

  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 4,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [bounceAnim]);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await notificationApi.getUnreadCount() as any;
      if (res && res.unreadCount !== undefined) {
        setUnreadCount(Number(res.unreadCount) || 0);
      } else if (res && typeof res.data === 'object' && res.data !== null && 'unreadCount' in res.data) {
        setUnreadCount(Number((res.data as any).unreadCount) || 0);
      } else if (res && typeof res.data === 'object' && res.data !== null && 'count' in res.data) {
        setUnreadCount(Number((res.data as any).count) || 0);
      } else if (res && res.data !== undefined && typeof res.data !== 'object') {
        setUnreadCount(Number(res.data) || 0);
      }
    } catch (err) {
      console.log("[Notifications] Failed to load unread count:", err);
    }
  }, [user]);

  useFocusEffect(
    React.useCallback(() => {
      fetchUnreadCount();

      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 10000);

      return () => {
        clearInterval(interval);
      };
    }, [fetchUnreadCount])
  );

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        BackHandler.exitApp();
        return true;
      };

      const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);

      return () => {
        subscription.remove();
      };
    }, [])
  );

  const isNavigating = useRef(false);
  const navigateSafe = (route: any) => {
    if (isNavigating.current) return;
    isNavigating.current = true;
    setTimeout(() => {
      isNavigating.current = false;
    }, 1000);
    router.push(route);
  };

  const getAge = (dobString: string): number => {
    if (!dobString) return 25;
    const birthDate = new Date(dobString);
    const ageDiff = Date.now() - birthDate.getTime();
    return Math.floor(ageDiff / (365.25 * 24 * 60 * 60 * 1000));
  };

  const getPhotoUrl = (path?: string | null): string => {
    if (!path)
      return "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1200&auto=format&fit=crop";
    if (path.startsWith("http")) return path;
    const baseUrl = BASE_URL.replace("/api", "");
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  };

  useEffect(() => {
    fetchMatches();
    fetchStories();
  }, [isAuthenticated, profileCompleted]);

  const fetchStories = async () => {
    try {
      const res = await successStoryApi.getAllStories();
      const list = Array.isArray(res.data) ? res.data : res.data?.stories || [];
      setRealStories(list);
    } catch (err: any) {
      console.log("[Home] Failed to load success stories:", err.message);
    }
  };

  const fetchMatches = async () => {
    try {
      console.log("[Home] Loading real matches from backend...");
      const usePublic = !isAuthenticated || !profileCompleted;
      const response = usePublic
        ? await profileApi.getPublicProfiles(1, 10)
        : await profileApi.getPartnerPreferenceProfiles(1, 10);
      if (response.data) {
        setRealMatches(response.data);
      }
    } catch (err: any) {
      console.log("[Home] Failed to load matches:", err.message);
    }
  };

  const [uploadingGalleryPhoto, setUploadingGalleryPhoto] = useState(false);

  const handleUploadGalleryPhoto = async () => {
    try {
      const result = await pickImageWithPermissionCheck({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (result && !result.canceled && result.assets && result.assets.length > 0) {
        const photoUri = result.assets[0].uri;
        console.log("[Home] Uploading gallery photo:", photoUri);
        setUploadingGalleryPhoto(true);

        const response = await profileApi.uploadPhoto(photoUri);
        if (response.data) {
          Alert.alert(
            "Success",
            "Photo uploaded to your gallery successfully!",
          );
        } else {
          Alert.alert(
            "Upload Failed",
            response.message || "Failed to upload photo.",
          );
        }
      }
    } catch (err: any) {
      console.error("[GalleryUpload] Selection/upload failed:", err);
      Alert.alert("Error", err.message || "Failed to upload gallery photo.");
    } finally {
      setUploadingGalleryPhoto(false);
    }
  };

  const heroOpacity = scrollY.interpolate({
    inputRange: [0, 300],
    outputRange: [1, 0.3],
    extrapolate: "clamp",
  });

  const navbarTranslateY = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, -120],
    extrapolate: "clamp",
  });

  const navBgColor = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: isDark ? ["#17171C", "#17171C"] : ["#E2E2E6", "#FFFFFF"],
    extrapolate: "clamp",
  });

  const handlePrimaryAction = () => {
    if (!isAuthenticated) {
      navigateSafe("/(auth)/mobile");
      return;
    }
    if (profileCompleted) {
      navigateSafe("/explore");
    } else {
      navigateSafe("/edit-profile");
    }
  };

  const handleExploreAction = () => {
    navigateSafe("/explore");
  };

  const primaryLabel = profileCompleted
    ? isMr
      ? "शोधा"
      : "Explore Profiles"
    : isMr
      ? "प्रोफाइल तयार करा"
      : "Create Profile";

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"} 
        backgroundColor="transparent" 
        translucent={true} 
      />

      {/* Fixed Top Navigation Header */}
      <Animated.View
        style={[
          styles.topHeader,
          {
            transform: [{ translateY: navbarTranslateY }],
            backgroundColor: navBgColor,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <SafeAreaView edges={["top"]}>
          <View style={styles.topHeaderContent}>
            {/* Left: Brand name */}
            <ThemedText
              style={[
                styles.headerCursiveTitle,
                {
                  fontSize: isMr ? 21 : 32,
                  fontFamily: isMr ? "YatraOne" : "GrandHotel",
                  color: colors.text,
                },
              ]}
            >
              {isMr ? "वासुदेव विवाह सोहळा" : "Vasudev Vivah Sohala"}
            </ThemedText>

            {/* Right Corner: Bell notification icon */}
            <TouchableOpacity
              style={[
                styles.notifBtn,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => navigateSafe("/requests")}
            >
              <Feather name="bell" size={20} color={colors.text} />
              {unreadCount > 0 && (
                <View style={styles.badgeContainer}>
                  <ThemedText style={styles.badgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </ThemedText>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
      >
        {/* ── Hero ── */}
        <Animated.View style={{ opacity: heroOpacity }}>
          <ImageBackground
            source={isDark ? heroImageDark : heroImageLight}
            style={styles.hero}
            imageStyle={styles.heroImg}
            resizeMode="cover"
          >
            <View
              style={[
                styles.heroOverlay,
                {
                  backgroundColor: isDark
                    ? "rgba(5,5,10,0.62)"
                    : "rgba(5,5,10,0.35)",
                },
              ]}
            >
              <View style={styles.heroContent}>
                <ThemedText
                  style={[
                    styles.heroTitle,
                    { color: isDark ? "#B0B0BE" : "#ded6e2fc" },
                  ]}
                >
                  {isMr
                    ? "योग्य जोडीदार\nआपल्याच समाजात"
                    : "Find Your Perfect Match\nWithin Our Community"}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.heroSub,
                    { color: isDark ? "#B0B0BE" : "#ded6e2fc" },
                  ]}
                >
                  {isMr
                    ? "फक्त वासुदेव समाजासाठी"
                    : "Exclusively for the Vasudev community"}
                </ThemedText>
                <View style={styles.heroBtnRow}>
                  {!profileCompleted && (
                    <TouchableOpacity
                      style={styles.heroPrimary}
                      onPress={handlePrimaryAction}
                    >
                      <ThemedText style={styles.heroPrimaryText}>
                        {primaryLabel}
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Faded Scroll Down Hint at Bottom of Hero */}
              <Animated.View
                style={[
                  styles.scrollHintContainer,
                  { transform: [{ translateY: bounceAnim }] },
                ]}
              >
                <View style={styles.scrollHintPill}>
                  <ThemedText style={styles.scrollHintText}>
                    {isMr ? "खाली स्क्रोल करा" : "Scroll down"}
                  </ThemedText>
                  <Feather name="chevron-down" size={12} color="rgba(255,255,255,0.45)" style={{ marginLeft: 3 }} />
                </View>
              </Animated.View>
            </View>
          </ImageBackground>
        </Animated.View>

        {/* ── Trending Matches ── */}
        <View style={styles.section}>
          <SectionHeading mr="आजचे जोडीदार" en="Latest Profiles" isMr={isMr} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hScroll}
          >
            {realMatches
              .filter((profile) => {
                if (!isAuthenticated || !user || !user.profile) return true;
                const lookingFor = (
                  user.profile.lookingFor || ""
                ).toLowerCase();
                const gender = (profile.gender || "").toLowerCase();
                if (lookingFor === "bride" || lookingFor === "female") {
                  return gender === "female";
                }
                if (lookingFor === "groom" || lookingFor === "male") {
                  return gender === "male";
                }
                return true;
              })
              .slice(0, 6)
              .map((profile) => {
                const age = getAge(profile.dateOfBirth);
                const imageUrl = getPhotoUrl(profile.profilePhoto);
                const locationStr =
                  [profile.city, profile.state, profile.country]
                    .filter(Boolean)
                    .join(", ") || "Not set";

                const handleConnect = () => {
                  if (!isAuthenticated) {
                    navigateSafe("/(auth)/mobile");
                    return;
                  }
                  if (!profileCompleted) {
                    Alert.alert(
                      isMr ? "प्रोफाइल अपूर्ण आहे" : "Profile Incomplete",
                      isMr
                        ? "कृपया प्रथम तुमची प्रोफाइल तयार करा."
                        : "Please create your profile first.",
                    );
                    navigateSafe("/edit-profile");
                    return;
                  }
                  Alert.alert(
                    "Connect",
                    `Sending connection request to ${profile.fullName}...`,
                  );
                };

                const handleCardPress = () => {
                  if (!isAuthenticated) {
                    navigateSafe("/(auth)/mobile");
                    return;
                  }
                  if (!profileCompleted) {
                    Alert.alert(
                      isMr ? "प्रोफाइल अपूर्ण आहे" : "Profile Incomplete",
                      isMr
                        ? "कृपया प्रथम तुमची प्रोफाइल तयार करा."
                        : "Please create your profile first.",
                    );
                    navigateSafe("/edit-profile");
                    return;
                  }
                  navigateSafe({
                    pathname: "/profile",
                    params: {
                      view: "other",
                      profileId: String(profile.userId),
                      name: profile.fullName,
                      age: String(age),
                      role: profile.profession || "Not set",
                      gender: (profile.gender || "male").toLowerCase(),
                      bio: profile.bio || "",
                      about: profile.bio || "",
                      education: profile.education || "--",
                      city: profile.city || "",
                      state: profile.state || "",
                      country: profile.country || "",
                      height: profile.height || "--",
                      interest: (profile.interest || []).join(","),
                      image: imageUrl,
                      isConnection: "false",
                    },
                  });
                };

                return (
                  <TouchableOpacity
                    key={profile.id}
                    activeOpacity={0.9}
                    onPress={handleCardPress}
                    style={[
                      styles.card,
                      styles.profileCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <ImageBackground
                      source={{ uri: imageUrl }}
                      style={styles.profileImg}
                      imageStyle={styles.profileImgStyle}
                    />
                    <View style={styles.profileBody}>
                      <ThemedText style={styles.profileName}>
                        {profile.fullName}
                      </ThemedText>
                      <ThemedText style={styles.profileRole}>
                        {profile.profession || "Not set"}
                      </ThemedText>
                    </View>
                  </TouchableOpacity>
                );
              })}

            {/* Explore All Profiles Card */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigateSafe("/explore")}
              style={[
                styles.card,
                styles.profileCard,
                styles.exploreProfilesCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.exploreCirclePink}>
                <Feather name="arrow-right" size={24} color="#FF4D8D" />
              </View>
              <ThemedText style={styles.exploreTextLabel}>
                {isMr ? "सर्व प्रोफाईल पहा" : "Explore All Profiles"}
              </ThemedText>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* ── Success Stories ── */}
        <View style={styles.section}>
          <SectionHeading
            mr="यशोगाथा"
            en="Success Stories"
            isMr={isMr}
            rightAction={
              isAuthenticated ? (
                <TouchableOpacity
                  style={styles.headerPlusBtn}
                  onPress={() => navigateSafe("/success-stories?action=add")}
                  activeOpacity={0.8}
                >
                  <Feather name="plus" size={14} color="#FF4D8D" />
                </TouchableOpacity>
              ) : null
            }
          />
          <TestimonialsSection isMr={isMr} stories={realStories} />
        </View>

        {/* ── CTA Banner ── */}
        <View
          style={[
            styles.ctaBanner,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <ThemedText style={styles.ctaEmoji}>🦚</ThemedText>
          <ThemedText style={styles.ctaTitle}>
            {isMr ? "आजच सुरुवात करा" : "Start Your Journey Today"}
          </ThemedText>
          <ThemedText style={styles.ctaSub}>
            {isMr
              ? "हजारो वासुदेव समाजातील सदस्यांसोबत सामील व्हा."
              : "Join thousands from the Vasudev community finding their soulmate."}
          </ThemedText>
          <TouchableOpacity
            style={[styles.pinkBtn, styles.ctaBtn]}
            onPress={handlePrimaryAction}
          >
            <ThemedText style={styles.pinkBtnText}>
              {profileCompleted
                ? isMr
                  ? "प्रोफाइलला भेट द्या"
                  : "Explore Profiles"
                : isMr
                  ? "प्रोफाइल तयार करा"
                  : "Create Profile"}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* ── About ── */}
        <View style={styles.section}>
          <CollapsibleHeading
            mr="आमच्याबद्दल"
            en="About Community"
            isMr={isMr}
            expanded={aboutOpen}
            onPress={() => setAboutOpen((prev) => !prev)}
          />
          {aboutOpen && (
            <View style={styles.collapsibleBody}>
              <AboutSection isMr={isMr} />
            </View>
          )}
        </View>

        {/* ── How It Works ── */}
        <View style={styles.section}>
          <CollapsibleHeading
            mr="कसे कार्य करते?"
            en="How It Works"
            isMr={isMr}
            expanded={howItWorksOpen}
            onPress={() => setHowItWorksOpen((prev) => !prev)}
          />
          {howItWorksOpen && (
            <View style={styles.collapsibleBody}>
              <HowItWorksSection isMr={isMr} />
            </View>
          )}
        </View>

        {/* ── Upcoming Events ── */}
        <View style={styles.section}>
          <CollapsibleHeading
            mr="आगामी कार्यक्रम"
            en="Upcoming Events"
            isMr={isMr}
            expanded={eventsOpen}
            onPress={() => setEventsOpen((prev) => !prev)}
          />
          {eventsOpen && (
            <View style={styles.collapsibleBody}>
              <EventsSection isMr={isMr} />
            </View>
          )}
        </View>

        {/* ── Footer ── */}
        <View
          style={[
            styles.footer,
            { backgroundColor: colors.card, borderTopColor: colors.border },
          ]}
        >
          <ThemedText style={styles.footerLabel}>Powered by</ThemedText>
          <ThemedText style={styles.footerCompany}>DHRUVEXA</ThemedText>
           <ThemedText style={styles.footerCompany}>TECHNOLOGIES</ThemedText>
        </View>
      </Animated.ScrollView>

      <BottomNavigation />
      <AuthModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DARK },
  scrollContent: { paddingBottom: 80 },

  // Top Header Bar
  topHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 77, 141, 0.15)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 77, 141, 0.22)",
    zIndex: 1000,
  },
  topHeaderContent: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
  },
  centerHeaderContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: -1,
  },
  headerCursiveTitle: {
    color: WHITE,
    textAlign: "center",
  },
  notifBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 77, 141, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 77, 141, 0.35)",
  },
  headerPlusBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255, 77, 141, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 77, 141, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollHintContainer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  scrollHintPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.22)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    opacity: 0.55,
  },
  scrollHintText: {
    fontSize: 10.5,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.55)",
    letterSpacing: 0.3,
  },
  badgeContainer: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF4D8D',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 8.5,
    fontWeight: '900',
    textAlign: 'center',
  },
  headerIndicator: {
    padding: 8,
  },

  // Hero
  hero: { width: SW, height: SH },
  heroImg: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  heroOverlay: {
    flex: 1,
    backgroundColor: "rgba(5,5,10,0.62)",
    paddingHorizontal: 22,
  },
  heroBadge: {
    marginTop: 12,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,77,141,0.15)",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: PINK + "55",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  heroBadgeText: { color: PINK, fontWeight: "700", fontSize: 13 },
  heroContent: { flex: 1, justifyContent: "center" },
  heroTitle: { color: WHITE, fontSize: 36, fontWeight: "900", lineHeight: 46 },
  heroSub: { color: "#B0B0BE", marginTop: 12, fontSize: 13, lineHeight: 20 },
  heroBtnRow: { flexDirection: "row", gap: 12, marginTop: 28 },
  heroPrimary: {
    backgroundColor: PINK,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
  },
  heroPrimaryText: { color: WHITE, fontWeight: "800", fontSize: 15 },
  heroSecondary: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
  },
  heroSecondaryText: { color: WHITE, fontWeight: "600", fontSize: 15 },

  // Stats
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 18,
    marginTop: -38,
  },
  statCard: {
    flex: 1,
    backgroundColor: CARD,
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: "center",
  },
  statNum: { color: PINK, fontSize: 22, fontWeight: "800" },
  statLbl: { color: MUTED, fontSize: 11, marginTop: 4 },

  // Section
  section: { marginTop: 36, paddingHorizontal: 18 },
  sectionHeading: { marginBottom: 18 },
  sectionTitle: { fontSize: 22, fontWeight: "900" },
  sectionLine: {
    width: 40,
    height: 3,
    backgroundColor: PINK,
    borderRadius: 99,
    marginTop: 8,
  },
  collapsibleHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: CARD,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  chevronWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  collapsibleBody: {
    marginTop: 14,
  },

  // Card base (shared)
  card: { backgroundColor: CARD, borderRadius: 24, padding: 20 },

  // About
  aboutIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  aboutIcon: { fontSize: 36 },
  pill: {
    backgroundColor: PINK + "22",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: PINK + "44",
  },
  pillText: { color: PINK, fontSize: 11, fontWeight: "700" },
  aboutTitle: { color: WHITE, fontSize: 22, fontWeight: "900" },
  aboutSub: {
    color: PINK,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
    marginBottom: 12,
  },
  aboutBody: { color: "#C8C8D8", fontSize: 14, lineHeight: 22 },
  aboutStats: {
    flexDirection: "row",
    marginTop: 20,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: "#FFFFFF11",
    justifyContent: "space-around",
  },
  aboutStat: { alignItems: "center" },
  aboutStatNum: { color: WHITE, fontSize: 24, fontWeight: "900" },
  aboutStatLbl: {
    color: MUTED,
    fontSize: 11,
    marginTop: 4,
    textAlign: "center",
  },

  // Matches
  hScroll: { gap: 16, paddingBottom: 4 },
  profileCard: { width: SW * 0.68, padding: 0, overflow: "hidden" },
  profileImg: { height: 300, justifyContent: "flex-end", padding: 14 },
  profileImgStyle: { borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  activePill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: "#3BFF87",
  },
  activeText: { color: WHITE, fontSize: 11 },
  profileBody: { padding: 18 },
  profileName: { fontSize: 20, fontWeight: "800" },
  profileRole: { marginTop: 4, fontSize: 13 },
  profileCity: { color: MUTED, marginTop: 3, fontSize: 12, marginBottom: 14 },

  // Shared pink button
  pinkBtn: {
    backgroundColor: PINK,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  storyCtaButton: {
    paddingHorizontal: 22,
    paddingVertical: 14,
    minWidth: 196,
    minHeight: 48,
    justifyContent: "center",
  },
  storyCtaButtonText: {
    fontSize: 14,
    lineHeight: 18,
  },
  pinkBtnText: { color: WHITE, fontWeight: "800", fontSize: 13 },

  // Steps
  stepRow: { flexDirection: "row", gap: 14, minHeight: 120 },
  stepLeft: { alignItems: "center", width: 44 },
  stepNumBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PINK + "22",
    borderWidth: 1.5,
    borderColor: PINK,
    justifyContent: "center",
    alignItems: "center",
  },
  stepNum: { color: PINK, fontWeight: "900", fontSize: 13 },
  stepConnector: {
    flex: 1,
    width: 1.5,
    backgroundColor: PINK + "33",
    marginVertical: 4,
  },
  stepCard: { flex: 1, borderRadius: 20, marginBottom: 14, padding: 16 },
  stepEmojiRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  stepEmoji: { fontSize: 26 },
  stepTitle: { fontWeight: "800", fontSize: 15 },
  stepDesc: { fontSize: 13, lineHeight: 19, marginTop: 4 },

  // Events
  eventCard: { width: SW * 0.78 },
  eventTagRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  eventTag: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  eventTagText: { fontSize: 11, fontWeight: "700" },
  eventEmoji: { fontSize: 28 },
  eventDate: { color: MUTED, fontSize: 12, marginBottom: 6 },
  eventTitle: { fontSize: 18, fontWeight: "900" },
  eventDesc: { fontSize: 13, marginTop: 6, lineHeight: 19 },

  // Testimonials
  testimonialTop: { flexDirection: "row", gap: 14, marginBottom: 14 },
  testimonialAvatar: { width: 60, height: 60, borderRadius: 30 },
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
  testimonialMeta: { flex: 1, justifyContent: "center" },
  testimonialCouple: { fontSize: 16, fontWeight: "800" },
  testimonialCity: { color: PINK, fontSize: 12, marginTop: 3 },
  testimonialMarried: {
    color: "#3BFF87",
    fontSize: 11,
    marginTop: 3,
    fontWeight: "600",
  },
  testimonialQuote: {
    fontSize: 14,
    lineHeight: 22,
    fontStyle: "italic",
  },

  // CTA
  ctaBanner: {
    margin: 18,
    marginTop: 36,
    backgroundColor: CARD,
    borderRadius: 28,
    padding: 28,
    alignItems: "center",
  },
  ctaEmoji: { fontSize: 44, marginBottom: 12 },
  ctaTitle: {
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
  },
  ctaSub: {
    color: MUTED,
    fontSize: 13,
    marginTop: 10,
    textAlign: "center",
    lineHeight: 20,
  },
  ctaBtn: {
    marginTop: 20,
    paddingHorizontal: 28,
    paddingVertical: 15,
    borderRadius: 18,
  },

  // Footer
  footer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    marginTop: 30,
    backgroundColor: "#0A0A0E",
  },
  footerLabel: {
    color: "#77777C",
    fontSize: 12,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  footerCompany: {
    color: "#FF4D8D",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 4,
    marginTop: 4,
  },
  footerText: {
    color: "#B0B0BE",
    fontSize: 11,
    letterSpacing: 6,
    textTransform: "uppercase",
    marginTop: 2,
    marginLeft: 6,
  },
  exploreProfilesCard: {
    width: SW * 0.68,
    height: 380,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: CARD,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "rgba(255, 77, 141, 0.2)",
    gap: 12,
  },
  exploreCirclePink: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 77, 141, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255, 77, 141, 0.35)",
  },
  exploreTextLabel: {
    color: "#FF4D8D",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
  testimonialHorizontalCard: {
    width: SW * 0.8,
    height: 160,
    backgroundColor: CARD,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    justifyContent: "space-between",
  },
  exploreMoreStoriesCard: {
    width: 160,
    height: 160,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: CARD,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "rgba(255, 77, 141, 0.2)",
    padding: 20,
    gap: 12,
  },
});
