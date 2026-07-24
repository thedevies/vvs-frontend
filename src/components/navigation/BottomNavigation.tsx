import { useAuth } from "@/context/AuthContext";
import { ThemedText } from "@/components/themed-text";
import { Feather, Ionicons } from "@expo/vector-icons";
import { router, usePathname, useLocalSearchParams } from "expo-router";
import { StyleSheet, TouchableOpacity, View, Platform, Image, ActivityIndicator, Animated, Modal } from "react-native";
import { useEffect, useState } from "react";
import AuthModal from "@/components/ui/AuthModal";
import { BASE_URL, profileApi } from "@/utils/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { CustomAlert as Alert } from "@/utils/alert";
import { eventEmitter } from "@/utils/events";
import { useAppTheme } from "@/context/ThemeContext";

import { useLanguage } from "@/context/LanguageContext";
import { pickImageWithPermissionCheck } from "@/utils/imagePicker";

type BottomNavigationProps = {
  activeRouteOverride?: string;
  containerStyle?: any;
};

export default function BottomNavigation({ activeRouteOverride, containerStyle }: BottomNavigationProps) {
  const pathname = usePathname();
  const params = useLocalSearchParams();
  const { isAuthenticated, profileCompleted, user } = useAuth();
  const { colors, isDark } = useAppTheme();
  const { t } = useLanguage();
  const [showLockedWarning, setShowLockedWarning] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const insets = useSafeAreaInsets();

  const bottomPadding = insets.bottom > 0 ? insets.bottom : 12;
  const warningBottom = 54 + bottomPadding;

  useEffect(() => {
    if (!showLockedWarning) return;

    const timeoutId = setTimeout(() => {
      setShowLockedWarning(false);
    }, 2200);

    return () => clearTimeout(timeoutId);
  }, [showLockedWarning]);

  const blockedRoutes = new Set(["/search", "/requests"]);
  const [uploading, setUploading] = useState(false);

  const handleUploadPhoto = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    if (!profileCompleted) {
      setShowLockedWarning(true);
      return;
    }

    try {
      const result = await pickImageWithPermissionCheck({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (result && !result.canceled && result.assets && result.assets.length > 0) {
        const photoUri = result.assets[0].uri;
        console.log("[BottomNav] Uploading gallery photo:", photoUri);
        setUploading(true);

        const response = await profileApi.uploadPhoto(photoUri);
        if (response.data) {
          Alert.alert("Success", "Photo uploaded to your gallery successfully!");
          eventEmitter.emit("photo-uploaded");
        } else {
          Alert.alert("Upload Failed", response.message || "Failed to upload photo.");
        }
      }
    } catch (err: any) {
      console.error("[BottomNav] Upload failed:", err);
      Alert.alert("Error", err.message || "Failed to upload photo.");
    } finally {
      setUploading(false);
    }
  };

  const tabs = [
    {
      icon: "home",
      label: t("home"),
      route: "/",
    },
    {
      icon: "compass",
      label: t("explore"),
      route: "/explore",
    },
    {
      icon: "plus",
      label: t("upload"),
      action: "upload",
    },
    {
      icon: "heart",
      label: t("requests"),
      route: "/requests",
    },
    {
      icon: "user",
      label: t("profile"),
      route: "/profile",
    },
  ] as const;

  const [showPlusActionModal, setShowPlusActionModal] = useState(false);

  const handleTabPress = (tab: typeof tabs[number]) => {
    if ('action' in tab && tab.action === "upload") {
      if (!isAuthenticated) {
        setShowAuthModal(true);
        return;
      }
      if (!profileCompleted) {
        setShowLockedWarning(true);
        return;
      }
      setShowPlusActionModal(true);
      return;
    }
    const route = (tab as any).route;
    const isViewingOtherProfile = pathname === '/profile' && params.view === 'other';
    if (route === pathname && !isViewingOtherProfile) return;
    if (route === '/profile' && pathname === '/edit-profile') return;

    if (!isAuthenticated) {
      if (route === "/" || route === "/explore") {
        router.push(route as any);
      } else {
        setShowAuthModal(true);
      }
      return;
    }

    if (route === "/profile" && !profileCompleted) {
      router.push("/edit-profile");
      return;
    }

    if (!profileCompleted && blockedRoutes.has(route)) {
      setShowLockedWarning(true);
      return;
    }

    router.push(route as any);
  };

  const getPhotoUrl = (path?: string | null): string => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const baseUrl = BASE_URL.replace('/api', '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  };

  return (
    <>
      <AuthModal visible={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {/* Plus Button Action Modal */}
      <Modal visible={showPlusActionModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              paddingBottom: insets.bottom > 0 ? insets.bottom + 20 : 28,
            }
          ]}>
            <View style={styles.modalHeaderRow}>
              <ThemedText style={[styles.modalTitle, { color: colors.text }]}>{t('quickAction')}</ThemedText>
              <TouchableOpacity onPress={() => setShowPlusActionModal(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 10, marginTop: 12 }}>
              <TouchableOpacity
                style={[styles.modalOptionBtn, { backgroundColor: colors.card2 || colors.background, borderColor: colors.border }]}
                onPress={() => {
                  setShowPlusActionModal(false);
                  router.push("/success-stories?action=add");
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.modalOptionIconBox, { backgroundColor: "rgba(255, 77, 141, 0.12)" }]}>
                  <ThemedText style={{ fontSize: 16 }}>💍</ThemedText>
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={[styles.modalOptionTitle, { color: colors.text }]}>{t('addSuccessStory')}</ThemedText>
                  <ThemedText style={[styles.modalOptionSub, { color: colors.textSecondary }]}>{t('shareJourney')}</ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalOptionBtn, { backgroundColor: colors.card2 || colors.background, borderColor: colors.border }]}
                onPress={() => {
                  setShowPlusActionModal(false);
                  handleUploadPhoto();
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.modalOptionIconBox, { backgroundColor: "rgba(30, 106, 210, 0.12)" }]}>
                  <Ionicons name="image-outline" size={18} color="#1E6AD2" />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={[styles.modalOptionTitle, { color: colors.text }]}>{t('uploadProfilePhoto')}</ThemedText>
                  <ThemedText style={[styles.modalOptionSub, { color: colors.textSecondary }]}>{t('addPhotosToGallery')}</ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {showLockedWarning && (
        <View style={[styles.lockWarning, { bottom: warningBottom }]}>
          <Feather name="lock" size={16} color="#FF4D8D" />
          <ThemedText style={styles.lockWarningText}>
            To enable this, create your profile.
          </ThemedText>
        </View>
      )}

      <Animated.View style={[styles.container, { 
        paddingBottom: bottomPadding,
        backgroundColor: colors.card,
        borderTopColor: colors.border,
      }, containerStyle]}>
      {tabs.map((tab, index) => {
        const active = 'route' in tab && (activeRouteOverride ?? pathname) === tab.route;
        const ownPhoto = user?.profile?.profilePhoto;

        return (
          <TouchableOpacity
            key={index}
            style={styles.tabButton}
            onPress={() => handleTabPress(tab)}
          >
            {tab.icon === "user" && ownPhoto ? (
              <Image
                source={{ uri: getPhotoUrl(ownPhoto) }}
                style={[
                  styles.profileAvatar,
                  { borderColor: active ? "#FF4D8D" : colors.border }
                ]}
              />
            ) : 'action' in tab && tab.action === 'upload' && uploading ? (
              <ActivityIndicator size="small" color="#FF4D8D" />
            ) : (
              <Feather
                name={tab.icon as any}
                size={22}
                color={active ? "#FF4D8D" : "#9B9BA1"}
              />
            )}
          </TouchableOpacity>
        );
      })}
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,

    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",

    backgroundColor: "#0F0F12",

    paddingTop: 12,

    borderTopWidth: 0.5,
    borderTopColor: "rgba(255,255,255,0.08)",

    zIndex: 999,
  },

  lockWarning: {
    position: "absolute",
    left: 24,
    right: 24,
    borderRadius: 14,
    backgroundColor: "#1A1215",
    borderWidth: 1,
    borderColor: "rgba(255, 77, 141, 0.3)",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    zIndex: 1000,
  },

  lockWarningText: {
    color: "#FF4D8D",
    fontSize: 12,
    fontWeight: "600",
  },

  tabButton: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    paddingVertical: 6,
  },

  profileAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
  },

  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    borderWidth: 1,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  modalOptionBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  modalOptionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOptionTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  modalOptionSub: {
    fontSize: 11,
    marginTop: 2,
  },
});
