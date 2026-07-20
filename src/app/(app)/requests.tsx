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
import { interestApi, notificationApi, BASE_URL } from "@/utils/api";
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

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [notifications, setNotifications] = useState<any[]>([]);

  const formatTime = (createdAtString: string): string => {
    try {
      const diffMs = Date.now() - new Date(createdAtString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return "1d ago";
    }
  };

  const fetchNotifications = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await notificationApi.getNotifications(1, 50);
      if (res && res.data) {
        const formatted = (res.data as any[]).map((n) => {
          let icon = "bell";
          if (n.type === "PROFILE_MATCH") icon = "user-plus";
          else if (n.type === "INTEREST_RECEIVED") icon = "heart";
          else if (n.type === "INTEREST_ACCEPTED") icon = "check-circle";

          return {
            id: n.id,
            title: n.title,
            description: n.body || n.message,
            icon,
            type: n.type,
            category:
              n.type === "INTEREST_RECEIVED" || n.type === "PROFILE_MATCH"
                ? "interests"
                : "system",
            time: formatTime(n.createdAt),
            isRead: n.isRead,
            metadata: n.metadata,
            referenceId: n.referenceId || null, // interestId for INTEREST_RECEIVED notifications
          };
        });
        setNotifications(formatted);
      }
    } catch (err) {
      console.log("[Notifications] Failed to load notifications:", err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const [activeFilter, setActiveFilter] = useState<
    "all" | "requests" | "interests" | "system"
  >("all");
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredItems = React.useMemo(() => {
    const requestItems = requests.map((r: any) => ({ ...r, _type: 'request' as const }));
    const notifItems = notifications.map((n: any) => ({ ...n, _type: 'notification' as const }));

    const all = [...requestItems, ...notifItems];

    if (activeFilter === 'all') return all;
    if (activeFilter === 'requests') return requestItems;
    if (activeFilter === 'interests') return notifItems.filter(n => n.category === 'interests');
    if (activeFilter === 'system') return notifItems.filter(n => n.category === 'system');
    return all;
  }, [requests, notifications, activeFilter]);

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
                    (365.25 * 24 * 60 * 60 * 1000),
                ),
              )
            : "25";

          return {
            id: item.interestId,
            senderUserId: profile.userId || null, // Store the sender's userId for notification fallback
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
      Alert.alert(
        "Error",
        err.message || "Failed to decline interest request.",
      );
    }
  };

  // ADD THIS ↓
  const handleRequestPress = (request: any) => {
    if (!request.senderUserId) {
      console.log(
        "[Requests] No senderUserId on request, cannot navigate:",
        request,
      );
      return;
    }
    router.push({
      pathname: "/profile",
      params: {
        view: "other",
        profileId: String(request.senderUserId),
        interestStatus: "PENDING",
        isInterestSender: "false",
        interestId: String(request.id),
      },
    });
  };

  const handleDismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchReceivedInterests();
      fetchNotifications(false);

      const onBackPress = () => {
        router.replace("/explore");
        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => {
        subscription.remove();
      };
    }, []),
  );

  const handleNotificationPress = async (notification: any) => {
    // ── Step 1: Find senderId ──
    let senderId: number | null = null;

    // Try metadata first (backend injects senderId here)
    if (notification.metadata) {
      try {
        const meta =
          typeof notification.metadata === "string"
            ? JSON.parse(notification.metadata)
            : notification.metadata;
        senderId = meta?.senderId || meta?.userId || null;
      } catch (e) {
        console.log("[Notifications] Failed to parse metadata:", e);
      }
    }

    // Call the dedicated getNotificationSender backend endpoint to resolve it dynamically
    if (!senderId) {
      try {
        const res = await notificationApi.getNotificationSender(
          notification.id,
        );
        if (res && res.data && res.data.senderId) {
          senderId = res.data.senderId;
        }
      } catch (e) {
        console.log(
          "[Notifications] Failed to resolve senderId via backend endpoint:",
          e,
        );
      }
    }

    // Fallback: for INTEREST_RECEIVED, look up sender from received interests list
    // notification.referenceId is the interestId stored by backend
    // Our `requests` state stores { id: interestId, senderUserId }
    if (!senderId && notification.type === "INTEREST_RECEIVED") {
      // Try to find matching request by interestId (referenceId)
      if (notification.referenceId) {
        const matchingRequest = requests.find(
          (r) => r.id === notification.referenceId,
        );
        if (matchingRequest?.senderUserId) {
          senderId = matchingRequest.senderUserId;
        }
      }
      // If still not found, refetch received interests and try again
      if (!senderId) {
        try {
          const freshRes = await interestApi.getReceivedInterests(1, 200);
          if (freshRes.data) {
            // If we have referenceId, find the exact matching interest
            if (notification.referenceId) {
              for (const item of freshRes.data as any[]) {
                if (item.interestId === notification.referenceId) {
                  senderId = item.profile?.userId || null;
                  break;
                }
              }
            }
            // Last resort: just take the first received interest's sender
            if (!senderId) {
              for (const item of freshRes.data as any[]) {
                const profile = item.profile || {};
                if (profile.userId) {
                  senderId = profile.userId;
                  break;
                }
              }
            }
          }
        } catch (e) {
          console.log("[Notifications] Interest lookup fallback failed:", e);
        }
      }
    }

    // ── Step 2: Mark as read (non-blocking — don't let this stop navigation) ──
    if (!notification.isRead) {
      try {
        await notificationApi.markAsRead(notification.id);
      } catch (e) {
        console.log("[Notifications] Failed to mark as read:", e);
      }
      // Update local state regardless of API success
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, isRead: true } : n,
        ),
      );
    }

    // ── Step 3: Navigate to sender's profile ──
    if (senderId) {
      router.push({
        pathname: "/profile",
        params: {
          view: "other",
          profileId: String(senderId),
          interestStatus:
            notification.type === "INTEREST_RECEIVED" ? "PENDING" : "",
          isInterestSender: "false",
        },
      });
    } else {
      console.log(
        "[Notifications] No senderId found, cannot navigate. notification:",
        JSON.stringify(notification),
      );
    }
  };

  return (
    <View style={styles.mainContainer}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <ThemedText style={styles.headerTitle}>Notifications</ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              {requests.length > 0 ? `${requests.length} pending request${requests.length > 1 ? 's' : ''}` : 'All caught up'}
            </ThemedText>
          </View>
        </View>

        {/* Filter Chips Bar */}
        <View style={styles.filterBar}>
          {(["all", "requests", "interests", "system"] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterChip,
                activeFilter === f && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter(f)}
              activeOpacity={0.8}
            >
              <ThemedText
                style={[
                  styles.filterChipText,
                  activeFilter === f && styles.filterChipTextActive,
                ]}
              >
                {f === "all" ? "All" : f === "requests" ? "Requests" : f === "interests" ? "Interests" : "System"}
              </ThemedText>
              {f === 'requests' && requests.length > 0 && (
                <View
                  style={[
                    styles.filterBadge,
                    activeFilter === f ? styles.filterBadgeActive : styles.filterBadgeInactive,
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.filterBadgeText,
                      activeFilter === f ? styles.filterBadgeTextActive : styles.filterBadgeTextInactive,
                    ]}
                  >
                    {requests.length}
                  </ThemedText>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          {loading ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator size="large" color={ACCENT} />
            </View>
          ) : filteredItems.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Feather name="bell-off" size={22} color={colors.muted} />
              </View>
              <ThemedText style={styles.emptyTitle}>Nothing here yet</ThemedText>
              <ThemedText style={styles.emptyBody}>
                {activeFilter === 'requests' ? 'No pending connection requests.' : 'No notifications in this category.'}
              </ThemedText>
            </View>
          ) : (
            <View style={styles.sectionContainer}>
              {/* Requests Section */}
              {filteredItems.some((i) => i._type === 'request') && (
                <View style={styles.notificationSection}>
                  <View style={styles.sectionHeaderRow}>
                    <ThemedText style={styles.sectionTitle}>Connection Requests</ThemedText>
                    <View style={styles.countBadge}>
                      <ThemedText style={styles.countBadgeText}>
                        {filteredItems.filter((i) => i._type === 'request').length}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.notificationsList}>
                    {filteredItems
                      .filter((i) => i._type === 'request')
                      .map((request: any) => (
                        <TouchableOpacity
                          key={`req-${request.id}`}
                          style={[styles.requestCard, CARD_SHADOW]}
                          activeOpacity={0.8}
                          onPress={() => handleRequestPress(request)}
                        >
                          <Image
                            source={{ uri: request.image }}
                            style={styles.requestAvatar}
                          />
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
                                onPress={(e) => {
                                  e.stopPropagation();
                                  handleAcceptRequest(request.name, request.id);
                                }}
                                activeOpacity={0.85}
                              >
                                <Feather name="check" size={13} color="#fff" />
                                <ThemedText style={styles.miniBtnText}>Accept</ThemedText>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.miniDeclineBtn}
                                onPress={(e) => {
                                  e.stopPropagation();
                                  handleDeclineRequest(request.id);
                                }}
                                activeOpacity={0.85}
                              >
                                <ThemedText style={styles.miniBtnTextDecline}>Decline</ThemedText>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </TouchableOpacity>
                      ))}
                  </View>
                </View>
              )}

              {/* Notifications Section */}
              {filteredItems.some((i) => i._type === 'notification') && (
                <View style={[styles.notificationSection, { marginTop: filteredItems.some((i) => i._type === 'request') ? 20 : 0 }]}>
                  {/* Unread Notifications */}
                  {filteredItems.filter((i) => i._type === 'notification' && !i.isRead).length > 0 && (
                    <View>
                      <View style={styles.sectionHeaderRow}>
                        <ThemedText style={styles.sectionTitle}>Unread</ThemedText>
                        <View style={styles.countBadge}>
                          <ThemedText style={styles.countBadgeText}>
                            {filteredItems.filter((i) => i._type === 'notification' && !i.isRead).length}
                          </ThemedText>
                        </View>
                      </View>
                      <View style={styles.notificationsList}>
                        {filteredItems
                          .filter((i) => i._type === 'notification' && !i.isRead)
                          .map((notification: any) => (
                            <TouchableOpacity
                              key={notification.id}
                              activeOpacity={0.8}
                              style={[styles.notificationCard, styles.unreadNotificationCard]}
                              onPress={() => handleNotificationPress(notification)}
                            >
                              <View style={styles.unreadIconRing}>
                                <View style={styles.unreadNotificationIcon}>
                                  <Feather name={notification.icon as any} size={16} color={ACCENT} />
                                </View>
                              </View>
                              <View style={styles.notificationInfo}>
                                <View style={styles.notificationTitleRow}>
                                  <ThemedText
                                    style={[styles.notificationTitle, styles.unreadNotificationTitle]}
                                    numberOfLines={1}
                                  >
                                    {notification.title}
                                  </ThemedText>
                                  <View style={styles.newBadge}>
                                    <ThemedText style={styles.newBadgeText}>NEW</ThemedText>
                                  </View>
                                </View>
                                <ThemedText style={styles.notificationDescription} numberOfLines={2}>
                                  {notification.description}
                                </ThemedText>
                                <View style={styles.notificationFooterRow}>
                                  <ThemedText style={styles.notificationTime}>{notification.time}</ThemedText>
                                </View>
                              </View>
                              <TouchableOpacity
                                style={styles.closeButton}
                                onPress={(e) => {
                                  e.stopPropagation();
                                  handleDismissNotification(notification.id);
                                }}
                                hitSlop={6}
                              >
                                <Feather name="x" size={14} color={colors.muted} />
                              </TouchableOpacity>
                            </TouchableOpacity>
                          ))}
                      </View>
                    </View>
                  )}

                  {/* Read Notifications */}
                  {filteredItems.filter((i) => i._type === 'notification' && i.isRead).length > 0 && (
                    <View style={{ marginTop: filteredItems.some((i) => i._type === 'notification' && !i.isRead) ? 16 : 0 }}>
                      <ThemedText style={[styles.sectionTitle, { color: colors.muted }]}>Earlier</ThemedText>
                      <View style={styles.notificationsList}>
                        {filteredItems
                          .filter((i) => i._type === 'notification' && i.isRead)
                          .map((notification: any) => (
                            <TouchableOpacity
                              key={notification.id}
                              activeOpacity={0.8}
                              style={[styles.notificationCard, styles.readNotificationCard]}
                              onPress={() => handleNotificationPress(notification)}
                            >
                              <View style={[styles.notificationIcon, styles.readNotificationIcon]}>
                                <Feather name={notification.icon as any} size={15} color={colors.muted} />
                              </View>
                              <View style={styles.notificationInfo}>
                                <ThemedText
                                  style={[styles.notificationTitle, styles.readNotificationTitle]}
                                  numberOfLines={1}
                                >
                                  {notification.title}
                                </ThemedText>
                                <ThemedText
                                  style={[styles.notificationDescription, styles.readNotificationDescription]}
                                  numberOfLines={2}
                                >
                                  {notification.description}
                                </ThemedText>
                                <View style={styles.notificationFooterRow}>
                                  <ThemedText style={styles.notificationTime}>{notification.time}</ThemedText>
                                  <View style={styles.seenBadge}>
                                    <Feather name="check" size={10} color={colors.muted} style={{ opacity: 0.7 }} />
                                  </View>
                                </View>
                              </View>
                              <TouchableOpacity
                                style={styles.closeButton}
                                onPress={(e) => {
                                  e.stopPropagation();
                                  handleDismissNotification(notification.id);
                                }}
                                hitSlop={6}
                              >
                                <Feather name="x" size={14} color={colors.muted} />
                              </TouchableOpacity>
                            </TouchableOpacity>
                          ))}
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
      <BottomNavigation />
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
      gap: 5,
      backgroundColor: "#2E7D32",
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
      padding: 14,
      paddingLeft: 12,
      gap: 11,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    notificationIcon: {
      width: 38,
      height: 38,
      borderRadius: 12,
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
      letterSpacing: -0.1,
    },
    notificationDescription: {
      color: colors.muted,
      fontSize: 12,
      marginTop: 3,
      lineHeight: 17,
    },
    notificationFooterRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      marginTop: 7,
    },
    notificationTime: {
      color: colors.muted,
      opacity: 0.75,
      fontSize: 10.5,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.3,
    },
    closeButton: {
      padding: 4,
      marginTop: 1,
    },

    // ── Unread: bold pink border, glowing icon ring, NEW pill ──
    unreadNotificationCard: {
      // backgroundColor:
      //   colors.background === "#121214" ||
      //   colors.text === "#fff" ||
      //   colors.text === "#E2E2EC"
      //     ? "rgba(248, 51, 123, 0.035)" // Very light pink in dark mode
      //     : "rgba(248, 51, 123, 0.02)",
      borderColor: ACCENT_SOFT_BORDER,
      shadowColor: ACCENT,
      shadowOpacity: 0.18,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
      borderLeftWidth: 3.5,
      borderLeftColor: "rgba(248, 51, 123, 0.93)",
      // backgroundColor: colors.card,
      opacity: 0.9,
    },
    unreadIconRing: {
      width: 44,
      height: 44,
      borderRadius: 14,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 1,
      borderWidth: 1.5,
      borderColor: ACCENT_SOFT_BORDER,
    },
    unreadNotificationIcon: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: ACCENT_SOFT,
      justifyContent: "center",
      alignItems: "center",
    },
    notificationTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
    },
    unreadNotificationTitle: {
      fontWeight: "800",
      color: colors.text,
    },
    newBadge: {
      backgroundColor: ACCENT,
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
      shadowColor: ACCENT,
      shadowOpacity: 0.5,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 1 },
    },
    newBadgeText: {
      color: "#fff",
      fontSize: 9,
      fontWeight: "800",
      letterSpacing: 0.4,
    },
    unreadDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: ACCENT,
    },

    // ── Read: soft pink border (dimmer than unread), muted icon, faded text ──
    readNotificationCard: {
      borderLeftWidth: 3.5,
      borderLeftColor: "rgba(248, 51, 123, 0.93)",
      backgroundColor: colors.card,
      opacity: 0.9,
    },
    readNotificationIcon: {
      width: 38,
      height: 38,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor:
        colors.background === "#121214" ||
        colors.text === "#fff" ||
        colors.text === "#E2E2EC"
          ? "rgba(255,255,255,0.06)"
          : "rgba(20,20,25,0.05)",
    },
    readNotificationTitle: {
      fontWeight: "600",
      color: colors.muted,
    },
    readNotificationDescription: {
      opacity: 0.85,
    },
    seenBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
    },
    seenBadgeText: {
      fontSize: 10,
      fontWeight: "600",
      color: colors.muted,
      opacity: 0.7,
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
    filterBar: {
      flexDirection: "row",
      paddingHorizontal: 20,
      paddingBottom: 12,
      gap: 8,
    },
    filterContainer: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 4,
    },
    filterChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 999,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterBadge: {
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
      minWidth: 18,
    },
    filterBadgeActive: {
      backgroundColor: "rgba(255, 255, 255, 0.28)",
    },
    filterBadgeInactive: {
      backgroundColor: ACCENT,
    },
    filterBadgeText: {
      fontSize: 10,
      fontWeight: "800",
    },
    filterBadgeTextActive: {
      color: "#FFFFFF",
    },
    filterBadgeTextInactive: {
      color: "#FFFFFF",
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
    notificationsScroll: {
      paddingBottom: 24,
    },
    notificationSection: {
      gap: 12,
    },
    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    sectionTitle: {
      fontSize: 14.5,
      fontWeight: "800",
      letterSpacing: 0.1,
    },
    countBadge: {
      backgroundColor: ACCENT,
      paddingHorizontal: 7,
      paddingVertical: 1.5,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
    },
    countBadgeText: {
      color: "#fff",
      fontSize: 10.5,
      fontWeight: "800",
    },
  });
