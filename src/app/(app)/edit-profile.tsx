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
import { useAppTheme } from '@/context/ThemeContext';

type Gender = 'male' | 'female';
type MaritalStatus = 'never_married' | 'divorced' | 'widowed';

const COMMON_INTERESTS = [
  'Travel', 'AI', 'Music', 'Fitness', 'Photography',
  'Reading', 'Movies', 'Cooking', 'Art', 'Sports',
  'Gaming', 'Writing', 'Yoga', 'Dancing', 'Tech'
];

const ACCENT = '#FF4D8D';

export default function EditProfileScreen() {
  const { user, profileCompleted, refreshUser, logout } = useAuth();
  const { colors, isDark } = useAppTheme();

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
  const [ageError, setAgeError] = useState('');
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
    setAgeError('');

    if (!name.trim()) {
      const msg = 'Please enter your full name.';
      setError(msg);
      Alert.alert('Validation Error', msg);
      return;
    }
    if (!heightFeet.trim() || !heightInches.trim()) {
      const msg = 'Please enter your height in feet and inches (e.g. 5 ft 10 in).';
      setError(msg);
      Alert.alert('Validation Error', msg);
      return;
    }
    if (!dateOfBirth.trim()) {
      const msg = 'Please select your date of birth.';
      setError(msg);
      Alert.alert('Validation Error', msg);
      return;
    }

    const dobDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dobDate.getFullYear();
    const monthDiff = today.getMonth() - dobDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
      age--;
    }

    if (gender === 'female' && age < 18) {
      const msg = 'Age must be at least 18 years old.';
      setError(msg);
      setAgeError(msg);
      Alert.alert('Validation Error', msg);
      return;
    }
    if (gender === 'male' && age < 21) {
      const msg = 'Age must be at least 21 years old.';
      setError(msg);
      setAgeError(msg);
      Alert.alert('Validation Error', msg);
      return;
    }

    if (!bio.trim()) {
      const msg = 'Please write a short bio about yourself.';
      setError(msg);
      Alert.alert('Validation Error', msg);
      return;
    }

    if (!profileCompleted && !photoUri) {
      const msg = 'Please select a profile photo.';
      setError(msg);
      Alert.alert('Validation Error', msg);
      return;
    }

    const formattedHeight = `${heightFeet.trim()}'${heightInches.trim()}"`;

    if (!user?.biodata) {
      const msg = 'Matrimonial biodata is mandatory! Please upload or generate your biodata below before saving.';
      setError(msg);
      Alert.alert('Validation Error', msg);
      return;
    }

    setSaving(true);

    try {
      let uploadedPhotoUrl = profile?.profilePhoto || '';

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

        await refreshUser();

        Alert.alert('Success', 'Profile created successfully!', [
          { text: 'OK', onPress: () => router.replace('/explore') },
        ]);
      } else {
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
    <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.container}>
        {/* ── Header ── */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.headerIconBtn, { backgroundColor: colors.card }]}
            onPress={handleBack}
          >
            <Feather name="arrow-left" size={19} color={colors.text} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: colors.text }]}>
            {profileCompleted ? 'Edit Profile' : 'Complete Profile'}
          </ThemedText>
          <TouchableOpacity
            style={[styles.saveHeaderButton, { borderColor: ACCENT }]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={ACCENT} />
            ) : (
              <ThemedText style={styles.saveHeaderText}>Save</ThemedText>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          {/* ── Profile Photo ── */}
          <View style={styles.imageSection}>
            <View style={styles.imageWrapper}>
              {displayImage ? (
                <Image source={{ uri: displayImage }} style={styles.profileImage} />
              ) : (
                <View style={[styles.profileImage, styles.placeholderImage, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Feather name="user" size={44} color={colors.muted} />
                </View>
              )}
              {uploadingPhoto && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="large" color={ACCENT} />
                  <ThemedText style={styles.uploadingText}>Uploading...</ThemedText>
                </View>
              )}
              <TouchableOpacity style={[styles.editImageBadge, { borderColor: colors.background }]} onPress={pickImage} disabled={uploadingPhoto}>
                <Feather name="camera" size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            {displayImage ? (
              <TouchableOpacity style={styles.cropImageButton} onPress={pickImage} disabled={uploadingPhoto}>
                <Feather name="crop" size={13} color={ACCENT} />
                <ThemedText style={styles.cropImageButtonText}>Crop / Edit Photo</ThemedText>
              </TouchableOpacity>
            ) : (
              !profileCompleted && !photoUri && (
                <ThemedText style={[styles.photoHint, { color: colors.textSecondary }]}>Tap the camera icon to add a photo (required)</ThemedText>
              )
            )}
          </View>

          <View style={styles.formSection}>
            {/* ── Basic Information Card ── */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ThemedText style={[styles.cardTitle, { color: colors.text }]}>Basic Information</ThemedText>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: colors.textSecondary }]}>Full Name *</ThemedText>
                <CustomInput placeholder="Full Name" value={name} onChangeText={setName} />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: colors.textSecondary }]}>Gender *</ThemedText>
                <View style={styles.chipRow}>
                  {(['male', 'female'] as Gender[]).map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[
                        styles.chip,
                        { backgroundColor: colors.card2 || colors.background, borderColor: colors.border },
                        gender === g && styles.chipActive,
                      ]}
                      onPress={() => setGender(g)}
                      activeOpacity={0.75}
                    >
                      <ThemedText style={[styles.chipText, { color: colors.textSecondary }, gender === g && styles.chipTextActive]}>
                        {g === 'male' ? 'Male' : 'Female'}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: colors.textSecondary }]}>Date of Birth *</ThemedText>
                <TouchableOpacity
                  style={[styles.datePickerButton, { backgroundColor: colors.card2 || colors.background, borderColor: colors.border }]}
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.8}
                >
                  <ThemedText style={[styles.datePickerText, { color: colors.text }, !dateOfBirth && { color: colors.muted }]}>
                    {dateOfBirth || 'Select Date of Birth'}
                  </ThemedText>
                  <Feather name="calendar" size={18} color={ACCENT} />
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
                {ageError ? <ThemedText style={styles.fieldError}>{ageError}</ThemedText> : null}
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: colors.textSecondary }]}>Marital Status *</ThemedText>
                <View style={styles.chipRow}>
                  {([
                    { key: 'never_married', label: 'Never Married' },
                    { key: 'divorced', label: 'Divorced' },
                    { key: 'widowed', label: 'Widowed' },
                  ] as { key: MaritalStatus; label: string }[]).map((s) => (
                    <TouchableOpacity
                      key={s.key}
                      style={[
                        styles.chip,
                        { backgroundColor: colors.card2 || colors.background, borderColor: colors.border },
                        maritalStatus === s.key && styles.chipActive,
                      ]}
                      onPress={() => setMaritalStatus(s.key)}
                      activeOpacity={0.75}
                    >
                      <ThemedText style={[styles.chipText, { color: colors.textSecondary }, maritalStatus === s.key && styles.chipTextActive]}>
                        {s.label}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: colors.textSecondary }]}>Height *</ThemedText>
                <View style={styles.heightSplitRow}>
                  <View style={styles.heightSplitBox}>
                    <CustomInput placeholder="Feet" value={heightFeet} onChangeText={setHeightFeet} keyboardType="numeric" maxLength={1} />
                    <ThemedText style={[styles.heightSplitLabel, { color: colors.textSecondary }]}>ft</ThemedText>
                  </View>
                  <View style={styles.heightSplitBox}>
                    <CustomInput placeholder="Inches" value={heightInches} onChangeText={setHeightInches} keyboardType="numeric" maxLength={2} />
                    <ThemedText style={[styles.heightSplitLabel, { color: colors.textSecondary }]}>in</ThemedText>
                  </View>
                </View>
              </View>
            </View>

            {/* ── About You Card ── */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ThemedText style={[styles.cardTitle, { color: colors.text }]}>About You</ThemedText>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: colors.textSecondary }]}>Bio *</ThemedText>
                <View style={styles.textAreaContainer}>
                  <CustomInput placeholder="Tell us about yourself..." value={bio} onChangeText={setBio} />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: colors.textSecondary }]}>Profession</ThemedText>
                <CustomInput placeholder="Profession" value={profession} onChangeText={setProfession} />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: colors.textSecondary }]}>Education</ThemedText>
                <CustomInput placeholder="Highest Education" value={education} onChangeText={setEducation} />
              </View>
            </View>

            {/* ── Location Card ── */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ThemedText style={[styles.cardTitle, { color: colors.text }]}>Location</ThemedText>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: colors.textSecondary }]}>Country</ThemedText>
                <CustomInput placeholder="Country" value={country} onChangeText={setCountry} />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: colors.textSecondary }]}>State</ThemedText>
                <CustomInput placeholder="State" value={stateVal} onChangeText={setStateVal} />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: colors.textSecondary }]}>City/Location</ThemedText>
                <CustomInput placeholder="City" value={city} onChangeText={setCity} />
              </View>
            </View>

            {/* ── Interests Card ── */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ThemedText style={[styles.cardTitle, { color: colors.text }]}>Interests & Hobbies *</ThemedText>

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
                        { backgroundColor: colors.card2 || colors.background, borderColor: colors.border },
                        isSelected && styles.interestChipActive,
                      ]}
                      activeOpacity={0.75}
                    >
                      <ThemedText style={[styles.interestText, { color: colors.textSecondary }, isSelected && styles.interestTextActive]}>
                        {item}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={[styles.customInterestInputRow, { backgroundColor: colors.card2 || colors.background, borderColor: colors.border }]}>
                <TextInput
                  value={customInterestText}
                  onChangeText={setCustomInterestText}
                  placeholder="Enter custom hobby..."
                  placeholderTextColor={colors.muted}
                  style={[styles.customInterestInput, { color: colors.text }]}
                />
                <TouchableOpacity style={styles.customInterestAddBtn} onPress={handleAddCustomInterest}>
                  <Ionicons name="add" size={16} color="#fff" />
                  <ThemedText style={styles.customInterestAddText}>Add</ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Matrimonial Biodata Card (Mandatory) ── */}
            <View style={[styles.card, styles.biodataCard, { backgroundColor: colors.card, borderColor: hasBiodata ? 'rgba(59,182,115,0.35)' : colors.border }]}>
              <View style={styles.biodataPanelLeft}>
                <View style={[styles.biodataIconWrapper, { backgroundColor: 'rgba(255,77,141,0.1)' }]}>
                  <Ionicons name="document-text-outline" size={20} color={ACCENT} />
                </View>
                <View style={styles.biodataInfoTexts}>
                  <ThemedText style={[styles.biodataPanelTitle, { color: colors.text }]}>Matrimonial Biodata *</ThemedText>
                  <ThemedText style={[styles.biodataPanelStatus, { color: colors.textSecondary }]}>
                    {hasBiodata ? (biodataObj?.isGenerated ? 'Compiled PDF Document' : 'Uploaded PDF Document') : 'No document added (mandatory)'}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.biodataPanelRight}>
                {hasBiodata ? (
                  <View style={styles.biodataActionIconsRow}>
                    <TouchableOpacity
                      style={[styles.biodataOutlineBtn, { backgroundColor: colors.card2 || colors.background, borderColor: '#3BB673' }]}
                      onPress={handleViewBiodata}
                    >
                      <Ionicons name="eye-outline" size={16} color="#3BB673" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.biodataOutlineBtn, { backgroundColor: colors.card2 || colors.background, borderColor: ACCENT }]}
                      onPress={handleUpdateBiodata}
                    >
                      <Ionicons name="cloud-upload-outline" size={16} color={ACCENT} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.biodataPanelAddRow}>
                    <TouchableOpacity
                      style={[styles.biodataMiniBtn, { backgroundColor: colors.card2 || colors.background }]}
                      onPress={handleUploadBiodata}
                      disabled={uploadingBiodata}
                    >
                      {uploadingBiodata ? (
                        <ActivityIndicator color={ACCENT} size="small" />
                      ) : (
                        <>
                          <Ionicons name="cloud-upload-outline" size={12} color={ACCENT} />
                          <ThemedText style={styles.biodataMiniBtnText}>Upload</ThemedText>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.biodataMiniBtn, styles.biodataMiniBtnPink]}
                      onPress={() => setShowGenerateModal(true)}
                    >
                      <Ionicons name="sparkles-outline" size={12} color="#fff" />
                      <ThemedText style={[styles.biodataMiniBtnText, { color: '#fff' }]}>Create</ThemedText>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

            <View style={styles.buttonContainer}>
              <CustomButton
                title={loading ? 'Saving...' : profileCompleted ? 'Save Changes' : 'Create Profile'}
                onPress={handleSave}
                disabled={loading || uploadingBiodata || generatingBiodata}
              />
              {loading && <ActivityIndicator size="small" color={ACCENT} style={{ marginTop: 12 }} />}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Generate Biodata Modal */}
      <Modal visible={showGenerateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <ThemedText style={[styles.modalTitle, { color: colors.text }]}>Generate Matrimony PDF</ThemedText>
              <TouchableOpacity onPress={() => setShowGenerateModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm} showsVerticalScrollIndicator={false}>
              <View style={styles.modalInputGroup}>
                <ThemedText style={[styles.modalInputLabel, { color: colors.text }]}>Religion</ThemedText>
                <TextInput
                  style={[styles.modalTextInput, { backgroundColor: colors.card2 || colors.background, color: colors.text, borderColor: colors.border }]}
                  value={religion}
                  onChangeText={setReligion}
                  placeholder="e.g. Hindu"
                  placeholderTextColor={colors.muted}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <ThemedText style={[styles.modalInputLabel, { color: colors.text }]}>Caste</ThemedText>
                <TextInput
                  style={[styles.modalTextInput, { backgroundColor: colors.card2 || colors.background, color: colors.text, borderColor: colors.border }]}
                  value={caste}
                  onChangeText={setCaste}
                  placeholder="e.g. Vasudev"
                  placeholderTextColor={colors.muted}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <ThemedText style={[styles.modalInputLabel, { color: colors.text }]}>Father's Full Name *</ThemedText>
                <TextInput
                  style={[styles.modalTextInput, { backgroundColor: colors.card2 || colors.background, color: colors.text, borderColor: colors.border }]}
                  value={fatherName}
                  onChangeText={setFatherName}
                  placeholder="Father's Name"
                  placeholderTextColor={colors.muted}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <ThemedText style={[styles.modalInputLabel, { color: colors.text }]}>Mother's Full Name *</ThemedText>
                <TextInput
                  style={[styles.modalTextInput, { backgroundColor: colors.card2 || colors.background, color: colors.text, borderColor: colors.border }]}
                  value={motherName}
                  onChangeText={setMotherName}
                  placeholder="Mother's Name"
                  placeholderTextColor={colors.muted}
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
  },
  container: {
    flex: 1,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  saveHeaderButton: {
    minWidth: 68,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1.3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveHeaderText: {
    color: ACCENT,
    fontWeight: '700',
    fontSize: 13.5,
  },

  scrollContainer: {
    paddingBottom: 48,
  },

  // ── Photo ──
  imageSection: {
    alignItems: 'center',
    paddingVertical: 26,
  },
  imageWrapper: {
    position: 'relative',
  },
  profileImage: {
    width: 116,
    height: 116,
    borderRadius: 58,
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 58,
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
    backgroundColor: ACCENT,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3.5,
  },
  photoHint: {
    fontSize: 12,
    marginTop: 10,
    fontWeight: '500',
  },
  cropImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.3,
    borderColor: ACCENT,
    backgroundColor: 'rgba(255, 77, 141, 0.08)',
  },
  cropImageButtonText: {
    color: ACCENT,
    fontSize: 12.5,
    fontWeight: '700',
  },

  // ── Form / Cards ──
  formSection: {
    paddingHorizontal: 16,
    gap: 16,
  },
  card: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
    gap: 18,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  inputGroup: {
    gap: 9,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    marginLeft: 2,
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
    fontSize: 13.5,
    fontWeight: '600',
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  chip: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.2,
  },
  chipActive: {
    backgroundColor: 'rgba(255, 77, 141, 0.10)',
    borderColor: ACCENT,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: ACCENT,
  },

  textAreaContainer: {
    minHeight: 90,
  },

  datePickerButton: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  datePickerText: {
    fontSize: 14.5,
    fontWeight: '500',
  },

  interestContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  interestChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 100,
    borderWidth: 1.2,
  },
  interestChipActive: {
    backgroundColor: 'rgba(255, 77, 141, 0.10)',
    borderColor: ACCENT,
  },
  interestText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  interestTextActive: {
    color: ACCENT,
  },
  customInterestInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1.2,
    paddingHorizontal: 14,
    height: 48,
  },
  customInterestInput: {
    flex: 1,
    fontSize: 14,
  },
  customInterestAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: ACCENT,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 32,
  },
  customInterestAddText: {
    color: '#fff',
    fontSize: 12.5,
    fontWeight: '700',
  },

  errorText: {
    color: '#ff5c5c',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  buttonContainer: {
    marginTop: 6,
  },
  fieldError: {
    color: '#ff5c5c',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    paddingLeft: 2,
  },

  // ── Biodata card ──
  biodataCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  biodataPanelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  biodataIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  biodataInfoTexts: {
    flex: 1,
  },
  biodataPanelTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  biodataPanelStatus: {
    fontSize: 11.5,
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
  biodataOutlineBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.3,
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
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 141, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 34,
    gap: 6,
  },
  biodataMiniBtnPink: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  biodataMiniBtnText: {
    color: ACCENT,
    fontSize: 12,
    fontWeight: '700',
  },

  // ── Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
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
  },
  modalTitle: {
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
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalTextInput: {
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 16,
    fontSize: 14,
    borderWidth: 1,
  },
  modalSubmitBtn: {
    backgroundColor: ACCENT,
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
