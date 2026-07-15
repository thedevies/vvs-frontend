import { router, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Modal,
  TextInput,
  Dimensions,
} from "react-native";
import { CustomAlert as Alert } from "@/utils/alert";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect, useCallback } from "react";
import * as DocumentPicker from "expo-document-picker";
import * as WebBrowser from "expo-web-browser";

const { width: SW } = Dimensions.get("window");

import BottomNavigation from "@/components/navigation/BottomNavigation";
import { ThemedText } from "@/components/themed-text";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { profileApi, interestApi, BASE_URL } from "@/utils/api";
import type { UserPhoto } from "@/utils/types";
import { eventEmitter } from "@/utils/events";
import { useAppTheme } from "@/context/ThemeContext";

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const { language, t } = useLanguage();
  const { colors, isDark } = useAppTheme();
  const isMr = language === "mr";
  const params = useLocalSearchParams<{
    view?: string | string[];
    profileId?: string | string[];
    name?: string | string[];
    age?: string | string[];
    role?: string | string[];
    gender?: string | string[];
    bio?: string | string[];
    about?: string | string[];
    education?: string | string[];
    city?: string | string[];
    state?: string | string[];
    country?: string | string[];
    height?: string | string[];
    interest?: string | string[];
    image?: string | string[];
    isConnection?: string | string[];
  }>();

  const [refreshing, setRefreshing] = useState(false);
  const [photos, setPhotos] = useState<UserPhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<UserPhoto | null>(null);

  // Other profile dynamic load states
  const [otherUser, setOtherUser] = useState<any>(null);
  const [loadingOtherProfile, setLoadingOtherProfile] = useState(false);

  // Dedicated Interest status state variables to drive button instantly
  const [interestStatus, setInterestStatus] = useState<string | null>(null);
  const [isInterestSender, setIsInterestSender] = useState<boolean>(false);
  const [interestId, setInterestId] = useState<number | null>(null);

  // Biodata states
  const [uploadingBiodata, setUploadingBiodata] = useState(false);
  const [generatingBiodata, setGeneratingBiodata] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [religion, setReligion] = useState("Hindu");
  const [caste, setCaste] = useState("Vasudev");
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");

  const getParamValue = (value?: string | string[]) =>
    Array.isArray(value) ? value[0] : value;

  const view = getParamValue(params.view);
  const isOtherProfileView = view === "other";

  // Load photos & profile data on mount
  useEffect(() => {
    if (isOtherProfileView && params.profileId) {
      loadOtherProfile(Number(params.profileId));
    } else if (!isOtherProfileView) {
      loadPhotos();
    }
  }, [isOtherProfileView, params.profileId]);

  // Listen to live photo upload events
  useEffect(() => {
    if (!isOtherProfileView) {
      const unsubscribe = eventEmitter.on("photo-uploaded", () => {
        console.log(
          "[Profile] Photo upload event received, reloading gallery...",
        );
        loadPhotos();
      });
      return () => unsubscribe();
    }
  }, [isOtherProfileView]);

  const loadOtherProfile = async (id: number) => {
    try {
      setLoadingOtherProfile(true);
      const response = await profileApi.getUserProfile(id);
      if (response.data) {
        setOtherUser(response.data);
        if (response.data.photos) {
          setPhotos(response.data.photos);
        }
        const data = response.data as any;
        setInterestStatus(data.interestStatus || null);
        setIsInterestSender(data.isInterestSender || false);
        setInterestId(data.interestId || null);

        if (data.interestStatus === "PENDING" && data.isInterestSender) {
          setConnectionRequested(true);
        } else if (data.interestStatus === "ACCEPTED") {
          setConnectionRequested(true);
        } else {
          setConnectionRequested(false);
        }
      }
    } catch (err) {
      console.log("[Profile] Failed to load other user profile:", err);
    } finally {
      setLoadingOtherProfile(false);
    }
  };

  const loadPhotos = async () => {
    try {
      setLoadingPhotos(true);
      const response = await profileApi.getMyPhotos();
      if (response.data) {
        setPhotos(response.data);
      }
    } catch (err) {
      console.log("[Profile] Failed to load photos:", err);
    } finally {
      setLoadingPhotos(false);
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    Alert.alert(
      isMr ? "फोटो हटवा" : "Delete Photo",
      isMr
        ? "तुम्हाला खात्री आहे की तुम्ही हा फोटो हटवू इच्छिता?"
        : "Are you sure you want to delete this photo?",
      [
        {
          text: isMr ? "रद्द करा" : "Cancel",
          style: "cancel",
        },
        {
          text: isMr ? "हटवा" : "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await profileApi.deletePhoto(photoId);
              if (res.message) {
                Alert.alert(
                  isMr ? "यशस्वी" : "Success",
                  isMr
                    ? "फोटो यशस्वीरित्या हटवला गेला."
                    : "Photo deleted successfully!",
                );
                // Update local state list
                setPhotos((prev) => prev.filter((p) => p.id !== photoId));
                setSelectedPhoto(null);
              }
            } catch (err: any) {
              Alert.alert(
                isMr ? "त्रुटी" : "Error",
                err.message ||
                  (isMr ? "फोटो हटवण्यात अयशस्वी." : "Failed to delete photo."),
              );
            }
          },
        },
      ],
    );
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (isOtherProfileView && params.profileId) {
      await loadOtherProfile(Number(params.profileId));
    } else {
      await refreshUser();
      await loadPhotos();
    }
    setRefreshing(false);
  }, [refreshUser, isOtherProfileView, params.profileId]);

  // Build photo URL from backend path
  const getPhotoUrl = (path: string): string => {
    if (path.startsWith("http")) return path;
    const baseUrl = BASE_URL.replace("/api", "");
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  };

  // Biodata handlers
  const handleUploadBiodata = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        console.log("[Biodata] Uploading file:", file.uri);
        setUploadingBiodata(true);
        const response = await profileApi.uploadBiodata(file.uri, "uploaded");
        if (response.data) {
          Alert.alert("Success", "Biodata uploaded successfully!");
          await refreshUser();
        } else {
          Alert.alert(
            "Upload Failed",
            response.message || "Failed to upload biodata.",
          );
        }
      }
    } catch (err: any) {
      console.log("[Biodata] Selection/upload failed:", err);
      Alert.alert("Error", err.message || "Failed to select/upload biodata.");
    } finally {
      setUploadingBiodata(false);
    }
  };

  const handleGenerateBiodata = async () => {
    if (!fatherName.trim() || !motherName.trim()) {
      Alert.alert("Required Info", "Please enter Father's and Mother's name.");
      return;
    }

    try {
      setGeneratingBiodata(true);
      const dobStr = profile?.dateOfBirth
        ? new Date(profile.dateOfBirth).toISOString().split("T")[0]
        : "1998-05-20";
      const body = {
        fullName: profile?.fullName || ownName,
        gender: (profile?.gender || "male").toLowerCase() as any,
        maritalStatus: (
          profile?.maritalStatus || "never_married"
        ).toLowerCase() as any,
        dateOfBirth: dobStr,
        city: profile?.city || "Pune",
        profession: profile?.profession || "Software Engineer",
        education: profile?.education || "B.Tech",
        religion: religion,
        caste: caste,
        fatherName: fatherName,
        motherName: motherName,
        bio: profile?.bio || ownBio,
      };

      console.log(
        "[Biodata] Requesting generateBiodata with body:",
        JSON.stringify(body),
      );
      const response = await profileApi.generateBiodata(body);
      if (response.data) {
        Alert.alert("Success", "Biodata PDF generated successfully!");
        setShowGenerateModal(false);
        await refreshUser();
      } else {
        Alert.alert(
          "Generation Failed",
          response.message || "Failed to generate biodata PDF.",
        );
      }
    } catch (err: any) {
      console.log("[Biodata] Generation error:", err);
      Alert.alert("Error", err.message || "Failed to generate biodata PDF.");
    } finally {
      setGeneratingBiodata(false);
    }
  };

  const handleViewBiodata = async () => {
    const url = biodataObj?.biodataUrl;
    if (!url) return;
    const fullUrl = url.startsWith("http")
      ? url
      : `${BASE_URL.replace("/api", "")}${url.startsWith("/") ? url : `/${url}`}`;
    console.log("[Biodata] Opening PDF:", fullUrl);
    await WebBrowser.openBrowserAsync(fullUrl);
  };

  const handleUpdateBiodata = () => {
    Alert.alert(
      "Update Biodata",
      "Choose how you want to update your matrimonial biodata PDF:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Upload New PDF",
          onPress: () => handleUploadBiodata(),
        },
        {
          text: "Generate New PDF",
          onPress: () => setShowGenerateModal(true),
        },
      ],
    );
  };

  const handleConnectPress = async () => {
    if (!isOtherProfileView || !otherUser) return;

    const otherData = otherUser as any;
    const targetUserId = otherUser.id || otherData.userId || otherData.id;

    // 1. If interestStatus is PENDING and we are the sender -> cancel it
    if (interestStatus === "PENDING" && isInterestSender && interestId) {
      try {
        const res = await interestApi.cancelInterest(interestId);
        Alert.alert("Success", "Connection request cancelled.");
        // Update dedicated state variables instantly
        setInterestStatus(null);
        setIsInterestSender(false);
        setInterestId(null);
        // Sync with backend in background
        loadOtherProfile(targetUserId);
      } catch (err: any) {
        Alert.alert("Error", err.message || "Failed to cancel request.");
      }
      return;
    }

    // 2. If interestStatus is PENDING and we are NOT the sender -> accept it
    if (interestStatus === "PENDING" && !isInterestSender && interestId) {
      try {
        const res = await interestApi.acceptInterest(interestId);
        Alert.alert(
          "Accepted",
          `You are now connected with ${otherUser.profile?.fullName || "this user"}!`,
        );
        // Update dedicated state variables instantly
        setInterestStatus("ACCEPTED");
        setIsInterestSender(false);
        // Sync with backend in background
        loadOtherProfile(targetUserId);
      } catch (err: any) {
        Alert.alert("Error", err.message || "Failed to accept request.");
      }
      return;
    }

    // 3. Otherwise, send a new interest request
    try {
      const res = await interestApi.sendInterest(targetUserId);
      Alert.alert("Sent", "Connection request sent.");
      if (res && res.data) {
        // Update dedicated state variables instantly
        setInterestStatus("PENDING");
        setIsInterestSender(true);
        setInterestId(res.data.interestId);
      }
      // Sync with backend in background
      loadOtherProfile(targetUserId);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to send request.");
    }
  };

  const buttonConfig = (() => {
    const base = "#FF4D8D";
    if (!isOtherProfileView) {
      return {
        label: "Send Connection Request",
        icon: "heart" as const,
        tintColor: base,
        disabled: false,
      };
    }
    if (interestStatus === "ACCEPTED") {
      return {
        label: "Connected",
        icon: "checkmark-circle" as const,
        tintColor: "#3BB673",
        disabled: true,
      };
    }
    if (interestStatus === "PENDING") {
      if (isInterestSender) {
        return {
          label: "Cancel Request",
          icon: "close-circle-outline" as const,
          tintColor: "#9B9BA1",
          disabled: false,
        };
      } else {
        return {
          label: "Accept Request",
          icon: "checkmark-circle-outline" as const,
          tintColor: "#3B9CFF",
          disabled: false,
        };
      }
    }
    return {
      label: "Send Connection Request",
      icon: "heart" as const,
      tintColor: base,
      disabled: false,
    };
  })();

  // ---- Own profile data from context ----
  const profile = user?.profile;
  const ownName = profile?.fullName || "Your Name";
  const ownAge = profile?.dateOfBirth
    ? String(
        Math.floor(
          (Date.now() - new Date(profile.dateOfBirth).getTime()) /
            (365.25 * 24 * 60 * 60 * 1000),
        ),
      )
    : "--";
  const ownRole = profile?.profession || "Not set";
  const ownBio = profile?.bio || "Complete your profile to add a bio.";
  const ownEducation = profile?.education || "--";
  const ownCity =
    [profile?.city, profile?.state, profile?.country]
      .filter(Boolean)
      .join(", ") || "--";
  const ownGender = (profile?.gender || "male").toLowerCase();
  const ownHeight = profile?.height || "--";
  const ownInterests = profile?.interest || [];
  const ownProfilePhoto = profile?.profilePhoto
    ? getPhotoUrl(profile.profilePhoto)
    : "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1200&auto=format&fit=crop";

  // ---- Other profile data from params ----
  const otherName = getParamValue(params.name) ?? "Member";
  const otherAge = getParamValue(params.age) ?? "27";
  const otherRole = getParamValue(params.role) ?? "Professional";
  const otherGender = getParamValue(params.gender) ?? "female";
  const otherIsConnection = getParamValue(params.isConnection) === "true";
  const otherBio =
    getParamValue(params.bio) ??
    "Friendly, family-oriented, and looking for a meaningful relationship.";
  const otherAbout =
    getParamValue(params.about) ??
    "I believe in trust, communication, and growing together as partners.";
  const otherEducation = getParamValue(params.education) ?? "MBA";
  const otherCity =
    [
      getParamValue(params.city),
      getParamValue(params.state),
      getParamValue(params.country),
    ]
      .filter(Boolean)
      .join(", ") || "Pune";
  const otherImage =
    getParamValue(params.image) ??
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1200&auto=format&fit=crop";
  const otherHeight = getParamValue(params.height) ?? "5ft 6in";

  // Parse other interests (could be passed as JSON string or comma-separated string)
  const getOtherInterests = (): string[] => {
    const rawInterest = getParamValue(params.interest);
    if (!rawInterest) return ["Travel", "Music", "Fitness"];
    try {
      if (rawInterest.startsWith("[")) {
        return JSON.parse(rawInterest);
      }
      return rawInterest.split(",");
    } catch {
      return ["Travel", "Music", "Fitness"];
    }
  };

  const displayName = isOtherProfileView
    ? otherUser?.profile?.fullName || otherName
    : ownName;
  const displayAge = isOtherProfileView
    ? otherUser?.profile?.dateOfBirth
      ? String(
          Math.floor(
            (Date.now() - new Date(otherUser.profile.dateOfBirth).getTime()) /
              (365.25 * 24 * 60 * 60 * 1000),
          ),
        )
      : otherAge
    : ownAge;
  const displayRole = isOtherProfileView
    ? otherUser?.profile?.profession || otherRole
    : ownRole;
  const displayBio = isOtherProfileView
    ? otherUser?.profile?.bio || otherBio
    : ownBio;
  const displayAbout = isOtherProfileView
    ? otherUser?.profile?.bio || otherAbout
    : "Passionate about technology, startups, and fitness. I value emotional maturity and authenticity.";
  const displayEducation = isOtherProfileView
    ? otherUser?.profile?.education || otherEducation
    : ownEducation;
  const displayCity = isOtherProfileView
    ? otherUser?.profile
      ? [
          otherUser.profile.city,
          otherUser.profile.state,
          otherUser.profile.country,
        ]
          .filter(Boolean)
          .join(", ")
      : otherCity
    : ownCity;
  const displayImage = isOtherProfileView
    ? otherUser?.profile?.profilePhoto
      ? getPhotoUrl(otherUser.profile.profilePhoto)
      : otherImage
    : ownProfilePhoto;
  const displayGender = (
    isOtherProfileView ? otherUser?.profile?.gender || otherGender : ownGender
  ).toLowerCase();
  const displayHeight = isOtherProfileView
    ? otherUser?.profile?.height || otherHeight
    : ownHeight;
  const displayInterests = isOtherProfileView
    ? otherUser?.profile?.interest || getOtherInterests()
    : ownInterests;
  const lookingForGender = displayGender === "female" ? "Male" : "Female";
  const parsedAge = Number.parseInt(displayAge, 10);

  const biodataObj = isOtherProfileView ? otherUser?.biodata : user?.biodata;
  const hasBiodata = !!biodataObj?.biodataUrl;

  // Match score for other profiles
  const matchScore = (() => {
    if (!isOtherProfileView) return null;
    let score = 52;
    if (displayGender === "female") score += 10;
    if (displayCity.toLowerCase() === "pune") score += 12;
    if (displayEducation.toLowerCase() === "mba") score += 14;
    else if (displayEducation.toLowerCase().includes("tech")) score += 8;
    if (!Number.isNaN(parsedAge)) {
      const ageGap = Math.abs(parsedAge - 27);
      if (ageGap <= 2) score += 18;
      else if (ageGap <= 4) score += 12;
      else if (ageGap <= 7) score += 6;
    }
    if (otherIsConnection) score += 10;
    const roleText = displayRole.toLowerCase();
    if (
      roleText.includes("engineer") ||
      roleText.includes("doctor") ||
      roleText.includes("scientist")
    )
      score += 7;
    return Math.max(45, Math.min(97, score));
  })();

  const matchScoreColor = (() => {
    if (matchScore === null) return "#8E8E95";
    if (matchScore > 85) return "#33C56E";
    if (matchScore >= 70) return "#E4C542";
    return "#E25555";
  })();

  const [connectionRequested, setConnectionRequested] = useState(false);

  // Photo data for grid
  // Photo data for grid (filter out profile photo from gallery view)
  const profilePhotoPath = isOtherProfileView
    ? otherUser?.profile?.profilePhoto
    : user?.profile?.profilePhoto;

  const galleryPhotos = photos.filter((p) => p.photoUrl !== profilePhotoPath);

  return (
    <View
      style={[styles.mainContainer, { backgroundColor: colors.background }]}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 130 }}
          refreshControl={
            !isOtherProfileView ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#FF4D8D"
              />
            ) : undefined
          }
        >
          {/* ── Top Bar ── */}
          <View style={styles.topBar}>
            {isOtherProfileView ? (
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backBtn}
              >
                <Ionicons name="arrow-back" size={22} color={colors.text} />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 40 }} />
            )}
            <ThemedText style={styles.topBarTitle}>
              {isOtherProfileView ? displayName : t("myProfile")}
            </ThemedText>
            {!isOtherProfileView ? (
              <TouchableOpacity
                style={[styles.settingButton, { backgroundColor: colors.card }]}
                onPress={() => router.push("/settings")}
              >
                <Ionicons
                  name="settings-outline"
                  size={20}
                  color={colors.text}
                />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 40 }} />
            )}
          </View>

          {/* ── Hero Avatar ── */}
          <View style={styles.heroSection}>
            <View style={styles.avatarRing}>
              <Image source={{ uri: displayImage }} style={styles.heroAvatar} />
            </View>

            {/* Name + verified */}
            <View style={styles.heroNameRow}>
              <ThemedText style={styles.heroName}>{displayName}</ThemedText>
              {(isOtherProfileView
                ? otherUser?.isMobileVerified
                : user?.isMobileVerified) && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color="#0095f6"
                  style={{ marginLeft: 6 }}
                />
              )}
            </View>

            {/* Subtitle — age · city */}
            <ThemedText
              style={[styles.heroSub, { color: colors.textSecondary }]}
            >
              {displayAge} yrs
              {displayCity.split(", ")[0]
                ? `  ·  ${displayCity.split(", ")[0]}`
                : ""}
            </ThemedText>

            {/* Bio */}
            {displayBio ? (
              <ThemedText
                style={[styles.heroBio, { color: colors.textSecondary }]}
                numberOfLines={3}
              >
                {displayBio}
              </ThemedText>
            ) : null}

            {/* Quick-stat chips row */}
            <View style={styles.quickChipsRow}>
              {displayRole && displayRole !== "Not set" && (
                <View
                  style={[
                    styles.quickChip,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name="briefcase-outline"
                    size={12}
                    color="#FF4D8D"
                  />
                  <ThemedText style={styles.quickChipText} numberOfLines={1}>
                    {displayRole}
                  </ThemedText>
                </View>
              )}
              {displayEducation && displayEducation !== "--" && (
                <View
                  style={[
                    styles.quickChip,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Ionicons name="school-outline" size={12} color="#FF4D8D" />
                  <ThemedText style={styles.quickChipText} numberOfLines={1}>
                    {displayEducation}
                  </ThemedText>
                </View>
              )}
              {displayHeight && displayHeight !== "--" && (
                <View
                  style={[
                    styles.quickChip,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Ionicons name="resize-outline" size={12} color="#FF4D8D" />
                  <ThemedText style={styles.quickChipText}>
                    {displayHeight}
                  </ThemedText>
                </View>
              )}
            </View>

            {/* Interests tags */}
            {displayInterests && displayInterests.length > 0 && (
              <View style={styles.interestTagRow}>
                {displayInterests.slice(0, 4).map((item: string, i: number) => (
                  <View key={i} style={styles.interestTag}>
                    <ThemedText style={styles.interestTagText}>
                      {item}
                    </ThemedText>
                  </View>
                ))}
              </View>
            )}

            {/* ── Action button (other profile) ── */}
            {/* {isOtherProfileView && (
              <View style={styles.actionRow}>
                {matchScore !== null && (
                  <View style={[styles.matchBadge, { borderColor: `${matchScoreColor}33`, backgroundColor: `${matchScoreColor}11` }]}>
                    <ThemedText style={[styles.matchPct, { color: matchScoreColor }]}>{matchScore}%</ThemedText>
                    <ThemedText style={[styles.matchLbl, { color: matchScoreColor }]}>Match</ThemedText>
                  </View>
                )}
              </View>
            )} */}
          </View>

          {/* ── Connect Button (other profile) — full-width, below hero ── */}
          {isOtherProfileView && (
            <View style={styles.connectSection}>
              <TouchableOpacity
                style={[
                  styles.connectBtnFull,
                  {
                    backgroundColor: isDark ? colors.card : "#FFFFFF",
                    borderColor: buttonConfig.tintColor,
                  },
                ]}
                onPress={handleConnectPress}
                disabled={buttonConfig.disabled}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={buttonConfig.icon}
                  size={15}
                  color={buttonConfig.tintColor}
                />
                <ThemedText
                  style={[
                    styles.connectBtnFullText,
                    { color: buttonConfig.tintColor },
                  ]}
                >
                  {buttonConfig.label}
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Divider ── */}
          <View
            style={[styles.sectionDivider, { borderColor: colors.border }]}
          />

          {/* ── Biodata row (own profile only) + See More button ── */}
          <View style={styles.belowHeroSection}>
            {/* See More Info Button */}
            <TouchableOpacity
              style={[
                styles.seeMoreBtn,
                { borderColor: colors.border, backgroundColor: colors.card },
              ]}
              onPress={() => setShowInfoModal(!showInfoModal)}
              activeOpacity={0.75}
            >
              <Ionicons
                name="information-circle-outline"
                size={16}
                color="#FF4D8D"
              />
              <ThemedText
                style={[styles.seeMoreBtnText, { color: colors.text }]}
              >
                See More Information
              </ThemedText>
              <Ionicons
                name={showInfoModal ? "chevron-up" : "chevron-down"}
                size={16}
                color={colors.muted}
              />
            </TouchableOpacity>

            {/* ── Expandable Info Card (replaces the popup) ── */}
            {showInfoModal && (
              <View
                style={[
                  styles.infoExpandCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                {[
                  {
                    icon: "briefcase-outline" as const,
                    label: "Profession",
                    value: displayRole,
                  },
                  {
                    icon: "school-outline" as const,
                    label: "Education",
                    value: displayEducation,
                  },
                  {
                    icon: "location-outline" as const,
                    label: "Location",
                    value: displayCity || "--",
                  },
                  {
                    icon: "resize-outline" as const,
                    label: "Height",
                    value: displayHeight,
                  },
                  {
                    icon: "male-female-outline" as const,
                    label: "Gender",
                    value:
                      displayGender.charAt(0).toUpperCase() +
                      displayGender.slice(1),
                  },
                  {
                    icon: "calendar-outline" as const,
                    label: "Age",
                    value: `${displayAge} years`,
                  },
                  {
                    icon: "close-circle-outline" as const,
                    label: "Smoking",
                    value: t("no"),
                  },
                  {
                    icon: "wine-outline" as const,
                    label: "Drinking",
                    value: t("no"),
                  },
                ]
                  .filter(
                    (r) => r.value && r.value !== "--" && r.value !== "Not set",
                  )
                  .map(({ icon, label, value }, idx, arr) => (
                    <View
                      key={idx}
                      style={[
                        styles.infoDialogRow,
                        {
                          borderBottomColor: colors.border,
                          borderBottomWidth:
                            idx < arr.length - 1 ? StyleSheet.hairlineWidth : 0,
                          paddingHorizontal: 0,
                        },
                      ]}
                    >
                      <Ionicons
                        name={icon}
                        size={15}
                        color="#FF4D8D"
                        style={{ width: 22 }}
                      />
                      <ThemedText
                        style={[
                          styles.infoDialogLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {label}
                      </ThemedText>
                      <ThemedText
                        style={[styles.infoDialogValue, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {value}
                      </ThemedText>
                    </View>
                  ))}

                {/* {hasBiodata && (
                  <TouchableOpacity
                    style={[
                      styles.infoDialogRow,
                      { borderBottomWidth: 0, paddingHorizontal: 0 },
                    ]}
                    onPress={handleViewBiodata}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="document-text-outline"
                      size={15}
                      color="#FF4D8D"
                      style={{ width: 22 }}
                    />
                    <ThemedText
                      style={[
                        styles.infoDialogLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Biodata
                    </ThemedText>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <ThemedText
                        style={[styles.infoDialogValue, { color: "#FF4D8D" }]}
                      >
                        View PDF
                      </ThemedText>
                      <Ionicons name="open-outline" size={12} color="#FF4D8D" />
                    </View>
                  </TouchableOpacity>
                )} */}

                {displayInterests && displayInterests.length > 0 && (
                  <View style={styles.infoExpandInterests}>
                    <ThemedText
                      style={[
                        styles.infoDialogLabel,
                        { color: colors.textSecondary, marginBottom: 8 },
                      ]}
                    >
                      Interests
                    </ThemedText>
                    <View style={styles.infoDialogTagsRow}>
                      {displayInterests.map((item: string, i: number) => (
                        <View key={i} style={styles.infoDialogTag}>
                          <ThemedText style={styles.infoDialogTagText}>
                            {item}
                          </ThemedText>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Biodata row — own profile: upload/edit; other profile: view if available */}
            {isOtherProfileView ? (
              hasBiodata ? (
                <TouchableOpacity
                  style={[
                    styles.biodataRow,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.card,
                    },
                  ]}
                  onPress={handleViewBiodata}
                  activeOpacity={0.75}
                >
                  <View style={styles.detailLeft}>
                    <View style={styles.biodataIconDot}>
                      <Ionicons
                        name="document-text-outline"
                        size={16}
                        color="#FF4D8D"
                      />
                    </View>
                    <View>
                      <ThemedText
                        style={[styles.detailLabel, { color: colors.text }]}
                      >
                        Biodata
                      </ThemedText>
                      <ThemedText
                        style={{
                          fontSize: 11,
                          color: colors.muted,
                          marginTop: 2,
                        }}
                      >
                        {biodataObj?.isGenerated
                          ? "Generated PDF · tap to view"
                          : "Uploaded PDF · tap to view"}
                      </ThemedText>
                    </View>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.muted}
                  />
                </TouchableOpacity>
              ) : null
            ) : (
              <TouchableOpacity
                style={[
                  styles.biodataRow,
                  { borderColor: colors.border, backgroundColor: colors.card },
                ]}
                activeOpacity={hasBiodata ? 0.75 : 1}
                onPress={hasBiodata ? handleViewBiodata : undefined}
              >
                <View style={styles.detailLeft}>
                  <View style={styles.biodataIconDot}>
                    <Ionicons
                      name="document-text-outline"
                      size={16}
                      color="#FF4D8D"
                    />
                  </View>
                  <View>
                    <ThemedText
                      style={[styles.detailLabel, { color: colors.text }]}
                    >
                      Biodata
                    </ThemedText>
                    <ThemedText
                      style={{
                        fontSize: 11,
                        color: colors.muted,
                        marginTop: 2,
                      }}
                    >
                      {hasBiodata
                        ? biodataObj?.isGenerated
                          ? "Generated PDF · tap to view"
                          : "Uploaded PDF · tap to view"
                        : "Not added yet"}
                    </ThemedText>
                  </View>
                </View>
                {hasBiodata ? (
                  <TouchableOpacity
                    style={[
                      styles.biodataRoundBtn,
                      { backgroundColor: "rgba(255,77,141,0.12)" },
                    ]}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      setShowUpdateModal(true);
                    }}
                  >
                    <Ionicons name="create-outline" size={14} color="#FF4D8D" />
                  </TouchableOpacity>
                ) : (
                  <View style={{ flexDirection: "row", gap: 6 }}>
                    <TouchableOpacity
                      style={styles.biodataMiniBtn}
                      onPress={handleUploadBiodata}
                      disabled={uploadingBiodata}
                    >
                      {uploadingBiodata ? (
                        <ActivityIndicator color="#FF4D8D" size="small" />
                      ) : (
                        <>
                          <Ionicons
                            name="cloud-upload-outline"
                            size={11}
                            color="#FF4D8D"
                          />
                          <ThemedText style={styles.biodataMiniBtnText}>
                            Upload
                          </ThemedText>
                        </>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.biodataMiniBtn, styles.biodataMiniBtnPink]}
                      onPress={() => setShowGenerateModal(true)}
                    >
                      <Ionicons
                        name="sparkles-outline"
                        size={11}
                        color="#fff"
                      />
                      <ThemedText
                        style={[styles.biodataMiniBtnText, { color: "#fff" }]}
                      >
                        Create
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* ── Divider ── */}
          <View
            style={[styles.sectionDivider, { borderColor: colors.border }]}
          />

          {/* ── Photos Grid ── */}
          {(galleryPhotos.length > 0 || !isOtherProfileView) && (
            <View style={styles.photoGridSection}>
              {loadingPhotos && !isOtherProfileView ? (
                <ActivityIndicator color="#FF4D8D" style={{ marginTop: 16 }} />
              ) : galleryPhotos.length > 0 ? (
                <FlatList
                  data={galleryPhotos}
                  scrollEnabled={false}
                  numColumns={3}
                  keyExtractor={(item) => item.id.toString()}
                  columnWrapperStyle={styles.photoRow}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.photoThumb}
                      onPress={() => setSelectedPhoto(item)}
                    >
                      <Image
                        source={{ uri: getPhotoUrl(item.photoUrl) }}
                        style={styles.photoThumbImg}
                      />
                    </TouchableOpacity>
                  )}
                />
              ) : (
                <View
                  style={[
                    styles.noPhotosPlaceholder,
                    { borderColor: colors.border },
                  ]}
                >
                  <Ionicons
                    name="images-outline"
                    size={28}
                    color={colors.muted}
                  />
                  <ThemedText
                    style={[styles.noPhotosText, { color: colors.muted }]}
                  >
                    No photos yet
                  </ThemedText>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Generate Biodata Modal */}
        <Modal visible={showGenerateModal} animationType="slide" transparent>
          <View
            style={[
              styles.modalOverlay,
              { backgroundColor: colors.modalOverlay },
            ]}
          >
            <View
              style={[styles.modalContent, { backgroundColor: colors.card }]}
            >
              <View
                style={[
                  styles.modalHeader,
                  { borderBottomColor: colors.border },
                ]}
              >
                <ThemedText style={styles.modalTitle}>
                  Generate Matrimony PDF
                </ThemedText>
                <TouchableOpacity onPress={() => setShowGenerateModal(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView
                contentContainerStyle={styles.modalForm}
                showsVerticalScrollIndicator={false}
              >
                <ThemedText style={styles.formSectionTitle}>
                  Personal Info (Prefilled)
                </ThemedText>
                <View
                  style={[
                    styles.prefilledRow,
                    { backgroundColor: colors.card2 },
                  ]}
                >
                  <ThemedText style={styles.prefilledLabel}>
                    Name: {displayName}
                  </ThemedText>
                </View>
                <View
                  style={[
                    styles.prefilledRow,
                    { backgroundColor: colors.card2 },
                  ]}
                >
                  <ThemedText style={styles.prefilledLabel}>
                    Age: {displayAge} yrs
                  </ThemedText>
                </View>

                <ThemedText style={styles.formSectionTitle}>
                  Matrimonial Details
                </ThemedText>

                <ThemedText style={styles.inputLabel}>Religion</ThemedText>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.inputBg,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  value={religion}
                  onChangeText={setReligion}
                  placeholder="e.g. Hindu"
                  placeholderTextColor="#777"
                />

                <ThemedText style={styles.inputLabel}>Caste</ThemedText>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.inputBg,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  value={caste}
                  onChangeText={setCaste}
                  placeholder="e.g. Vasudev"
                  placeholderTextColor="#777"
                />

                <ThemedText style={styles.inputLabel}>Father's Name</ThemedText>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.inputBg,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  value={fatherName}
                  onChangeText={setFatherName}
                  placeholder="e.g. Rajesh Sharma"
                  placeholderTextColor="#777"
                />

                <ThemedText style={styles.inputLabel}>Mother's Name</ThemedText>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.inputBg,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  value={motherName}
                  onChangeText={setMotherName}
                  placeholder="e.g. Sunita Sharma"
                  placeholderTextColor="#777"
                />

                <TouchableOpacity
                  style={styles.submitGenerateButton}
                  onPress={handleGenerateBiodata}
                  disabled={generatingBiodata}
                >
                  {generatingBiodata ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="sparkles" size={18} color="#fff" />
                      <ThemedText style={styles.submitGenerateButtonText}>
                        Compile & Save PDF
                      </ThemedText>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Update Biodata Modal */}
        <Modal visible={showUpdateModal} animationType="slide" transparent>
          <View
            style={[
              styles.modalOverlay,
              { backgroundColor: colors.modalOverlay },
            ]}
          >
            <View
              style={[
                styles.modalContent,
                { backgroundColor: colors.card, paddingBottom: 40 },
              ]}
            >
              <View
                style={[
                  styles.modalHeader,
                  { borderBottomColor: colors.border },
                ]}
              >
                <ThemedText style={styles.modalTitle}>
                  Update Biodata
                </ThemedText>
                <TouchableOpacity onPress={() => setShowUpdateModal(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.updateModalBody}>
                <TouchableOpacity
                  style={[
                    styles.updateOptionBtn,
                    { backgroundColor: colors.card2 },
                  ]}
                  onPress={() => {
                    setShowUpdateModal(false);
                    handleUploadBiodata();
                  }}
                >
                  <View
                    style={[
                      styles.updateOptionIconBox,
                      { backgroundColor: "rgba(30, 106, 210, 0.1)" },
                    ]}
                  >
                    <Ionicons
                      name="cloud-upload-outline"
                      size={20}
                      color="#1E6AD2"
                    />
                  </View>
                  <View style={styles.updateOptionInfo}>
                    <ThemedText style={styles.updateOptionTitle}>
                      Upload New PDF
                    </ThemedText>
                    <ThemedText style={styles.updateOptionSub}>
                      Choose a compiled PDF file from your device
                    </ThemedText>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colors.muted}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.updateOptionBtn,
                    { backgroundColor: colors.card2 },
                  ]}
                  onPress={() => {
                    setShowUpdateModal(false);
                    setShowGenerateModal(true);
                  }}
                >
                  <View
                    style={[
                      styles.updateOptionIconBox,
                      { backgroundColor: "rgba(255, 77, 141, 0.1)" },
                    ]}
                  >
                    <Ionicons
                      name="sparkles-outline"
                      size={20}
                      color="#FF4D8D"
                    />
                  </View>
                  <View style={styles.updateOptionInfo}>
                    <ThemedText style={styles.updateOptionTitle}>
                      Generate New PDF
                    </ThemedText>
                    <ThemedText style={styles.updateOptionSub}>
                      Instantly build a fresh PDF from your details
                    </ThemedText>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colors.muted}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Full Photo Preview Modal */}
        <Modal visible={!!selectedPhoto} transparent animationType="slide">
          <SafeAreaView
            style={[
              styles.previewContainer,
              { backgroundColor: colors.background },
            ]}
            edges={["top", "bottom"]}
          >
            {/* Header bar of modal */}
            <View
              style={[
                styles.previewHeader,
                { borderBottomColor: colors.border },
              ]}
            >
              <TouchableOpacity
                style={styles.previewCloseButton}
                onPress={() => setSelectedPhoto(null)}
              >
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <ThemedText style={styles.previewTitle}>
                {isOtherProfileView
                  ? isMr
                    ? "गॅलरी"
                    : "Gallery"
                  : isMr
                    ? "माझी गॅलरी"
                    : "My Gallery"}
              </ThemedText>
              <View style={{ width: 40 }} />
            </View>

            {/* Vertical scroll list of posts */}
            <FlatList
              data={galleryPhotos}
              keyExtractor={(item) => item.id.toString()}
              initialScrollIndex={
                galleryPhotos.indexOf(selectedPhoto!) !== -1
                  ? galleryPhotos.indexOf(selectedPhoto!)
                  : 0
              }
              getItemLayout={(_, index) => ({
                length: SW + 76,
                offset: (SW + 76) * index,
                index,
              })}
              renderItem={({ item }) => {
                const imgUrl = getPhotoUrl(item.photoUrl);
                return (
                  <View style={styles.instagramPostCard}>
                    {/* Post Header */}
                    <View style={styles.instagramPostHeader}>
                      <View style={styles.instagramPostHeaderLeft}>
                        <Image
                          source={{ uri: displayImage }}
                          style={styles.instagramPostAvatar}
                        />
                        <View>
                          <ThemedText style={styles.instagramPostName}>
                            {isOtherProfileView
                              ? otherUser?.profile?.fullName
                              : user?.profile?.fullName}
                          </ThemedText>
                          <ThemedText style={styles.instagramPostLocation}>
                            📍{" "}
                            {isOtherProfileView
                              ? otherUser?.profile?.city
                              : user?.profile?.city || "VVS Member"}
                          </ThemedText>
                        </View>
                      </View>

                      {/* Delete button (if own profile) */}
                      {!isOtherProfileView && (
                        <TouchableOpacity
                          style={styles.postDeleteBtn}
                          onPress={() => handleDeletePhoto(item.id)}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={20}
                            color="#ff5c5c"
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                    {/* Post Image */}
                    <Image
                      source={{ uri: imgUrl }}
                      style={styles.instagramPostImage}
                    />
                  </View>
                );
              }}
              showsVerticalScrollIndicator={false}
            />
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
      <BottomNavigation
        activeRouteOverride={isOtherProfileView ? "/search" : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  container: { flex: 1 },

  // ── Top bar ──
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  topBarTitle: { fontSize: 17, fontWeight: "700" },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  settingButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  settingPlaceholder: { width: 36 },

  // ── Hero ──
  heroSection: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  avatarRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2.5,
    borderColor: "#FF4D8D",
    padding: 3,
    marginBottom: 14,
  },
  heroAvatar: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
  },
  heroNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  heroName: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  heroSub: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 10,
  },
  heroBio: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  quickChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
    marginBottom: 10,
  },
  quickChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: StyleSheet.hairlineWidth,
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: "600",
    maxWidth: 100,
  },
  interestTagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
    marginBottom: 14,
  },
  interestTag: {
    backgroundColor: "rgba(255,77,141,0.10)",
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  interestTagText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FF4D8D",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
    width: "100%",
  },
  matchBadge: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: "center",
    minWidth: 68,
  },
  matchPct: {
    fontSize: 17,
    fontWeight: "800",
  },
  matchLbl: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 1,
  },
  connectBtn: {
    flex: 1,
    height: 44,
    borderRadius: 100,
    backgroundColor: "#FF4D8D",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  connectBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },

  // ── Full-width connect button (other profile) ──
  connectSection: {
    paddingVertical: 14,
    alignItems: "center",
  },
  connectBtnFull: {
    height: 40,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1.2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  connectBtnFullText: {
    fontWeight: "700",
    fontSize: 13,
    letterSpacing: 0.2,
  },

  // ── Below-hero section (See More + Biodata) ──
  belowHeroSection: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
    gap: 10,
  },
  seeMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  seeMoreBtnText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
  infoExpandCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  infoExpandHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  infoExpandAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "#FF4D8D",
  },
  infoExpandName: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 2,
  },
  infoExpandSub: {
    fontSize: 12,
    fontWeight: "500",
  },
  infoExpandDivider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 4,
  },
  infoExpandInterests: {
    paddingTop: 10,
  },
  biodataRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  biodataIconDot: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,77,141,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Centered Info Dialog ──
  infoModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  infoModalDialog: {
    width: "100%",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 20,
  },
  infoModalCloseBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  infoDialogHeader: {
    alignItems: "center",
    paddingTop: 28,
    paddingBottom: 18,
    paddingHorizontal: 20,
  },
  infoDialogAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2.5,
    borderColor: "#FF4D8D",
    marginBottom: 10,
  },
  infoDialogName: {
    fontSize: 19,
    fontWeight: "800",
    marginBottom: 3,
  },
  infoDialogSub: {
    fontSize: 12,
    fontWeight: "500",
  },
  infoDialogDivider: {
    height: StyleSheet.hairlineWidth,
  },
  infoDialogRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  infoDialogLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
  },
  infoDialogValue: {
    fontSize: 13,
    fontWeight: "700",
    maxWidth: "50%",
    textAlign: "right",
  },
  infoDialogInterests: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  infoDialogTagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 6,
  },
  infoDialogTag: {
    backgroundColor: "rgba(255,77,141,0.10)",
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  infoDialogTagText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FF4D8D",
  },

  // ── Info Modal (legacy bottom-sheet kept for compat) ──
  infoModalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 0,
    maxHeight: "80%",
  },
  infoModalHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 14,
  },
  infoModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  infoModalTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  infoModalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  infoModalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  infoModalIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  infoModalLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  infoModalValue: {
    fontSize: 15,
    fontWeight: "700",
  },
  infoModalInterests: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  infoModalTagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  infoModalTag: {
    backgroundColor: "rgba(255,77,141,0.10)",
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  infoModalTagText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FF4D8D",
  },

  // ── Divider ──
  sectionDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginHorizontal: 0,
    marginVertical: 0,
  },

  // ── Details list ──
  detailsSection: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  detailLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "700",
    maxWidth: "55%",
    textAlign: "right",
  },

  // ── Photo grid ──
  photoGridSection: { paddingBottom: 8 },
  photoRow: { gap: 1.5, marginBottom: 1.5 },
  photoThumb: { width: (SW - 3) / 3, aspectRatio: 1, overflow: "hidden" },
  photoThumbImg: { width: "100%", height: "100%" },
  noPhotosPlaceholder: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  noPhotosText: { fontSize: 13 },

  // ── Biodata buttons (kept, used in detailsSection) ──
  biodataRoundBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FF4D8D",
    justifyContent: "center",
    alignItems: "center",
  },
  biodataMiniBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,77,141,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,77,141,0.25)",
    borderRadius: 100,
    paddingHorizontal: 12,
    height: 32,
    gap: 5,
  },
  biodataMiniBtnPink: {
    backgroundColor: "#FF4D8D",
    borderColor: "#FF4D8D",
  },
  biodataMiniBtnText: {
    color: "#FF4D8D",
    fontSize: 12,
    fontWeight: "700",
  },

  // Legacy (kept for photo preview modal & biodata modals below)
  postSection: { marginTop: 28, paddingHorizontal: 16 },
  postTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16 },
  columnWrapper: {
    justifyContent: "flex-start",
    gap: 8,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  postContainer: {
    width: (SW - 48) / 3,
    aspectRatio: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  postImage: { width: "100%", height: "100%" },
  noPhotos: {
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    marginHorizontal: 16,
  },

  // Kept for backward compat in infoRow / miniChip used in modal sections
  infoRowsSection: {
    marginTop: 0,
    borderRadius: 0,
    overflow: "hidden",
    borderWidth: 0,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoRowLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  infoRowLabel: { fontSize: 13, fontWeight: "500", opacity: 0.65 },
  infoRowValue: {
    fontSize: 13,
    fontWeight: "700",
    maxWidth: "55%",
    textAlign: "right",
  },
  infoRowChips: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
    justifyContent: "flex-end",
    maxWidth: "60%",
  },
  miniChip: {
    backgroundColor: "rgba(255,77,141,0.1)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  miniChipText: { fontSize: 11, fontWeight: "600", color: "#FF4D8D" },
  ageBadge: {
    marginTop: 6,
  },
  ageBadgeText: {
    color: "#FF4D8D",
    fontSize: 12,
    fontWeight: "600",
  },
  instagramBioContainer: {
    marginTop: 14,
    paddingHorizontal: 2,
  },
  instagramBioText: {
    fontSize: 13,
    lineHeight: 19,
  },
  identityChip: {
    backgroundColor: "#1E1E24",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  identityChipText: { fontSize: 11, fontWeight: "600" },

  statsCardUnified: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#151519",
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 12,
    marginTop: 24,
  },
  statColumnUnified: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statDivider: {
    width: 1,
    height: 38,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  statLabelUnified: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValueUnified: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  statSubValueUnified: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 2,
  },
  topActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 20,
  },
  miniScoreCard: {
    backgroundColor: "#1C251D",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(59, 140, 88, 0.15)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 85,
  },
  miniScoreLabel: {
    color: "#8E9A90",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  miniScoreValue: {
    fontSize: 16,
    fontWeight: "800",
    marginTop: 2,
  },
  miniRequestButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#FF4D8D",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  miniRequestedButton: {
    backgroundColor: "#3B8C58",
  },
  miniRequestButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  infoCard: {
    backgroundColor: "#151519",
    borderRadius: 24,
    padding: 20,
    marginTop: 22,
  },
  cardTitle: { fontSize: 20, fontWeight: "700", marginBottom: 14 },
  lookingForRow: { flexDirection: "row", gap: 10 },
  lookingForChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#24242B",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  lookingForChipActive: { backgroundColor: "#FF4D8D", borderColor: "#FF4D8D" },
  lookingForChipText: { fontSize: 13, fontWeight: "600" },
  lookingForChipTextActive: { color: "#fff", fontSize: 13, fontWeight: "700" },
  aboutText: { fontSize: 14, lineHeight: 22 },
  interestContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  interestChip: {
    backgroundColor: "rgba(255, 77, 141, 0.06)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 77, 141, 0.15)",
  },
  interestText: {
    color: "#FF4D8D",
    fontSize: 13,
    fontWeight: "600",
  },
  lifestyleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  lifestylePill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E24",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.03)",
    gap: 8,
  },
  lifestylePillTexts: {
    flex: 1,
  },
  lifestylePillLabel: {
    fontSize: 10,
    fontWeight: "600",
  },
  lifestylePillValue: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 1,
  },

  actionButtons: { marginTop: 30, gap: 12 },
  editButton: {
    backgroundColor: "rgba(255, 77, 141, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 77, 141, 0.3)",
    borderRadius: 18,
    height: 55,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  editButtonText: { color: "#FF4D8D", fontWeight: "700" },
  logoutButton: {
    backgroundColor: "#17171C",
    borderRadius: 18,
    height: 55,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  logoutText: { color: "#ff5c5c", fontWeight: "700" },

  // Biodata Styles
  biodataPanelUnified: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#151519",
    borderRadius: 20,
    padding: 16,
    marginTop: 22,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  biodataPanelLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  biodataIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255, 77, 141, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  biodataInfoTexts: {
    marginLeft: 12,
    flex: 1,
  },
  biodataPanelTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  biodataPanelStatus: {
    fontSize: 12,
    marginTop: 2,
  },
  biodataPanelRight: {
    marginLeft: 10,
    justifyContent: "center",
  },
  biodataActionIconsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  // Modal Styles
  updateModalBody: {
    paddingVertical: 24,
    gap: 12,
  },
  updateOptionBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    gap: 14,
    marginBottom: 8,
  },
  updateOptionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  updateOptionInfo: {
    flex: 1,
  },
  updateOptionTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  updateOptionSub: {
    fontSize: 11,
    color: "#9B9BA1",
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#151519",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
    paddingHorizontal: 20,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  modalForm: {
    paddingVertical: 20,
    paddingBottom: 40,
  },
  formSectionTitle: {
    color: "#FF4D8D",
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 12,
    marginTop: 8,
  },
  prefilledRow: {
    backgroundColor: "#1D1D24",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  prefilledLabel: {
    fontSize: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 14,
  },
  textInput: {
    backgroundColor: "#1E1E24",
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 16,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  submitGenerateButton: {
    backgroundColor: "#FF4D8D",
    borderRadius: 16,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 28,
  },
  submitGenerateButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  previewContainer: {
    flex: 1,
    backgroundColor: "#0B0B0D",
  },
  previewHeader: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  previewCloseButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  instagramPostCard: {
    width: SW,
    marginBottom: 20,
  },
  instagramPostHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  instagramPostHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  instagramPostAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#FF4D8D",
  },
  instagramPostName: {
    fontSize: 14,
    fontWeight: "700",
  },
  instagramPostLocation: {
    color: "#8E8E95",
    fontSize: 11,
    marginTop: 2,
  },
  instagramPostImage: {
    width: SW,
    height: SW,
  },
  postDeleteBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
});
