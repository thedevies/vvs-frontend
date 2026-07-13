import React, { useState, useEffect } from 'react';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import { CustomAlert as Alert } from '@/utils/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import * as WebBrowser from 'expo-web-browser';

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
  // Parser helper to extract feet & inches from profile.height (e.g. 5'10")
  const parseHeight = (hStr?: string | null) => {
    if (!hStr) return { feet: '', inches: '' };
    const match = hStr.match(/(\d+)\s*(?:ft|')\s*(?:(\d+)\s*(?:in|"))?/i) || hStr.match(/(\d+)\s*[-.]\s*(\d+)/);
    if (match) {
      return {
        feet: match[1] || '',
        inches: match[2] || '0'
      };
    }
    if (/^\d$/.test(hStr[0])) {
      return { feet: hStr[0], inches: '' };
    }
    return { feet: '', inches: '' };
  };

  const initialHeight = parseHeight(profile?.height);
  const [heightFeet, setHeightFeet] = useState(initialHeight.feet);
  const [heightInches, setHeightInches] = useState(initialHeight.inches);
  const [interests, setInterests] = useState<string[]>(
    profile?.interest || ['Travel', 'AI', 'Music', 'Fitness', 'Photography']
  );
  const [customInterestText, setCustomInterestText] = useState('');

  const handleAddCustomInterest = () => {
    const trimmed = customInterestText.trim();
    if (!trimmed) return;
    if (trimmed.length > 25) {
      Alert.alert('Too Long', 'Hobby name must be under 25 characters.');
      return;
    }
    const alreadyExists = interests.some(i => i.toLowerCase() === trimmed.toLowerCase());
    if (alreadyExists) {
      setCustomInterestText('');
      return;
    }
    setInterests([...interests, trimmed]);
    setCustomInterestText('');
  };
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

  // Biodata states
  const [uploadingBiodata, setUploadingBiodata] = useState(false);
  const [generatingBiodata, setGeneratingBiodata] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [religion, setReligion] = useState('Hindu');
  const [caste, setCaste] = useState('Vasudev');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');

  const biodataObj = user?.biodata;
  const hasBiodata = !!biodataObj?.biodataUrl;

  const handleViewBiodata = async () => {
    const url = biodataObj?.biodataUrl;
    if (!url) return;
    const fullUrl = url.startsWith('http') ? url : `${BASE_URL.replace('/api', '')}${url.startsWith('/') ? url : `/${url}`}`;
    console.log('[Biodata] Opening PDF:', fullUrl);
    await WebBrowser.openBrowserAsync(fullUrl);
  };

  const handleUploadBiodata = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        console.log('[Biodata] Document picked:', file.name, file.uri);
        setUploadingBiodata(true);

        const response = await profileApi.uploadBiodata(file.uri, 'uploaded');
        if (response.data) {
          await refreshUser();
          Alert.alert('Success', 'Biodata PDF uploaded successfully!');
        } else {
          Alert.alert('Upload Failed', response.message || 'Failed to upload biodata.');
        }
      }
    } catch (err: any) {
      console.error('[BiodataUpload] Error picking/uploading:', err);
      Alert.alert('Error', err.message || 'Failed to upload biodata. Please try again.');
    } finally {
      setUploadingBiodata(false);
    }
  };

  const handleUpdateBiodata = () => {
    Alert.alert(
      'Update Biodata',
      'Choose how you want to update your matrimonial biodata:',
      [
        { text: 'Upload PDF', onPress: handleUploadBiodata },
        { text: 'Generate PDF', onPress: () => setShowGenerateModal(true) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleGenerateSubmit = async () => {
    if (!fatherName.trim() || !motherName.trim()) {
      Alert.alert('Error', 'Please fill in all parental fields to generate biodata.');
      return;
    }

    try {
      setGeneratingBiodata(true);
      setShowGenerateModal(false);

      const response = await profileApi.generateBiodata({
        fullName: name.trim() || profile?.fullName || user?.profile?.fullName || 'User Name',
        gender: gender || (profile?.gender as any) || 'male',
        maritalStatus: maritalStatus || (profile?.maritalStatus as any) || 'never_married',
        dateOfBirth: dateOfBirth || (profile?.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '1998-05-20'),
        city: city.trim() || profile?.city || undefined,
        profession: profession.trim() || profile?.profession || undefined,
        education: education.trim() || profile?.education || undefined,
        bio: bio.trim() || profile?.bio || undefined,
        religion: religion.trim(),
        caste: caste.trim(),
        fatherName: fatherName.trim(),
        motherName: motherName.trim(),
      });

      if (response.data) {
        await refreshUser();
        Alert.alert('Success', 'Biodata PDF generated successfully!');
      } else {
        Alert.alert('Generation Failed', response.message || 'Failed to generate biodata.');
      }
    } catch (err: any) {
      console.error('[BiodataGen] Error generating:', err);
      Alert.alert('Error', err.message || 'Failed to generate biodata. Please try again.');
    } finally {
      setGeneratingBiodata(false);
    }
  };

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
    if (!heightFeet.trim() || !heightInches.trim()) {
      setError('Please enter your height in feet and inches (e.g. 5 ft 10 in).');
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

    const formattedHeight = `${heightFeet.trim()}'${heightInches.trim()}"`;

    // Biodata is mandatory for all users
    if (!user?.biodata) {
      setError('Matrimonial biodata is mandatory! Please upload or generate your biodata below before saving.');
      return;
    }

    setSaving(true);

    try {
      let uploadedPhotoUrl = profile?.profilePhoto || '';

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
          height: formattedHeight,
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
          height: formattedHeight,
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

            {displayImage ? (
              <TouchableOpacity style={styles.cropImageButton} onPress={pickImage} disabled={uploadingPhoto}>
                <Feather name="crop" size={14} color="#FF4D8D" />
                <ThemedText style={styles.cropImageButtonText}>Crop / Edit Photo</ThemedText>
              </TouchableOpacity>
            ) : (
              !profileCompleted && !photoUri && (
                <ThemedText style={styles.photoHint}>Tap camera to add photo (required)</ThemedText>
              )
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

            {/* Height (Split Feet & Inches) */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Height *</ThemedText>
              <View style={styles.heightSplitRow}>
                <View style={styles.heightSplitBox}>
                  <CustomInput 
                    placeholder="Feet" 
                    value={heightFeet} 
                    onChangeText={setHeightFeet} 
                    keyboardType="numeric"
                    maxLength={1}
                  />
                  <ThemedText style={styles.heightSplitLabel}>ft</ThemedText>
                </View>
                <View style={styles.heightSplitBox}>
                  <CustomInput 
                    placeholder="Inches" 
                    value={heightInches} 
                    onChangeText={setHeightInches} 
                    keyboardType="numeric"
                    maxLength={2}
                  />
                  <ThemedText style={styles.heightSplitLabel}>in</ThemedText>
                </View>
              </View>
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
              {Array.from(new Set([...COMMON_INTERESTS, ...interests])).map((item) => {
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

            {/* Custom Hobby Input Box */}
            <View style={styles.customInterestInputRow}>
              <TextInput
                value={customInterestText}
                onChangeText={setCustomInterestText}
                placeholder="Enter custom hobby..."
                placeholderTextColor="#777"
                style={styles.customInterestInput}
              />
              <TouchableOpacity style={styles.customInterestAddBtn} onPress={handleAddCustomInterest}>
                <Ionicons name="add" size={16} color="#fff" />
                <ThemedText style={styles.customInterestAddText}>Add</ThemedText>
              </TouchableOpacity>
            </View>

            {/* Matrimonial Biodata Panel (Mandatory) */}
            <View style={styles.biodataPanelUnified}>
              <View style={styles.biodataPanelLeft}>
                <View style={styles.biodataIconWrapper}>
                  <Ionicons name="document-text-outline" size={20} color="#FF4D8D" />
                </View>
                <View style={styles.biodataInfoTexts}>
                  <ThemedText style={styles.biodataPanelTitle}>Matrimonial Biodata *</ThemedText>
                  <ThemedText style={styles.biodataPanelStatus}>
                    {hasBiodata ? (biodataObj?.isGenerated ? 'Compiled PDF Document' : 'Uploaded PDF Document') : 'No Document Added (Mandatory)'}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.biodataPanelRight}>
                {hasBiodata ? (
                  <View style={styles.biodataActionIconsRow}>
                    <TouchableOpacity style={styles.biodataRoundBtn} onPress={handleViewBiodata}>
                      <Ionicons name="eye-outline" size={16} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.biodataRoundBtn, { backgroundColor: 'rgba(255, 77, 141, 0.1)' }]} onPress={handleUpdateBiodata}>
                      <Ionicons name="cloud-upload-outline" size={16} color="#FF4D8D" />
                    </TouchableOpacity>
                  </View>
                ) : (
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
                )}
              </View>
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
                      : 'Create Profile'
                }
                onPress={handleSave}
                disabled={loading || uploadingBiodata || generatingBiodata}
              />
              {loading && (
                <ActivityIndicator size="small" color="#FF4D8D" style={{ marginTop: 12 }} />
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

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
              <View style={styles.modalInputGroup}>
                <ThemedText style={styles.modalInputLabel}>Religion</ThemedText>
                <TextInput
                  style={styles.modalTextInput}
                  value={religion}
                  onChangeText={setReligion}
                  placeholder="e.g. Hindu"
                  placeholderTextColor="#777"
                />
              </View>

              <View style={styles.modalInputGroup}>
                <ThemedText style={styles.modalInputLabel}>Caste</ThemedText>
                <TextInput
                  style={styles.modalTextInput}
                  value={caste}
                  onChangeText={setCaste}
                  placeholder="e.g. Vasudev"
                  placeholderTextColor="#777"
                />
              </View>

              <View style={styles.modalInputGroup}>
                <ThemedText style={styles.modalInputLabel}>Father's Full Name *</ThemedText>
                <TextInput
                  style={styles.modalTextInput}
                  value={fatherName}
                  onChangeText={setFatherName}
                  placeholder="Father's Name"
                  placeholderTextColor="#777"
                />
              </View>

              <View style={styles.modalInputGroup}>
                <ThemedText style={styles.modalInputLabel}>Mother's Full Name *</ThemedText>
                <TextInput
                  style={styles.modalTextInput}
                  value={motherName}
                  onChangeText={setMotherName}
                  placeholder="Mother's Name"
                  placeholderTextColor="#777"
                />
              </View>

              <TouchableOpacity
                style={[styles.modalSubmitBtn, generatingBiodata && { opacity: 0.7 }]}
                onPress={handleGenerateSubmit}
                disabled={generatingBiodata}
              >
                {generatingBiodata ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <ThemedText style={styles.modalSubmitBtnText}>Generate Biodata PDF</ThemedText>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  cropImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FF4D8D',
    backgroundColor: 'rgba(255, 77, 141, 0.08)',
  },
  cropImageButtonText: {
    color: '#FF4D8D',
    fontSize: 13,
    fontWeight: '700',
  },
  formSection: {
    paddingHorizontal: 24,
    gap: 24,
  },
  inputGroup: {
    gap: 10,
  },
  heightSplitRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  heightSplitBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heightSplitLabel: {
    color: '#9B9BA1',
    fontSize: 14,
    fontWeight: '600',
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
  customInterestInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
    backgroundColor: '#17171C',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 16,
    height: 52,
  },
  customInterestInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
  },
  customInterestAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FF4D8D',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 36,
  },
  customInterestAddText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
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
  modalInputGroup: {
    marginBottom: 16,
  },
  modalInputLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalTextInput: {
    backgroundColor: '#1E1E24',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 16,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalSubmitBtn: {
    backgroundColor: '#FF4D8D',
    borderRadius: 16,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 28,
  },
  modalSubmitBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
