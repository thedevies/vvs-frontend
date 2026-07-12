import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BottomNavigation from "@/components/navigation/BottomNavigation";
import { ThemedText } from "@/components/themed-text";

export default function RequestsScreen() {
  const [requests, setRequests] = useState<any[]>([
    {
      id: 1,
      name: "Kiara",
      age: "25",
      role: "Software Engineer",
      city: "Mumbai",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1200&auto=format&fit=crop",
      time: "2h ago",
    },
    {
      id: 2,
      name: "Aisha",
      age: "27",
      role: "Doctor",
      city: "Pune",
      image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=1200&auto=format&fit=crop",
      time: "1d ago",
    }
  ]);

  const [notifications, setNotifications] = useState<any[]>([
    {
      id: "notif1",
      title: "New Match Found",
      description: "Check out new profiles matching your preferences.",
      icon: "heart",
      time: "Just now",
    },
    {
      id: "notif2",
      title: "Complete Your Profile",
      description: "Add bio details to get 3x more visibility.",
      icon: "user",
      time: "1d ago",
    }
  ]);

  const handleAcceptRequest = (name: string, id: number) => {
    Alert.alert("Request Accepted", `You are now connected with ${name}!`);
    setRequests(prev => prev.filter(r => r.id !== id));
  };

  const handleDeclineRequest = (id: number) => {
    setRequests(prev => prev.filter(r => r.id !== id));
  };

  const handleDismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <View style={styles.mainContainer}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>
            Activity
          </ThemedText>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          {/* Connection Requests Section */}
          {requests.length > 0 && (
            <View style={styles.sectionContainer}>
              <ThemedText style={styles.sectionHeader}>Connection Requests</ThemedText>
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
          )}

          {/* Activity / Notifications Section */}
          <View style={[styles.sectionContainer, { marginTop: requests.length > 0 ? 24 : 0 }]}>
            <ThemedText style={styles.sectionHeader}>Recent Activity</ThemedText>
            {notifications.length === 0 ? (
              <View style={styles.emptyState}>
                <ThemedText style={styles.emptyText}>
                  No new notifications
                </ThemedText>
              </View>
            ) : (
              <View style={styles.notificationsList}>
                {notifications.map((notification) => (
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
        </ScrollView>
      </SafeAreaView>
      <BottomNavigation />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#0F0F12",
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#17171C",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  sectionContainer: {
    gap: 12,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
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
    backgroundColor: "#17171C",
    borderRadius: 20,
    padding: 16,
    gap: 12,
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
    color: '#fff',
    fontSize: 14,
    lineHeight: 18,
  },
  boldText: {
    fontWeight: '700',
  },
  requestTimeText: {
    color: '#8B8B91',
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
    backgroundColor: '#26262D',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniBtnTextDecline: {
    color: '#aaa',
    fontSize: 12,
    fontWeight: '700',
  },
  notificationsList: {
    gap: 12,
  },
  notificationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#131317",
    borderRadius: 16,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.02)',
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
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  notificationDescription: {
    color: "#8E8E95",
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  notificationTime: {
    color: "#555",
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
    color: "#9B9BA1",
    fontSize: 16,
  },
});
