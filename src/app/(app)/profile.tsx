import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, FlatList, Image, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useCallback } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as WebBrowser from 'expo-web-browser';

import BottomNavigation from '@/components/navigation/BottomNavigation';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { profileApi, BASE_URL } from '@/utils/api';
import type { UserPhoto } from '@/utils/types';

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const { t } = useLanguage();
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

  // Other profile dynamic load states
  const [otherUser, setOtherUser] = useState<any>(null);
  const [loadingOtherProfile, setLoadingOtherProfile] = useState(false);

  // Biodata states
  const [uploadingBiodata, setUploadingBiodata] = useState(false);
  const [generatingBiodata, setGeneratingBiodata] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [religion, setReligion] = useState('Hindu');
  const [caste, setCaste] = useState('Vasudev');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');

  const getParamValue = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value);

  const view = getParamValue(params.view);
  const isOtherProfileView = view === 'other';

  // Load photos & profile data on mount
  useEffect(() => {
    if (isOtherProfileView && params.profileId) {
      loadOtherProfile(Number(params.profileId));
    } else if (!isOtherProfileView) {
      loadPhotos();
    }
  }, [isOtherProfileView, params.profileId]);

  const loadOtherProfile = async (id: number) => {
    try {
      setLoadingOtherProfile(true);
      const response = await profileApi.getUserProfile(id);
      if (response.data) {
        setOtherUser(response.data);
        if (response.data.photos) {
          setPhotos(response.data.photos);
        }
      }
    } catch (err) {
      console.log('[Profile] Failed to load other user profile:', err);
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
      console.log('[Profile] Failed to load photos:', err);
    } finally {
      setLoadingPhotos(false);
    }
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
    if (path.startsWith('http')) return path;
    const baseUrl = BASE_URL.replace('/api', '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  };

  // Biodata handlers
  const handleUploadBiodata = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        console.log('[Biodata] Uploading file:', file.uri);
        setUploadingBiodata(true);
        const response = await profileApi.uploadBiodata(file.uri, 'uploaded');
        if (response.data) {
          Alert.alert('Success', 'Biodata uploaded successfully!');
          await refreshUser();
        } else {
          Alert.alert('Upload Failed', response.message || 'Failed to upload biodata.');
        }
      }
    } catch (err: any) {
      console.log('[Biodata] Selection/upload failed:', err);
      Alert.alert('Error', err.message || 'Failed to select/upload biodata.');
    } finally {
      setUploadingBiodata(false);
    }
  };

  const handleGenerateBiodata = async () => {
    if (!fatherName.trim() || !motherName.trim()) {
      Alert.alert('Required Info', "Please enter Father's and Mother's name.");
      return;
    }

    try {
      setGeneratingBiodata(true);
      const dobStr = profile?.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : '1998-05-20';
      const body = {
        fullName: profile?.fullName || ownName,
        gender: (profile?.gender || 'male').toLowerCase() as any,
        maritalStatus: (profile?.maritalStatus || 'never_married').toLowerCase() as any,
        dateOfBirth: dobStr,
        city: profile?.city || 'Pune',
        profession: profile?.profession || 'Software Engineer',
        education: profile?.education || 'B.Tech',
        religion: religion,
        caste: caste,
        fatherName: fatherName,
        motherName: motherName,
        bio: profile?.bio || ownBio,
      };

      console.log('[Biodata] Requesting generateBiodata with body:', JSON.stringify(body));
      const response = await profileApi.generateBiodata(body);
      if (response.data) {
        Alert.alert('Success', 'Biodata PDF generated successfully!');
        setShowGenerateModal(false);
        await refreshUser();
      } else {
        Alert.alert('Generation Failed', response.message || 'Failed to generate biodata PDF.');
      }
    } catch (err: any) {
      console.log('[Biodata] Generation error:', err);
      Alert.alert('Error', err.message || 'Failed to generate biodata PDF.');
    } finally {
      setGeneratingBiodata(false);
    }
  };

  const handleViewBiodata = async () => {
    const url = biodataObj?.biodataUrl;
    if (!url) return;
    const fullUrl = url.startsWith('http') ? url : `${BASE_URL.replace('/api', '')}${url.startsWith('/') ? url : `/${url}`}`;
    console.log('[Biodata] Opening PDF:', fullUrl);
    await WebBrowser.openBrowserAsync(fullUrl);
  };

  const handleDeleteBiodata = () => {
    Alert.alert(
      'Delete Biodata',
      'Are you sure you want to permanently delete your matrimonial biodata PDF?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('[Biodata] Deleting biodata...');
              const response = await profileApi.deleteBiodata();
              if (response.message) {
                Alert.alert('Deleted', 'Biodata PDF deleted successfully.');
                await refreshUser();
              }
            } catch (err: any) {
              console.log('[Biodata] Failed to delete biodata:', err);
              Alert.alert('Error', err.message || 'Failed to delete biodata.');
            }
          },
        },
      ]
    );
  };

  // ---- Own profile data from context ----
  const profile = user?.profile;
  const ownName = profile?.fullName || 'Your Name';
  const ownAge = profile?.dateOfBirth
    ? String(Math.floor((Date.now() - new Date(profile.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)))
    : '--';
  const ownRole = profile?.profession || 'Not set';
  const ownBio = profile?.bio || 'Complete your profile to add a bio.';
  const ownEducation = profile?.education || '--';
  const ownCity = [profile?.city, profile?.state, profile?.country].filter(Boolean).join(', ') || '--';
  const ownGender = (profile?.gender || 'male').toLowerCase();
  const ownHeight = profile?.height || '--';
  const ownInterests = profile?.interest || [];
  const ownProfilePhoto = profile?.profilePhoto
    ? getPhotoUrl(profile.profilePhoto)
    : 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1200&auto=format&fit=crop';

  // ---- Other profile data from params ----
  const otherName = getParamValue(params.name) ?? 'Member';
  const otherAge = getParamValue(params.age) ?? '27';
  const otherRole = getParamValue(params.role) ?? 'Professional';
  const otherGender = getParamValue(params.gender) ?? 'female';
  const otherIsConnection = getParamValue(params.isConnection) === 'true';
  const otherBio = getParamValue(params.bio)
    ?? 'Friendly, family-oriented, and looking for a meaningful relationship.';
  const otherAbout = getParamValue(params.about)
    ?? 'I believe in trust, communication, and growing together as partners.';
  const otherEducation = getParamValue(params.education) ?? 'MBA';
  const otherCity = [
    getParamValue(params.city),
    getParamValue(params.state),
    getParamValue(params.country)
  ].filter(Boolean).join(', ') || 'Pune';
  const otherImage = getParamValue(params.image)
    ?? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1200&auto=format&fit=crop';
  const otherHeight = getParamValue(params.height) ?? '5ft 6in';
  
  // Parse other interests (could be passed as JSON string or comma-separated string)
  const getOtherInterests = (): string[] => {
    const rawInterest = getParamValue(params.interest);
    if (!rawInterest) return ['Travel', 'Music', 'Fitness'];
    try {
      if (rawInterest.startsWith('[')) {
        return JSON.parse(rawInterest);
      }
      return rawInterest.split(',');
    } catch {
      return ['Travel', 'Music', 'Fitness'];
    }
  };

  const displayName = isOtherProfileView ? (otherUser?.profile?.fullName || otherName) : ownName;
  const displayAge = isOtherProfileView ? (otherUser?.profile?.dateOfBirth ? String(Math.floor((Date.now() - new Date(otherUser.profile.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))) : otherAge) : ownAge;
  const displayRole = isOtherProfileView ? (otherUser?.profile?.profession || otherRole) : ownRole;
  const displayBio = isOtherProfileView ? (otherUser?.profile?.bio || otherBio) : ownBio;
  const displayAbout = isOtherProfileView ? (otherUser?.profile?.bio || otherAbout) : 'Passionate about technology, startups, and fitness. I value emotional maturity and authenticity.';
  const displayEducation = isOtherProfileView ? (otherUser?.profile?.education || otherEducation) : ownEducation;
  const displayCity = isOtherProfileView ? (otherUser?.profile ? [otherUser.profile.city, otherUser.profile.state, otherUser.profile.country].filter(Boolean).join(', ') : otherCity) : ownCity;
  const displayImage = isOtherProfileView ? (otherUser?.profile?.profilePhoto ? getPhotoUrl(otherUser.profile.profilePhoto) : otherImage) : ownProfilePhoto;
  const displayGender = (isOtherProfileView ? (otherUser?.profile?.gender || otherGender) : ownGender).toLowerCase();
  const displayHeight = isOtherProfileView ? (otherUser?.profile?.height || otherHeight) : ownHeight;
  const displayInterests = isOtherProfileView ? (otherUser?.profile?.interest || getOtherInterests()) : ownInterests;
  const lookingForGender = displayGender === 'female' ? 'Male' : 'Female';
  const parsedAge = Number.parseInt(displayAge, 10);

  const biodataObj = isOtherProfileView ? otherUser?.biodata : user?.biodata;
  const hasBiodata = !!biodataObj?.biodataUrl;

  // Match score for other profiles
  const matchScore = (() => {
    if (!isOtherProfileView) return null;
    let score = 52;
    if (displayGender === 'female') score += 10;
    if (displayCity.toLowerCase() === 'pune') score += 12;
    if (displayEducation.toLowerCase() === 'mba') score += 14;
    else if (displayEducation.toLowerCase().includes('tech')) score += 8;
    if (!Number.isNaN(parsedAge)) {
      const ageGap = Math.abs(parsedAge - 27);
      if (ageGap <= 2) score += 18;
      else if (ageGap <= 4) score += 12;
      else if (ageGap <= 7) score += 6;
    }
    if (otherIsConnection) score += 10;
    const roleText = displayRole.toLowerCase();
    if (roleText.includes('engineer') || roleText.includes('doctor') || roleText.includes('scientist')) score += 7;
    return Math.max(45, Math.min(97, score));
  })();

  const matchScoreColor = (() => {
    if (matchScore === null) return '#8E8E95';
    if (matchScore > 85) return '#33C56E';
    if (matchScore >= 70) return '#E4C542';
    return '#E25555';
  })();

  const [connectionRequested, setConnectionRequested] = useState(false);

  // Photo data for grid
  const photoUrls = isOtherProfileView
    ? (displayImage ? [displayImage] : [])
    : photos.map((p) => getPhotoUrl(p.photoUrl));

  return (
    <View style={styles.mainContainer}>
      <SafeAreaView style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 130 }}
          refreshControl={
            !isOtherProfileView ? (
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF4D8D" />
            ) : undefined
          }
        >
          <View style={styles.header}>
            <ThemedText style={styles.headerTitle}>{isOtherProfileView ? 'Profile' : t('myProfile')}</ThemedText>
            {!isOtherProfileView ? (
              <TouchableOpacity style={styles.settingButton} onPress={() => router.push('/settings')}>
                <Ionicons name="settings-outline" size={22} color="#fff" />
              </TouchableOpacity>
            ) : (
              <View style={styles.settingPlaceholder} />
            )}
          </View>

          <View style={styles.profileHeaderContainer}>
            <View style={styles.headerTopRow}>
              <Image source={{ uri: displayImage }} style={styles.profileImageRound} />
              
              <View style={styles.profileStats}>
                <View style={styles.nameRow}>
                  <ThemedText style={styles.profileNameText}>{displayName}</ThemedText>
                  {user?.isMobileVerified && (
                    <Ionicons name="checkmark-circle" size={18} color="#0095f6" style={{ marginLeft: 6 }} />
                  )}
                </View>
                
                <ThemedText style={styles.profileProfessionText}>{displayRole}</ThemedText>
                
                <View style={styles.ageBadge}>
                  <ThemedText style={styles.ageBadgeText}>Age {displayAge} • {lookingForGender === 'Female' ? 'Looking for Female' : 'Looking for Male'}</ThemedText>
                </View>
              </View>
            </View>

            {/* Instagram Style Bio directly under */}
            {displayBio ? (
              <View style={styles.instagramBioContainer}>
                <ThemedText style={styles.instagramBioText}>{displayBio}</ThemedText>
              </View>
            ) : null}
          </View>

          {isOtherProfileView && (
            <View style={styles.topActionsRow}>
              {matchScore !== null && (
                <View style={styles.miniScoreCard}>
                  <ThemedText style={styles.miniScoreLabel}>Match</ThemedText>
                  <ThemedText style={[styles.miniScoreValue, { color: matchScoreColor }]}>{matchScore}%</ThemedText>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.miniRequestButton, 
                  connectionRequested && styles.miniRequestedButton,
                  matchScore === null && { flex: 1 } // Full width if no match score
                ]}
                onPress={() => setConnectionRequested(true)}
                disabled={connectionRequested}>
                <Ionicons name={connectionRequested ? 'checkmark-circle' : 'heart'} size={18} color="#fff" />
                <ThemedText style={styles.miniRequestButtonText}>
                  {connectionRequested ? 'Requested' : 'Send Connection Request'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.statsCardUnified}>
            {/* Column 1: Profession */}
            <View style={styles.statColumnUnified}>
              <Ionicons name="briefcase-outline" size={18} color="#FF4D8D" style={{ marginBottom: 6 }} />
              <ThemedText style={styles.statLabelUnified}>Profession</ThemedText>
              <ThemedText style={styles.statValueUnified} numberOfLines={2}>{displayRole}</ThemedText>
            </View>

            {/* Vertical Divider */}
            <View style={styles.statDivider} />

            {/* Column 2: Education */}
            <View style={styles.statColumnUnified}>
              <Ionicons name="school-outline" size={18} color="#FF4D8D" style={{ marginBottom: 6 }} />
              <ThemedText style={styles.statLabelUnified}>{t('education')}</ThemedText>
              <ThemedText style={styles.statValueUnified} numberOfLines={2}>{displayEducation}</ThemedText>
            </View>

            {/* Vertical Divider */}
            <View style={styles.statDivider} />

            {/* Column 3: Location */}
            <View style={styles.statColumnUnified}>
              <Ionicons name="location-outline" size={18} color="#FF4D8D" style={{ marginBottom: 6 }} />
              <ThemedText style={styles.statLabelUnified}>Location</ThemedText>
              {(() => {
                const parts = displayCity.split(', ');
                return (
                  <>
                    <ThemedText style={styles.statValueUnified} numberOfLines={1}>{parts[0] || '--'}</ThemedText>
                    {parts[1] ? <ThemedText style={styles.statSubValueUnified} numberOfLines={1}>{parts[1]}</ThemedText> : null}
                  </>
                );
              })()}
            </View>
          </View>



          <View style={styles.infoCard}>
            <ThemedText style={styles.cardTitle}>{t('interests')}</ThemedText>
            <View style={styles.interestContainer}>
              {displayInterests && displayInterests.length > 0 ? (
                displayInterests.map((item: string, i: number) => (
                  <View key={i} style={styles.interestChip}>
                    <ThemedText style={styles.interestText}># {item}</ThemedText>
                  </View>
                ))
              ) : (
                <ThemedText style={styles.aboutText}>No interests added yet.</ThemedText>
              )}
            </View>
          </View>

          <View style={styles.infoCard}>
            <ThemedText style={styles.cardTitle}>{t('lifestyle')}</ThemedText>
            <View style={styles.lifestyleRow}>
              <View style={styles.lifestylePill}>
                <Ionicons name="resize-outline" size={16} color="#FF4D8D" />
                <View style={styles.lifestylePillTexts}>
                  <ThemedText style={styles.lifestylePillLabel}>Height</ThemedText>
                  <ThemedText style={styles.lifestylePillValue}>{displayHeight}</ThemedText>
                </View>
              </View>

              <View style={styles.lifestylePill}>
                <Ionicons name="close-circle-outline" size={16} color="#FF4D8D" />
                <View style={styles.lifestylePillTexts}>
                  <ThemedText style={styles.lifestylePillLabel}>Smoking</ThemedText>
                  <ThemedText style={styles.lifestylePillValue}>{t('no')}</ThemedText>
                </View>
              </View>

              <View style={styles.lifestylePill}>
                <Ionicons name="wine-outline" size={16} color="#FF4D8D" />
                <View style={styles.lifestylePillTexts}>
                  <ThemedText style={styles.lifestylePillLabel}>Drinking</ThemedText>
                  <ThemedText style={styles.lifestylePillValue}>{t('no')}</ThemedText>
                </View>
              </View>
            </View>
          </View>

          {/* Matrimonial Biodata Panel */}
          <View style={styles.biodataPanelUnified}>
            <View style={styles.biodataPanelLeft}>
              <View style={styles.biodataIconWrapper}>
                <Ionicons name="document-text-outline" size={20} color="#FF4D8D" />
              </View>
              <View style={styles.biodataInfoTexts}>
                <ThemedText style={styles.biodataPanelTitle}>Matrimonial Biodata</ThemedText>
                <ThemedText style={styles.biodataPanelStatus}>
                  {hasBiodata ? (biodataObj?.isGenerated ? 'Compiled PDF Document' : 'Uploaded PDF Document') : 'No Document Added'}
                </ThemedText>
              </View>
            </View>

            <View style={styles.biodataPanelRight}>
              {hasBiodata ? (
                <View style={styles.biodataActionIconsRow}>
                  <TouchableOpacity style={styles.biodataRoundBtn} onPress={handleViewBiodata}>
                    <Ionicons name="eye-outline" size={16} color="#fff" />
                  </TouchableOpacity>
                  {!isOtherProfileView && (
                    <TouchableOpacity style={[styles.biodataRoundBtn, { backgroundColor: 'rgba(255, 77, 77, 0.1)' }]} onPress={handleDeleteBiodata}>
                      <Ionicons name="trash-outline" size={16} color="#ff4d4d" />
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                !isOtherProfileView && (
                  <View style={styles.biodataPanelAddRow}>
                    <TouchableOpacity
                      style={styles.biodataMiniBtn}
                      onPress={handleUploadBiodata}
                      disabled={uploadingBiodata}>
                      {uploadingBiodata ? (
                        <ActivityIndicator color="#FF4D8D" size="small" />
                      ) : (
                        <>
                          <Ionicons name="cloud-upload-outline" size={12} color="#FF4D8D" />
                          <ThemedText style={styles.biodataMiniBtnText}>Upload</ThemedText>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.biodataMiniBtn, styles.biodataMiniBtnPink]}
                      onPress={() => setShowGenerateModal(true)}>
                      <Ionicons name="sparkles-outline" size={12} color="#fff" />
                      <ThemedText style={[styles.biodataMiniBtnText, { color: '#fff' }]}>Create</ThemedText>
                    </TouchableOpacity>
                  </View>
                )
              )}
            </View>
          </View>

          {/* Photos Section */}
          <View style={styles.postSection}>
            <ThemedText style={styles.postTitle}>{t('photos')}</ThemedText>
            {loadingPhotos && !isOtherProfileView ? (
              <ActivityIndicator color="#FF4D8D" style={{ marginTop: 16 }} />
            ) : photoUrls.length > 0 ? (
              <FlatList
                data={photoUrls}
                scrollEnabled={false}
                numColumns={3}
                keyExtractor={(_, i) => i.toString()}
                columnWrapperStyle={styles.columnWrapper}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.postContainer}>
                    <Image source={{ uri: item }} style={styles.postImage} />
                  </TouchableOpacity>
                )}
              />
            ) : (
              <View style={styles.noPhotos}>
                <ThemedText style={styles.noPhotosText}>
                  No photos yet. Add some in settings edit profile section!
                </ThemedText>
              </View>
            )}
          </View>

        </ScrollView>
      {/* Generate Biodata Modal */}
      <Modal visible={showGenerateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Generate Matrimony PDF</ThemedText>
              <TouchableOpacity onPress={() => setShowGenerateModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm} showsVerticalScrollIndicator={false}>
              <ThemedText style={styles.formSectionTitle}>Personal Info (Prefilled)</ThemedText>
              <View style={styles.prefilledRow}>
                <ThemedText style={styles.prefilledLabel}>Name: {displayName}</ThemedText>
              </View>
              <View style={styles.prefilledRow}>
                <ThemedText style={styles.prefilledLabel}>Age: {displayAge} yrs</ThemedText>
              </View>

              <ThemedText style={styles.formSectionTitle}>Matrimonial Details</ThemedText>

              <ThemedText style={styles.inputLabel}>Religion</ThemedText>
              <TextInput
                style={styles.textInput}
                value={religion}
                onChangeText={setReligion}
                placeholder="e.g. Hindu"
                placeholderTextColor="#777"
              />

              <ThemedText style={styles.inputLabel}>Caste</ThemedText>
              <TextInput
                style={styles.textInput}
                value={caste}
                onChangeText={setCaste}
                placeholder="e.g. Vasudev"
                placeholderTextColor="#777"
              />

              <ThemedText style={styles.inputLabel}>Father's Name</ThemedText>
              <TextInput
                style={styles.textInput}
                value={fatherName}
                onChangeText={setFatherName}
                placeholder="e.g. Rajesh Sharma"
                placeholderTextColor="#777"
              />

              <ThemedText style={styles.inputLabel}>Mother's Name</ThemedText>
              <TextInput
                style={styles.textInput}
                value={motherName}
                onChangeText={setMotherName}
                placeholder="e.g. Sunita Sharma"
                placeholderTextColor="#777"
              />

              <TouchableOpacity
                style={styles.submitGenerateButton}
                onPress={handleGenerateBiodata}
                disabled={generatingBiodata}>
                {generatingBiodata ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={18} color="#fff" />
                    <ThemedText style={styles.submitGenerateButtonText}>Compile & Save PDF</ThemedText>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      </SafeAreaView>
      <BottomNavigation activeRouteOverride={isOtherProfileView ? '/search' : undefined} />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#0B0B0D' },
  container: { flex: 1, paddingHorizontal: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 24,
  },
  headerTitle: { color: '#fff', fontSize: 28, fontWeight: '800' },
  settingButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#17171C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingPlaceholder: { width: 42, height: 42 },
  profileHeaderContainer: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageRound: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#FF4D8D',
  },
  profileStats: {
    flex: 1,
    marginLeft: 20,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileNameText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  profileProfessionText: {
    color: '#8E8E95',
    fontSize: 13,
    marginTop: 4,
  },
  ageBadge: {
    marginTop: 6,
  },
  ageBadgeText: {
    color: '#FF4D8D',
    fontSize: 12,
    fontWeight: '600',
  },
  instagramBioContainer: {
    marginTop: 14,
    paddingHorizontal: 2,
  },
  instagramBioText: {
    color: '#CFCFD6',
    fontSize: 13,
    lineHeight: 19,
  },
  identityChip: {
    backgroundColor: '#1E1E24',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  identityChipText: { color: '#D8D8DE', fontSize: 11, fontWeight: '600' },
  statsCardUnified: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#151519',
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 12,
    marginTop: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statColumnUnified: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statDivider: {
    width: 1,
    height: 38,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  statLabelUnified: {
    color: '#8E8E95',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValueUnified: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  statSubValueUnified: {
    color: '#8E8E95',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
  },
  miniScoreCard: {
    backgroundColor: '#1C251D',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 140, 88, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 85,
  },
  miniScoreLabel: {
    color: '#8E9A90',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  miniScoreValue: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  miniRequestButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FF4D8D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  miniRequestedButton: {
    backgroundColor: '#3B8C58',
  },
  miniRequestButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  infoCard: {
    backgroundColor: '#151519',
    borderRadius: 24,
    padding: 20,
    marginTop: 22,
  },
  cardTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 14 },
  lookingForRow: { flexDirection: 'row', gap: 10 },
  lookingForChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#24242B',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  lookingForChipActive: { backgroundColor: '#FF4D8D', borderColor: '#FF4D8D' },
  lookingForChipText: { color: '#C0C0CC', fontSize: 13, fontWeight: '600' },
  lookingForChipTextActive: { color: '#fff', fontSize: 13, fontWeight: '700' },
  aboutText: { color: '#CFCFD6', fontSize: 14, lineHeight: 22 },
  interestContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  interestChip: {
    backgroundColor: 'rgba(255, 77, 141, 0.06)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 141, 0.15)',
  },
  interestText: { 
    color: '#FF4D8D', 
    fontSize: 13,
    fontWeight: '600',
  },
  lifestyleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  lifestylePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E24',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
    gap: 8,
  },
  lifestylePillTexts: {
    flex: 1,
  },
  lifestylePillLabel: {
    color: '#8E8E95',
    fontSize: 10,
    fontWeight: '600',
  },
  lifestylePillValue: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
  postSection: { marginTop: 28 },
  postTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 16 },
  columnWrapper: { justifyContent: 'space-between', marginBottom: 8 },
  postContainer: { width: '32%', aspectRatio: 1, borderRadius: 18, overflow: 'hidden' },
  postImage: { width: '100%', height: '100%' },
  noPhotos: {
    backgroundColor: '#17171C',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
  },
  noPhotosText: { color: '#8E8E95', fontSize: 14 },
  actionButtons: { marginTop: 30, gap: 12 },
  editButton: {
    backgroundColor: 'rgba(255, 77, 141, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 141, 0.3)',
    borderRadius: 18,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  editButtonText: { color: '#FF4D8D', fontWeight: '700' },
  logoutButton: {
    backgroundColor: '#17171C',
    borderRadius: 18,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  logoutText: { color: '#ff5c5c', fontWeight: '700' },

  // Biodata Styles
  biodataPanelUnified: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#151519',
    borderRadius: 20,
    padding: 16,
    marginTop: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  biodataPanelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  biodataIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 77, 141, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  biodataInfoTexts: {
    marginLeft: 12,
    flex: 1,
  },
  biodataPanelTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  biodataPanelStatus: {
    color: '#8E8E95',
    fontSize: 12,
    marginTop: 2,
  },
  biodataPanelRight: {
    marginLeft: 10,
    justifyContent: 'center',
  },
  biodataActionIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  biodataRoundBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF4D8D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  biodataPanelAddRow: {
    flexDirection: 'row',
    gap: 8,
  },
  biodataMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 77, 141, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 141, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 34,
    gap: 6,
  },
  biodataMiniBtnPink: {
    backgroundColor: '#FF4D8D',
    borderColor: '#FF4D8D',
  },
  biodataMiniBtnText: {
    color: '#FF4D8D',
    fontSize: 12,
    fontWeight: '700',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#151519',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
    paddingHorizontal: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  modalForm: {
    paddingVertical: 20,
    paddingBottom: 40,
  },
  formSectionTitle: {
    color: '#FF4D8D',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
    marginTop: 8,
  },
  prefilledRow: {
    backgroundColor: '#1D1D24',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  prefilledLabel: {
    color: '#9B9BA1',
    fontSize: 14,
  },
  inputLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 14,
  },
  textInput: {
    backgroundColor: '#1E1E24',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 16,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  submitGenerateButton: {
    backgroundColor: '#FF4D8D',
    borderRadius: 16,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 28,
  },
  submitGenerateButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
