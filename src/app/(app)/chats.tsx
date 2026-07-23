import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import BottomNavigation from '@/components/navigation/BottomNavigation';
import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

const CHATS = [
  {
    id: 1,
    name: 'Kiara',
    message: 'Hey, I saw your profile and we have a lot in common!',
    time: '2m ago',
    unread: 2,
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1200&auto=format&fit=crop',
    online: true,
  },
  {
    id: 2,
    name: 'Aisha',
    message: 'Are you from Pune too? Would love to connect.',
    time: '1h ago',
    unread: 0,
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=1200&auto=format&fit=crop',
    online: false,
  },
  {
    id: 3,
    name: 'Priya',
    message: 'That sounds amazing! Let me know when you are free.',
    time: 'Yesterday',
    unread: 0,
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=1200&auto=format&fit=crop',
    online: true,
  },
];

export default function ChatsScreen() {
  const { colors, isDark } = useAppTheme();
  const { t } = useLanguage();

  const styles = getStyles(colors, isDark);

  return (
    <View style={styles.mainContainer}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>{t('chats')}</ThemedText>
          <TouchableOpacity style={styles.iconButton}>
            <Feather name="search" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}>

          <View style={styles.matchesSection}>
            <ThemedText style={styles.sectionTitle}>{t('newMatches')}</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {[1, 2, 3, 4, 5].map((_, index) => (
                <View key={index} style={styles.newMatchItem}>
                  <View style={styles.imageContainer}>
                    <Image
                      source={{ uri: CHATS[index % CHATS.length].image }}
                      style={styles.newMatchImage}
                    />
                    <View style={styles.onlineBadge} />
                  </View>
                  <ThemedText style={styles.newMatchName}>
                    {CHATS[index % CHATS.length].name}
                  </ThemedText>
                </View>
              ))}
            </ScrollView>
          </View>

          <View style={styles.chatList}>
            {CHATS.map((chat) => (
              <TouchableOpacity key={chat.id} style={styles.chatItem}>
                <View style={styles.chatImageContainer}>
                  <Image source={{ uri: chat.image }} style={styles.chatImage} />
                  {chat.online && <View style={styles.onlineDot} />}
                </View>

                <View style={styles.chatContent}>
                  <View style={styles.chatHeader}>
                    <ThemedText style={styles.chatName}>{chat.name}</ThemedText>
                    <ThemedText style={[styles.chatTime, chat.unread > 0 && styles.unreadTime]}>
                      {chat.time}
                    </ThemedText>
                  </View>

                  <View style={styles.chatMessageRow}>
                    <ThemedText
                      style={[styles.chatMessage, chat.unread > 0 && styles.unreadMessage]}
                      numberOfLines={1}>
                      {chat.message}
                    </ThemedText>

                    {chat.unread > 0 && (
                      <View style={styles.unreadBadge}>
                        <ThemedText style={styles.unreadText}>{chat.unread}</ThemedText>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
      <BottomNavigation />
    </View>
  );
}

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    mainContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      gap: 12,
    },
    headerTitle: {
      flex: 1,
      fontSize: 32,
      fontWeight: '800',
      color: colors.text,
    },
    iconButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.card,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    scrollContainer: {
      paddingBottom: 140,
    },
    matchesSection: {
      paddingVertical: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      paddingHorizontal: 20,
      marginBottom: 16,
    },
    horizontalScroll: {
      paddingHorizontal: 20,
      gap: 16,
    },
    newMatchItem: {
      alignItems: 'center',
      gap: 8,
    },
    imageContainer: {
      position: 'relative',
    },
    newMatchImage: {
      width: 68,
      height: 68,
      borderRadius: 34,
      borderWidth: 2,
      borderColor: '#FF4D8D',
    },
    onlineBadge: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: '#22C55E',
      borderWidth: 3,
      borderColor: colors.background,
    },
    newMatchName: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: '500',
    },
    chatList: {
      paddingHorizontal: 20,
      paddingTop: 8,
      gap: 20,
    },
    chatItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    chatImageContainer: {
      position: 'relative',
    },
    chatImage: {
      width: 60,
      height: 60,
      borderRadius: 30,
    },
    onlineDot: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: '#22C55E',
      borderWidth: 2,
      borderColor: colors.background,
    },
    chatContent: {
      flex: 1,
      justifyContent: 'center',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: 16,
    },
    chatHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    chatName: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
    },
    chatTime: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    unreadTime: {
      color: '#FF4D8D',
      fontWeight: '600',
    },
    chatMessageRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 16,
    },
    chatMessage: {
      flex: 1,
      fontSize: 14,
      color: colors.textSecondary,
    },
    unreadMessage: {
      color: colors.text,
      fontWeight: '600',
    },
    unreadBadge: {
      backgroundColor: '#FF4D8D',
      width: 22,
      height: 22,
      borderRadius: 11,
      justifyContent: 'center',
      alignItems: 'center',
    },
    unreadText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '700',
    },
  });
