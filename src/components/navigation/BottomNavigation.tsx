import { useAuth } from "@/context/AuthContext";
import { ThemedText } from "@/components/themed-text";
import { Feather } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { StyleSheet, TouchableOpacity, View, Platform, Image, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import AuthModal from "@/components/ui/AuthModal";
import { BASE_URL, profileApi } from "@/utils/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { CustomAlert as Alert } from "@/utils/alert";

type BottomNavigationProps = {
  activeRouteOverride?: string;
};

export default function BottomNavigation({ activeRouteOverride }: BottomNavigationProps) {
  const pathname = usePathname();
  const { isAuthenticated, profileCompleted, user } = useAuth();
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
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permission Denied", "Media library access is required to upload photos.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photoUri = result.assets[0].uri;
        console.log("[BottomNav] Uploading gallery photo:", photoUri);
        setUploading(true);

        const response = await profileApi.uploadPhoto(photoUri);
        if (response.data) {
          Alert.alert("Success", "Photo uploaded to your gallery successfully!");
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
      label: "Home",
      route: "/",
    },
    {
      icon: "compass",
      label: "Explore",
      route: "/explore",
    },
    /*
    {
      icon: "search",
      label: "Search",
      route: "/search",
    },
    */
    {
      icon: "plus",
      label: "Upload",
      action: "upload",
    },
    {
      icon: "heart",
      label: "Requests",
      route: "/requests",
    },
    {
      icon: "user",
      label: "Profile",
      route: "/profile",
    },
  ] as const;

  const handleTabPress = (tab: typeof tabs[number]) => {
    if ('action' in tab && tab.action === "upload") {
      handleUploadPhoto();
      return;
    }
    const route = (tab as any).route;
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

      {showLockedWarning && (
        <View style={[styles.lockWarning, { bottom: warningBottom }]}>
          <Feather name="lock" size={16} color="#FF4D8D" />
          <ThemedText style={styles.lockWarningText}>
            To enable this, create your profile.
          </ThemedText>
        </View>
      )}

      <View style={[styles.container, { paddingBottom: bottomPadding }]}>
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
                  { borderColor: active ? "#FF4D8D" : "rgba(255,255,255,0.18)" }
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
      </View>
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
});
