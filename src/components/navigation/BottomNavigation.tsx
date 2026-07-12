import { useAuth } from "@/context/AuthContext";
import { ThemedText } from "@/components/themed-text";
import { Feather } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { StyleSheet, TouchableOpacity, View, Platform, Image } from "react-native";
import { useEffect, useState } from "react";
import AuthModal from "@/components/ui/AuthModal";
import { BASE_URL } from "@/utils/api";

type BottomNavigationProps = {
  activeRouteOverride?: string;
};

export default function BottomNavigation({ activeRouteOverride }: BottomNavigationProps) {
  const pathname = usePathname();
  const { isAuthenticated, profileCompleted, user } = useAuth();
  const [showLockedWarning, setShowLockedWarning] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (!showLockedWarning) return;

    const timeoutId = setTimeout(() => {
      setShowLockedWarning(false);
    }, 2200);

    return () => clearTimeout(timeoutId);
  }, [showLockedWarning]);

  const blockedRoutes = new Set(["/search", "/requests"]);

  const handleTabPress = (route: string) => {
    if (!isAuthenticated) {
      if (route === "/") {
        router.push(route as any);
      } else {
        setShowAuthModal(true);
      }
      return;
    }

    if (!profileCompleted && blockedRoutes.has(route)) {
      setShowLockedWarning(true);
      return;
    }

    router.push(route as any);
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
    {
      icon: "search",
      label: "Search",
      route: "/search",
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
  ];

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
        <View style={styles.lockWarning}>
          <Feather name="lock" size={16} color="#D0D0D5" />
          <ThemedText style={styles.lockWarningText}>
            To enable this, complete your profile.
          </ThemedText>
        </View>
      )}

      <View style={styles.container}>
      {tabs.map((tab, index) => {
        const active = (activeRouteOverride ?? pathname) === tab.route;
        const ownPhoto = user?.profile?.profilePhoto;

        return (
          <TouchableOpacity
            key={index}
            style={styles.tabButton}
            onPress={() => handleTabPress(tab.route)}
          >
            {tab.icon === "user" && ownPhoto ? (
              <Image
                source={{ uri: getPhotoUrl(ownPhoto) }}
                style={[
                  styles.profileAvatar,
                  { borderColor: active ? "#FF4D8D" : "rgba(255,255,255,0.18)" }
                ]}
              />
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
    paddingBottom: Platform.OS === 'ios' ? 26 : 12,

    borderTopWidth: 0.5,
    borderTopColor: "rgba(255,255,255,0.08)",

    zIndex: 999,
  },

  lockWarning: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: Platform.OS === 'ios' ? 78 : 58,
    borderRadius: 14,
    backgroundColor: "#2A2A2F",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    zIndex: 1000,
  },

  lockWarningText: {
    color: "#D0D0D5",
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
