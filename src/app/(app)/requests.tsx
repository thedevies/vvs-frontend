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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BottomNavigation from "@/components/navigation/BottomNavigation";
import { ThemedText } from "@/components/themed-text";
import { interestApi, BASE_URL } from "@/utils/api";
import { useAppTheme } from "@/context/ThemeContext";

export default function RequestsScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = getStyles(colors);
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
    }
  ]);

  const [activeFilter, setActiveFilter] = useState<'all' | 'interests' | 'system'>('all');
  const [selectedSection, setSelectedSection] = useState<'requests' | 'activity'>('requests');
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'all') return true;
    return n.type === activeFilter;
  });

  useEffect(() => {
    fetchReceivedInterests();
  }, []);

  const getPhotoUrl = (path?: string | null): string => {
    if (!path) return 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1200&auto=format&fit=crop';
    if (path.startsWith('http')) return path;
    const baseUrl = BASE_URL.replace('/api', '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
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
            ? String(Math.floor((Date.now() - new Date(profile.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)))
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
        setRequests(mapped.filter((r: any) => r.status === 'PENDING'));
      }
    } catch (err: any) {
      console.log('[Requests] Failed to load interests:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (name: string, interestId: number) => {
    try {
      await interestApi.acceptInterest(interestId);
      Alert.alert("Request Accepted", `You are now connected with ${name}!`);
      setRequests(prev => prev.filter(r => r.id !== interestId));
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to accept interest request.");
    }
  };

  const handleDeclineRequest = async (interestId: number) => {
    try {
      await interestApi.cancelInterest(interestId);
      Alert.alert("Declined", "Connection request declined.");
      setRequests(prev => prev.filter(r => r.id !== interestId));
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to decline interest request.");
    }
  };

  const handleDismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <View style={styles.mainContainer}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowDropdown(true)}>
            <ThemedText style={styles.headerTitle}>
              {selectedSection === 'requests' ? 'Connection Requests' : 'Recent Activity'}
            </ThemedText>
            <Feather name="chevron-down" size={20} color={colors.text} style={styles.dropdownChevron} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          {selectedSection === 'requests' ? (
            loading ? (
              <ActivityIndicator size="large" color="#FF4D8D" style={{ marginVertical: 32 }} />
            ) : (
              <>
                {requests.length > 0 ? (
                  <View style={styles.sectionContainer}>
                    <View style={styles.requestsList}>
                      {requests.map((request) => (
                        <View key={request.id} style={styles.requestCard}>
                          <Image source={{ uri: request.image }} style={styles.requestAvatar} />
                          <View style={styles.requestContent}>
                            <ThemedText style={styles.requestText}>
                              <ThemedText style={styles.boldText}>{request.name}</ThemedText> • {request.role}
                            </ThemedText>
                            <ThemedText style={styles.requestTimeText}>{request.time} • {request.city}</ThemedText>
                            
                            <View style={styles.requestActionRow}>
                              <TouchableOpacity 
                                style={styles.miniAcceptBtn}
                                onPress={() => handleAcceptRequest(request.name, request.id)}
                              >
                                <ThemedText style={styles.miniBtnText}>Accept</ThemedText>
                              </TouchableOpacity>
                              <TouchableOpacity 
                                style={styles.miniDeclineBtn}
                                onPress={() => handleDeclineRequest(request.id)}
                              >
                                <ThemedText style={styles.miniBtnTextDecline}>Decline</ThemedText>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : (
                  <View style={styles.sectionContainer}>
                    <View style={styles.emptyState}>
                      <ThemedText style={styles.emptyText}>No pending requests</ThemedText>
                    </View>
                  </View>
                )}
              </>
            )
          ) : (
            /* Recent Activity / Notifications Section */
            <View style={styles.sectionContainer}>
              {/* Filter Chips */}
              <View style={styles.filterContainer}>
                <TouchableOpacity 
                  style={[styles.filterChip, activeFilter === 'all' && styles.filterChipActive]} 
                  onPress={() => setActiveFilter('all')}
                >
                  <ThemedText style={[styles.filterChipText, activeFilter === 'all' && styles.filterChipTextActive]}>
                    All
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.filterChip, activeFilter === 'interests' && styles.filterChipActive]} 
                  onPress={() => setActiveFilter('interests')}
                >
                  <ThemedText style={[styles.filterChipText, activeFilter === 'interests' && styles.filterChipTextActive]}>
                    Interests
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.filterChip, activeFilter === 'system' && styles.filterChipActive]} 
                  onPress={() => setActiveFilter('system')}
                >
                  <ThemedText style={[styles.filterChipText, activeFilter === 'system' && styles.filterChipTextActive]}>
                    System
                  </ThemedText>
                </TouchableOpacity>
              </View>

              {filteredNotifications.length === 0 ? (
                <View style={styles.emptyState}>
                  <ThemedText style={styles.emptyText}>
                    No notifications in this category
                  </ThemedText>
                </View>
              ) : (
                <View style={styles.notificationsList}>
                  {filteredNotifications.map((notification) => (
                    <View key={notification.id} style={styles.notificationCard}>
                      <View style={styles.notificationIcon}>
                        <Feather
                          name={notification.icon as any}
                          size={16}
                          color="#FF4D8D"
                        />
                      </View>
                      <View style={styles.notificationInfo}>
                        <ThemedText style={styles.notificationTitle}>
                          {notification.title}
                        </ThemedText>
                        <ThemedText style={styles.notificationDescription}>
                          {notification.description}
                        </ThemedText>
                        <ThemedText style={styles.notificationTime}>
                          {notification.time}
                        </ThemedText>
                      </View>
                      <TouchableOpacity 
                        style={styles.closeButton}
                        onPress={() => handleDismissNotification(notification.id)}
                      >
                        <Feather name="x" size={14} color="#555" />
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
              style={[styles.dropdownItem, selectedSection === 'requests' && { backgroundColor: 'rgba(255, 77, 141, 0.08)' }]} 
              onPress={() => {
                setSelectedSection('requests');
                setShowDropdown(false);
              }}
            >
              <Feather name="users" size={16} color={selectedSection === 'requests' ? '#FF4D8D' : colors.text} />
              <ThemedText style={[styles.dropdownItemText, selectedSection === 'requests' && { color: '#FF4D8D', fontWeight: '700' }]}>
                Connection Requests
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.dropdownItem, selectedSection === 'activity' && { backgroundColor: 'rgba(255, 77, 141, 0.08)' }]} 
              onPress={() => {
                setSelectedSection('activity');
                setShowDropdown(false);
              }}
            >
              <Feather name="bell" size={16} color={selectedSection === 'activity' ? '#FF4D8D' : colors.text} />
              <ThemedText style={[styles.dropdownItemText, selectedSection === 'activity' && { color: '#FF4D8D', fontWeight: '700' }]}>
                Recent Activity
              </ThemedText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
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
    paddingVertical: 16,
  },
  dropdownBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dropdownChevron: {
    marginTop: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    borderRadius: 16,
    borderWidth: 1,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 12,
  },
  dropdownItemText: {
    fontSize: 16,
    fontWeight: '600',
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.card,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionContainer: {
    gap: 12,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 140,
  },
  requestsList: {
    gap: 16,
  },
  requestCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  requestAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  requestContent: {
    flex: 1,
    marginLeft: 4,
  },
  requestText: {
    fontSize: 14,
    lineHeight: 18,
  },
  boldText: {
    fontWeight: '700',
  },
  requestTimeText: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 4,
  },
  requestActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  miniAcceptBtn: {
    backgroundColor: '#FF4D8D',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  miniDeclineBtn: {
    backgroundColor: colors.card2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniBtnTextDecline: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  notificationsList: {
    gap: 12,
  },
  notificationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notificationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 77, 141, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  notificationDescription: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  notificationTime: {
    color: colors.muted,
    opacity: 0.7,
    fontSize: 10,
    marginTop: 4,
  },
  closeButton: {
    padding: 4,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: "#FF4D8D",
    borderColor: "#FF4D8D",
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text === "#ffffff" ? "#9B9BA1" : "#66666F",
  },
  filterChipTextActive: {
    color: "#fff",
  },
});
