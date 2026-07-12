import React, { useState, useEffect } from 'react';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

import CustomButton from '@/components/ui/CustomButton';
import CustomInput from '@/components/ui/CustomInput';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/AuthContext';
import { profileApi, BASE_URL } from '@/utils/api';

type Gender = 'male' | 'female';
type MaritalStatus = 'never_married' | 'divorced' | 'widowed';

const COMMON_INTERESTS = [
  'Travel', 'AI', 'Music', 'Fitness', 'Photography', 
  'Reading', 'Movies', 'Cooking', 'Art', 'Sports', 
  'Gaming', 'Writing', 'Yoga', 'Dancing', 'Tech'
];

export default function EditProfileScreen() {
  const { user, profileCompleted, refreshUser, logout } = useAuth();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      Alert.alert(
        'Cancel Registration?',
        'You must complete your profile to continue. Going back will sign you out.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Out', style: 'destructive', onPress: () => logout() }
        ]
      );
    }
  };

  // Pre-fill from existing profile if editing
  const profile = user?.profile;
  const [name, setName] = useState(profile?.fullName || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [profession, setProfession] = useState(profile?.profession || '');
  const [education, setEducation] = useState(profile?.education || '');
  const [city, setCity] = useState(profile?.city || '');
  const [country, setCountry] = useState(profile?.country || 'India');
  const [stateVal, setStateVal] = useState(profile?.state || 'Maharashtra');
  const [height, setHeight] = useState(profile?.height || '');
  const [interests, setInterests] = useState<string[]>(
    profile?.interest || ['Travel', 'AI', 'Music', 'Fitness', 'Photography']
  );
  const [gender, setGender] = useState<Gender>((profile?.gender as Gender) || 'male');
  const [maritalStatus, setMaritalStatus] = useState<MaritalStatus>(
    (profile?.maritalStatus as MaritalStatus) || 'never_married'
  );
  const [dateOfBirth, setDateOfBirth] = useState(
    profile?.dateOfBirth ? profile.dateOfBirth.split('T')[0] : ''
  );
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const getDobDate = () => {
    if (dateOfBirth) {
      const parsed = new Date(dateOfBirth);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    // Default: 25 years ago
    const d = new Date();
    d.setFullYear(d.getFullYear() - 25);
    return d;
  };

  const getPhotoUrl = (path: string): string => {
    if (path.startsWith('http')) return path;
    const baseUrl = BASE_URL.replace('/api', '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  };

  // Profile photo URL from backend
  const existingPhotoUrl = profile?.profilePhoto
    ? getPhotoUrl(profile.profilePhoto)
    : null;

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Needed', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const displayImage = photoUri || existingPhotoUrl;

  const handleSave = async () => {
    setError('');

    // Validation
    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!height.trim()) {
      setError('Please enter your height (e.g. 5\'10").');
      return;
    }
    if (!dateOfBirth.trim()) {
      setError('Please select your date of birth.');
      return;
    }
    if (!bio.trim()) {
      setError('Please write a short bio about yourself.');
      return;
    }

    // For new profile, photo is required
    if (!profileCompleted && !photoUri) {
      setError('Please select a profile photo.');
      return;
    }

    setSaving(true);

    try {
      let uploadedPhotoUrl = existingPhotoUrl || '';

      // 1. If a new photo is selected, upload it first to get the URL
      if (photoUri) {
        console.log('[EditProfile] Uploading photo first...');
        setUploadingPhoto(true);
        try {
          const uploadRes = await profileApi.uploadPhoto(photoUri);
          if (uploadRes.data?.photoUrl) {
            uploadedPhotoUrl = uploadRes.data.photoUrl;
            console.log('[EditProfile] Photo uploaded successfully:', uploadedPhotoUrl);
          } else {
            throw new Error('Failed to upload profile photo.');
          }
        } finally {
          setUploadingPhoto(false);
        }
      }

      if (!profileCompleted) {
        // Create new profile via pure JSON
        await profileApi.setupProfile({
          fullName: name.trim(),
          gender,
          height: height.trim(),
          maritalStatus,
          dateOfBirth,
          country: country.trim() || undefined,
          state: stateVal.trim() || undefined,
          city: city.trim() || undefined,
          profession: profession.trim() || undefined,
          education: education.trim() || undefined,
          bio: bio.trim(),
          profilePhoto: uploadedPhotoUrl,
          interest: interests,
        });

        // Refresh user data in context
        await refreshUser();

        Alert.alert('Success', 'Profile created successfully!', [
          { text: 'OK', onPress: () => router.replace('/explore') },
        ]);
      } else {
        // Update existing profile
        await profileApi.updateProfile({
          fullName: name.trim(),
          gender,
          height: height.trim(),
          maritalStatus,
          dateOfBirth,
          country: country.trim() || undefined,
          state: stateVal.trim() || undefined,
          city: city.trim() || undefined,
          profession: profession.trim() || undefined,
          education: education.trim() || undefined,
          bio: bio.trim(),
          profilePhoto: uploadedPhotoUrl || undefined,
          interest: interests,
        });

        // Refresh user data
        await refreshUser();

        Alert.alert('Success', 'Profile updated successfully!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (err: any) {
      console.error('[EditProfile] Save error:', err);
      setError(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>
            {profileCompleted ? 'Edit Profile' : 'Complete Profile'}
          </ThemedText>
          <TouchableOpacity style={styles.saveHeaderButton} onPress={handleSave} disabled={loading}>
            <ThemedText style={styles.saveHeaderText}>{loading ? '...' : 'Save'}</ThemedText>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}>
          
          {/* Profile Photo */}
          <View style={styles.imageSection}>
            <View style={styles.imageWrapper}>
              {displayImage ? (
                <Image source={{ uri: displayImage }} style={styles.profileImage} />
              ) : (
                <View style={[styles.profileImage, styles.placeholderImage]}>
                  <Feather name="user" size={48} color="#555" />
                </View>
              )}
              {uploadingPhoto && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="large" color="#FF4D8D" />
                  <ThemedText style={styles.uploadingText}>Uploading...</ThemedText>
                </View>
              )}
              <TouchableOpacity style={styles.editImageBadge} onPress={pickImage} disabled={uploadingPhoto}>
                <Feather name="camera" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            {!profileCompleted && !photoUri && (
              <ThemedText style={styles.photoHint}>Tap camera to add photo (required)</ThemedText>
            )}
          </View>

          <View style={styles.formSection}>
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Full Name *</ThemedText>
              <CustomInput 
                placeholder="Full Name" 
                value={name} 
                onChangeText={setName} 
              />
            </View>

            {/* Gender */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Gender *</ThemedText>
              <View style={styles.chipRow}>
                {(['male', 'female'] as Gender[]).map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.chip, gender === g && styles.chipActive]}
                    onPress={() => setGender(g)}
                  >
                    <ThemedText style={[styles.chipText, gender === g && styles.chipTextActive]}>
                      {g === 'male' ? 'Male' : 'Female'}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Date of Birth */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Date of Birth *</ThemedText>
              <TouchableOpacity 
                style={styles.datePickerButton} 
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.8}
              >
                <ThemedText style={[styles.datePickerText, !dateOfBirth && styles.datePickerPlaceholder]}>
                  {dateOfBirth || 'Select Date of Birth'}
                </ThemedText>
                <Feather name="calendar" size={20} color="#FF4D8D" />
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={getDobDate()}
                  mode="date"
                  display="default"
                  maximumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (selectedDate) {
                      const year = selectedDate.getFullYear();
                      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                      const day = String(selectedDate.getDate()).padStart(2, '0');
                      setDateOfBirth(`${year}-${month}-${day}`);
                    }
                  }}
                />
              )}
            </View>

            {/* Marital Status */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Marital Status *</ThemedText>
              <View style={styles.chipRow}>
                {([
                  { key: 'never_married', label: 'Never Married' },
                  { key: 'divorced', label: 'Divorced' },
                  { key: 'widowed', label: 'Widowed' },
                ] as { key: MaritalStatus; label: string }[]).map((s) => (
                  <TouchableOpacity
                    key={s.key}
                    style={[styles.chip, maritalStatus === s.key && styles.chipActive]}
                    onPress={() => setMaritalStatus(s.key)}
                  >
                    <ThemedText style={[styles.chipText, maritalStatus === s.key && styles.chipTextActive]}>
                      {s.label}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Height */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Height * (e.g. 5'10")</ThemedText>
              <CustomInput 
                placeholder="5ft 10in" 
                value={height} 
                onChangeText={setHeight} 
              />
            </View>

            {/* Bio */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Bio *</ThemedText>
              <View style={styles.textAreaContainer}>
                <CustomInput 
                  placeholder="Tell us about yourself..." 
                  value={bio} 
                  onChangeText={setBio}
                />
              </View>
            </View>

            {/* Profession */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Profession</ThemedText>
              <CustomInput 
                placeholder="Profession" 
                value={profession} 
                onChangeText={setProfession} 
              />
            </View>

            {/* Education */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Education</ThemedText>
              <CustomInput 
                placeholder="Highest Education" 
                value={education} 
                onChangeText={setEducation} 
              />
            </View>

            {/* Country */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Country</ThemedText>
              <CustomInput 
                placeholder="Country" 
                value={country} 
                onChangeText={setCountry} 
              />
            </View>

            {/* State */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>State</ThemedText>
              <CustomInput 
                placeholder="State" 
                value={stateVal} 
                onChangeText={setStateVal} 
              />
            </View>

            {/* City */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>City/Location</ThemedText>
              <CustomInput 
                placeholder="City" 
                value={city} 
                onChangeText={setCity} 
              />
            </View>

            <View style={styles.sectionDivider} />

            <ThemedText style={styles.sectionTitle}>Interests & Hobbies *</ThemedText>
            
            <View style={styles.interestContainer}>
              {COMMON_INTERESTS.map((item) => {
                const isSelected = interests.includes(item);
                return (
                  <TouchableOpacity 
                    key={item} 
                    onPress={() => {
                      if (isSelected) {
                        setInterests(interests.filter(i => i !== item));
                      } else {
                        setInterests([...interests, item]);
                      }
                    }}
                    style={[
                      styles.interestChip, 
                      isSelected && styles.interestChipActive
                    ]}>
                    <ThemedText style={[
                      styles.interestText,
                      isSelected && styles.interestTextActive
                    ]}>
                      {item}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>

            {error ? (
              <ThemedText style={styles.errorText}>{error}</ThemedText>
            ) : null}

            <View style={styles.buttonContainer}>
              <CustomButton
                title={
                  loading
                    ? 'Saving...'
                    : profileCompleted
                      ? 'Save Changes'
                      : 'Complete Profile'
                }
                onPress={handleSave}
                disabled={loading}
              />
              {loading && (
                <ActivityIndicator size="small" color="#FF4D8D" style={{ marginTop: 12 }} />
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#0F0F12',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  saveHeaderButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  saveHeaderText: {
    color: '#FF4D8D',
    fontWeight: '700',
    fontSize: 16,
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  imageSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  imageWrapper: {
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  placeholderImage: {
    backgroundColor: '#17171C',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    borderStyle: 'dashed',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  uploadingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  editImageBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF4D8D',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#0F0F12',
  },
  photoHint: {
    color: '#FF4D8D',
    fontSize: 12,
    marginTop: 8,
    fontWeight: '600',
  },
  formSection: {
    paddingHorizontal: 24,
    gap: 24,
  },
  inputGroup: {
    gap: 10,
  },
  inputLabel: {
    color: '#9B9BA1',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    backgroundColor: '#17171C',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  chipActive: {
    backgroundColor: 'rgba(255, 77, 141, 0.15)',
    borderColor: '#FF4D8D',
  },
  chipText: {
    color: '#9B9BA1',
    fontSize: 14,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FF4D8D',
  },
  textAreaContainer: {
    height: 100,
  },
  datePickerButton: {
    backgroundColor: '#17171C',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  datePickerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  datePickerPlaceholder: {
    color: '#555',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 8,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: -8,
  },
  interestContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  interestChip: {
    backgroundColor: '#17171C',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  interestChipActive: {
    backgroundColor: 'rgba(255, 77, 141, 0.15)',
    borderColor: '#FF4D8D',
  },
  interestText: {
    color: '#9B9BA1',
  },
  interestTextActive: {
    color: '#FF4D8D',
    fontWeight: '600',
  },
  addInterestChip: {
    backgroundColor: 'rgba(255, 77, 141, 0.1)',
    borderColor: 'rgba(255, 77, 141, 0.3)',
    borderStyle: 'dashed',
  },
  addInterestText: {
    color: '#FF4D8D',
    fontWeight: '600',
  },
  errorText: {
    color: '#FF7A7A',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  buttonContainer: {
    marginTop: 20,
  },
});
