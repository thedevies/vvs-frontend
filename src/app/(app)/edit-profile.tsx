import React, { useState, useEffect, useCallback } from 'react';
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
import { profileApi, personalInformationApi, BASE_URL } from '@/utils/api';
import { useAppTheme } from '@/context/ThemeContext';
import { pickImageWithPermissionCheck } from '@/utils/imagePicker';

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
    profile?.interest || []
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

  const [gender, setGender] = useState<Gender>(() => {
    const g = profile?.gender?.toLowerCase();
    return (g === 'male' || g === 'female' ? g : 'male') as Gender;
  });
  const [maritalStatus, setMaritalStatus] = useState<MaritalStatus>(
    (profile?.maritalStatus as MaritalStatus) || 'never_married'
  );
  const [dateOfBirth, setDateOfBirth] = useState(
    profile?.dateOfBirth ? profile.dateOfBirth.split('T')[0] : ''
  );
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(
    profile?.profilePhoto || null
  );
  const [loading, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState('');
  const [ageError, setAgeError] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Biodata states
  const [uploadingBiodata, setUploadingBiodata] = useState(false);
  const [generatingBiodata, setGeneratingBiodata] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [religion, setReligion] = useState('Hindu');
  const [caste, setCaste] = useState('Vasudev');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');

  // Personal Information states
  const initialPi = user?.personalInformation as any;
  const [piExists, setPiExists] = useState(!!initialPi);
  const [piEmail, setPiEmail] = useState(initialPi?.email || '');
  const [piAddress, setPiAddress] = useState(initialPi?.address || '');
  const [piCity, setPiCity] = useState(initialPi?.city || '');
  const [piState, setPiState] = useState(initialPi?.state || '');
  const [piFatherName, setPiFatherName] = useState(initialPi?.fatherName || '');
  const [piFatherMobile, setPiFatherMobile] = useState(initialPi?.fatherMobileNumber || '');
  const [piFatherOccupation, setPiFatherOccupation] = useState(initialPi?.fatherOccupation || '');
  const [piMotherName, setPiMotherName] = useState(initialPi?.motherName || '');
  const [piMotherOccupation, setPiMotherOccupation] = useState(initialPi?.motherOccupation || '');
  const [piNumBrothers, setPiNumBrothers] = useState(initialPi?.numberOfBrothers != null ? String(initialPi.numberOfBrothers) : '');
  const [piMarriedBrothers, setPiMarriedBrothers] = useState(initialPi?.marriedBrothers != null ? String(initialPi.marriedBrothers) : '');
  const [piNumSisters, setPiNumSisters] = useState(initialPi?.numberOfSisters != null ? String(initialPi.numberOfSisters) : '');
  const [piMarriedSisters, setPiMarriedSisters] = useState(initialPi?.marriedSisters != null ? String(initialPi.marriedSisters) : '');

  const populatePersonalInfo = useCallback((pi: any) => {
    if (!pi) return;
    if (pi.fatherName || pi.motherName || pi.address || pi.email || pi.city) {
      setPiExists(true);
      if (pi.email != null) setPiEmail(pi.email);
      if (pi.address != null) setPiAddress(pi.address);
      if (pi.city != null) setPiCity(pi.city);
      if (pi.state != null) setPiState(pi.state);
      if (pi.fatherName != null) setPiFatherName(pi.fatherName);
      if (pi.fatherMobileNumber != null) setPiFatherMobile(pi.fatherMobileNumber);
      if (pi.fatherOccupation != null) setPiFatherOccupation(pi.fatherOccupation);
      if (pi.motherName != null) setPiMotherName(pi.motherName);
      if (pi.motherOccupation != null) setPiMotherOccupation(pi.motherOccupation);
      if (pi.numberOfBrothers != null) setPiNumBrothers(String(pi.numberOfBrothers));
      if (pi.marriedBrothers != null) setPiMarriedBrothers(String(pi.marriedBrothers));
      if (pi.numberOfSisters != null) setPiNumSisters(String(pi.numberOfSisters));
      if (pi.marriedSisters != null) setPiMarriedSisters(String(pi.marriedSisters));
    }
  }, []);

  // 1. Instantly populate from AuthContext on mount or when user updates
  useEffect(() => {
    if (user?.personalInformation) {
      populatePersonalInfo(user.personalInformation);
    }
  }, [user?.personalInformation, populatePersonalInfo]);

  // 2. Fetch in background to sync any server updates
  useEffect(() => {
    const loadPersonalInfo = async () => {
      try {
        const res = await personalInformationApi.getDetails();
        const pi = res?.data || (res as any);
        if (pi) {
          populatePersonalInfo(pi);
        }
      } catch (e) {
        console.log('[EditProfile] Failed to fetch personal info:', e);
      }
    };
    loadPersonalInfo();
  }, [populatePersonalInfo]);

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
    setShowUpdateModal(true);
  };

  const handleGenerateSubmit = async () => {
    try {
      setGeneratingBiodata(true);
      setShowGenerateModal(false);

      const response = await profileApi.generateBiodata({
        fullName: name.trim() || profile?.fullName || user?.profile?.fullName || 'User Name',
        gender: gender || (profile?.gender as any) || 'male',
        maritalStatus: maritalStatus || (profile?.maritalStatus as any) || 'never_married',
        dateOfBirth: dateOfBirth || (profile?.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '1998-05-20'),
        city: city.trim() || profile?.city || undefined,
        state: stateVal.trim() || profile?.state || undefined,
        country: country.trim() || profile?.country || undefined,
        profession: profession.trim() || profile?.profession || undefined,
        education: education.trim() || profile?.education || undefined,
        bio: bio.trim() || profile?.bio || undefined,
        profilePhoto: uploadedPhotoUrl || photoUri || profile?.profilePhoto || undefined,
        fatherName: piFatherName.trim() || undefined,
        fatherMobileNumber: piFatherMobile.trim() || undefined,
        fatherOccupation: piFatherOccupation.trim() || undefined,
        motherName: piMotherName.trim() || undefined,
        motherOccupation: piMotherOccupation.trim() || undefined,
        numberOfBrothers: piNumBrothers ? parseInt(piNumBrothers, 10) : undefined,
        marriedBrothers: piMarriedBrothers ? parseInt(piMarriedBrothers, 10) : undefined,
        numberOfSisters: piNumSisters ? parseInt(piNumSisters, 10) : undefined,
        marriedSisters: piMarriedSisters ? parseInt(piMarriedSisters, 10) : undefined,
        address: piAddress.trim() || undefined,
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

  const pickAndUploadImage = async () => {
    const result = await pickImageWithPermissionCheck({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result && !result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setPhotoUri(uri);
      // Auto-upload immediately
      try {
        setUploadingPhoto(true);
        const uploadRes = await profileApi.uploadProfilePhoto(uri);
        if (uploadRes.data?.photoUrl) {
          setUploadedPhotoUrl(uploadRes.data.photoUrl);
          console.log('[EditProfile] Photo auto-uploaded:', uploadRes.data.photoUrl);
        } else {
          Alert.alert('Upload Failed', uploadRes.message || 'Could not upload photo.');
          setPhotoUri(null);
        }
      } catch (err: any) {
        Alert.alert('Upload Error', err.message || 'Failed to upload photo. Please try again.');
        setPhotoUri(null);
      } finally {
        setUploadingPhoto(false);
      }
    }
  };

  const displayImage = photoUri || existingPhotoUrl || (uploadedPhotoUrl ? (uploadedPhotoUrl.startsWith('http') ? uploadedPhotoUrl : getPhotoUrl(uploadedPhotoUrl)) : null);

  const handleOpenGenerateModal = () => {
    const hasPhoto = uploadedPhotoUrl || profile?.profilePhoto;
    if (!hasPhoto) {
      Alert.alert(
        'Profile Photo Required',
        'Please upload your profile photo before generating biodata. Your photo will appear in the PDF.',
        [{ text: 'OK' }],
        'error'
      );
      return;
    }
    setShowGenerateModal(true);
  };

  const handleSave = async () => {
    setError('');
    setAgeError('');

    if (!name.trim()) {
      const msg = 'Please enter your full name.';
      setError(msg);
      Alert.alert('Validation Error', msg, undefined, 'error');
      return;
    }
    if (!heightFeet.trim() || !heightInches.trim()) {
      const msg = 'Please enter your height in feet and inches (e.g. 5 ft 10 in).';
      setError(msg);
      Alert.alert('Validation Error', msg, undefined, 'error');
      return;
    }
    if (!dateOfBirth.trim()) {
      const msg = 'Please select your date of birth.';
      setError(msg);
      Alert.alert('Validation Error', msg, undefined, 'error');
      return;
    }
    if (!maritalStatus || !maritalStatus.trim()) {
      const msg = 'Please select your marital status.';
      setError(msg);
      Alert.alert('Validation Error', msg, undefined, 'error');
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
      Alert.alert('Validation Error', msg, undefined, 'error');
      return;
    }
    if (gender === 'male' && age < 21) {
      const msg = 'Age must be at least 21 years old.';
      setError(msg);
      setAgeError(msg);
      Alert.alert('Validation Error', msg, undefined, 'error');
      return;
    }

    if (!bio.trim()) {
      const msg = 'Please write a short bio about yourself.';
      setError(msg);
      Alert.alert('Validation Error', msg, undefined, 'error');
      return;
    }

    if (bio.length > 250) {
      const msg = 'Bio cannot exceed 250 characters.';
      setError(msg);
      Alert.alert('Validation Error', msg, undefined, 'error');
      return;
    }

    if (!profileCompleted && !photoUri) {
      const msg = 'Please select a profile photo.';
      setError(msg);
      Alert.alert('Validation Error', msg, undefined, 'error');
      return;
    }

    const formattedHeight = `${heightFeet.trim()}'${heightInches.trim()}"`;

    if (!user?.biodata) {
      const msg = 'Matrimonial biodata is mandatory! Please upload or generate your biodata below before saving.';
      setError(msg);
      Alert.alert('Validation Error', msg, undefined, 'error');
      return;
    }

    setSaving(true);
    let stage = 'photo_upload';

    try {
      // Use already-uploaded URL (auto-uploaded on pick), or existing profile photo
      let finalPhotoUrl = uploadedPhotoUrl || profile?.profilePhoto || '';

      if (!profileCompleted) {
        stage = 'profile_creation';
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
          profilePhoto: finalPhotoUrl,
          interest: interests,
        });

        await refreshUser();

        Alert.alert('Success', 'Profile created successfully!', [
          { text: 'OK', onPress: () => router.replace('/explore') },
        ]);
      } else {
        stage = 'profile_update';
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
          profilePhoto: finalPhotoUrl || undefined,
          interest: interests,
        });

        await refreshUser();

        Alert.alert('Success', 'Profile updated successfully!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }

      // ── Save Personal Information (non-blocking, optional fields) ──
      const hasAnyPiField = !!(
        piFatherName.trim() ||
        piMotherName.trim() ||
        piFatherMobile.trim() ||
        piFatherOccupation.trim() ||
        piMotherOccupation.trim() ||
        piEmail.trim() ||
        piAddress.trim() ||
        piCity.trim() ||
        piState.trim() ||
        piNumBrothers.trim() ||
        piMarriedBrothers.trim() ||
        piNumSisters.trim() ||
        piMarriedSisters.trim()
      );
      if (hasAnyPiField) {
        try {
          const piPayload = {
            email: piEmail.trim() || undefined,
            address: piAddress.trim() || undefined,
            city: piCity.trim() || undefined,
            state: piState.trim() || undefined,
            fatherName: piFatherName.trim() || undefined,
            fatherMobileNumber: piFatherMobile.trim() || undefined,
            fatherOccupation: piFatherOccupation.trim() || undefined,
            motherName: piMotherName.trim() || undefined,
            motherOccupation: piMotherOccupation.trim() || undefined,
            numberOfBrothers: piNumBrothers ? parseInt(piNumBrothers, 10) : undefined,
            marriedBrothers: piMarriedBrothers ? parseInt(piMarriedBrothers, 10) : undefined,
            numberOfSisters: piNumSisters ? parseInt(piNumSisters, 10) : undefined,
            marriedSisters: piMarriedSisters ? parseInt(piMarriedSisters, 10) : undefined,
          };
          let piRes: any;
          if (piExists) {
            piRes = await personalInformationApi.update(piPayload);
            if (piRes && !piRes.data) {
              piRes = await personalInformationApi.add(piPayload);
            }
          } else {
            piRes = await personalInformationApi.add(piPayload);
          }
          if (piRes?.data) {
            setPiExists(true);
          }
          await refreshUser();
        } catch (piErr: any) {
          console.warn('[EditProfile] Personal info save failed (non-critical):', piErr?.message);
        }
      }
    } catch (err: any) {
      console.error('[EditProfile] Save error:', err);
      setError(err.message || 'Failed to save profile. Please try again.');

      let errorLocation = 'General save step';
      let cleanErrorMessage = err.message || '';

      if (
        cleanErrorMessage.toLowerCase().includes('maritalstatus') ||
        cleanErrorMessage.toLowerCase().includes('marital status') ||
        cleanErrorMessage.includes('NEVER_MARRIED')
      ) {
        cleanErrorMessage = 'Please select your marital status.';
      }

      if (cleanErrorMessage.includes('[Profile Photo Section]')) {
        errorLocation = 'Profile Photo Section';
        cleanErrorMessage = cleanErrorMessage.replace('[Profile Photo Section] ', '');
      } else if (stage === 'profile_creation') {
        errorLocation = 'Profile Creation Section';
      } else if (stage === 'profile_update') {
        errorLocation = 'Profile Update Section';
      }

      Alert.alert(
        'Profile Save Error',
        // `An error occurred in the "${errorLocation}".\n\nDetails: ${cleanErrorMessage || 'Please check your inputs and try again.'}`,
        `${cleanErrorMessage || 'Please check your inputs and try again.'}`,
        [{ text: 'OK' }],
        'error'
      );
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
              <TouchableOpacity style={[styles.editImageBadge, { borderColor: colors.background }]} onPress={pickAndUploadImage} disabled={uploadingPhoto}>
                <Feather name="camera" size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            {displayImage ? (
              <TouchableOpacity style={styles.cropImageButton} onPress={pickAndUploadImage} disabled={uploadingPhoto}>
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
                  <CustomInput 
                    placeholder="Tell us about yourself..." 
                    value={bio} 
                    onChangeText={setBio}
                    multiline={true}
                    maxLength={250}
                    style={{ height: undefined, minHeight: 90, paddingTop: 10, paddingBottom: 10, textAlignVertical: 'top' }}
                  />
                </View>
                <ThemedText style={{ alignSelf: 'flex-end', fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>
                  {bio.length}/250
                </ThemedText>
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

             {/* ── Personal Information Card ── */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ThemedText style={[styles.cardTitle, { color: colors.text }]}>Family &amp; Personal Details</ThemedText>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: colors.textSecondary }]}>Email</ThemedText>
                <CustomInput placeholder="Email address" value={piEmail} onChangeText={setPiEmail} keyboardType="email-address" autoCapitalize="none" />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: colors.textSecondary }]}>Address</ThemedText>
                <CustomInput placeholder="Residential address" value={piAddress} onChangeText={setPiAddress} />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: colors.textSecondary }]}>City</ThemedText>
                <CustomInput placeholder="City" value={piCity} onChangeText={setPiCity} />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: colors.textSecondary }]}>State</ThemedText>
                <CustomInput placeholder="State" value={piState} onChangeText={setPiState} />
              </View>

              <View style={[styles.inputGroup, { marginTop: 8 }]}>
                <ThemedText style={[styles.inputLabel, { color: colors.textSecondary, fontWeight: '700' }]}>Father's Details</ThemedText>
              </View>
              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: colors.textSecondary }]}>Father's Name</ThemedText>
                <CustomInput placeholder="Father's full name" value={piFatherName} onChangeText={setPiFatherName} />
              </View>
              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: colors.textSecondary }]}>Father's Mobile</ThemedText>
                <CustomInput placeholder="Father's mobile number" value={piFatherMobile} onChangeText={setPiFatherMobile} keyboardType="phone-pad" />
              </View>
              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: colors.textSecondary }]}>Father's Occupation</ThemedText>
                <CustomInput placeholder="Father's occupation" value={piFatherOccupation} onChangeText={setPiFatherOccupation} />
              </View>

              <View style={[styles.inputGroup, { marginTop: 8 }]}>
                <ThemedText style={[styles.inputLabel, { color: colors.textSecondary, fontWeight: '700' }]}>Mother's Details</ThemedText>
              </View>
              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: colors.textSecondary }]}>Mother's Name</ThemedText>
                <CustomInput placeholder="Mother's full name" value={piMotherName} onChangeText={setPiMotherName} />
              </View>
              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: colors.textSecondary }]}>Mother's Occupation</ThemedText>
                <CustomInput placeholder="Mother's occupation" value={piMotherOccupation} onChangeText={setPiMotherOccupation} />
              </View>

              <View style={[styles.inputGroup, { marginTop: 8 }]}>
                <ThemedText style={[styles.inputLabel, { color: colors.textSecondary, fontWeight: '700' }]}>Siblings</ThemedText>
              </View>
              <View style={styles.siblingsRow}>
                <View style={styles.siblingsCol}>
                  <ThemedText style={[styles.inputLabel, { color: colors.textSecondary }]}>Brothers</ThemedText>
                  <CustomInput placeholder="Total" value={piNumBrothers} onChangeText={setPiNumBrothers} keyboardType="numeric" maxLength={2} />
                </View>
                <View style={styles.siblingsCol}>
                  <ThemedText style={[styles.inputLabel, { color: colors.textSecondary }]}>Married</ThemedText>
                  <CustomInput placeholder="Married" value={piMarriedBrothers} onChangeText={setPiMarriedBrothers} keyboardType="numeric" maxLength={2} />
                </View>
              </View>
              <View style={styles.siblingsRow}>
                <View style={styles.siblingsCol}>
                  <ThemedText style={[styles.inputLabel, { color: colors.textSecondary }]}>Sisters</ThemedText>
                  <CustomInput placeholder="Total" value={piNumSisters} onChangeText={setPiNumSisters} keyboardType="numeric" maxLength={2} />
                </View>
                <View style={styles.siblingsCol}>
                  <ThemedText style={[styles.inputLabel, { color: colors.textSecondary }]}>Married</ThemedText>
                  <CustomInput placeholder="Married" value={piMarriedSisters} onChangeText={setPiMarriedSisters} keyboardType="numeric" maxLength={2} />
                </View>
              </View>
            </View>

            {/* ── Biodata Card ── */}
            <View style={[styles.card, styles.biodataCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TouchableOpacity
                style={styles.biodataPanelLeft}
                onPress={hasBiodata ? handleViewBiodata : undefined}
                activeOpacity={hasBiodata ? 0.7 : 1}
              >
                <View style={styles.biodataInfoTexts}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <ThemedText style={[styles.biodataPanelTitle, { color: colors.text, fontSize: 16, fontWeight: '700' }]}>Biodata</ThemedText>
                    {hasBiodata && (
                      <Ionicons name="document-text-outline" size={14} color={ACCENT} style={{ marginLeft: 6 }} />
                    )}
                  </View>
                  {hasBiodata && (
                    <ThemedText style={[styles.biodataPanelStatus, { color: colors.textSecondary }]}>
                      {biodataObj?.isGenerated ? 'Generated (Tap to view)' : 'Uploaded (Tap to view)'}
                    </ThemedText>
                  )}
                </View>
              </TouchableOpacity>

              <View style={styles.biodataPanelRight}>
                {hasBiodata ? (
                  <View style={styles.biodataActionIconsRow}>
                    <TouchableOpacity
                      style={[styles.biodataOutlineBtn, { borderColor: ACCENT }]}
                      onPress={handleViewBiodata}
                    >
                      <Feather name="eye" size={14} color={ACCENT} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.biodataOutlineBtn, { borderColor: ACCENT }]}
                      onPress={handleUpdateBiodata}
                    >
                      <Feather name="edit-2" size={14} color={ACCENT} />
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
                      onPress={() => handleOpenGenerateModal()}
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
              <View>
                <ThemedText style={[styles.modalTitle, { color: colors.text }]}>Generate Biodata PDF</ThemedText>
                <ThemedText style={[styles.modalSubtitle, { color: colors.textSecondary }]}>Review your saved information</ThemedText>
              </View>
              <TouchableOpacity onPress={() => setShowGenerateModal(false)}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm} showsVerticalScrollIndicator={false}>

              {/* Profile Info Section */}
              <ThemedText style={[styles.verifySection, { color: ACCENT }]}>Profile Details</ThemedText>
              <View style={[styles.verifyCard, { backgroundColor: colors.card2 || colors.background, borderColor: colors.border }]}>
                {[
                  { label: 'Name', value: name.trim() || profile?.fullName || '—' },
                  { label: 'Gender', value: gender || profile?.gender || '—' },
                  { label: 'Date of Birth', value: dateOfBirth || (profile?.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '—') },
                  { label: 'City', value: city.trim() || profile?.city || '—' },
                  { label: 'Profession', value: profession.trim() || profile?.profession || '—' },
                  { label: 'Education', value: education.trim() || profile?.education || '—' },
                ].map((item, i, arr) => (
                  <View key={item.label} style={[styles.verifyRow, i < arr.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                    <ThemedText style={[styles.verifyLabel, { color: colors.textSecondary }]}>{item.label}</ThemedText>
                    <ThemedText style={[styles.verifyValue, { color: colors.text }]}>{item.value}</ThemedText>
                  </View>
                ))}
              </View>

              {/* Family Info Section */}
              <ThemedText style={[styles.verifySection, { color: ACCENT }]}>Family Details</ThemedText>
              <View style={[styles.verifyCard, { backgroundColor: colors.card2 || colors.background, borderColor: colors.border }]}>
                {[
                  { label: "Father's Name", value: piFatherName || '—' },
                  { label: "Father's Occupation", value: piFatherOccupation || '—' },
                  { label: "Mother's Name", value: piMotherName || '—' },
                  { label: "Mother's Occupation", value: piMotherOccupation || '—' },
                  { label: 'Brothers', value: piNumBrothers ? `${piNumBrothers} (${piMarriedBrothers || 0} married)` : '—' },
                  { label: 'Sisters', value: piNumSisters ? `${piNumSisters} (${piMarriedSisters || 0} married)` : '—' },
                ].map((item, i, arr) => (
                  <View key={item.label} style={[styles.verifyRow, i < arr.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                    <ThemedText style={[styles.verifyLabel, { color: colors.textSecondary }]}>{item.label}</ThemedText>
                    <ThemedText style={[styles.verifyValue, { color: colors.text }]}>{item.value}</ThemedText>
                  </View>
                ))}
              </View>

              {(!piFatherName || !piMotherName) && (
                <View style={[styles.verifyWarning, { backgroundColor: 'rgba(255,77,141,0.08)', borderColor: 'rgba(255,77,141,0.25)' }]}>
                  <Ionicons name="information-circle-outline" size={15} color={ACCENT} />
                  <ThemedText style={[styles.verifyWarningText, { color: ACCENT }]}>
                    Some family details are missing. Add them in the Family &amp; Personal Details section below.
                  </ThemedText>
                </View>
              )}

              <TouchableOpacity
                style={[styles.modalSubmitBtn, generatingBiodata && { opacity: 0.7 }]}
                onPress={handleGenerateSubmit}
                disabled={generatingBiodata}
              >
                {generatingBiodata ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={16} color="#fff" />
                    <ThemedText style={styles.modalSubmitBtnText}>Generate Biodata PDF</ThemedText>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Update Biodata Modal */}
      <Modal visible={showUpdateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, paddingBottom: 24 }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <ThemedText style={[styles.modalTitle, { color: colors.text }]}>Update Biodata</ThemedText>
              <TouchableOpacity onPress={() => setShowUpdateModal(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={{ paddingTop: 16, gap: 12 }}>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderRadius: 14,
                  backgroundColor: colors.card2 || colors.background,
                  borderWidth: 1,
                  borderColor: colors.border,
                  gap: 12,
                }}
                onPress={() => {
                  setShowUpdateModal(false);
                  handleUploadBiodata();
                }}
                activeOpacity={0.8}
              >
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(30, 106, 210, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="cloud-upload-outline" size={18} color="#1E6AD2" />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={{ fontSize: 14, fontWeight: '700', color: colors.text }} numberOfLines={1}>
                    Update new PDF
                  </ThemedText>
                  <ThemedText style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                    Upload a PDF document from device
                  </ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderRadius: 14,
                  backgroundColor: colors.card2 || colors.background,
                  borderWidth: 1,
                  borderColor: colors.border,
                  gap: 12,
                }}
                onPress={() => {
                  setShowUpdateModal(false);
                  handleOpenGenerateModal();
                }}
                activeOpacity={0.8}
              >
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255, 77, 141, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="sparkles-outline" size={18} color={ACCENT} />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={{ fontSize: 14, fontWeight: '700', color: colors.text }} numberOfLines={1}>
                    Generate new PDF
                  </ThemedText>
                  <ThemedText style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                    Compile fresh PDF from saved info
                  </ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
              </TouchableOpacity>
            </View>
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
    fontSize: 14,
    fontWeight: '700',
  },

  // ── Siblings Row ──
  siblingsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  siblingsCol: {
    flex: 1,
  },

  // ── Verification Modal ──
  modalSubtitle: {
    fontSize: 11,
    marginTop: 2,
    opacity: 0.7,
  },
  verifySection: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 14,
  },
  verifyCard: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  verifyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  verifyLabel: {
    fontSize: 12,
    flex: 1,
  },
  verifyValue: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1.5,
    textAlign: 'right',
  },
  verifyWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
  },
  verifyWarningText: {
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
});
