import React, { useState, useEffect, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/context/ThemeContext";
import { successStoryApi, type SuccessStoryData } from "@/utils/api";

const ACCENT = "#FF4D8D";
const ACCENT_SOFT = "rgba(255, 77, 141, 0.10)";
const GREEN = "#3BFF87";

// ── Types ──────────────────────────────────────────────────────────────────────
interface StoryPhoto {
  id: number;
  photoUrl: string;
}
interface Story {
  id: number;
  title: string;
  story: string;
  partnerName?: string;
  marriageDate?: string;
  rating?: number;
  wouldRecommend?: boolean;
  status?: string;
  photos?: StoryPhoto[];
  user?: { profile?: { fullName?: string; profilePhoto?: string } };
}

// ── Star Rating Picker ─────────────────────────────────────────────────────────
function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={{ flexDirection: "row", gap: 6 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <TouchableOpacity key={s} onPress={() => onChange(s)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
          <Ionicons name={s <= value ? "star" : "star-outline"} size={26} color={s <= value ? "#FFD700" : "#888"} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Story Card ─────────────────────────────────────────────────────────────────
function StoryCard({ story, colors, isOwn, onEdit, onDeleteStory }: { story: Story; colors: any; isOwn: boolean; onEdit?: () => void; onDeleteStory?: () => void }) {
  const photoUrl = story.photos?.[0]?.photoUrl;
  const profilePhoto = story.user?.profile?.profilePhoto;
  const name = story.user?.profile?.fullName || story.partnerName || "Anonymous";
  const date = story.marriageDate ? new Date(story.marriageDate).toLocaleDateString("en-IN", { year: "numeric", month: "short" }) : null;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Card header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardAvatar}>
          {profilePhoto ? (
            <Image source={{ uri: profilePhoto.startsWith("http") ? profilePhoto : `http://192.168.1.1:3000/${profilePhoto}` }} style={styles.avatarImg} />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: ACCENT_SOFT }]}>
              <Ionicons name="heart" size={20} color={ACCENT} />
            </View>
          )}
          <View style={styles.ringBadge}>
            <ThemedText style={{ fontSize: 10 }}>💍</ThemedText>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText style={[styles.cardName, { color: colors.text }]} numberOfLines={1}>{name}</ThemedText>
          {date && <ThemedText style={styles.cardDate}>Married {date}</ThemedText>}
          {story.rating ? (
            <View style={{ flexDirection: "row", gap: 2, marginTop: 2 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Ionicons key={i} name={i < (story.rating ?? 0) ? "star" : "star-outline"} size={11} color={i < (story.rating ?? 0) ? "#FFD700" : "#555"} />
              ))}
            </View>
          ) : null}
        </View>
        {isOwn && (
          <View style={{ flexDirection: "row", gap: 6 }}>
            {onEdit && (
              <TouchableOpacity style={styles.editBadge} onPress={onEdit}>
                <Feather name="plus" size={14} color={ACCENT} />
              </TouchableOpacity>
            )}
            {onDeleteStory && (
              <TouchableOpacity style={[styles.editBadge, { backgroundColor: "rgba(211,47,47,0.1)" }]} onPress={onDeleteStory}>
                <Feather name="trash-2" size={13} color="#D32F2F" />
              </TouchableOpacity>
            )}
          </View>
        )}
        {story.status === "PENDING" && (
          <View style={[styles.statusBadge, { backgroundColor: "rgba(255,200,0,0.12)", borderColor: "rgba(255,200,0,0.3)" }]}>
            <ThemedText style={{ fontSize: 10, color: "#FFD700" }}>Pending</ThemedText>
          </View>
        )}
      </View>

      {/* Photo strip */}
      {story.photos && story.photos.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
          {story.photos.map((p) => (
            <Image key={p.id} source={{ uri: p.photoUrl.startsWith("http") ? p.photoUrl : `http://192.168.1.1:3000/${p.photoUrl}` }} style={styles.photoStrip} />
          ))}
        </ScrollView>
      )}

      <ThemedText style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>{story.title}</ThemedText>
      <ThemedText style={[styles.cardStory, { color: colors.textSecondary }]} numberOfLines={4}>{story.story}</ThemedText>

      {story.wouldRecommend && (
        <View style={styles.recommendBadge}>
          <Ionicons name="checkmark-circle" size={12} color={GREEN} />
          <ThemedText style={{ fontSize: 11, color: GREEN, marginLeft: 4 }}>Recommends VVS</ThemedText>
        </View>
      )}
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────
export default function SuccessStoriesScreen() {
  const { colors } = useAppTheme();
  const [stories, setStories] = useState<Story[]>([]);
  const [myStory, setMyStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [marriageDate, setMarriageDate] = useState("");
  const [showMarriageDatePicker, setShowMarriageDatePicker] = useState(false);
  const [rating, setRating] = useState(5);
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [newPhotoUris, setNewPhotoUris] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [allRes, myRes] = await Promise.all([
        successStoryApi.getAllStories(),
        successStoryApi.myStory(),
      ]);
      setStories(Array.isArray(allRes.data) ? allRes.data : allRes.data?.stories || []);
      setMyStory(myRes.data || null);
    } catch (e) {
      console.error("[SuccessStories] Load error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const params = useLocalSearchParams<{ action?: string }>();

  useFocusEffect(useCallback(() => {
    loadData();
  }, [loadData]));

  useEffect(() => {
    if (params.action === "add" && !loading) {
      openModal(myStory || undefined);
    }
  }, [params.action, loading]);

  const openModal = (editStory?: Story) => {
    if (editStory) {
      setTitle(editStory.title || "");
      setStory(editStory.story || "");
      setPartnerName(editStory.partnerName || "");
      setMarriageDate(editStory.marriageDate ? editStory.marriageDate.split("T")[0] : "");
      setRating(editStory.rating || 5);
      setWouldRecommend(editStory.wouldRecommend ?? true);
    } else {
      setTitle(""); setStory(""); setPartnerName("");
      setMarriageDate(""); setRating(5); setWouldRecommend(true);
    }
    setNewPhotoUris([]);
    setShowModal(true);
  };

  const pickPhotos = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert("Permission needed"); return; }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!res.canceled) {
      const uris = res.assets.map((a) => a.uri);
      setNewPhotoUris((prev) => [...prev, ...uris].slice(0, 5));
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !story.trim() || !partnerName.trim()) {
      Alert.alert("Required Fields", "Please fill in all mandatory fields: Title, Your Story, and Partner's Name.");
      return;
    }
    setSaving(true);
    try {
      const data: SuccessStoryData = {
        title: title.trim(),
        story: story.trim(),
        partnerName: partnerName.trim() || undefined,
        marriageDate: marriageDate.trim() || undefined,
        rating,
        wouldRecommend,
      };

      if (myStory) {
        await successStoryApi.updateStory(data);
      } else {
        await successStoryApi.addStory(data);
      }

      // Upload new photos
      if (newPhotoUris.length > 0) {
        setUploadingPhotos(true);
        try {
          await successStoryApi.uploadPhotos(newPhotoUris);
        } catch (e) {
          console.error("[Photos] Upload failed:", e);
        } finally {
          setUploadingPhotos(false);
        }
      }

      setShowModal(false);
      await loadData();
      Alert.alert("Success", myStory ? "Story updated!" : "Story submitted for review!");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to save story.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    Alert.alert("Delete Photo", "Remove this photo from your story?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          try {
            await successStoryApi.deletePhoto(photoId);
            setMyStory((prev) => prev ? { ...prev, photos: prev.photos?.filter((p) => p.id !== photoId) } : prev);
          } catch (e: any) {
            Alert.alert("Error", e.message || "Failed to delete photo.");
          }
        }
      }
    ]);
  };

  const handleDeleteStory = async () => {
    Alert.alert("Delete Story", "Are you sure you want to delete your success story?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await successStoryApi.deleteStory();
            setMyStory(null);
            setShowModal(false);
            await loadData();
            Alert.alert("Deleted", "Your success story has been removed.");
          } catch (e: any) {
            Alert.alert("Error", e.message || "Failed to delete story.");
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Story }) => (
    <StoryCard
      story={item}
      colors={colors}
      isOwn={myStory?.id === item.id}
      onEdit={() => openModal(item)}
      onDeleteStory={handleDeleteStory}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <SafeAreaView edges={["top"]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color={colors.text} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: colors.text }]}>Success Stories</ThemedText>
          <View style={{ width: 38 }} />
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={ACCENT} size="large" />
        </View>
      ) : (
        <FlatList
          data={stories}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
              Beautiful matches united through Vasudev Vivah Sohala.
            </ThemedText>
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="heart-outline" size={48} color={colors.muted} />
              <ThemedText style={[styles.emptyText, { color: colors.muted }]}>No stories yet. Be the first!</ThemedText>
            </View>
          }
        />
      )}

      {/* FAB */}
      {!loading && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => openModal(myStory || undefined)}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={22} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            {/* Sheet handle */}
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />

            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <ThemedText style={[styles.modalTitle, { color: colors.text }]}>
                {myStory ? "Edit Your Story" : "Share Your Story"}
              </ThemedText>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Title */}
              <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Story Title *</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card2 || colors.background, color: colors.text, borderColor: colors.border }]}
                value={title}
                onChangeText={setTitle}
                placeholder="Give your story a title..."
                placeholderTextColor={colors.muted}
                maxLength={120}
              />

              {/* Story */}
              <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Your Story *</ThemedText>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: colors.card2 || colors.background, color: colors.text, borderColor: colors.border }]}
                value={story}
                onChangeText={setStory}
                placeholder="Share your journey to finding the one..."
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />

              {/* Partner name (Mandatory) */}
              <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Partner's Name *</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card2 || colors.background, color: colors.text, borderColor: colors.border }]}
                value={partnerName}
                onChangeText={setPartnerName}
                placeholder="Enter partner's full name"
                placeholderTextColor={colors.muted}
              />

              {/* Marriage date selector */}
              <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Marriage Date</ThemedText>
              <TouchableOpacity
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card2 || colors.background,
                    borderColor: colors.border,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  },
                ]}
                onPress={() => setShowMarriageDatePicker(true)}
                activeOpacity={0.8}
              >
                <ThemedText style={{ color: marriageDate ? colors.text : colors.muted, fontSize: 14 }}>
                  {marriageDate ? marriageDate : "Select Marriage Date"}
                </ThemedText>
                <Feather name="calendar" size={16} color={ACCENT} />
              </TouchableOpacity>

              {showMarriageDatePicker && (
                <DateTimePicker
                  value={marriageDate && !isNaN(new Date(marriageDate).getTime()) ? new Date(marriageDate) : new Date()}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  maximumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowMarriageDatePicker(Platform.OS === "ios");
                    if (selectedDate) {
                      const formatted = selectedDate.toISOString().split("T")[0];
                      setMarriageDate(formatted);
                    }
                  }}
                />
              )}

              {/* Rating */}
              <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Rating</ThemedText>
              <StarRating value={rating} onChange={setRating} />

              {/* Recommend toggle */}
              <TouchableOpacity
                style={[styles.toggleRow, { backgroundColor: colors.card2 || colors.background, borderColor: colors.border }]}
                onPress={() => setWouldRecommend((v) => !v)}
                activeOpacity={0.8}
              >
                <ThemedText style={[styles.toggleLabel, { color: colors.text }]}>Would recommend VVS?</ThemedText>
                <View style={[styles.toggle, wouldRecommend ? styles.toggleOn : { backgroundColor: colors.border }]}>
                  <View style={[styles.toggleThumb, wouldRecommend ? { right: 2 } : { left: 2 }]} />
                </View>
              </TouchableOpacity>

              {/* Photos section */}
              <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Photos (up to 5)</ThemedText>

              {/* Existing photos (edit mode) */}
              {myStory?.photos && myStory.photos.length > 0 && (
                <View style={styles.photoGrid}>
                  {myStory.photos.map((p) => (
                    <View key={p.id} style={styles.photoThumb}>
                      <Image source={{ uri: p.photoUrl.startsWith("http") ? p.photoUrl : `http://192.168.1.1:3000/${p.photoUrl}` }} style={styles.photoThumbImg} />
                      <TouchableOpacity style={styles.photoDelete} onPress={() => handleDeletePhoto(p.id)}>
                        <Ionicons name="close-circle" size={18} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* New photos to upload */}
              {newPhotoUris.length > 0 && (
                <View style={styles.photoGrid}>
                  {newPhotoUris.map((uri, i) => (
                    <View key={i} style={styles.photoThumb}>
                      <Image source={{ uri }} style={styles.photoThumbImg} />
                      <TouchableOpacity style={styles.photoDelete} onPress={() => setNewPhotoUris((prev) => prev.filter((_, j) => j !== i))}>
                        <Ionicons name="close-circle" size={18} color="#fff" />
                      </TouchableOpacity>
                      <View style={styles.newBadge}>
                        <ThemedText style={{ fontSize: 9, color: "#fff" }}>NEW</ThemedText>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity style={[styles.addPhotoBtn, { borderColor: colors.border }]} onPress={pickPhotos}>
                <Ionicons name="images-outline" size={18} color={ACCENT} />
                <ThemedText style={[styles.addPhotoBtnText, { color: ACCENT }]}>Add Photos</ThemedText>
              </TouchableOpacity>

              {/* Save button */}
              <TouchableOpacity
                style={[styles.saveBtn, (saving || uploadingPhotos) && { opacity: 0.7 }]}
                onPress={handleSave}
                disabled={saving || uploadingPhotos}
              >
                {saving || uploadingPhotos ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="heart" size={16} color="#fff" />
                    <ThemedText style={styles.saveBtnText}>
                      {myStory ? "Update Story" : "Share Story"}
                    </ThemedText>
                  </>
                )}
              </TouchableOpacity>

              {/* Delete story button in modal if existing */}
              {myStory && (
                <TouchableOpacity
                  style={[styles.deleteStoryBtn, { borderColor: "#D32F2F" }]}
                  onPress={handleDeleteStory}
                  disabled={saving || uploadingPhotos}
                >
                  <Feather name="trash-2" size={15} color="#D32F2F" />
                  <ThemedText style={styles.deleteStoryBtnText}>Delete Story</ThemedText>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  android: { elevation: 3 },
  default: {},
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: { width: 38, height: 38, justifyContent: "center", alignItems: "center" },
  addBtn: { backgroundColor: ACCENT, borderRadius: 12 },
  headerTitle: { fontSize: 18, fontWeight: "800" },
  list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 100, gap: 14 },
  subtitle: { fontSize: 13, lineHeight: 20, textAlign: "center", marginBottom: 8 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14 },

  // Story Card
  card: {
    borderRadius: 20,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    ...CARD_SHADOW,
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 10 },
  cardAvatar: { position: "relative", width: 50, height: 50 },
  avatarImg: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: ACCENT },
  avatarFallback: { width: 50, height: 50, borderRadius: 25, justifyContent: "center", alignItems: "center" },
  ringBadge: { position: "absolute", bottom: -3, right: -3, backgroundColor: "#fff", borderRadius: 99, width: 20, height: 20, justifyContent: "center", alignItems: "center" },
  cardName: { fontSize: 15, fontWeight: "700" },
  cardDate: { fontSize: 11, color: ACCENT, marginTop: 2 },
  editBadge: { width: 30, height: 30, borderRadius: 10, backgroundColor: ACCENT_SOFT, justifyContent: "center", alignItems: "center" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, borderWidth: 1 },
  photoStrip: { width: 100, height: 80, borderRadius: 10, marginRight: 8 },
  cardTitle: { fontSize: 14, fontWeight: "700", marginBottom: 6 },
  cardStory: { fontSize: 13, lineHeight: 20, fontStyle: "italic" },
  recommendBadge: { flexDirection: "row", alignItems: "center", marginTop: 10 },

  // FAB
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: ACCENT,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: ACCENT,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },

  // Modal
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "93%", paddingBottom: 32 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginTop: 10, marginBottom: 4 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  modalTitle: { fontSize: 17, fontWeight: "800" },
  modalBody: { paddingHorizontal: 20, paddingTop: 16, gap: 6 },

  // Fields
  fieldLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 10, marginBottom: 4 },
  input: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14 },
  textArea: { minHeight: 110, paddingTop: 11 },

  // Toggle
  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingVertical: 13, marginTop: 10 },
  toggleLabel: { fontSize: 14, fontWeight: "600" },
  toggle: { width: 44, height: 24, borderRadius: 12, justifyContent: "center" },
  toggleOn: { backgroundColor: ACCENT },
  toggleThumb: { position: "absolute", width: 20, height: 20, borderRadius: 10, backgroundColor: "#fff" },

  // Photos
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 8 },
  photoThumb: { width: 80, height: 80, borderRadius: 12, overflow: "hidden", position: "relative" },
  photoThumbImg: { width: "100%", height: "100%" },
  photoDelete: { position: "absolute", top: 3, right: 3 },
  newBadge: { position: "absolute", bottom: 3, left: 3, backgroundColor: ACCENT, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
  addPhotoBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, borderWidth: 1, borderStyle: "dashed", paddingVertical: 13, marginTop: 6 },
  addPhotoBtnText: { fontSize: 14, fontWeight: "600" },

  // Save Button
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: ACCENT, borderRadius: 16, paddingVertical: 15, marginTop: 20 },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  deleteStoryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderRadius: 16, paddingVertical: 13, marginTop: 10 },
  deleteStoryBtnText: { color: "#D32F2F", fontSize: 14, fontWeight: "700" },
});
