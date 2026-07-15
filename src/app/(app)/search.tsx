import React, { useMemo, useState, useEffect } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

import BottomNavigation from '@/components/navigation/BottomNavigation';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/AuthContext';
import { profileApi, BASE_URL } from '@/utils/api';

type Profile = {
  id: number;
  name: string;
  age: number;
  role: string;
  gender: 'male' | 'female';
  bio: string;
  about: string;
  education: string;
  city: string;
  image: string;
  isConnection: boolean;
};

type ViewMode = 'connections' | 'others';

const MIN_AGE_LIMIT = 18;
const MAX_AGE_LIMIT = 45;

export default function SearchScreen() {
  const { profileCompleted, user } = useAuth();
  const [searchText, setSearchText] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [ageOpen, setAgeOpen] = useState(false);
  const [educationOpen, setEducationOpen] = useState(false);
  const [placeOpen, setPlaceOpen] = useState(false);
  const [selectedEducation, setSelectedEducation] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [cityInput, setCityInput] = useState('');
  const [minAge, setMinAge] = useState(18);
  const [maxAge, setMaxAge] = useState(45);

  const [dbProfiles, setDbProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  // Fade-in animation for elegant search results transition
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [dbProfiles]);

  const getAge = (dobString: string): number => {
    if (!dobString) return 25;
    const birthDate = new Date(dobString);
    const ageDiff = Date.now() - birthDate.getTime();
    return Math.floor(ageDiff / (365.25 * 24 * 60 * 60 * 1000));
  };

  const getPhotoUrl = (path?: string | null): string => {
    if (!path) return 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1200&auto=format&fit=crop';
    if (path.startsWith('http')) return path;
    const baseUrl = BASE_URL.replace('/api', '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  };

  const fetchSearchProfiles = async () => {
    try {
      setLoading(true);
      const filterBody: any = {
        page: 1,
        limit: 50,
      };

      if (searchText.trim()) {
        filterBody.search = searchText.trim();
      }

      if (selectedEducation !== 'All') {
        filterBody.education = selectedEducation;
      }

      const activeLocation = cityInput.trim() || (selectedLocation !== 'All' ? selectedLocation : '');
      if (activeLocation) {
        filterBody.city = activeLocation;
      }

      console.log('[Search] Querying searchProfiles with body:', JSON.stringify(filterBody));
      const response = await profileApi.searchProfiles(filterBody);

      if (response.data) {
        const mapped = response.data.map((userObj: any) => {
          const age = getAge(userObj.dateOfBirth);
          const imageUrl = getPhotoUrl(userObj.profilePhoto);
          return {
            id: userObj.userId,
            name: userObj.fullName || 'Member',
            age: age,
            role: userObj.profession || 'Not set',
            gender: (userObj.gender || 'male').toLowerCase() as 'male' | 'female',
            bio: userObj.bio || '',
            about: userObj.bio || '',
            education: userObj.education || '--',
            city: userObj.city || 'Not set',
            image: imageUrl,
            isConnection: false,
          };
        });

        // Apply age and gender filters locally
        const ageFiltered = mapped.filter((p) => {
          const ageMatch = p.age >= minAge && p.age <= maxAge;
          
          let genderMatch = true;
          if (user && user.profile) {
            const lookingFor = (user.profile.lookingFor || '').toLowerCase();
            const pGender = (p.gender || '').toLowerCase();
            if (lookingFor === 'bride' || lookingFor === 'female') {
              genderMatch = pGender === 'female';
            } else if (lookingFor === 'groom' || lookingFor === 'male') {
              genderMatch = pGender === 'male';
            }
          }
          return ageMatch && genderMatch;
        });
        setDbProfiles(ageFiltered);
      }
    } catch (err) {
      console.log('[Search] Failed to load search profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profileCompleted) {
      fetchSearchProfiles();
    }
  }, [profileCompleted, searchText, selectedEducation, selectedLocation, cityInput, minAge, maxAge]);

  const educationOptions = ['All', 'B.Tech', 'M.Tech', 'MBA', 'MBBS', 'PhD', 'B.Com', 'M.Com', 'MCA', 'B.E.'];
  const locationOptions = ['All', 'Pune', 'Mumbai', 'Nashik', 'Bengaluru', 'Nagpur', 'Kolhapur', 'Thane'];

  const filteredProfiles = useMemo(() => {
    return dbProfiles;
  }, [dbProfiles]);

  const decMinAge = () => setMinAge((prev) => Math.max(MIN_AGE_LIMIT, Math.min(prev - 1, maxAge - 1)));
  const incMinAge = () => setMinAge((prev) => Math.min(prev + 1, maxAge - 1));
  const decMaxAge = () => setMaxAge((prev) => Math.max(prev - 1, minAge + 1));
  const incMaxAge = () => setMaxAge((prev) => Math.min(MAX_AGE_LIMIT, Math.max(prev + 1, minAge + 1)));

  if (!profileCompleted) {
    return (
      <View style={styles.mainContainer}>
        <SafeAreaView style={styles.container}>
          <View style={styles.lockedPageWrap}>
            <View style={styles.lockedIconWrap}>
              <Feather name="lock" size={28} color="#D0D0D5" />
            </View>
            <ThemedText style={styles.lockedTitle}>Search is locked</ThemedText>
            <ThemedText style={styles.lockedBody}>To enable this, complete your profile.</ThemedText>
            <TouchableOpacity style={styles.unlockButton} onPress={() => router.push('/edit-profile')}>
              <ThemedText style={styles.unlockButtonText}>Complete Profile</ThemedText>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        <BottomNavigation />
      </View>
    );
  }

  const hasAppliedFilters =
    searchText.trim().length > 0 ||
    selectedEducation !== 'All' ||
    selectedLocation !== 'All' ||
    cityInput.trim().length > 0 ||
    minAge !== 18 ||
    maxAge !== 45;

  const clearAllFilters = () => {
    setSearchText('');
    setSelectedEducation('All');
    setSelectedLocation('All');
    setCityInput('');
    setMinAge(18);
    setMaxAge(45);
  };

  return (
    <View style={styles.mainContainer}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>Search Profiles</ThemedText>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton} onPress={() => setFiltersOpen((prev) => !prev)}>
              <Feather name="sliders" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchWrap}>
          <Feather name="search" size={16} color="#9B9BA1" />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search by name, role, city..."
            placeholderTextColor="#777"
            style={styles.searchInput}
          />
        </View>

        <View style={styles.resultRow}>
          <View style={styles.resultPill}>
            <ThemedText style={styles.resultPillText}>{filteredProfiles.length} found</ThemedText>
          </View>
        </View>

        {hasAppliedFilters && (
          <View style={styles.appliedFiltersRow}>
            <View style={styles.appliedFiltersTag}>
              <ThemedText style={styles.appliedFiltersText}>Applied Filters</ThemedText>
            </View>
            <TouchableOpacity style={styles.clearFiltersButton} onPress={clearAllFilters}>
              <Feather name="x" size={16} color="#fff" />
              <ThemedText style={styles.clearFiltersText}>Clear All</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView style={styles.filtersAndList} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
          {filtersOpen && (
            <View style={styles.filtersCard}>
              <TouchableOpacity style={styles.filterHeaderRow} onPress={() => setAgeOpen((prev) => !prev)}>
                <ThemedText style={styles.filterHeaderText}>Age</ThemedText>
                <Feather name={ageOpen ? 'chevron-down' : 'chevron-right'} size={18} color="#fff" />
              </TouchableOpacity>
              {ageOpen && (
                <View style={styles.filterSectionBody}>
                  <View style={styles.ageCard}>
                    <View style={styles.ageControlColumn}>
                      <ThemedText style={styles.ageLabel}>Min</ThemedText>
                      <View style={styles.ageControlRow}>
                        <TouchableOpacity style={styles.ageControlButton} onPress={decMinAge}>
                          <Feather name="minus" size={16} color="#fff" />
                        </TouchableOpacity>
                        <ThemedText style={styles.ageValue}>{minAge}</ThemedText>
                        <TouchableOpacity style={styles.ageControlButton} onPress={incMinAge}>
                          <Feather name="plus" size={16} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.ageControlColumn}>
                      <ThemedText style={styles.ageLabel}>Max</ThemedText>
                      <View style={styles.ageControlRow}>
                        <TouchableOpacity style={styles.ageControlButton} onPress={decMaxAge}>
                          <Feather name="minus" size={16} color="#fff" />
                        </TouchableOpacity>
                        <ThemedText style={styles.ageValue}>{maxAge}</ThemedText>
                        <TouchableOpacity style={styles.ageControlButton} onPress={incMaxAge}>
                          <Feather name="plus" size={16} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              <TouchableOpacity style={styles.filterHeaderRow} onPress={() => setEducationOpen((prev) => !prev)}>
                <ThemedText style={styles.filterHeaderText}>Education</ThemedText>
                <Feather name={educationOpen ? 'chevron-down' : 'chevron-right'} size={18} color="#fff" />
              </TouchableOpacity>
              {educationOpen && (
                <View style={styles.filterSectionBody}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                    {educationOptions.map((education) => (
                      <TouchableOpacity
                        key={education}
                        style={[styles.filterChip, selectedEducation === education && styles.filterChipActive]}
                        onPress={() => setSelectedEducation(education)}>
                        <ThemedText style={[styles.filterChipText, selectedEducation === education && styles.filterChipTextActive]}>
                          {education}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <TouchableOpacity style={styles.filterHeaderRow} onPress={() => setPlaceOpen((prev) => !prev)}>
                <ThemedText style={styles.filterHeaderText}>Place</ThemedText>
                <Feather name={placeOpen ? 'chevron-down' : 'chevron-right'} size={18} color="#fff" />
              </TouchableOpacity>
              {placeOpen && (
                <View style={styles.filterSectionBody}>
                  <View style={styles.cityInputWrap}>
                    <Feather name="map-pin" size={15} color="#9B9BA1" />
                    <TextInput
                      value={cityInput}
                      onChangeText={setCityInput}
                      placeholder="Enter city"
                      placeholderTextColor="#777"
                      style={styles.cityInput}
                    />
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                    {locationOptions.map((location) => (
                      <TouchableOpacity
                        key={location}
                        style={[styles.filterChip, selectedLocation === location && styles.filterChipActive]}
                        onPress={() => {
                          setSelectedLocation(location);
                          if (location !== 'All') {
                            setCityInput('');
                          }
                        }}>
                        <ThemedText style={[styles.filterChipText, selectedLocation === location && styles.filterChipTextActive]}>
                          {location}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          )}

          <Animated.View style={[styles.listSection, { opacity: fadeAnim }]}>
            {filteredProfiles.length === 0 ? (
              <View style={styles.emptyCard}>
                <ThemedText style={styles.emptyTitle}>No profiles match your filters</ThemedText>
                <ThemedText style={styles.emptyBody}>Try changing education, age range, or location.</ThemedText>
              </View>
            ) : (
              filteredProfiles.map((profile) => (
                <TouchableOpacity
                  key={profile.id}
                  activeOpacity={0.9}
                  style={styles.profileCard}
                  onPress={() =>
                    router.push({
                      pathname: '/profile',
                      params: {
                        view: 'other',
                        profileId: String(profile.id),
                        name: profile.name,
                        age: String(profile.age),
                        role: profile.role,
                        gender: profile.gender,
                        bio: profile.bio,
                        about: profile.about,
                        education: profile.education,
                        city: profile.city,
                        image: profile.image,
                        isConnection: String(profile.isConnection),
                      },
                    })
                  }>
                  <Image source={{ uri: profile.image }} style={styles.avatar} />

                  <View style={styles.profileMeta}>
                    <View style={styles.nameRow}>
                      <ThemedText style={styles.nameText}>{profile.name}</ThemedText>
                      {profile.isConnection && <Feather name="check-circle" size={16} color="#3BFF87" />}
                    </View>

                    <ThemedText style={styles.roleText}>{profile.role}</ThemedText>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      <BottomNavigation />
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
  headerTitle: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '800',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#17171C',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchWrap: {
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: '#17171C',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
  },
  resultRow: {
    marginHorizontal: 20,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  appliedFiltersRow: {
    marginHorizontal: 20,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appliedFiltersTag: {
    backgroundColor: 'rgba(255,77,141,0.15)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,77,141,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  appliedFiltersText: {
    color: '#FF4D8D',
    fontSize: 12,
    fontWeight: '700',
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#17171C',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  clearFiltersText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  resultPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,77,141,0.4)',
    backgroundColor: 'rgba(255,77,141,0.15)',
  },
  resultPillText: {
    color: '#FF4D8D',
    fontSize: 12,
    fontWeight: '700',
  },
  modeRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 12,
    gap: 10,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#17171C',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#FF4D8D',
    borderColor: '#FF4D8D',
  },
  modeButtonText: {
    color: '#9B9BA1',
    fontWeight: '600',
  },
  modeButtonTextActive: {
    color: '#fff',
  },
  filtersAndList: {
    flex: 1,
  },
  lockedPageWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  lockedIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#2A2A2F',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  lockedTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  lockedBody: {
    color: '#B0B0B5',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 8,
  },
  unlockButton: {
    marginTop: 18,
    backgroundColor: '#FF4D8D',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  unlockButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  filterSection: {
    marginTop: 14,
    paddingHorizontal: 20,
  },
  filtersCard: {
    marginTop: 14,
    marginHorizontal: 20,
    backgroundColor: '#17171C',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  filterHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  filterHeaderText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  filterSectionBody: {
    paddingHorizontal: 12,
    paddingBottom: 14,
    paddingTop: 4,
  },
  filterTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  filterRow: {
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#17171C',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  filterChipActive: {
    backgroundColor: '#FF4D8D',
    borderColor: '#FF4D8D',
  },
  filterChipText: {
    color: '#9B9BA1',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  ageCard: {
    backgroundColor: '#17171C',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 14,
    flexDirection: 'row',
    gap: 12,
  },
  ageControlColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 10,
  },
  ageLabel: {
    color: '#9B9BA1',
    fontSize: 12,
  },
  ageControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ageControlButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#0F0F12',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ageValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    minWidth: 28,
    textAlign: 'center',
  },
  cityInputWrap: {
    backgroundColor: '#0F0F12',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  cityInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
  },
  listSection: {
    marginTop: 18,
    paddingHorizontal: 20,
    gap: 12,
  },
  emptyCard: {
    backgroundColor: '#17171C',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyBody: {
    color: '#9B9BA1',
    marginTop: 8,
    lineHeight: 20,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#17171C',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  profileMeta: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nameText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  roleText: {
    color: '#9B9BA1',
    fontSize: 13,
  },
});