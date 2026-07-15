import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { CustomAlert as Alert } from '@/utils/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

import BottomNavigation from '@/components/navigation/BottomNavigation';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/AuthContext';
import { profileApi, BASE_URL } from '@/utils/api';
import type { UserProfile } from '@/utils/types';
import { useAppTheme } from '@/context/ThemeContext';

type ViewMode = 'connections' | 'others';

const MIN_AGE_LIMIT = 18;
const MAX_AGE_LIMIT = 45;

export default function ExploreScreen() {
  const { profileCompleted, user } = useAuth();
  const { colors, isDark } = useAppTheme();
  const styles = getStyles(colors);
  const isNavigating = React.useRef(false);
  const navigateSafe = (route: any) => {
    if (isNavigating.current) return;
    isNavigating.current = true;
    setTimeout(() => {
      isNavigating.current = false;
    }, 1000);
    router.push(route);
  };
  const [viewMode, setViewMode] = useState<ViewMode>('others');
  const [searchOpen, setSearchOpen] = useState(false);
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


  // Dynamic profiles fetching states
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

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

  const loadProfiles = useCallback(async (pageNum: number, isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const usePublicApi = !user || !profileCompleted;
      let response;
      if (usePublicApi) {
        console.log(`[Explore] Fetching public profiles page ${pageNum}...`);
        response = await profileApi.getPublicProfiles(pageNum, 10);
      } else {
        const filterBody: any = {
          page: pageNum,
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'desc',
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

        console.log(`[Explore] Fetching searchProfiles page ${pageNum} with body:`, JSON.stringify(filterBody));
        response = await profileApi.searchProfiles(filterBody);
      }
      
      if (response.data) {
        const newProfiles = response.data;

        // Apply age and gender filters locally
        const ageFiltered = newProfiles.filter((p: any) => {
          const age = getAge(p.dateOfBirth);
          const ageMatch = age >= minAge && age <= maxAge;
          
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

        if (isRefresh || pageNum === 1) {
          setProfiles(ageFiltered);
        } else {
          setProfiles((prev) => {
            const existingIds = new Set(prev.map(p => p.id));
            const filteredNew = ageFiltered.filter((p: any) => !existingIds.has(p.id));
            return [...prev, ...filteredNew];
          });
        }
        
        if (response.pagination) {
          setPage(response.pagination.page);
          setTotalPages(response.pagination.totalPages);
        }
      }
    } catch (err: any) {
      console.log('[Explore] Failed to load profiles:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [profileCompleted, selectedEducation, selectedLocation, cityInput, minAge, maxAge, user, searchText]);

  useEffect(() => {
    loadProfiles(1);
  }, [selectedEducation, selectedLocation, cityInput, minAge, maxAge, profileCompleted, user, searchText]);

  const onRefresh = useCallback(() => {
    loadProfiles(1, true);
  }, [loadProfiles]);

  const onLoadMore = () => {
    if (page < totalPages && !loadingMore && !loading) {
      loadProfiles(page + 1);
    }
  };

  const educationOptions = ['All', 'B.Tech', 'M.Tech', 'MBA', 'MBBS', 'PhD', 'B.Com', 'M.Com', 'MCA', 'B.E.'];
  const locationOptions = ['All', 'Pune', 'Mumbai', 'Nashik', 'Bengaluru', 'Nagpur', 'Kolhapur', 'Thane'];

  const filteredProfiles = useMemo(() => {
    return profiles;
  }, [profiles]);

  const decMinAge = () => setMinAge((prev) => Math.max(MIN_AGE_LIMIT, Math.min(prev - 1, maxAge - 1)));
  const incMinAge = () => setMinAge((prev) => Math.min(prev + 1, maxAge - 1));
  const decMaxAge = () => setMaxAge((prev) => Math.max(prev - 1, minAge + 1));
  const incMaxAge = () => setMaxAge((prev) => Math.min(MAX_AGE_LIMIT, Math.max(prev + 1, minAge + 1)));

  // ── Explore page is unlocked for guest view ──

  // ── Defined after guard, matching Search page ─────────────────────────────
  const hasAppliedFilters =
    searchText.trim().length > 0 ||
    selectedEducation !== 'All' ||
    selectedLocation !== 'All' ||
    cityInput.trim().length > 0 ||
    minAge !== 22 ||
    maxAge !== 30;

  const clearAllFilters = () => {
    setSearchText('');
    setSelectedEducation('All');
    setSelectedLocation('All');
    setCityInput('');
    setMinAge(22);
    setMaxAge(30);
  };

  return (
    <View style={styles.mainContainer}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>Discover Profiles</ThemedText>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton} onPress={() => setSearchOpen((prev) => !prev)}>
              <Feather name="search" size={20} color={searchOpen ? "#FF4D8D" : colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => setFiltersOpen((prev) => !prev)}>
              <Feather name="sliders" size={20} color={filtersOpen ? "#FF4D8D" : colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {searchOpen && (
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
        )}

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

        <ScrollView
          style={styles.filtersAndList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 140 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF4D8D" />
          }>
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
                          if (location !== 'All') setCityInput('');
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

          <View style={styles.listSection}>
            {loading && page === 1 ? (
              <ActivityIndicator color="#FF4D8D" size="large" style={{ marginTop: 40 }} />
            ) : filteredProfiles.length === 0 ? (
              <View style={styles.emptyCard}>
                <ThemedText style={styles.emptyTitle}>No profiles match your filters</ThemedText>
                <ThemedText style={styles.emptyBody}>Try changing education, age range, or location.</ThemedText>
              </View>
            ) : (
              <>
                {filteredProfiles.map((profile) => {
                  const age = getAge(profile.dateOfBirth);
                  const imageUrl = getPhotoUrl(profile.profilePhoto);
                  const locationStr = [profile.city, profile.state, profile.country].filter(Boolean).join(', ') || 'Not set';

                  return (
                    <TouchableOpacity
                      key={profile.id}
                      activeOpacity={0.9}
                      style={styles.profileCard}
                      onPress={() => {
                        if (!profileCompleted) {
                          Alert.alert(
                            'Profile Incomplete',
                            'Please complete your profile to view other member details and send interest requests.'
                          );
                          navigateSafe('/edit-profile');
                          return;
                        }
                        navigateSafe({
                          pathname: '/profile',
                          params: {
                            view: 'other',
                            profileId: String(profile.userId),
                            name: profile.fullName,
                            age: String(age),
                            role: profile.profession || 'Not set',
                            gender: (profile.gender || 'male').toLowerCase(),
                            bio: profile.bio || '',
                            about: profile.bio || '',
                            education: profile.education || '--',
                            city: profile.city || '',
                            state: profile.state || '',
                            country: profile.country || '',
                            height: profile.height || '--',
                            interest: (profile.interest || []).join(','),
                            image: imageUrl,
                            isConnection: 'false',
                          },
                        });
                      }}>
                      <Image source={{ uri: imageUrl }} style={[styles.avatar, { borderWidth: 1.5, borderColor: '#FF4D8D' }]} />
                      <View style={styles.profileMeta}>
                        <View style={styles.nameRow}>
                          <ThemedText style={styles.nameText}>{profile.fullName}</ThemedText>
                        </View>
                        <ThemedText style={styles.roleText}>{profile.profession || 'Not set'}</ThemedText>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 }}>
                          <ThemedText style={{ color: colors.muted, fontSize: 12 }}>🎂 {age} yrs</ThemedText>
                          <ThemedText style={{ color: colors.muted, fontSize: 12 }}>📍 {profile.city || 'Not set'}</ThemedText>
                        </View>
                      </View>
                      <Feather name="chevron-right" size={20} color={colors.muted} style={{ marginRight: 4 }} />
                    </TouchableOpacity>
                  );
                })}

                {page < totalPages && (
                  <TouchableOpacity
                    onPress={onLoadMore}
                    disabled={loadingMore}
                    style={styles.loadMoreButton}
                  >
                    {loadingMore ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <ThemedText style={styles.loadMoreText}>Load More Profiles</ThemedText>
                    )}
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
      <BottomNavigation />
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: { color: colors.text, fontSize: 30, fontWeight: '800' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginHorizontal: 20,
    height: 44,
    gap: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 14 },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 6,
    marginBottom: 10,
  },
  resultPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.card2,
  },
  resultPillText: { color: '#FF4D8D', fontSize: 12, fontWeight: '700' },
  appliedFiltersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  appliedFiltersTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 77, 141, 0.1)',
  },
  appliedFiltersText: { color: '#FF4D8D', fontSize: 11, fontWeight: '700' },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: colors.card2,
  },
  clearFiltersText: { color: colors.text, fontSize: 11, fontWeight: '700', opacity: 0.9 },
  filtersAndList: { flex: 1 },
  lockedView: {
    paddingHorizontal: 40,
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.card2,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  lockedTitle: { color: colors.text, fontSize: 22, fontWeight: '800' },
  lockedBody: { color: colors.muted, fontSize: 14, textAlign: 'center', lineHeight: 21, marginTop: 8 },
  unlockButton: {
    marginTop: 18,
    backgroundColor: '#FF4D8D',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  unlockButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  filtersCard: {
    marginTop: 14,
    marginHorizontal: 20,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  filterHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterHeaderText: { color: colors.text, fontSize: 15, fontWeight: '700' },
  filterSectionBody: { paddingHorizontal: 12, paddingBottom: 14, paddingTop: 4 },
  filterRow: { gap: 10 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: '#FF4D8D', borderColor: '#FF4D8D' },
  filterChipText: { color: colors.muted, fontWeight: '600' },
  filterChipTextActive: { color: '#fff' },
  ageCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
  },
  ageControlColumn: { flex: 1, alignItems: 'center', gap: 10 },
  ageLabel: { color: colors.muted, fontSize: 12 },
  ageControlRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ageControlButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ageValue: { color: colors.text, fontSize: 18, fontWeight: '700', minWidth: 28, textAlign: 'center' },
  cityInputWrap: {
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  cityInput: { flex: 1, color: colors.text, fontSize: 14 },
  listSection: { marginTop: 18, paddingHorizontal: 20, gap: 12 },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  emptyBody: { color: colors.muted, marginTop: 8, lineHeight: 20 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  roleText: {
    color: colors.muted,
    fontSize: 13,
  },
  loadMoreButton: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  loadMoreText: {
    color: '#FF4D8D',
    fontSize: 14,
    fontWeight: '700',
  },
});