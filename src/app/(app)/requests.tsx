import { Feather } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Modal,
  BackHandler,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";

import BottomNavigation from "@/components/navigation/BottomNavigation";
import { ThemedText } from "@/components/themed-text";
import { interestApi, BASE_URL } from "@/utils/api";
import { useAppTheme } from "@/context/ThemeContext";

const ACCENT = "#FF4D8D";
const ACCENT_SOFT = "rgba(255, 77, 141, 0.10)";
const ACCENT_SOFT_BORDER = "rgba(255, 77, 141, 0.28)";

const CARD_SHADOW = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  android: { elevation: 1 },
});

const FALLBACK_PHOTO =
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1200&auto=format&fit=crop";

export default function RequestsScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        router.replace("/");
        return true;
      };

      const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);

      return () => {
        subscription.remove();
      };
    }, [])
  );

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [notifications, setNotifications] = useState<any[]>([
    {
      id: "notif1",
      title: "New Connection Request",
      description: "Sneha Patil has sent you an interest request.",
      icon: "heart",
      type: "interests",
      time: "5m ago",
    },
    {
      id: "notif2",
      title: "Complete Your Profile",
      description: "Add bio details to get 3x more visibility.",
      icon: "user",
      type: "system",
      time: "1d ago",
    },
    {
      id: "notif3",
      title: "Request Accepted 🎉",
      description: "Rahul Shinde accepted your interest request.",
      icon: "check-circle",
      type: "interests",
      time: "2h ago",
    },
    {
      id: "notif4",
      title: "Account Security Update",
      description: "Your login session from vivo device was registered.",
      icon: "shield",
      type: "system",
      time: "3d ago",
    },
  ]);

  const [activeFilter, setActiveFilter] = useState<"all" | "interests" | "system">("all");
  const [selectedSection, setSelectedSection] = useState<"requests" | "activity">("requests");
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === "all") return true;
    return n.type === activeFilter;
  });

  useEffect(() => {
    fetchReceivedInterests();
  }, []);

  const getPhotoUrl = (path?: string | null): string => {
    if (!path) return FALLBACK_PHOTO;
    if (path.startsWith("http")) return path;
    const baseUrl = BASE_URL.replace("/api", "");
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  };

  const formatRelativeTime = (dateStr: string): string => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHrs < 1) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return `${Math.max(1, diffMins)}m ago`;
      }
      if (diffHrs < 24) {
        return `${diffHrs}h ago`;
      }
      return `${Math.floor(diffHrs / 24)}d ago`;
    } catch {
      return "Just now";
    }
  };

  const fetchReceivedInterests = async () => {
    try {
      setLoading(true);
      const response = await interestApi.getReceivedInterests(1, 100);
      if (response.data) {
        const mapped = (response.data as any[]).map((item: any) => {
          const profile = item.profile || {};
          const age = profile.dateOfBirth
            ? String(
                Math.floor(
                  (Date.now() - new Date(profile.dateOfBirth).getTime()) /
                    (365.25 * 24 * 60 * 60 * 1000)
                )
              )
            : "25";

          return {
            id: item.interestId,
            name: profile.fullName || "User",
            age,
            role: profile.profession || "N/A",
            city: profile.city || "N/A",
            image: getPhotoUrl(profile.profilePhoto),
            time: formatRelativeTime(item.createdAt),
            status: item.status,
          };
        });
        setRequests(mapped.filter((r: any) => r.status === "PENDING"));
      }
    } catch (err: any) {
      console.log("[Requests] Failed to load interests:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (name: string, interestId: number) => {
    try {
      await interestApi.acceptInterest(interestId);
      Alert.alert("Request Accepted", `You are now connected with ${name}!`);
      setRequests((prev) => prev.filter((r) => r.id !== interestId));
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to accept interest request.");
    }
  };

  const handleDeclineRequest = async (interestId: number) => {
    try {
      await interestApi.cancelInterest(interestId);
      Alert.alert("Declined", "Connection request declined.");
      setRequests((prev) => prev.filter((r) => r.id !== interestId));
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to decline interest request.");
    }
  };

  const handleDismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <View style={styles.mainContainer}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.dropdownBtn}
            onPress={() => setShowDropdown(true)}
            activeOpacity={0.75}
          >
            <View>
              <ThemedText style={styles.headerTitle}>
                {selectedSection === "requests" ? "Requests" : "Activity"}
              </ThemedText>
              <ThemedText style={styles.headerSubtitle}>
                {selectedSection === "requests"
                  ? requests.length > 0
                    ? `${requests.length} pending`
                    : "Connection requests"
                  : "Recent notifications"}
              </ThemedText>
            </View>
            <View style={styles.dropdownChevronWrap}>
              <Feather name="chevron-down" size={16} color={colors.text} />
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          {selectedSection === "requests" ? (
            loading ? (
              <View style={styles.loaderWrap}>
                <ActivityIndicator size="large" color={ACCENT} />
              </View>
            ) : (
              <View style={styles.sectionContainer}>
                {requests.length > 0 ? (
                  <View style={styles.requestsList}>
                    {requests.map((request) => (
                      <View key={request.id} style={[styles.requestCard, CARD_SHADOW]}>
                        <Image source={{ uri: request.image }} style={styles.requestAvatar} />
                        <View style={styles.requestContent}>
                          <ThemedText style={styles.requestName} numberOfLines={1}>
                            {request.name}
                          </ThemedText>
                          <ThemedText style={styles.requestRole} numberOfLines={1}>
                            {request.role}
                          </ThemedText>
                          <View style={styles.requestMetaRow}>
                            <View style={styles.requestMetaChip}>
                              <Feather name="map-pin" size={10} color={colors.muted} />
                              <ThemedText style={styles.requestMetaText} numberOfLines={1}>
                                {request.city}
                              </ThemedText>
                            </View>
                            <View style={styles.requestMetaDot} />
                            <ThemedText style={styles.requestMetaText}>{request.time}</ThemedText>
                          </View>

                          <View style={styles.requestActionRow}>
                            <TouchableOpacity
                              style={styles.miniAcceptBtn}
                              onPress={() => handleAcceptRequest(request.name, request.id)}
                              activeOpacity={0.85}
                            >
                              <Feather name="check" size={13} color="#fff" />
                              <ThemedText style={styles.miniBtnText}>Accept</ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.miniDeclineBtn}
                              onPress={() => handleDeclineRequest(request.id)}
                              activeOpacity={0.85}
                            >
                              <ThemedText style={styles.miniBtnTextDecline}>Decline</ThemedText>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <View style={styles.emptyIconCircle}>
                      <Feather name="users" size={22} color={colors.muted} />
                    </View>
                    <ThemedText style={styles.emptyTitle}>No pending requests</ThemedText>
                    <ThemedText style={styles.emptyBody}>
                      New connection requests will show up here.
                    </ThemedText>
                  </View>
                )}
              </View>
            )
          ) : (
            /* Recent Activity / Notifications Section */
            <View style={styles.sectionContainer}>
              {/* Filter Chips */}
              <View style={styles.filterContainer}>
                {(["all", "interests", "system"] as const).map((filter) => (
                  <TouchableOpacity
                    key={filter}
                    style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
                    onPress={() => setActiveFilter(filter)}
                    activeOpacity={0.8}
                  >
                    <ThemedText
                      style={[
                        styles.filterChipText,
                        activeFilter === filter && styles.filterChipTextActive,
                      ]}
                    >
                      {filter === "all" ? "All" : filter === "interests" ? "Interests" : "System"}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>

              {filteredNotifications.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconCircle}>
                    <Feather name="bell-off" size={22} color={colors.muted} />
                  </View>
                  <ThemedText style={styles.emptyTitle}>Nothing here yet</ThemedText>
                  <ThemedText style={styles.emptyBody}>
                    No notifications in this category.
                  </ThemedText>
                </View>
              ) : (
                <View style={styles.notificationsList}>
                  {filteredNotifications.map((notification) => (
                    <View key={notification.id} style={[styles.notificationCard, CARD_SHADOW]}>
                      <View style={styles.notificationIcon}>
                        <Feather name={notification.icon as any} size={15} color={ACCENT} />
                      </View>
                      <View style={styles.notificationInfo}>
                        <ThemedText style={styles.notificationTitle} numberOfLines={1}>
                          {notification.title}
                        </ThemedText>
                        <ThemedText style={styles.notificationDescription} numberOfLines={2}>
                          {notification.description}
                        </ThemedText>
                        <ThemedText style={styles.notificationTime}>{notification.time}</ThemedText>
                      </View>
                      <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => handleDismissNotification(notification.id)}
                        hitSlop={6}
                      >
                        <Feather name="x" size={14} color={colors.muted} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
      <BottomNavigation />

      {/* Dropdown Menu Modal */}
      <Modal visible={showDropdown} transparent animationType="fade">
        <TouchableOpacity
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => setShowDropdown(false)}
        >
          <View style={[styles.dropdownMenu, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.dropdownItem, selectedSection === "requests" && styles.dropdownItemActive]}
              onPress={() => {
                setSelectedSection("requests");
                setShowDropdown(false);
              }}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.dropdownItemIconWrap,
                  selectedSection === "requests" && styles.dropdownItemIconWrapActive,
                ]}
              >
                <Feather
                  name="users"
                  size={16}
                  color={selectedSection === "requests" ? ACCENT : colors.muted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText
                  style={[
                    styles.dropdownItemText,
                    selectedSection === "requests" && styles.dropdownItemTextActive,
                  ]}
                >
                  Connection Requests
                </ThemedText>
                {requests.length > 0 && (
                  <ThemedText style={styles.dropdownItemSub}>{requests.length} pending</ThemedText>
                )}
              </View>
              {selectedSection === "requests" && (
                <Feather name="check" size={16} color={ACCENT} />
              )}
            </TouchableOpacity>

            <View style={[styles.dropdownDivider, { backgroundColor: colors.border }]} />

            <TouchableOpacity
              style={[styles.dropdownItem, selectedSection === "activity" && styles.dropdownItemActive]}
              onPress={() => {
                setSelectedSection("activity");
                setShowDropdown(false);
              }}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.dropdownItemIconWrap,
                  selectedSection === "activity" && styles.dropdownItemIconWrapActive,
                ]}
              >
                <Feather
                  name="bell"
                  size={16}
                  color={selectedSection === "activity" ? ACCENT : colors.muted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText
                  style={[
                    styles.dropdownItemText,
                    selectedSection === "activity" && styles.dropdownItemTextActive,
                  ]}
                >
                  Recent Activity
                </ThemedText>
              </View>
              {selectedSection === "activity" && (
                <Feather name="check" size={16} color={ACCENT} />
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    mainContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 16,
    },
    dropdownBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    dropdownChevronWrap: {
      width: 26,
      height: 26,
      borderRadius: 13,
      marginTop: 2,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "800",
      letterSpacing: -0.3,
    },
    headerSubtitle: {
      fontSize: 12.5,
      color: colors.muted,
      marginTop: 2,
      fontWeight: "500",
    },

    // Dropdown modal
    dropdownOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.55)",
    },
    dropdownMenu: {
      position: "absolute",
      top: 96,
      left: 20,
      right: 20,
      borderRadius: 18,
      borderWidth: 1,
      padding: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.18,
      shadowRadius: 16,
      elevation: 6,
    },
    dropdownItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 10,
      borderRadius: 14,
      gap: 12,
    },
    dropdownItemActive: {
      backgroundColor: ACCENT_SOFT,
    },
    dropdownItemIconWrap: {
      width: 34,
      height: 34,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(128,128,140,0.12)",
    },
    dropdownItemIconWrapActive: {
      backgroundColor: ACCENT_SOFT_BORDER,
    },
    dropdownItemText: {
      fontSize: 15,
      fontWeight: "600",
    },
    dropdownItemTextActive: {
      color: ACCENT,
      fontWeight: "700",
    },
    dropdownItemSub: {
      fontSize: 11.5,
      color: colors.muted,
      marginTop: 1,
    },
    dropdownDivider: {
      height: 1,
      marginVertical: 4,
      marginHorizontal: 6,
    },

    sectionContainer: {
      gap: 12,
    },
    scrollContainer: {
      paddingHorizontal: 20,
      paddingBottom: 140,
    },
    loaderWrap: {
      paddingVertical: 60,
      alignItems: "center",
    },

    // Requests
    requestsList: {
      gap: 12,
    },
    requestCard: {
      flexDirection: "row",
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 14,
      gap: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    requestAvatar: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: colors.background,
    },
    requestContent: {
      flex: 1,
      minWidth: 0,
    },
    requestName: {
      fontSize: 15.5,
      fontWeight: "700",
    },
    requestRole: {
      fontSize: 12.5,
      color: colors.muted,
      marginTop: 1,
      fontWeight: "500",
    },
    requestMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 6,
    },
    requestMetaChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      maxWidth: 110,
    },
    requestMetaText: {
      fontSize: 11.5,
      color: colors.muted,
      fontWeight: "500",
    },
    requestMetaDot: {
      width: 3,
      height: 3,
      borderRadius: 1.5,
      backgroundColor: colors.muted,
    },
    requestActionRow: {
      flexDirection: "row",
      gap: 8,
      marginTop: 12,
    },
    miniAcceptBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: ACCENT,
      borderRadius: 9,
      paddingHorizontal: 14,
      height: 32,
      justifyContent: "center",
      alignItems: "center",
    },
    miniBtnText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "700",
    },
    miniDeclineBtn: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 9,
      paddingHorizontal: 14,
      height: 32,
      justifyContent: "center",
      alignItems: "center",
    },
    miniBtnTextDecline: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "700",
    },

    // Notifications
    notificationsList: {
      gap: 10,
    },
    notificationCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 13,
      gap: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    notificationIcon: {
      width: 36,
      height: 36,
      borderRadius: 11,
      backgroundColor: ACCENT_SOFT,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 1,
    },
    notificationInfo: {
      flex: 1,
      minWidth: 0,
    },
    notificationTitle: {
      fontSize: 13.5,
      fontWeight: "700",
    },
    notificationDescription: {
      color: colors.muted,
      fontSize: 12,
      marginTop: 2,
      lineHeight: 17,
    },
    notificationTime: {
      color: colors.muted,
      opacity: 0.7,
      fontSize: 10.5,
      marginTop: 5,
      fontWeight: "500",
    },
    closeButton: {
      padding: 4,
      marginTop: 1,
    },

    // Empty state
    emptyState: {
      alignItems: "center",
      paddingVertical: 56,
      paddingHorizontal: 24,
    },
    emptyIconCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 14,
    },
    emptyTitle: {
      fontSize: 15,
      fontWeight: "700",
      textAlign: "center",
    },
    emptyBody: {
      color: colors.muted,
      fontSize: 13,
      marginTop: 6,
      textAlign: "center",
      lineHeight: 19,
    },

    // Filters
    filterContainer: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 4,
    },
    filterChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterChipActive: {
      backgroundColor: ACCENT,
      borderColor: ACCENT,
    },
    filterChipText: {
      fontSize: 12.5,
      fontWeight: "600",
      color: colors.muted,
    },
    filterChipTextActive: {
      color: "#fff",
    },
  });