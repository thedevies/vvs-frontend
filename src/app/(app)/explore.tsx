import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import { CustomAlert as Alert } from "@/utils/alert";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";

import BottomNavigation from "@/components/navigation/BottomNavigation";
import { ThemedText } from "@/components/themed-text";
import { useAuth } from "@/context/AuthContext";
import { profileApi, interestApi, BASE_URL } from "@/utils/api";
import type { UserProfile } from "@/utils/types";
import { useAppTheme } from "@/context/ThemeContext";

type ViewMode = "connections" | "others";

const MIN_AGE_LIMIT = 18;
const MAX_AGE_LIMIT = 45;

// Single source of truth for the accent color + a couple of derived tones.
// Keeping this in one place avoids the accent drifting between hex values
// as the file grows.
const ACCENT = "#FF4D8D";
const ACCENT_SOFT = "rgba(255, 77, 141, 0.10)";
const ACCENT_SOFT_BORDER = "rgba(255, 77, 141, 0.28)";

const FALLBACK_PHOTO =
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1200&auto=format&fit=crop";

export default function ExploreScreen() {
  const { profileCompleted, user } = useAuth();
  const { colors } = useAppTheme();
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

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [ageOpen, setAgeOpen] = useState(false);
  const [educationOpen, setEducationOpen] = useState(false);
  const [placeOpen, setPlaceOpen] = useState(false);
  const [selectedEducation, setSelectedEducation] = useState("All");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [cityInput, setCityInput] = useState("");
  const [minAge, setMinAge] = useState(MIN_AGE_LIMIT);
  const [maxAge, setMaxAge] = useState(MAX_AGE_LIMIT);

  // Dynamic profiles fetching state
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
    if (!path) return FALLBACK_PHOTO;
    if (path.startsWith("http")) return path;
    const baseUrl = BASE_URL.replace("/api", "");
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  };

  const loadProfiles = useCallback(
    async (pageNum: number, isRefresh = false) => {
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
          response = await profileApi.getPublicProfiles(pageNum, 10);
        } else {
          const filterBody: any = {
            page: pageNum,
            limit: 10,
            sortBy: "createdAt",
            sortOrder: "desc",
          };

          if (searchText.trim()) filterBody.search = searchText.trim();
          if (selectedEducation !== "All")
            filterBody.education = selectedEducation;

          const activeLocation =
            cityInput.trim() ||
            (selectedLocation !== "All" ? selectedLocation : "");
          if (activeLocation) filterBody.city = activeLocation;

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
              const lookingFor = (user.profile.lookingFor || "").toLowerCase();
              const pGender = (p.gender || "").toLowerCase();
              if (lookingFor === "bride" || lookingFor === "female") {
                genderMatch = pGender === "female";
              } else if (lookingFor === "groom" || lookingFor === "male") {
                genderMatch = pGender === "male";
              }
            }
            return ageMatch && genderMatch;
          });

          if (isRefresh || pageNum === 1) {
            setProfiles(ageFiltered);
          } else {
            setProfiles((prev) => {
              const existingIds = new Set(prev.map((p) => p.id));
              const filteredNew = ageFiltered.filter(
                (p: any) => !existingIds.has(p.id),
              );
              return [...prev, ...filteredNew];
            });
          }

          if (response.pagination) {
            setPage(response.pagination.page);
            setTotalPages(response.pagination.totalPages);
          }
        }
      } catch (err: any) {
        console.log("[Explore] Failed to load profiles:", err.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [
      profileCompleted,
      selectedEducation,
      selectedLocation,
      cityInput,
      minAge,
      maxAge,
      user,
      searchText,
    ],
  );

  useEffect(() => {
    loadProfiles(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedEducation,
    selectedLocation,
    cityInput,
    minAge,
    maxAge,
    profileCompleted,
    user,
    searchText,
  ]);

  const onRefresh = useCallback(() => {
    loadProfiles(1, true);
  }, [loadProfiles]);

  const onLoadMore = () => {
    if (page < totalPages && !loadingMore && !loading) {
      loadProfiles(page + 1);
    }
  };

  const handleConnectionAction = async (targetProfile: UserProfile) => {
    if (!profileCompleted) {
      Alert.alert(
        "Profile Incomplete",
        "Please complete your profile to view other member details and send interest requests.",
      );
      navigateSafe("/edit-profile");
      return;
    }

    const targetUserId = targetProfile.userId;
    const isRequested =
      (targetProfile as any).interestStatus === "PENDING" ||
      (targetProfile as any).interestStatus === "ACCEPTED";
    const isSender = (targetProfile as any).isInterestSender;
    const interestId = (targetProfile as any).interestId;

    if (isRequested && isSender && interestId) {
      // Cancel request
      try {
        await interestApi.cancelInterest(interestId);
        Alert.alert("Success", "Connection request cancelled.");
        // Update local state list instantly
        setProfiles((prev) =>
          prev.map((p) =>
            p.userId === targetUserId
              ? ({
                  ...p,
                  interestStatus: null,
                  isInterestSender: false,
                  interestId: null,
                } as any)
              : p,
          ),
        );
      } catch (err: any) {
        Alert.alert("Error", err.message || "Failed to cancel request.");
      }
    } else if (!isRequested) {
      // Send connection request
      try {
        const res = await interestApi.sendInterest(targetUserId);
        Alert.alert("Sent", "Connection request sent.");
        if (res && res.data) {
          // Update local state list instantly
          setProfiles((prev) =>
            prev.map((p) =>
              p.userId === targetUserId
                ? ({
                    ...p,
                    interestStatus: "PENDING",
                    isInterestSender: true,
                    interestId: res.data.interestId,
                  } as any)
                : p,
            ),
          );
        }
      } catch (err: any) {
        Alert.alert("Error", err.message || "Failed to send request.");
      }
    }
  };

  const educationOptions = [
    "All",
    "B.Tech",
    "M.Tech",
    "MBA",
    "MBBS",
    "PhD",
    "B.Com",
    "M.Com",
    "MCA",
    "B.E.",
  ];
  const locationOptions = [
    "All",
    "Pune",
    "Mumbai",
    "Nashik",
    "Bengaluru",
    "Nagpur",
    "Kolhapur",
    "Thane",
  ];

  const filteredProfiles = useMemo(() => profiles, [profiles]);

  const decMinAge = () =>
    setMinAge((prev) =>
      Math.max(MIN_AGE_LIMIT, Math.min(prev - 1, maxAge - 1)),
    );
  const incMinAge = () => setMinAge((prev) => Math.min(prev + 1, maxAge - 1));
  const decMaxAge = () => setMaxAge((prev) => Math.max(prev - 1, minAge + 1));
  const incMaxAge = () =>
    setMaxAge((prev) =>
      Math.min(MAX_AGE_LIMIT, Math.max(prev + 1, minAge + 1)),
    );

  const hasAppliedFilters =
    searchText.trim().length > 0 ||
    selectedEducation !== "All" ||
    selectedLocation !== "All" ||
    cityInput.trim().length > 0 ||
    minAge !== MIN_AGE_LIMIT ||
    maxAge !== MAX_AGE_LIMIT;

  const activeFilterCount = [
    searchText.trim().length > 0,
    selectedEducation !== "All",
    selectedLocation !== "All" || cityInput.trim().length > 0,
    minAge !== MIN_AGE_LIMIT || maxAge !== MAX_AGE_LIMIT,
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSearchText("");
    setSelectedEducation("All");
    setSelectedLocation("All");
    setCityInput("");
    setMinAge(MIN_AGE_LIMIT);
    setMaxAge(MAX_AGE_LIMIT);
  };

  return (
    <View style={styles.mainContainer}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* ── Header ───────────────────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <ThemedText style={styles.headerTitle}>Discover</ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              Profiles picked for you
            </ThemedText>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.iconButton, searchOpen && styles.iconButtonActive]}
              onPress={() => setSearchOpen((prev) => !prev)}
              activeOpacity={0.75}
            >
              <Feather
                name="search"
                size={18}
                color={searchOpen ? ACCENT : colors.muted}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.iconButton,
                filtersOpen && styles.iconButtonActive,
              ]}
              onPress={() => setFiltersOpen((prev) => !prev)}
              activeOpacity={0.75}
            >
              <Feather
                name="sliders"
                size={18}
                color={filtersOpen ? ACCENT : colors.muted}
              />
              {activeFilterCount > 0 && (
                <View style={styles.filterBadge}>
                  <ThemedText style={styles.filterBadgeText}>
                    {activeFilterCount}
                  </ThemedText>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Search ───────────────────────────────────────────── */}
        {searchOpen && (
          <View style={styles.searchWrap}>
            <Feather name="search" size={16} color={colors.muted} />
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search by name, role, city..."
              placeholderTextColor={colors.muted}
              style={styles.searchInput}
              autoFocus
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText("")} hitSlop={8}>
                <Feather name="x-circle" size={16} color={colors.muted} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Result count + applied filters ──────────────────── */}
        {(filteredProfiles.length > 0 || hasAppliedFilters) && (
          <View style={styles.metaRow}>
            {filteredProfiles.length > 0 && (
              <View style={styles.resultPill}>
                <View style={styles.resultDot} />
                <ThemedText style={styles.resultPillText}>
                  {filteredProfiles.length}{" "}
                  {filteredProfiles.length === 1 ? "profile" : "profiles"}
                </ThemedText>
              </View>
            )}
            {hasAppliedFilters && (
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={clearAllFilters}
                activeOpacity={0.75}
              >
                <Feather name="x" size={13} color={colors.text} />
                <ThemedText style={styles.clearFiltersText}>
                  Clear filters
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
        )}

        <ScrollView
          style={styles.filtersAndList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 140 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={ACCENT}
            />
          }
        >
          {/* ── Filters card ───────────────────────────────────── */}
          {filtersOpen && (
            <View style={styles.filtersCard}>
              <FilterSection
                icon="calendar"
                label="Age range"
                open={ageOpen}
                onToggle={() => setAgeOpen((p) => !p)}
                colors={colors}
                styles={styles}
                trailing={
                  !ageOpen ? (
                    <ThemedText style={styles.filterHeaderValue}>
                      {minAge}–{maxAge}
                    </ThemedText>
                  ) : undefined
                }
              >
                <View style={styles.ageCard}>
                  <View style={styles.ageControlColumn}>
                    <ThemedText style={styles.ageLabel}>MIN</ThemedText>
                    <View style={styles.ageControlRow}>
                      <TouchableOpacity
                        style={styles.ageControlButton}
                        onPress={decMinAge}
                        activeOpacity={0.7}
                      >
                        <Feather name="minus" size={14} color={colors.text} />
                      </TouchableOpacity>
                      <ThemedText style={styles.ageValue}>{minAge}</ThemedText>
                      <TouchableOpacity
                        style={styles.ageControlButton}
                        onPress={incMinAge}
                        activeOpacity={0.7}
                      >
                        <Feather name="plus" size={14} color={colors.text} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.ageDivider} />
                  <View style={styles.ageControlColumn}>
                    <ThemedText style={styles.ageLabel}>MAX</ThemedText>
                    <View style={styles.ageControlRow}>
                      <TouchableOpacity
                        style={styles.ageControlButton}
                        onPress={decMaxAge}
                        activeOpacity={0.7}
                      >
                        <Feather name="minus" size={14} color={colors.text} />
                      </TouchableOpacity>
                      <ThemedText style={styles.ageValue}>{maxAge}</ThemedText>
                      <TouchableOpacity
                        style={styles.ageControlButton}
                        onPress={incMaxAge}
                        activeOpacity={0.7}
                      >
                        <Feather name="plus" size={14} color={colors.text} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </FilterSection>

              <FilterSection
                icon="book-open"
                label="Education"
                open={educationOpen}
                onToggle={() => setEducationOpen((p) => !p)}
                colors={colors}
                styles={styles}
                trailing={
                  !educationOpen && selectedEducation !== "All" ? (
                    <ThemedText style={styles.filterHeaderValue}>
                      {selectedEducation}
                    </ThemedText>
                  ) : undefined
                }
              >
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterRow}
                >
                  {educationOptions.map((education) => (
                    <TouchableOpacity
                      key={education}
                      style={[
                        styles.filterChip,
                        selectedEducation === education &&
                          styles.filterChipActive,
                      ]}
                      onPress={() => setSelectedEducation(education)}
                      activeOpacity={0.75}
                    >
                      <ThemedText
                        style={[
                          styles.filterChipText,
                          selectedEducation === education &&
                            styles.filterChipTextActive,
                        ]}
                      >
                        {education}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </FilterSection>

              <FilterSection
                icon="map-pin"
                label="Location"
                open={placeOpen}
                onToggle={() => setPlaceOpen((p) => !p)}
                colors={colors}
                styles={styles}
                last
                trailing={
                  !placeOpen &&
                  (cityInput.trim() || selectedLocation !== "All") ? (
                    <ThemedText
                      style={styles.filterHeaderValue}
                      numberOfLines={1}
                    >
                      {cityInput.trim() || selectedLocation}
                    </ThemedText>
                  ) : undefined
                }
              >
                <View style={styles.cityInputWrap}>
                  <Feather name="map-pin" size={14} color={colors.muted} />
                  <TextInput
                    value={cityInput}
                    onChangeText={setCityInput}
                    placeholder="Enter a city"
                    placeholderTextColor={colors.muted}
                    style={styles.cityInput}
                  />
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterRow}
                >
                  {locationOptions.map((location) => (
                    <TouchableOpacity
                      key={location}
                      style={[
                        styles.filterChip,
                        selectedLocation === location &&
                          styles.filterChipActive,
                      ]}
                      onPress={() => {
                        setSelectedLocation(location);
                        if (location !== "All") setCityInput("");
                      }}
                      activeOpacity={0.75}
                    >
                      <ThemedText
                        style={[
                          styles.filterChipText,
                          selectedLocation === location &&
                            styles.filterChipTextActive,
                        ]}
                      >
                        {location}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </FilterSection>
            </View>
          )}

          {/* ── Profile list ─────────────────────────────────────── */}
          <View style={styles.listSection}>
            {loading && page === 1 ? (
              <View style={styles.loaderWrap}>
                <ActivityIndicator color={ACCENT} size="large" />
                <ThemedText style={styles.loaderText}>
                  Finding profiles…
                </ThemedText>
              </View>
            ) : filteredProfiles.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconCircle}>
                  <Feather name="users" size={22} color={colors.muted} />
                </View>
                <ThemedText style={styles.emptyTitle}>
                  No profiles match your filters
                </ThemedText>
                <ThemedText style={styles.emptyBody}>
                  Try widening the age range, or changing education and
                  location.
                </ThemedText>
                {hasAppliedFilters && (
                  <TouchableOpacity
                    style={styles.emptyClearButton}
                    onPress={clearAllFilters}
                    activeOpacity={0.8}
                  >
                    <ThemedText style={styles.emptyClearButtonText}>
                      Clear all filters
                    </ThemedText>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <>
                {filteredProfiles.map((profile) => {
                  const age = getAge(profile.dateOfBirth);
                  const imageUrl = getPhotoUrl(profile.profilePhoto);
                  const isRequested =
                    (profile as any).interestStatus === "PENDING" ||
                    (profile as any).interestStatus === "ACCEPTED";

                  return (
                    <TouchableOpacity
                      key={profile.id}
                      activeOpacity={0.85}
                      style={styles.profileCard}
                      onPress={() => {
                        if (!profileCompleted) {
                          Alert.alert(
                            "Profile Incomplete",
                            "Please complete your profile to view other member details and send interest requests.",
                          );
                          navigateSafe("/edit-profile");
                          return;
                        }
                        navigateSafe({
                          pathname: "/profile",
                          params: {
                            view: "other",
                            profileId: String(profile.userId),
                            name: profile.fullName,
                            age: String(age),
                            role: profile.profession || "Not set",
                            gender: (profile.gender || "male").toLowerCase(),
                            bio: profile.bio || "",
                            about: profile.bio || "",
                            education: profile.education || "--",
                            city: profile.city || "",
                            state: profile.state || "",
                            country: profile.country || "",
                            height: profile.height || "--",
                            interest: (profile.interest || []).join(","),
                            image: imageUrl,
                            isConnection: "false",
                          },
                        });
                      }}
                      style={styles.profileCard}
                      onPress={() => {
                        if (!profileCompleted) {
                          Alert.alert(
                            "Profile Incomplete",
                            "Please complete your profile to view other member details and send interest requests.",
                          );
                          navigateSafe("/edit-profile");
                          return;
                        }
                        navigateSafe({
                          pathname: "/profile",
                          params: {
                            view: "other",
                            profileId: String(profile.userId),
                            name: profile.fullName,
                            age: String(age),
                            role: profile.profession || "Not set",
                            gender: (profile.gender || "male").toLowerCase(),
                            bio: profile.bio || "",
                            about: profile.bio || "",
                            education: profile.education || "--",
                            city: profile.city || "",
                            state: profile.state || "",
                            country: profile.country || "",
                            height: profile.height || "--",
                            interest: (profile.interest || []).join(","),
                            image: imageUrl,
                            isConnection: "false",
                          },
                        });
                      }}
                    >
                      {/* Image on the left */}
                      <Image source={{ uri: imageUrl }} style={styles.avatar} />

                      {/* Info on the right */}
                      <View style={styles.profileMeta}>
                        <View>
                          <ThemedText style={styles.nameText} numberOfLines={1}>
                            {profile.fullName}
                          </ThemedText>
                          <ThemedText style={styles.roleText} numberOfLines={1}>
                            {profile.profession || "Not set"}
                          </ThemedText>
                          <View style={styles.metaChipsRow}>
                            <View style={styles.metaChip}>
                              <Feather
                                name="calendar"
                                size={11}
                                color={colors.muted}
                              />
                              <ThemedText style={styles.metaChipText}>
                                {age} yrs
                              </ThemedText>
                            </View>
                            <View style={styles.metaChip}>
                              <Feather
                                name="map-pin"
                                size={11}
                                color={colors.muted}
                              />
                              <ThemedText
                                style={styles.metaChipText}
                                numberOfLines={1}
                              >
                                {profile.city || "Not set"}
                              </ThemedText>
                            </View>
                          </View>
                        </View>

                        {/* Connection Button below info on the right */}
                        <TouchableOpacity
                          style={[
                            styles.connectBtn,
                            isRequested
                              ? styles.connectBtnRequested
                              : styles.connectBtnActive,
                          ]}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleConnectionAction(profile);
                          }}
                          activeOpacity={0.85}
                        >
                          <Feather
                            name={isRequested ? "x" : "user-plus"}
                            size={13}
                            color={ACCENT}
                            style={{ marginRight: 6 }}
                          />
                          <ThemedText style={styles.connectBtnText}>
                            {isRequested ? "Cancel Request" : "Connect"}
                          </ThemedText>
                        </TouchableOpacity>
                      </View>

                      <View style={styles.chevronWrap}>
                        <Feather
                          name="chevron-right"
                          size={18}
                          color={colors.muted}
                        />
                      </View>
                    </TouchableOpacity>
                  );
                })}

                {page < totalPages && (
                  <TouchableOpacity
                    onPress={onLoadMore}
                    disabled={loadingMore}
                    style={styles.loadMoreButton}
                    activeOpacity={0.8}
                  >
                    {loadingMore ? (
                      <ActivityIndicator color={ACCENT} size="small" />
                    ) : (
                      <>
                        <ThemedText style={styles.loadMoreText}>
                          Load more profiles
                        </ThemedText>
                        <Feather name="chevron-down" size={16} color={ACCENT} />
                      </>
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

// Small presentational helper so each collapsible filter section (Age /
// Education / Location) shares identical header markup, spacing and
// chevron behaviour instead of being duplicated three times.
function FilterSection({
  icon,
  label,
  open,
  onToggle,
  children,
  colors,
  styles,
  trailing,
  last,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  colors: any;
  styles: any;
  trailing?: React.ReactNode;
  last?: boolean;
}) {
  return (
    <View style={last ? undefined : styles.filterSectionWrap}>
      <TouchableOpacity
        style={styles.filterHeaderRow}
        onPress={onToggle}
        activeOpacity={0.75}
      >
        <View style={styles.filterHeaderLeft}>
          <View style={styles.filterHeaderIconWrap}>
            <Feather name={icon} size={14} color={ACCENT} />
          </View>
          <ThemedText style={styles.filterHeaderText}>{label}</ThemedText>
        </View>
        <View style={styles.filterHeaderRight}>
          {trailing}
          <Feather
            name={open ? "chevron-up" : "chevron-down"}
            size={16}
            color={colors.muted}
          />
        </View>
      </TouchableOpacity>
      {open && <View style={styles.filterSectionBody}>{children}</View>}
    </View>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1 },

    // ── Header ───────────────────────────────────────────────
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 16,
    },
    headerTitle: {
      color: colors.text,
      fontSize: 26,
      fontWeight: "800",
      letterSpacing: -0.3,
    },
    headerSubtitle: {
      color: colors.muted,
      fontSize: 13,
      marginTop: 2,
      fontWeight: "500",
    },
    headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: "center",
      alignItems: "center",
    },
    iconButtonActive: {
      backgroundColor: ACCENT_SOFT,
      borderColor: ACCENT_SOFT_BORDER,
    },
    filterBadge: {
      position: "absolute",
      top: -4,
      right: -4,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: ACCENT,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 3,
    },
    filterBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },

    // ── Search ───────────────────────────────────────────────
    searchWrap: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingHorizontal: 14,
      marginHorizontal: 20,
      height: 46,
      gap: 10,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: { flex: 1, color: colors.text, fontSize: 14, padding: 0 },

    // ── Result / applied filters row ────────────────────────
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      marginBottom: 12,
      minHeight: 28,
    },
    resultPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: ACCENT_SOFT,
    },
    resultDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: ACCENT,
    },
    resultPillText: { color: ACCENT, fontSize: 12, fontWeight: "700" },
    clearFiltersButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    clearFiltersText: { color: colors.text, fontSize: 12, fontWeight: "600" },

    filtersAndList: { flex: 1 },

    // ── Filters card ─────────────────────────────────────────
    filtersCard: {
      marginTop: 2,
      marginHorizontal: 20,
      marginBottom: 4,
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    filterSectionWrap: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    filterHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 14,
    },
    filterHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
    filterHeaderIconWrap: {
      width: 26,
      height: 26,
      borderRadius: 8,
      backgroundColor: ACCENT_SOFT,
      justifyContent: "center",
      alignItems: "center",
    },
    filterHeaderText: { color: colors.text, fontSize: 14, fontWeight: "700" },
    filterHeaderRight: { flexDirection: "row", alignItems: "center", gap: 8 },
    filterHeaderValue: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "600",
      maxWidth: 110,
    },
    filterSectionBody: {
      paddingHorizontal: 14,
      paddingBottom: 16,
      paddingTop: 2,
      gap: 10,
    },
    filterRow: { gap: 8 },
    filterChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterChipActive: { backgroundColor: ACCENT, borderColor: ACCENT },
    filterChipText: { color: colors.muted, fontSize: 13, fontWeight: "600" },
    filterChipTextActive: { color: "#fff" },

    // ── Age control ──────────────────────────────────────────
    ageCard: {
      backgroundColor: colors.background,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      flexDirection: "row",
      alignItems: "center",
    },
    ageControlColumn: { flex: 1, alignItems: "center", gap: 8 },
    ageDivider: {
      width: 1,
      height: 44,
      backgroundColor: colors.border,
      marginHorizontal: 8,
    },
    ageLabel: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.5,
    },
    ageControlRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    ageControlButton: {
      width: 30,
      height: 30,
      borderRadius: 9,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: "center",
      alignItems: "center",
    },
    ageValue: {
      color: colors.text,
      fontSize: 17,
      fontWeight: "800",
      minWidth: 26,
      textAlign: "center",
    },

    // ── Place input ──────────────────────────────────────────
    cityInputWrap: {
      backgroundColor: colors.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      height: 42,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    cityInput: { flex: 1, color: colors.text, fontSize: 14, padding: 0 },

    // ── List ─────────────────────────────────────────────────
    listSection: { marginTop: 6, paddingHorizontal: 20, gap: 10 },
    loaderWrap: { alignItems: "center", paddingVertical: 60, gap: 10 },
    loaderText: { color: colors.muted, fontSize: 13, fontWeight: "500" },

    emptyCard: {
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 24,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    emptyIconCircle: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 14,
    },
    emptyTitle: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "700",
      textAlign: "center",
    },
    emptyBody: {
      color: colors.muted,
      marginTop: 6,
      lineHeight: 19,
      fontSize: 13,
      textAlign: "center",
    },
    emptyClearButton: {
      marginTop: 16,
      backgroundColor: ACCENT,
      borderRadius: 12,
      paddingHorizontal: 18,
      paddingVertical: 10,
    },
    emptyClearButtonText: { color: "#fff", fontSize: 13, fontWeight: "700" },

    profileCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOpacity: 0.04,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
        },
        android: { elevation: 1 },
      }),
    },
    cardHeaderInfo: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
    },
    connectBtn: {
      flexDirection: "row",
      height: 38,
      borderRadius: 19,
      justifyContent: "center",
      alignItems: "center",
      alignSelf: "flex-start",
      paddingHorizontal: 14,
    },
    connectBtnActive: {
      backgroundColor: "rgba(255, 77, 141, 0.14)",
      borderWidth: 1.2,
      borderColor: "rgba(255, 77, 141, 0.45)",
      ...Platform.select({
        ios: {
          shadowColor: ACCENT,
          shadowOpacity: 0.12,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
        },
        android: { elevation: 1 },
      }),
    },
    connectBtnRequested: {
      backgroundColor: "transparent",
      borderWidth: 1.5,
      borderColor: ACCENT_SOFT_BORDER,
    },
    connectBtnText: {
      color: ACCENT,
      fontSize: 13,
      fontWeight: "700",
      letterSpacing: 0.2,
    },
    connectBtnTextRequested: {
      color: ACCENT,
    },
    avatar: {
      width: 95,
      height: 125,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: ACCENT_SOFT_BORDER,
      backgroundColor: colors.background,
    },
    profileMeta: {
      flex: 1,
      height: 125,
      justifyContent: "space-between",
      gap: 6,
      minWidth: 0,
    },
    nameText: { color: colors.text, fontSize: 20.5, fontWeight: "700" },
    roleText: { color: colors.muted, fontSize: 12.5, fontWeight: "500" },
    metaChipsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 3,
    },
    metaChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      maxWidth: 120,
    },
    metaChipText: { color: colors.muted, fontSize: 11.5, fontWeight: "600" },
    chevronWrap: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.background,
      justifyContent: "center",
      alignItems: "center",
    },

    loadMoreButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 14,
      marginTop: 6,
      marginBottom: 20,
    },
    loadMoreText: { color: ACCENT, fontSize: 13.5, fontWeight: "700" },
  });
