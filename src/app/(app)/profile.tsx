import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Modal,
  TextInput,
  Dimensions,
  BackHandler,
} from "react-native";
import { CustomAlert as Alert } from "@/utils/alert";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect, useCallback, useRef } from "react";
import * as DocumentPicker from "expo-document-picker";
import * as WebBrowser from "expo-web-browser";
import * as ImagePicker from "expo-image-picker";
import BottomNavigation from "@/components/navigation/BottomNavigation";
import { ThemedText } from "@/components/themed-text";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { profileApi, interestApi, personalInformationApi, successStoryApi, BASE_URL } from "@/utils/api";
import type { UserPhoto } from "@/utils/types";
import { eventEmitter } from "@/utils/events";
import { useAppTheme } from "@/context/ThemeContext";
import { pickImageWithPermissionCheck } from "@/utils/imagePicker";
import InAppPdfModal from "@/components/ui/InAppPdfModal";

const { width: SW } = Dimensions.get("window");

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const { language, t } = useLanguage();
  const { colors, isDark } = useAppTheme();
  const isMr = language === "mr";
  const photoFlatListRef = useRef<FlatList>(null);
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
  const [selectedPhoto, setSelectedPhoto] = useState<UserPhoto | null>(null);

  // Other profile dynamic load states
  const [otherUser, setOtherUser] = useState<any>(null);
  const [loadingOtherProfile, setLoadingOtherProfile] = useState(false);

  // Dedicated Interest status state variables to drive button instantly
  const [interestStatus, setInterestStatus] = useState<string | null>(null);
  const [isInterestSender, setIsInterestSender] = useState<boolean>(false);
  const [interestId, setInterestId] = useState<number | null>(null);

  // Biodata states
  const [uploadingBiodata, setUploadingBiodata] = useState(false);
  const [generatingBiodata, setGeneratingBiodata] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showPrivacyLockedModal, setShowPrivacyLockedModal] = useState(false);
  const [pdfUrlToView, setPdfUrlToView] = useState<string | null>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [religion, setReligion] = useState("Hindu");
  const [caste, setCaste] = useState("Vasudev");
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");

  // Pre-fill father/mother & personalInfo from personal information API
  useEffect(() => {
    const fetchPersonalInfoOnMount = async () => {
      try {
        const res = await personalInformationApi.getDetails();
        if (res?.data) {
          const pi = res.data as any;
          setPersonalInfo(pi);
          if (pi.fatherName) setFatherName(pi.fatherName);
          if (pi.motherName) setMotherName(pi.motherName);
        }
      } catch {
        // silent — personal info is optional
      }
    };
    fetchPersonalInfoOnMount();
  }, []);

  // Photo multiple selection states
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<number>>(new Set());
  const [photoToDeleteId, setPhotoToDeleteId] = useState<number | null>(null);

  const getParamValue = (value?: string | string[]) =>
    Array.isArray(value) ? value[0] : value;

  const view = getParamValue(params.view);
  const isOtherProfileView = view === "other";

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (isOtherProfileView) {
          return false;
        }
        router.replace("/explore");
        return true;
      };

      const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);

      return () => {
        subscription.remove();
      };
    }, [isOtherProfileView])
  );

  const [mySuccessStory, setMySuccessStory] = useState<any>(null);
  const [personalInfo, setPersonalInfo] = useState<any>(() => user?.personalInformation || null);
  const [showPersonalInfoExpand, setShowPersonalInfoExpand] = useState(false);

  // Instantly sync personalInfo state when AuthContext user changes
  useEffect(() => {
    if (!isOtherProfileView && user?.personalInformation) {
      setPersonalInfo(user.personalInformation);
    }
  }, [isOtherProfileView, user?.personalInformation]);

  const loadSuccessStory = useCallback(async () => {
    try {
      const res = await successStoryApi.myStory();
      if (res.data) setMySuccessStory(res.data);
      else setMySuccessStory(null);
    } catch (e) {
      console.log("[Profile] Failed to load success story:", e);
    }
  }, []);

  const loadPersonalInfo = useCallback(async () => {
    try {
      const res = await personalInformationApi.getDetails();
      if (res.data) setPersonalInfo(res.data);
    } catch (e) {
      console.log("[Profile] Failed to load personal info:", e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!isOtherProfileView) {
        loadSuccessStory();
        loadPersonalInfo();
      }
    }, [isOtherProfileView, loadSuccessStory, loadPersonalInfo])
  );

  const handleDeleteSuccessStory = async () => {
    Alert.alert("Delete Success Story", "Are you sure you want to delete your success story?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await successStoryApi.deleteStory();
            setMySuccessStory(null);
            Alert.alert("Deleted", "Your success story has been removed.");
          } catch (e: any) {
            Alert.alert("Error", e.message || "Failed to delete success story.");
          }
        },
      },
    ]);
  };

  // Sync connection status parameters from route to local state immediately
  useEffect(() => {
    if (isOtherProfileView) {
      const pStatus = getParamValue((params as any).interestStatus);
      const pIsSender = getParamValue((params as any).isInterestSender);
      const pInterestId = getParamValue((params as any).interestId);

      if (pStatus) {
        setInterestStatus(pStatus);
      } else {
        setInterestStatus(null);
      }
      setIsInterestSender(pIsSender === "true");
      setInterestId(pInterestId ? Number(pInterestId) || null : null);
    }
  }, [(params as any).interestStatus, (params as any).isInterestSender, (params as any).interestId, isOtherProfileView]);

  // Load photos & profile data on mount
  useEffect(() => {
    const pid = getParamValue(params.profileId);
    if (isOtherProfileView && pid) {
      loadOtherProfile(Number(pid));
    } else if (!isOtherProfileView) {
      loadPhotos();
    }
  }, [isOtherProfileView, params.profileId]);

  // Listen to live photo upload events
  useEffect(() => {
    if (!isOtherProfileView) {
      const unsubscribe = eventEmitter.on("photo-uploaded", () => {
        console.log(
          "[Profile] Photo upload event received, reloading gallery...",
        );
        loadPhotos();
      });
      return () => unsubscribe();
    }
  }, [isOtherProfileView]);

  const loadOtherProfile = async (id: number) => {
    try {
      setLoadingOtherProfile(true);
      const response = await profileApi.getUserProfile(id);
      if (response.data) {
        setOtherUser(response.data);
        if (response.data.photos) {
          setPhotos(response.data.photos);
        }
        const data = response.data as any;
        setInterestStatus(data.interestStatus || null);
        setIsInterestSender(data.isInterestSender || false);
        setInterestId(data.interestId || null);

        if (data.interestStatus === "PENDING" && data.isInterestSender) {
          setConnectionRequested(true);
        } else if (data.interestStatus === "ACCEPTED") {
          setConnectionRequested(true);
        } else {
          setConnectionRequested(false);
        }
      }
    } catch (err) {
      console.log("[Profile] Failed to load other user profile:", err);
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
      console.log("[Profile] Failed to load photos:", err);
    } finally {
      setLoadingPhotos(false);
    }
  };

  const [uploadingGalleryPhoto, setUploadingGalleryPhoto] = useState(false);

  const handleUploadGalleryPhoto = async () => {
    try {
      const result = await pickImageWithPermissionCheck({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (result && !result.canceled && result.assets && result.assets.length > 0) {
        const photoUri = result.assets[0].uri;
        setUploadingGalleryPhoto(true);

        const response = await profileApi.uploadPhoto(photoUri);
        if (response.data) {
          Alert.alert(
            isMr ? "यशस्वी" : "Success",
            isMr
              ? "फोटो तुमच्या गॅलरीमध्ये यशस्वीरित्या अपलोड झाला!"
              : "Photo uploaded to your gallery successfully!"
          );
          await loadPhotos();
        } else {
          Alert.alert(
            isMr ? "अपलोड अयशस्वी" : "Upload Failed",
            response.message || (isMr ? "फोटो अपलोड करण्यात अयशस्वी." : "Failed to upload photo.")
          );
        }
      }
    } catch (err: any) {
      console.error("[ProfilePhotoUpload] Selection/upload failed:", err);
      Alert.alert(isMr ? "त्रुटी" : "Error", err.message || (isMr ? "फोटो अपलोड करण्यात अयशस्वी." : "Failed to upload photo."));
    } finally {
      setUploadingGalleryPhoto(false);
    }
  };

  const handleDeletePhoto = (photoId: number) => {
    setPhotoToDeleteId(photoId);
  };

  const confirmDeleteSinglePhoto = async () => {
    if (photoToDeleteId === null) return;
    const photoId = photoToDeleteId;
    setPhotoToDeleteId(null);
    setLoadingPhotos(true);
    try {
      const res = await profileApi.deletePhoto(photoId);
      if (res.message) {
        Alert.alert(
          isMr ? "यशस्वी" : "Success",
          isMr
            ? "फोटो यशस्वीरित्या हटवला गेला."
            : "Photo deleted successfully!"
        );
        setPhotos((prev) => prev.filter((p) => p.id !== photoId));
        setSelectedPhoto(null);
      }
    } catch (err: any) {
      Alert.alert(
        isMr ? "त्रुटी" : "Error",
        err.message ||
          (isMr ? "फोटो हटवण्यात अयशस्वी." : "Failed to delete photo.")
      );
    } finally {
      setLoadingPhotos(false);
    }
  };

  const handlePhotoPress = (item: any) => {
    if (isSelectionMode) {
      const newSelected = new Set(selectedPhotoIds);
      if (newSelected.has(item.id)) {
        newSelected.delete(item.id);
      } else {
        newSelected.add(item.id);
      }
      setSelectedPhotoIds(newSelected);
    } else {
      setSelectedPhoto(item);
    }
  };

  const cancelSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedPhotoIds(new Set());
  };

  const handleDeleteSelectedPhotos = () => {
    if (selectedPhotoIds.size === 0) return;

    Alert.alert(
      isMr ? "निवडलेले फोटो हटवा" : "Delete Selected Photos",
      isMr
        ? `तुम्हाला खात्री आहे की तुम्ही निवडलेले ${selectedPhotoIds.size} फोटो हटवू इच्छिता?`
        : `Are you sure you want to delete the selected ${selectedPhotoIds.size} photo(s)?`,
      [
        {
          text: isMr ? "रद्द करा" : "Cancel",
          style: "cancel",
        },
        {
          text: isMr ? "हटवा" : "Delete",
          style: "destructive",
          onPress: async () => {
            setLoadingPhotos(true);
            try {
              const ids = Array.from(selectedPhotoIds);
              let successCount = 0;
              for (const id of ids) {
                try {
                  await profileApi.deletePhoto(id);
                  successCount++;
                } catch (e) {
                  console.error(`Failed to delete photo ${id}:`, e);
                }
              }

              if (successCount > 0) {
                Alert.alert(
                  isMr ? "यशस्वी" : "Success",
                  isMr
                    ? "निवडलेले फोटो यशस्वीरित्या हटवले गेले."
                    : `${successCount} photo(s) deleted successfully!`
                );
                setPhotos((prev) => prev.filter((p) => !selectedPhotoIds.has(p.id)));
              }
            } finally {
              setLoadingPhotos(false);
              setIsSelectionMode(false);
              setSelectedPhotoIds(new Set());
            }
          },
        },
      ]
    );
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const pid = getParamValue(params.profileId);
    if (isOtherProfileView && pid) {
      await loadOtherProfile(Number(pid));
    } else {
      await refreshUser();
      await loadPhotos();
    }
    setRefreshing(false);
  }, [refreshUser, isOtherProfileView, params.profileId]);

  // Build photo URL from backend path
  const getPhotoUrl = (path: string): string => {
    if (path.startsWith("http")) return path;
    const baseUrl = BASE_URL.replace("/api", "");
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  };

  // Biodata handlers
  const handleUploadBiodata = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        console.log("[Biodata] Uploading file:", file.uri);
        setUploadingBiodata(true);
        const response = await profileApi.uploadBiodata(file.uri, "uploaded");
        if (response.data) {
          Alert.alert("Success", "Biodata uploaded successfully!");
          await refreshUser();
        } else {
          Alert.alert(
            "Upload Failed",
            response.message || "Failed to upload biodata.",
          );
        }
      }
    } catch (err: any) {
      console.log("[Biodata] Selection/upload failed:", err);
      Alert.alert("Error", err.message || "Failed to select/upload biodata.");
    } finally {
      setUploadingBiodata(false);
    }
  };

  const handleGenerateBiodata = async () => {
    try {
      setGeneratingBiodata(true);
      const dobStr = profile?.dateOfBirth
        ? new Date(profile.dateOfBirth).toISOString().split("T")[0]
        : "1998-05-20";
      const body = {
        fullName: profile?.fullName || ownName,
        gender: (profile?.gender || "male").toLowerCase() as any,
        maritalStatus: (
          profile?.maritalStatus || "never_married"
        ).toLowerCase() as any,
        dateOfBirth: dobStr,
        city: profile?.city || undefined,
        profession: profile?.profession || undefined,
        education: profile?.education || undefined,
        fatherName: fatherName || undefined,
        motherName: motherName || undefined,
        bio: profile?.bio || ownBio,
      };

      console.log(
        "[Biodata] Requesting generateBiodata with body:",
        JSON.stringify(body),
      );
      const response = await profileApi.generateBiodata(body);
      if (response.data) {
        Alert.alert("Success", "Biodata PDF generated successfully!");
        setShowGenerateModal(false);
        await refreshUser();
      } else {
        Alert.alert(
          "Generation Failed",
          response.message || "Failed to generate biodata PDF.",
        );
      }
    } catch (err: any) {
      console.log("[Biodata] Generation error:", err);
      Alert.alert("Error", err.message || "Failed to generate biodata PDF.");
    } finally {
      setGeneratingBiodata(false);
    }
  };

  const handleViewBiodata = async () => {
    const url = biodataObj?.biodataUrl;
    if (!url) return;
    const fullUrl = url.startsWith("http")
      ? url
      : `${BASE_URL.replace("/api", "")}${url.startsWith("/") ? url : `/${url}`}`;
    console.log("[Biodata] Opening PDF inside app:", fullUrl);
    setPdfUrlToView(fullUrl);
    setShowPdfModal(true);
  };

  const handleUpdateBiodata = () => {
    setShowUpdateModal(true);
  };

  const handleConnectPress = async () => {
    if (!isOtherProfileView || !otherUser) return;

    const otherData = otherUser as any;
    const targetUserId = otherUser.id || otherData.userId || otherData.id;

    // 1.5. If interestStatus is ACCEPTED -> prompt to remove connection
    if (interestStatus === "ACCEPTED" && interestId) {
      Alert.alert(
        "Remove Connection",
        `Are you sure you want to remove your connection with ${otherUser.profile?.fullName || "this user"}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: async () => {
              try {
                await interestApi.cancelInterest(interestId);
                Alert.alert("Success", "Connection removed.");
                // Update dedicated state variables instantly
                setInterestStatus(null);
                setIsInterestSender(false);
                setInterestId(null);
                // Sync with backend in background
                loadOtherProfile(targetUserId);
              } catch (err: any) {
                Alert.alert("Error", err.message || "Failed to remove connection.");
              }
            },
          },
        ]
      );
      return;
    }

    // 1. If interestStatus is PENDING and we are the sender -> cancel it
    if (interestStatus === "PENDING" && isInterestSender && interestId) {
      try {
        const res = await interestApi.cancelInterest(interestId);
        Alert.alert("Success", "Connection request cancelled.");
        // Update dedicated state variables instantly
        setInterestStatus(null);
        setIsInterestSender(false);
        setInterestId(null);
        // Sync with backend in background
        loadOtherProfile(targetUserId);
      } catch (err: any) {
        Alert.alert("Error", err.message || "Failed to cancel request.");
      }
      return;
    }

    // 2. If interestStatus is PENDING and we are NOT the sender -> accept it
    if (interestStatus === "PENDING" && !isInterestSender && interestId) {
      try {
        const res = await interestApi.acceptInterest(interestId);
        Alert.alert(
          "Accepted",
          `You are now connected with ${otherUser.profile?.fullName || "this user"}!`,
        );
        // Update dedicated state variables instantly
        setInterestStatus("ACCEPTED");
        setIsInterestSender(false);
        // Sync with backend in background
        loadOtherProfile(targetUserId);
      } catch (err: any) {
        Alert.alert("Error", err.message || "Failed to accept request.");
      }
      return;
    }

    // 3. Otherwise, send a new interest request
    try {
      const res = await interestApi.sendInterest(targetUserId);
      Alert.alert("Sent", "Connection request sent.");
      if (res && res.data) {
        // Update dedicated state variables instantly
        setInterestStatus("PENDING");
        setIsInterestSender(true);
        setInterestId(res.data.interestId);
      }
      // Sync with backend in background
      loadOtherProfile(targetUserId);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to send request.");
    }
  };

  const handleDeclinePress = async () => {
    if (!interestId) return;
    const pid = getParamValue(params.profileId);
    const targetUserId = pid ? Number(pid) : 0;
    try {
      await interestApi.cancelInterest(interestId);
      Alert.alert("Success", "Connection request declined.");
      setInterestStatus(null);
      setIsInterestSender(false);
      setInterestId(null);
      if (targetUserId) loadOtherProfile(targetUserId);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to decline request.");
    }
  };

  const buttonConfig = (() => {
    const base = "#FF4D8D";
    if (!isOtherProfileView) {
      return {
        label: "Send Connection Request",
        icon: "heart" as const,
        tintColor: base,
        disabled: false,
      };
    }
    if (interestStatus === "ACCEPTED") {
      return {
        label: "Remove Connection",
        icon: "close-circle-outline" as const,
        tintColor: "#D32F2F",
        disabled: false,
      };
    }
    if (interestStatus === "PENDING") {
      if (isInterestSender) {
        return {
          label: "Cancel Request",
          icon: "close-circle-outline" as const,
          tintColor: "#9B9BA1",
          disabled: false,
        };
      } else {
        return {
          label: "Accept Request",
          icon: "checkmark-circle-outline" as const,
          tintColor: "#2E7D32",
          disabled: false,
        };
      }
    }
    return {
      label: "Send Connection Request",
      icon: "heart" as const,
      tintColor: base,
      disabled: false,
    };
  })();

  // ---- Own profile data from context ----
  const profile = user?.profile;
  const ownName = profile?.fullName || "Your Name";
  const ownAge = profile?.dateOfBirth
    ? String(
        Math.floor(
          (Date.now() - new Date(profile.dateOfBirth).getTime()) /
            (365.25 * 24 * 60 * 60 * 1000),
        ),
      )
    : "--";
  const ownRole = profile?.profession || "Not set";
  const ownBio = profile?.bio || "Complete your profile to add a bio.";
  const ownEducation = profile?.education || "--";
  const ownCity =
    [profile?.city, profile?.state, profile?.country]
      .filter(Boolean)
      .join(", ") || "--";
  const ownGender = (profile?.gender || "male").toLowerCase();
  const ownHeight = profile?.height || "--";
  const ownInterests = profile?.interest || [];
  const ownProfilePhoto = profile?.profilePhoto
    ? getPhotoUrl(profile.profilePhoto)
    : "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1200&auto=format&fit=crop";

  // ---- Other profile data from params ----
  const otherName = getParamValue(params.name) ?? "Member";
  const otherAge = getParamValue(params.age) ?? "27";
  const otherRole = getParamValue(params.role) ?? "Professional";
  const otherGender = getParamValue(params.gender) ?? "female";
  const otherIsConnection = getParamValue(params.isConnection) === "true";
  const otherBio =
    getParamValue(params.bio) ??
    "Friendly, family-oriented, and looking for a meaningful relationship.";
  const otherAbout =
    getParamValue(params.about) ??
    "I believe in trust, communication, and growing together as partners.";
  const otherEducation = getParamValue(params.education) ?? "MBA";
  const otherCity =
    [
      getParamValue(params.city),
      getParamValue(params.state),
      getParamValue(params.country),
    ]
      .filter(Boolean)
      .join(", ") || "Pune";
  const otherImage =
    getParamValue(params.image) ??
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1200&auto=format&fit=crop";
  const otherHeight = getParamValue(params.height) ?? "5ft 6in";

  // Parse other interests (could be passed as JSON string or comma-separated string)
  const getOtherInterests = (): string[] => {
    const rawInterest = getParamValue(params.interest);
    if (!rawInterest) return [];
    try {
      if (rawInterest.startsWith("[")) {
        return JSON.parse(rawInterest);
      }
      return rawInterest.split(",");
    } catch {
      return [];
    }
  };

  const displayName = isOtherProfileView
    ? otherUser?.profile?.fullName || otherName
    : ownName;
  const displayAge = isOtherProfileView
    ? otherUser?.profile?.dateOfBirth
      ? String(
          Math.floor(
            (Date.now() - new Date(otherUser.profile.dateOfBirth).getTime()) /
              (365.25 * 24 * 60 * 60 * 1000),
          ),
        )
      : otherAge
    : ownAge;
  const displayRole = isOtherProfileView
    ? otherUser?.profile?.profession || otherRole
    : ownRole;
  const displayBio = isOtherProfileView
    ? otherUser?.profile?.bio || getParamValue(params.bio) || ""
    : ownBio;
  const displayAbout = displayBio;
  const displayEducation = isOtherProfileView
    ? otherUser?.profile?.education || otherEducation
    : ownEducation;
  const displayCity = isOtherProfileView
    ? otherUser?.profile
      ? [
          otherUser.profile.city,
          otherUser.profile.state,
          otherUser.profile.country,
        ]
          .filter(Boolean)
          .join(", ")
      : otherCity
    : ownCity;
  const rawPersonalInfo = isOtherProfileView
    ? (otherUser?.personalInformation ||
       (otherUser as any)?.user?.personalInformation ||
       (otherUser as any)?.personalInfo ||
       (otherUser as any)?.data?.personalInformation)
    : (personalInfo || user?.personalInformation);

  const displayPersonalInfo = Array.isArray(rawPersonalInfo)
    ? (rawPersonalInfo[0] || {})
    : (rawPersonalInfo || {});

  const activeSuccessStory = isOtherProfileView
    ? otherUser?.successStory?.title
      ? otherUser.successStory
      : null
    : user?.successStory?.title
      ? user.successStory
      : mySuccessStory?.title
        ? mySuccessStory
        : null;

  const isConnected = isOtherProfileView ? interestStatus === "ACCEPTED" : true;

  const displayImage = isOtherProfileView
    ? otherUser?.profile?.profilePhoto
      ? getPhotoUrl(otherUser.profile.profilePhoto)
      : otherImage
    : ownProfilePhoto;
  const displayGender = (
    isOtherProfileView ? otherUser?.profile?.gender || otherGender : ownGender
  ).toLowerCase();
  const displayHeight = isOtherProfileView
    ? otherUser?.profile?.height || otherHeight
    : ownHeight;
  const displayInterests = isOtherProfileView
    ? otherUser?.profile?.interest || getOtherInterests()
    : ownInterests;
  const lookingForGender = displayGender === "female" ? "Male" : "Female";
  const parsedAge = Number.parseInt(displayAge, 10);

  const biodataObj = isOtherProfileView ? otherUser?.biodata : user?.biodata;
  const hasBiodata = !!biodataObj?.biodataUrl;

  // Match score for other profiles
  const matchScore = (() => {
    if (!isOtherProfileView) return null;
    let score = 52;
    if (displayGender === "female") score += 10;
    if (displayCity.toLowerCase() === "pune") score += 12;
    if (displayEducation.toLowerCase() === "mba") score += 14;
    else if (displayEducation.toLowerCase().includes("tech")) score += 8;
    if (!Number.isNaN(parsedAge)) {
      const ageGap = Math.abs(parsedAge - 27);
      if (ageGap <= 2) score += 18;
      else if (ageGap <= 4) score += 12;
      else if (ageGap <= 7) score += 6;
    }
    if (otherIsConnection) score += 10;
    const roleText = displayRole.toLowerCase();
    if (
      roleText.includes("engineer") ||
      roleText.includes("doctor") ||
      roleText.includes("scientist")
    )
      score += 7;
    return Math.max(45, Math.min(97, score));
  })();

  const matchScoreColor = (() => {
    if (matchScore === null) return "#8E8E95";
    if (matchScore > 85) return "#33C56E";
    if (matchScore >= 70) return "#E4C542";
    return "#E25555";
  })();

  const [connectionRequested, setConnectionRequested] = useState(false);

  // Photo data for grid
  // Photo data for grid (filter out profile photo from gallery view)
  const profilePhotoPath = isOtherProfileView
    ? otherUser?.profile?.profilePhoto
    : user?.profile?.profilePhoto;

  const cleanPathForComparison = (path?: string | null) => {
    if (!path) return '';
    let clean = path;
    if (clean.includes('/uploads/')) {
      clean = clean.substring(clean.indexOf('/uploads/'));
    } else if (clean.includes('uploads/')) {
      clean = '/' + clean.substring(clean.indexOf('uploads/'));
    }
    if (!clean.startsWith('/')) {
      clean = '/' + clean;
    }
    return clean.toLowerCase();
  };

  const galleryPhotos = photos.filter((p) => {
    const cleanP = cleanPathForComparison(p.photoUrl);
    const cleanProfile = cleanPathForComparison(profilePhotoPath);
    return cleanP !== cleanProfile;
  });

  if (isOtherProfileView && (loadingOtherProfile || !otherUser)) {
    return (
      <View
        style={[styles.mainContainer, { backgroundColor: colors.background }]}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
            >
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </TouchableOpacity>
            <ThemedText style={styles.topBarTitle}>
              {""}
            </ThemedText>
            <View style={{ width: 40 }} />
          </View>
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              gap: 14,
            }}
          >
            <ActivityIndicator size="large" color="#FF4D8D" />
            <ThemedText
              style={{ fontSize: 13, color: colors.muted, fontWeight: "500" }}
            >
              Loading Profile...
            </ThemedText>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View
      style={[styles.mainContainer, { backgroundColor: colors.background }]}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 130 }}
          refreshControl={
            !isOtherProfileView ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#FF4D8D"
              />
            ) : undefined
          }
        >
          {/* ── Top Bar ── */}
          <View style={styles.topBar}>
            {isOtherProfileView ? (
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backBtn}
              >
                <Ionicons name="arrow-back" size={22} color={colors.text} />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 40 }} />
            )}
            <ThemedText style={styles.topBarTitle}>
              {""}
            </ThemedText>
            {!isOtherProfileView ? (
              <TouchableOpacity
                style={[styles.settingButton, { backgroundColor: colors.card }]}
                onPress={() => router.push("/settings")}
              >
                <Ionicons
                  name="settings-outline"
                  size={20}
                  color={colors.text}
                />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 40 }} />
            )}
          </View>

          {/* ── Hero Avatar ── */}
          <View style={styles.heroSection}>
            <View style={styles.avatarRing}>
              <Image source={{ uri: displayImage }} style={styles.heroAvatar} />
            </View>

            {/* Name + verified (Name strictly centered, checkmark balanced) */}
            <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
              <View style={{ width: 26 }} />
              <ThemedText style={styles.heroName}>{displayName}</ThemedText>
              <View style={{ width: 26, alignItems: 'flex-start', justifyContent: 'center', marginLeft: 4 }}>
                {(isOtherProfileView
                  ? otherUser?.isMobileVerified
                  : user?.isMobileVerified) && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color="#0095f6"
                  />
                )}
              </View>
            </View>

            {/* Subtitle — age · city */}
            <ThemedText
              style={[styles.heroSub, { color: colors.textSecondary }]}
            >
              {displayAge} yrs
              {displayCity.split(", ")[0]
                ? `  ·  ${displayCity.split(", ")[0]}`
                : ""}
            </ThemedText>

            {displayBio ? (
              <ThemedText
                style={[styles.heroBio, { color: colors.textSecondary }]}
              >
                {displayBio}
              </ThemedText>
            ) : null}

            {/* Quick-stat chips row */}
            <View style={styles.quickChipsRow}>
              {displayRole && displayRole !== "Not set" && (
                <View
                  style={[
                    styles.quickChip,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name="briefcase-outline"
                    size={12}
                    color="#FF4D8D"
                  />
                  <ThemedText style={styles.quickChipText} numberOfLines={1}>
                    {displayRole}
                  </ThemedText>
                </View>
              )}
              {displayEducation && displayEducation !== "--" && (
                <View
                  style={[
                    styles.quickChip,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Ionicons name="school-outline" size={12} color="#FF4D8D" />
                  <ThemedText style={styles.quickChipText} numberOfLines={1}>
                    {displayEducation}
                  </ThemedText>
                </View>
              )}
              {displayHeight && displayHeight !== "--" && (
                <View
                  style={[
                    styles.quickChip,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Ionicons name="resize-outline" size={12} color="#FF4D8D" />
                  <ThemedText style={styles.quickChipText}>
                    {displayHeight}
                  </ThemedText>
                </View>
              )}
            </View>

            {/* Interests tags */}
            {displayInterests && displayInterests.length > 0 && (
              <View style={styles.interestTagRow}>
                {displayInterests.slice(0, 4).map((item: string, i: number) => (
                  <View key={i} style={styles.interestTag}>
                    <ThemedText style={styles.interestTagText}>
                      {item}
                    </ThemedText>
                  </View>
                ))}
              </View>
            )}

            {/* ── Action button (other profile) ── */}
            {/* {isOtherProfileView && (
              <View style={styles.actionRow}>
                {matchScore !== null && (
                  <View style={[styles.matchBadge, { borderColor: `${matchScoreColor}33`, backgroundColor: `${matchScoreColor}11` }]}>
                    <ThemedText style={[styles.matchPct, { color: matchScoreColor }]}>{matchScore}%</ThemedText>
                    <ThemedText style={[styles.matchLbl, { color: matchScoreColor }]}>Match</ThemedText>
                  </View>
                )}
              </View>
            )} */}
          </View>

          {/* ── Connect Button (other profile) — full-width or side-by-side decline/approve ── */}
          {isOtherProfileView && (
            <View style={styles.connectSection}>
              {interestStatus === "PENDING" && !isInterestSender ? (
                <View style={styles.profileActionRow}>
                  <TouchableOpacity
                    style={[
                      styles.profileDeclineBtn,
                      {
                        backgroundColor: isDark ? colors.card : "#FFFFFF",
                        borderColor: "#D32F2F",
                      },
                    ]}
                    onPress={handleDeclinePress}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="close-circle-outline"
                      size={15}
                      color="#D32F2F"
                    />
                    <ThemedText
                      style={[
                        styles.profileActionBtnText,
                        { color: "#D32F2F" },
                      ]}
                    >
                      Decline Request
                    </ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.profileApproveBtn,
                      {
                        backgroundColor: isDark ? colors.card : "#FFFFFF",
                        borderColor: "#2E7D32",
                      },
                    ]}
                    onPress={handleConnectPress}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={15}
                      color="#2E7D32"
                    />
                    <ThemedText
                      style={[
                        styles.profileActionBtnText,
                        { color: "#2E7D32" },
                      ]}
                    >
                      Accept Request
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.connectBtnFull,
                    {
                      backgroundColor: isDark ? colors.card : "#FFFFFF",
                      borderColor: buttonConfig.tintColor,
                    },
                  ]}
                  onPress={handleConnectPress}
                  disabled={buttonConfig.disabled}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={buttonConfig.icon}
                    size={15}
                    color={buttonConfig.tintColor}
                  />
                  <ThemedText
                    style={[
                      styles.connectBtnFullText,
                      { color: buttonConfig.tintColor },
                    ]}
                  >
                    {buttonConfig.label}
                  </ThemedText>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* ── Divider ── */}
          <View
            style={[styles.sectionDivider, { borderColor: colors.border }]}
          />

          {/* ── Biodata row (own profile only) + See More button ── */}
          <View style={styles.belowHeroSection}>
            {/* See More Info Button */}
            <TouchableOpacity
              style={[
                styles.seeMoreBtn,
                { borderColor: colors.border, backgroundColor: colors.card },
              ]}
              onPress={() => setShowInfoModal(!showInfoModal)}
              activeOpacity={0.75}
            >
              <Ionicons
                name="information-circle-outline"
                size={16}
                color="#FF4D8D"
              />
              <ThemedText
                style={[styles.seeMoreBtnText, { color: colors.text }]}
              >
                See More Information
              </ThemedText>
              <Ionicons
                name={showInfoModal ? "chevron-up" : "chevron-down"}
                size={16}
                color={colors.muted}
              />
            </TouchableOpacity>

            {/* ── Expandable Info Card (replaces the popup) ── */}
            {showInfoModal && (
              <View
                style={[
                  styles.infoExpandCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                {[
                  {
                    icon: "briefcase-outline" as const,
                    label: "Profession",
                    value: displayRole,
                  },
                  {
                    icon: "school-outline" as const,
                    label: "Education",
                    value: displayEducation,
                  },
                  {
                    icon: "location-outline" as const,
                    label: "Location",
                    value: displayCity || "--",
                  },
                  {
                    icon: "resize-outline" as const,
                    label: "Height",
                    value: displayHeight,
                  },
                  {
                    icon: "male-female-outline" as const,
                    label: "Gender",
                    value:
                      displayGender.charAt(0).toUpperCase() +
                      displayGender.slice(1),
                  },
                  {
                    icon: "calendar-outline" as const,
                    label: "Age",
                    value: `${displayAge} years`,
                  },
                  {
                    icon: "close-circle-outline" as const,
                    label: "Smoking",
                    value: t("no"),
                  },
                  {
                    icon: "wine-outline" as const,
                    label: "Drinking",
                    value: t("no"),
                  },
                ]
                  .filter(
                    (r) => r.value && r.value !== "--" && r.value !== "Not set",
                  )
                  .map(({ icon, label, value }, idx, arr) => (
                    <View
                      key={idx}
                      style={[
                        styles.infoDialogRow,
                        {
                          borderBottomColor: colors.border,
                          borderBottomWidth:
                            idx < arr.length - 1 ? StyleSheet.hairlineWidth : 0,
                          paddingHorizontal: 0,
                        },
                      ]}
                    >
                      <Ionicons
                        name={icon}
                        size={15}
                        color="#FF4D8D"
                        style={{ width: 22 }}
                      />
                      <ThemedText
                        style={[
                          styles.infoDialogLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {label}
                      </ThemedText>
                      <ThemedText
                        style={[styles.infoDialogValue, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {value}
                      </ThemedText>
                    </View>
                  ))}

                {/* {hasBiodata && (
                  <TouchableOpacity
                    style={[
                      styles.infoDialogRow,
                      { borderBottomWidth: 0, paddingHorizontal: 0 },
                    ]}
                    onPress={handleViewBiodata}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="document-text-outline"
                      size={15}
                      color="#FF4D8D"
                      style={{ width: 22 }}
                    />
                    <ThemedText
                      style={[
                        styles.infoDialogLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Biodata
                    </ThemedText>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <ThemedText
                        style={[styles.infoDialogValue, { color: "#FF4D8D" }]}
                      >
                        View PDF
                      </ThemedText>
                      <Ionicons name="open-outline" size={12} color="#FF4D8D" />
                    </View>
                  </TouchableOpacity>
                )} */}
                {displayInterests && displayInterests.length > 0 && (
                  <View style={styles.infoExpandInterests}>
                    <ThemedText
                      style={[
                        styles.infoDialogLabel,
                        { color: colors.textSecondary, marginBottom: 8 },
                      ]}
                    >
                      Interests
                    </ThemedText>
                    <View style={styles.infoDialogTagsRow}>
                      {displayInterests.map((item: string, i: number) => (
                        <View key={i} style={styles.infoDialogTag}>
                          <ThemedText style={styles.infoDialogTagText}>
                            {item}
                          </ThemedText>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* ── Personal & Family Information Section (Matching expand look as See More Information) ── */}
            {isConnected && (
              <>
                <TouchableOpacity
                  style={[
                    styles.seeMoreBtn,
                    { borderColor: colors.border, backgroundColor: colors.card, marginTop: 4 },
                  ]}
                  onPress={() => setShowPersonalInfoExpand(!showPersonalInfoExpand)}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name="people-outline"
                    size={16}
                    color="#FF4D8D"
                  />
                  <ThemedText
                    style={[styles.seeMoreBtnText, { color: colors.text }]}
                  >
                    Personal &amp; Family Information
                  </ThemedText>
                  <Ionicons
                    name={showPersonalInfoExpand ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={colors.muted}
                  />
                </TouchableOpacity>

                {showPersonalInfoExpand && (
                  <View
                    style={[
                      styles.infoExpandCard,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}
                  >
                    {(() => {
                      const rawPi = displayPersonalInfo;
                      const pi = Array.isArray(rawPi) ? (rawPi[0] || {}) : (rawPi || {});
                      const targetProfile = isOtherProfileView ? (otherUser?.profile || (otherUser as any)?.user?.profile) : user?.profile;
                      const targetUserObj = isOtherProfileView ? ((otherUser as any)?.user || otherUser) : user;

                      const targetDob = pi.dateOfBirth
                        ? String(pi.dateOfBirth).split("T")[0]
                        : targetProfile?.dateOfBirth
                          ? String(targetProfile.dateOfBirth).split("T")[0]
                          : undefined;

                      const targetEmail = pi.email || (targetUserObj as any)?.email;
                      const targetAddress = pi.address;
                      const targetCity = pi.city || targetProfile?.city;
                      const targetState = pi.state || targetProfile?.state;
                      const targetReligion = pi.religion || (targetProfile as any)?.religion;
                      const targetCaste = pi.caste || (targetProfile as any)?.caste;
                      const targetFatherName = isOtherProfileView ? pi.fatherName : (pi.fatherName || fatherName);
                      const targetFatherMobile = pi.fatherMobileNumber || (pi as any)?.fatherMobile;
                      const targetFatherOcc = pi.fatherOccupation;
                      const targetMotherName = isOtherProfileView ? pi.motherName : (pi.motherName || motherName);
                      const targetMotherOcc = pi.motherOccupation;

                      const numBrothers = pi.numberOfBrothers !== undefined && pi.numberOfBrothers !== null ? pi.numberOfBrothers : (pi as any)?.numberOfBrothers;
                      const marriedBrothers = pi.marriedBrothers !== undefined && pi.marriedBrothers !== null ? pi.marriedBrothers : (pi as any)?.marriedBrothers;

                      const brothersVal =
                        numBrothers !== undefined && numBrothers !== null
                          ? `${numBrothers} (${marriedBrothers || 0} married)`
                          : undefined;

                      const numSisters = pi.numberOfSisters !== undefined && pi.numberOfSisters !== null ? pi.numberOfSisters : (pi as any)?.numberOfSisters;
                      const marriedSisters = pi.marriedSisters !== undefined && pi.marriedSisters !== null ? pi.marriedSisters : (pi as any)?.marriedSisters;

                      const sistersVal =
                        numSisters !== undefined && numSisters !== null
                          ? `${numSisters} (${marriedSisters || 0} married)`
                          : undefined;

                      const items = [
                        { icon: "calendar-outline" as const, label: "Date of Birth", value: targetDob },
                        { icon: "home-outline" as const, label: "Address", value: targetAddress },
                        { icon: "location-outline" as const, label: "City", value: targetCity },
                        { icon: "map-outline" as const, label: "State", value: targetState },
                        { icon: "flower-outline" as const, label: "Religion", value: targetReligion },
                        { icon: "bookmarks-outline" as const, label: "Caste", value: targetCaste },
                        { icon: "man-outline" as const, label: "Father's Name", value: targetFatherName },
                        { icon: "call-outline" as const, label: "Father's Mobile", value: targetFatherMobile },
                        { icon: "briefcase-outline" as const, label: "Father's Occupation", value: targetFatherOcc },
                        { icon: "woman-outline" as const, label: "Mother's Name", value: targetMotherName },
                        { icon: "briefcase-outline" as const, label: "Mother's Occupation", value: targetMotherOcc },
                        { icon: "people-outline" as const, label: "Brothers", value: brothersVal },
                        { icon: "people-outline" as const, label: "Sisters", value: sistersVal },
                      ].filter((item) => item.value !== undefined && item.value !== null && String(item.value).trim() !== "" && String(item.value) !== "undefined");

                      if (items.length === 0) {
                        return (
                          <View style={{ paddingVertical: 14, alignItems: "center", justifyContent: "center", gap: 6 }}>
                            <Ionicons name="information-circle-outline" size={20} color="#FF4D8D" />
                            <ThemedText style={{ fontSize: 13, color: colors.muted, textAlign: "center" }}>
                              No personal or family details added yet.
                            </ThemedText>
                          </View>
                        );
                      }

                      return items.map(({ icon, label, value }, idx, arr) => (
                        <View
                          key={idx}
                          style={[
                            styles.infoDialogRow,
                            {
                              borderBottomColor: colors.border,
                              borderBottomWidth:
                                idx < arr.length - 1 ? StyleSheet.hairlineWidth : 0,
                              paddingHorizontal: 0,
                            },
                          ]}
                        >
                          <Ionicons
                            name={icon}
                            size={15}
                            color="#FF4D8D"
                            style={{ width: 22 }}
                          />
                          <ThemedText
                            style={[
                              styles.infoDialogLabel,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {label}
                          </ThemedText>
                          <ThemedText
                            style={[styles.infoDialogValue, { color: colors.text }]}
                            numberOfLines={1}
                          >
                            {value}
                          </ThemedText>
                        </View>
                      ));
                    })()}

                    {!isOtherProfileView && (
                      <TouchableOpacity
                        style={{
                          marginTop: 10,
                          paddingTop: 10,
                          alignItems: "center",
                          justifyContent: "center",
                          borderTopWidth: StyleSheet.hairlineWidth,
                          borderTopColor: colors.border,
                        }}
                        onPress={() => router.push("/edit-profile")}
                      >
                        <ThemedText style={{ fontSize: 12.5, color: "#FF4D8D", fontWeight: "700" }}>
                          Edit Personal &amp; Family Information
                        </ThemedText>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </>
            )}

            {/* Privacy Lock Banner for Unconnected Profiles — 1 line clickable row */}
            {isOtherProfileView && !isConnected && (
              <TouchableOpacity
                style={[
                  styles.biodataRow,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    marginTop: 14,
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  },
                ]}
                activeOpacity={0.8}
                onPress={() => setShowPrivacyLockedModal(true)}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1, paddingRight: 6 }}>
                  <View style={[styles.biodataIconDot, { backgroundColor: "rgba(255,77,141,0.12)", width: 32, height: 32 }]}>
                    <Ionicons name="lock-closed-outline" size={15} color="#FF4D8D" />
                  </View>
                  <ThemedText style={{ fontSize: 13, fontWeight: "600", color: colors.text, flex: 1 }} numberOfLines={1}>
                    Private Information Locked (Biodata & Family Details)
                  </ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
              </TouchableOpacity>
            )}

            {/* ── Privacy Locked Modal ── */}
            <Modal visible={showPrivacyLockedModal} transparent animationType="fade">
              <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 20 }}>
                <View style={{ width: "90%", maxWidth: 360, backgroundColor: colors.card, borderRadius: 20, padding: 24, alignItems: "center" }}>
                  <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(255,77,141,0.12)", justifyContent: "center", alignItems: "center", marginBottom: 16 }}>
                    <Ionicons name="lock-closed" size={28} color="#FF4D8D" />
                  </View>

                  <ThemedText style={{ fontSize: 18, fontWeight: "700", color: colors.text, textAlign: "center", marginBottom: 8 }}>
                    Private Information Locked
                  </ThemedText>

                  <ThemedText style={{ fontSize: 13, color: colors.textSecondary, textAlign: "center", lineHeight: 20, marginBottom: 22 }}>
                    Biodata PDF and Family Information are only visible once {displayName} accepts your connection request.
                  </ThemedText>

                  {/* Connection Button — exact same function & styling as profile connection button */}
                  <TouchableOpacity
                    style={{
                      width: "100%",
                      height: 48,
                      borderRadius: 12,
                      backgroundColor: isDark ? colors.card : "#FFFFFF",
                      borderWidth: 1.5,
                      borderColor: buttonConfig.tintColor,
                      flexDirection: "row",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 10,
                    }}
                    disabled={buttonConfig.disabled}
                    onPress={() => {
                      setShowPrivacyLockedModal(false);
                      handleConnectPress();
                    }}
                  >
                    <Ionicons name={buttonConfig.icon} size={18} color={buttonConfig.tintColor} />
                    <ThemedText style={{ fontSize: 14, fontWeight: "700", color: buttonConfig.tintColor }}>
                      {buttonConfig.label}
                    </ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{ paddingVertical: 10 }}
                    onPress={() => setShowPrivacyLockedModal(false)}
                  >
                    <ThemedText style={{ fontSize: 13.5, color: colors.muted, fontWeight: "600" }}>
                      Close
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            {/* In-App PDF Viewer Modal */}
            <InAppPdfModal
              visible={showPdfModal}
              pdfUrl={pdfUrlToView}
              title={`${displayName}'s Biodata`}
              onClose={() => setShowPdfModal(false)}
            />

            {/* Biodata row — visible to owner or connected friends */}
            {isConnected && (
              <TouchableOpacity
                style={[
                  styles.biodataRow,
                  { borderColor: colors.border, backgroundColor: colors.card },
                ]}
                activeOpacity={hasBiodata ? 0.75 : 1}
                onPress={hasBiodata ? handleViewBiodata : undefined}
              >
                <View style={styles.detailLeft}>
                  <View style={styles.biodataIconDot}>
                    <Ionicons
                      name="document-text-outline"
                      size={16}
                      color="#FF4D8D"
                    />
                  </View>
                  <View>
                    <ThemedText
                      style={[styles.detailLabel, { color: colors.text }]}
                    >
                      Biodata
                    </ThemedText>
                    <ThemedText
                      style={{
                        fontSize: 11,
                        color: colors.muted,
                        marginTop: 2,
                      }}
                    >
                      {hasBiodata
                        ? biodataObj?.isGenerated
                          ? "Generated PDF · tap to view"
                          : "Uploaded PDF · tap to view"
                        : "Not added yet"}
                    </ThemedText>
                  </View>
                </View>
                {!isOtherProfileView ? (
                  hasBiodata ? (
                    <TouchableOpacity
                      style={[
                        styles.biodataRoundBtn,
                        { backgroundColor: "rgba(255, 77, 141, 0.12)", borderColor: "rgba(255, 77, 141, 0.3)", borderWidth: 1 },
                      ]}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        handleUpdateBiodata();
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="pencil-sharp" size={15} color="#FF4D8D" />
                    </TouchableOpacity>
                  ) : (
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      <TouchableOpacity
                        style={styles.biodataMiniBtn}
                        onPress={handleUploadBiodata}
                      >
                        <Ionicons
                          name="cloud-upload-outline"
                          size={11}
                          color={colors.text}
                        />
                        <ThemedText style={styles.biodataMiniBtnText}>
                          Upload
                        </ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.biodataMiniBtn, styles.biodataMiniBtnPink]}
                        onPress={() => setShowGenerateModal(true)}
                      >
                        <Ionicons
                          name="sparkles-outline"
                          size={11}
                          color="#fff"
                        />
                        <ThemedText
                          style={[styles.biodataMiniBtnText, { color: "#fff" }]}
                        >
                          Create
                        </ThemedText>
                      </TouchableOpacity>
                    </View>
                  )
                ) : (
                  hasBiodata ? (
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={colors.muted}
                    />
                  ) : null
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* ── Success Story Section (Only render if user has added a success story) ── */}
          {activeSuccessStory ? (
            <>
              <View style={[styles.sectionDivider, { borderColor: colors.border }]} />
              <View style={{ paddingHorizontal: 20, marginVertical: 12 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <ThemedText style={{ fontSize: 16 }}>💍</ThemedText>
                    <ThemedText style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>
                      Success Story
                    </ThemedText>
                  </View>
                  {!isOtherProfileView && (
                    <TouchableOpacity
                      style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                      onPress={() => router.push("/success-stories")}
                    >
                      <Ionicons name="eye-outline" size={16} color="#FF4D8D" />
                      <ThemedText style={{ fontSize: 12, fontWeight: "600", color: "#FF4D8D" }}>
                        View All
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>
                        {activeSuccessStory.title}
                      </ThemedText>
                      {activeSuccessStory.partnerName ? (
                        <ThemedText style={{ fontSize: 12, color: "#FF4D8D", marginTop: 2, fontWeight: "600" }}>
                          ❤️ Married with {activeSuccessStory.partnerName}
                        </ThemedText>
                      ) : null}
                    </View>
                    {!isOtherProfileView && (
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        <TouchableOpacity
                          style={{ padding: 6, borderRadius: 8, backgroundColor: "rgba(255,77,141,0.1)" }}
                          onPress={() => router.push("/success-stories")}
                        >
                          <Ionicons name="add" size={16} color="#FF4D8D" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{ padding: 6, borderRadius: 8, backgroundColor: "rgba(211,47,47,0.1)" }}
                          onPress={handleDeleteSuccessStory}
                        >
                          <Ionicons name="trash-outline" size={14} color="#D32F2F" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                  <ThemedText style={{ fontSize: 12.5, color: colors.textSecondary, marginTop: 8, fontStyle: "italic", lineHeight: 18 }} numberOfLines={4}>
                    "{activeSuccessStory.story}"
                  </ThemedText>
                </View>
              </View>
            </>
          ) : null}

          {/* ── Divider ── */}
          <View
            style={[styles.sectionDivider, { borderColor: colors.border }]}
          />

          {/* ── Photos Grid ── */}
          {(galleryPhotos.length > 0 || !isOtherProfileView) && (
            <View style={styles.photoGridSection}>
              {/* Gallery Section Header with Selection Controls */}
              <View style={styles.photoSectionHeader}>
                <ThemedText style={[styles.photoSectionTitle, { color: colors.text }]}>
                  {isMr ? "गॅलरी" : "Gallery"} ({galleryPhotos.length})
                </ThemedText>
                
                {!isOtherProfileView && galleryPhotos.length > 0 && (
                  <View style={styles.photoActionButtons}>
                    {isSelectionMode ? (
                      <>
                        <TouchableOpacity 
                          style={[styles.manageBtn, { marginRight: 8 }]} 
                          onPress={handleDeleteSelectedPhotos}
                          disabled={selectedPhotoIds.size === 0}
                        >
                          <ThemedText style={[styles.manageBtnText, { color: selectedPhotoIds.size === 0 ? colors.muted : '#ff4d4d', fontWeight: '700' }]}>
                            {isMr ? `हटवा (${selectedPhotoIds.size})` : `Delete (${selectedPhotoIds.size})`}
                          </ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.manageBtn} 
                          onPress={cancelSelectionMode}
                        >
                          <ThemedText style={[styles.manageBtnText, { color: colors.textSecondary }]}>
                            {isMr ? "रद्द करा" : "Cancel"}
                          </ThemedText>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <TouchableOpacity 
                        style={styles.manageBtn} 
                        onPress={() => setIsSelectionMode(true)}
                      >
                        <ThemedText style={[styles.manageBtnText, { color: '#FF4D8D' }]}>
                          {isMr ? "निवडा" : "Select"}
                        </ThemedText>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>

              {loadingPhotos && !isOtherProfileView ? (
                <ActivityIndicator color="#FF4D8D" style={{ marginTop: 16 }} />
              ) : galleryPhotos.length > 0 ? (
                <FlatList
                  data={galleryPhotos}
                  scrollEnabled={false}
                  numColumns={3}
                  keyExtractor={(item) => item.id.toString()}
                  columnWrapperStyle={styles.photoRow}
                  renderItem={({ item }) => {
                    const isSelected = selectedPhotoIds.has(item.id);
                    return (
                      <TouchableOpacity
                        style={[
                          styles.photoThumb,
                          isSelected && { borderColor: '#FF4D8D', borderWidth: 2 }
                        ]}
                        onPress={() => handlePhotoPress(item)}
                      >
                        <Image
                          source={{ uri: getPhotoUrl(item.photoUrl) }}
                          style={[
                            styles.photoThumbImg,
                            isSelected && { opacity: 0.7 }
                          ]}
                        />
                        {isSelected && (
                          <View style={styles.selectCheckboxOverlay}>
                            <Ionicons name="checkmark-circle" size={18} color="#FF4D8D" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  }}
                />
              ) : !isOtherProfileView ? (
                <TouchableOpacity
                  style={[
                    styles.noPhotosPlaceholder,
                    { borderColor: colors.border, paddingVertical: 32, borderStyle: 'dashed', borderWidth: 1.5, borderRadius: 16 }
                  ]}
                  onPress={handleUploadGalleryPhoto}
                  disabled={uploadingGalleryPhoto}
                >
                  {uploadingGalleryPhoto ? (
                    <ActivityIndicator color="#FF4D8D" size="small" />
                  ) : (
                    <>
                      <Ionicons
                        name="add-circle-outline"
                        size={48}
                        color="#FF4D8D"
                      />
                      <ThemedText
                        style={[styles.noPhotosText, { color: colors.muted }]}
                      >
                        {isMr ? "फोटो जोडा" : "Add Photo"}
                      </ThemedText>
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <View
                  style={[
                    styles.noPhotosPlaceholder,
                    { borderColor: colors.border },
                  ]}
                >
                  <Ionicons
                    name="images-outline"
                    size={28}
                    color={colors.muted}
                  />
                  <ThemedText
                    style={[styles.noPhotosText, { color: colors.muted }]}
                  >
                    No photos yet
                  </ThemedText>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Generate Biodata Modal */}
        <Modal visible={showGenerateModal} animationType="slide" transparent>
          <View
            style={[
              styles.modalOverlay,
              { backgroundColor: colors.modalOverlay },
            ]}
          >
            <View
              style={[styles.modalContent, { backgroundColor: colors.card }]}
            >
              <View
                style={[
                  styles.modalHeader,
                  { borderBottomColor: colors.border },
                ]}
              >
                <View>
                  <ThemedText style={styles.modalTitle}>
                    Generate Biodata PDF
                  </ThemedText>
                  <ThemedText style={[styles.verifySubtitle, { color: colors.muted }]}>
                    Review your saved information
                  </ThemedText>
                </View>
                <TouchableOpacity onPress={() => setShowGenerateModal(false)}>
                  <Ionicons name="close" size={22} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView
                contentContainerStyle={styles.modalForm}
                showsVerticalScrollIndicator={false}
              >
                {/* Profile Details */}
                <ThemedText style={[styles.verifySectionLabel, { color: "#FF4D8D" }]}>
                  Profile Details
                </ThemedText>
                <View style={[styles.verifyInfoCard, { backgroundColor: colors.card2, borderColor: colors.border }]}>
                  {[
                    { label: "Name", value: ownName },
                    { label: "Age", value: ownAge ? `${ownAge} yrs` : "—" },
                    { label: "Gender", value: profile?.gender || "—" },
                    { label: "City", value: profile?.city || "—" },
                    { label: "Profession", value: profile?.profession || "—" },
                    { label: "Education", value: profile?.education || "—" },
                  ].map((item, i, arr) => (
                    <View
                      key={item.label}
                      style={[
                        styles.verifyInfoRow,
                        i < arr.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                      ]}
                    >
                      <ThemedText style={[styles.verifyInfoLabel, { color: colors.muted }]}>{item.label}</ThemedText>
                      <ThemedText style={[styles.verifyInfoValue, { color: colors.text }]}>{item.value}</ThemedText>
                    </View>
                  ))}
                </View>

                {/* Family Details */}
                <ThemedText style={[styles.verifySectionLabel, { color: "#FF4D8D" }]}>
                  Personal &amp; Family Information
                </ThemedText>
                <View style={[styles.verifyInfoCard, { backgroundColor: colors.card2, borderColor: colors.border }]}>
                  {[
                    { label: "Father's Name", value: displayPersonalInfo?.fatherName || "—" },
                    { label: "Father's Occupation", value: displayPersonalInfo?.fatherOccupation || "—" },
                    { label: "Mother's Name", value: displayPersonalInfo?.motherName || "—" },
                    { label: "Mother's Occupation", value: displayPersonalInfo?.motherOccupation || "—" },
                    { label: "Brothers", value: displayPersonalInfo?.numberOfBrothers !== undefined ? `${displayPersonalInfo.numberOfBrothers} (${displayPersonalInfo.marriedBrothers || 0} married)` : "—" },
                    { label: "Sisters", value: displayPersonalInfo?.numberOfSisters !== undefined ? `${displayPersonalInfo.numberOfSisters} (${displayPersonalInfo.marriedSisters || 0} married)` : "—" },
                    { label: "Address", value: displayPersonalInfo?.address || "—" },
                    { label: "City", value: displayPersonalInfo?.city || "—" },
                    { label: "State", value: displayPersonalInfo?.state || "—" },
                  ].map((item, i, arr) => (
                    <View
                      key={item.label}
                      style={[
                        styles.verifyInfoRow,
                        i < arr.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                      ]}
                    >
                      <ThemedText style={[styles.verifyInfoLabel, { color: colors.muted }]}>{item.label}</ThemedText>
                      <ThemedText style={[styles.verifyInfoValue, { color: colors.text }]}>{item.value}</ThemedText>
                    </View>
                  ))}
                </View>

                {(!displayPersonalInfo?.fatherName || !displayPersonalInfo?.motherName) && (
                  <View style={[styles.verifyMissingNote, { backgroundColor: "rgba(255,77,141,0.08)", borderColor: "rgba(255,77,141,0.25)" }]}>
                    <Ionicons name="information-circle-outline" size={14} color="#FF4D8D" />
                    <ThemedText style={[styles.verifyMissingText, { color: "#FF4D8D" }]}>
                      Some details are missing. Update them in Edit Profile → Family &amp; Personal Details.
                    </ThemedText>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.submitGenerateButton, generatingBiodata && { opacity: 0.7 }]}
                  onPress={handleGenerateBiodata}
                  disabled={generatingBiodata}
                >
                  {generatingBiodata ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="sparkles" size={18} color="#fff" />
                      <ThemedText style={styles.submitGenerateButtonText}>
                        ✨ Generate &amp; Save Biodata PDF
                      </ThemedText>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Update Biodata Modal */}
        <Modal visible={showUpdateModal} animationType="slide" transparent>
          <View
            style={[
              styles.modalOverlay,
              { backgroundColor: colors.modalOverlay },
            ]}
          >
            <View
              style={[
                styles.modalContent,
                { backgroundColor: colors.card, paddingBottom: 40 },
              ]}
            >
              <View
                style={[
                  styles.modalHeader,
                  { borderBottomColor: colors.border },
                ]}
              >
                <ThemedText style={styles.modalTitle}>
                  Update Biodata
                </ThemedText>
                <TouchableOpacity onPress={() => setShowUpdateModal(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.updateModalBody}>
                <TouchableOpacity
                  style={[
                    styles.updateOptionBtn,
                    { backgroundColor: colors.card2 },
                  ]}
                  onPress={() => {
                    setShowUpdateModal(false);
                    handleUploadBiodata();
                  }}
                >
                  <View
                    style={[
                      styles.updateOptionIconBox,
                      { backgroundColor: "rgba(30, 106, 210, 0.1)" },
                    ]}
                  >
                    <Ionicons
                      name="cloud-upload-outline"
                      size={20}
                      color="#1E6AD2"
                    />
                  </View>
                  <View style={styles.updateOptionInfo}>
                    <ThemedText style={styles.updateOptionTitle}>
                      Update new PDF
                    </ThemedText>
                    <ThemedText style={styles.updateOptionSub}>
                      Choose a compiled PDF file from your device
                    </ThemedText>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colors.muted}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.updateOptionBtn,
                    { backgroundColor: colors.card2 },
                  ]}
                  onPress={() => {
                    setShowUpdateModal(false);
                    setShowGenerateModal(true);
                  }}
                >
                  <View
                    style={[
                      styles.updateOptionIconBox,
                      { backgroundColor: "rgba(255, 77, 141, 0.1)" },
                    ]}
                  >
                    <Ionicons
                      name="sparkles-outline"
                      size={20}
                      color="#FF4D8D"
                    />
                  </View>
                  <View style={styles.updateOptionInfo}>
                    <ThemedText style={styles.updateOptionTitle}>
                      Generate new PDF
                    </ThemedText>
                    <ThemedText style={styles.updateOptionSub}>
                      Instantly build a fresh PDF from your details
                    </ThemedText>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colors.muted}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Full Photo Preview Modal */}
        <Modal 
          visible={!!selectedPhoto} 
          transparent={false} 
          statusBarTranslucent={true} 
          animationType="slide"
          onRequestClose={() => setSelectedPhoto(null)}
        >
          <SafeAreaView
            style={[
              styles.previewContainer,
              { backgroundColor: colors.background },
            ]}
            edges={["top", "bottom"]}
          >
            {/* Header bar of modal */}
            <View
              style={[
                styles.previewHeader,
                { borderBottomColor: colors.border },
              ]}
            >
              <TouchableOpacity
                style={styles.previewCloseButton}
                onPress={() => setSelectedPhoto(null)}
              >
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <ThemedText style={styles.previewTitle}>
                {isOtherProfileView
                  ? isMr
                    ? "गॅलरी"
                    : "Gallery"
                  : isMr
                    ? "माझी गॅलरी"
                    : "My Gallery"}
              </ThemedText>
              <View style={{ width: 40 }} />
            </View>

            {/* Vertical scroll list of posts */}
            <FlatList
              ref={photoFlatListRef}
              data={galleryPhotos}
              keyExtractor={(item) => item.id.toString()}
              initialScrollIndex={
                galleryPhotos.indexOf(selectedPhoto!) !== -1
                  ? galleryPhotos.indexOf(selectedPhoto!)
                  : 0
              }
              onScrollToIndexFailed={(info) => {
                setTimeout(() => {
                  photoFlatListRef.current?.scrollToIndex({
                    index: info.index,
                    animated: false,
                  });
                }, 100);
              }}
              renderItem={({ item }) => {
                const imgUrl = getPhotoUrl(item.photoUrl);
                return (
                  <View style={styles.instagramPostCard}>
                    {/* Post Header */}
                    {!isOtherProfileView ? (
                      <View style={[styles.instagramPostHeader, { justifyContent: 'flex-end', paddingVertical: 8 }]}>
                        <TouchableOpacity
                          style={styles.postDeleteBtn}
                          onPress={() => handleDeletePhoto(item.id)}
                        >
                          <Ionicons
                            name="ellipsis-horizontal"
                            size={22}
                            color={colors.text}
                          />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={{ height: 12 }} />
                    )}
                    {/* Post Image */}
                    <Image
                      source={{ uri: imgUrl }}
                      style={styles.instagramPostImage}
                    />
                  </View>
                );
              }}
              showsVerticalScrollIndicator={false}
            />
          </SafeAreaView>
        </Modal>

        {/* Custom Delete Single Photo Modal */}
        <Modal
          visible={photoToDeleteId !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setPhotoToDeleteId(null)}
        >
          <View style={styles.deleteModalOverlay}>
            <View style={[styles.customDeleteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* Top Right Cross Icon */}
              <TouchableOpacity
                style={styles.modalCrossBtn}
                onPress={() => setPhotoToDeleteId(null)}
              >
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>

              <Ionicons
                name="alert-circle-outline"
                size={40}
                color="#ff4d4d"
                style={{ marginBottom: 14 }}
              />

              <ThemedText style={[styles.customDeleteTitle, { color: colors.text }]}>
                {isMr ? "फोटो हटवा" : "Delete Photo"}
              </ThemedText>

              <ThemedText style={[styles.customDeleteMsg, { color: colors.textSecondary }]}>
                {isMr
                  ? "तुम्हाला खात्री आहे की तुम्ही हा फोटो हटवू इच्छिता?"
                  : "Are you sure you want to delete this photo?"}
              </ThemedText>

              <TouchableOpacity
                style={styles.customDeleteConfirmBtn}
                onPress={confirmDeleteSinglePhoto}
              >
                <ThemedText style={styles.customDeleteConfirmBtnText}>
                  {isMr ? "हटवा" : "Delete"}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
      <BottomNavigation
        activeRouteOverride={isOtherProfileView ? "/search" : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  container: { flex: 1 },

  // Photo selection layout styles
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  customDeleteCard: {
    width: '100%',
    maxWidth: 300,
    borderRadius: 20,
    borderWidth: 1.2,
    padding: 24,
    alignItems: 'center',
    position: 'relative',
  },
  modalCrossBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customDeleteTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  customDeleteMsg: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 6,
  },
  customDeleteConfirmBtn: {
    backgroundColor: '#ff4d4d',
    width: '100%',
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customDeleteConfirmBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  photoSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  photoSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  photoActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  manageBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  manageBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  selectCheckboxOverlay: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },

  // ── Top bar ──
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  topBarTitle: { fontSize: 17, fontWeight: "700" },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  settingButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  settingPlaceholder: { width: 36 },

  // ── Hero ──
  heroSection: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
  },
  avatarRing: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2,
    borderColor: "#FF4D8D",
    padding: 2,
    marginBottom: 8,
  },
  heroAvatar: {
    width: "100%",
    height: "100%",
    borderRadius: 43,
  },
  detailCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  detailHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  detailCardTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  detailDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginVertical: 8,
  },
  heroNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginBottom: 2,
  },
  heroName: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
    textAlign: "center",
  },
  heroSub: {
    fontSize: 12.5,
    fontWeight: "500",
    marginBottom: 4,
  },
  heroBio: {
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: "center",
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  quickChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 5,
    marginBottom: 6,
  },
  quickChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: StyleSheet.hairlineWidth,
  },
  quickChipText: {
    fontSize: 11.5,
    fontWeight: "600",
    maxWidth: 100,
  },
  interestTagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 5,
    marginBottom: 8,
  },
  interestTag: {
    backgroundColor: "rgba(255,77,141,0.10)",
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  interestTagText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#FF4D8D",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
    width: "100%",
  },
  matchBadge: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: "center",
    minWidth: 68,
  },
  matchPct: {
    fontSize: 17,
    fontWeight: "800",
  },
  matchLbl: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 1,
  },
  connectBtn: {
    flex: 1,
    height: 44,
    borderRadius: 100,
    backgroundColor: "#FF4D8D",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  connectBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },

  // ── Full-width connect button (other profile) ──
  connectSection: {
    paddingVertical: 6,
    alignItems: "center",
  },
  connectBtnFull: {
    height: 40,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1.2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  connectBtnFullText: {
    fontWeight: "700",
    fontSize: 13,
    letterSpacing: 0.2,
  },
  profileActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: "100%",
    paddingHorizontal: 20,
  },
  profileDeclineBtn: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  profileApproveBtn: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  profileActionBtnText: {
    fontWeight: "700",
    fontSize: 13,
    letterSpacing: 0.2,
  },

  // ── Below-hero section (See More + Biodata) ──
  belowHeroSection: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
    gap: 10,
  },
  seeMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  seeMoreBtnText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
  infoExpandCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  infoExpandHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  infoExpandAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "#FF4D8D",
  },
  infoExpandName: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 2,
  },
  infoExpandSub: {
    fontSize: 12,
    fontWeight: "500",
  },
  infoExpandDivider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 4,
  },
  infoExpandInterests: {
    paddingTop: 10,
  },
  biodataRoundBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,77,141,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,77,141,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  biodataRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  biodataIconDot: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,77,141,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Centered Info Dialog ──
  infoModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  infoModalDialog: {
    width: "100%",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 20,
  },
  infoModalCloseBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  infoDialogHeader: {
    alignItems: "center",
    paddingTop: 28,
    paddingBottom: 18,
    paddingHorizontal: 20,
  },
  infoDialogAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2.5,
    borderColor: "#FF4D8D",
    marginBottom: 10,
  },
  infoDialogName: {
    fontSize: 19,
    fontWeight: "800",
    marginBottom: 3,
  },
  infoDialogSub: {
    fontSize: 12,
    fontWeight: "500",
  },
  infoDialogDivider: {
    height: StyleSheet.hairlineWidth,
  },
  infoDialogRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  infoDialogLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
  },
  infoDialogValue: {
    fontSize: 13,
    fontWeight: "700",
    maxWidth: "50%",
    textAlign: "right",
  },
  infoDialogInterests: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  infoDialogTagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 6,
  },
  infoDialogTag: {
    backgroundColor: "rgba(255,77,141,0.10)",
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  infoDialogTagText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FF4D8D",
  },

  // ── Info Modal (legacy bottom-sheet kept for compat) ──
  infoModalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 0,
    maxHeight: "80%",
  },
  infoModalHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 14,
  },
  infoModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  infoModalTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  infoModalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  infoModalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  infoModalIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  infoModalLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  infoModalValue: {
    fontSize: 15,
    fontWeight: "700",
  },
  infoModalInterests: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  infoModalTagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  infoModalTag: {
    backgroundColor: "rgba(255,77,141,0.10)",
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  infoModalTagText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FF4D8D",
  },

  // ── Divider ──
  sectionDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginHorizontal: 0,
    marginVertical: 0,
  },

  // ── Details list ──
  detailsSection: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  detailLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "700",
    maxWidth: "55%",
    textAlign: "right",
  },

  // ── Photo grid ──
  photoGridSection: { paddingBottom: 8 },
  photoRow: { gap: 1.5, marginBottom: 1.5 },
  photoThumb: { width: (SW - 3) / 3, aspectRatio: 1, overflow: "hidden" },
  photoThumbImg: { width: "100%", height: "100%" },
  noPhotosPlaceholder: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  noPhotosText: { fontSize: 13 },

  // ── Biodata buttons (kept, used in detailsSection) ──
  biodataMiniBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,77,141,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,77,141,0.25)",
    borderRadius: 100,
    paddingHorizontal: 12,
    height: 32,
    gap: 5,
  },
  biodataMiniBtnPink: {
    backgroundColor: "#FF4D8D",
    borderColor: "#FF4D8D",
  },
  biodataMiniBtnText: {
    color: "#FF4D8D",
    fontSize: 12,
    fontWeight: "700",
  },

  // Legacy (kept for photo preview modal & biodata modals below)
  postSection: { marginTop: 28, paddingHorizontal: 16 },
  postTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16 },
  columnWrapper: {
    justifyContent: "flex-start",
    gap: 8,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  postContainer: {
    width: (SW - 48) / 3,
    aspectRatio: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  postImage: { width: "100%", height: "100%" },
  noPhotos: {
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    marginHorizontal: 16,
  },

  // Kept for backward compat in infoRow / miniChip used in modal sections
  infoRowsSection: {
    marginTop: 0,
    borderRadius: 0,
    overflow: "hidden",
    borderWidth: 0,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoRowLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  infoRowLabel: { fontSize: 13, fontWeight: "500", opacity: 0.65 },
  infoRowValue: {
    fontSize: 13,
    fontWeight: "700",
    maxWidth: "55%",
    textAlign: "right",
  },
  infoRowChips: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
    justifyContent: "flex-end",
    maxWidth: "60%",
  },
  miniChip: {
    backgroundColor: "rgba(255,77,141,0.1)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  miniChipText: { fontSize: 11, fontWeight: "600", color: "#FF4D8D" },
  ageBadge: {
    marginTop: 6,
  },
  ageBadgeText: {
    color: "#FF4D8D",
    fontSize: 12,
    fontWeight: "600",
  },
  instagramBioContainer: {
    marginTop: 14,
    paddingHorizontal: 2,
  },
  instagramBioText: {
    fontSize: 13,
    lineHeight: 19,
  },
  identityChip: {
    backgroundColor: "#1E1E24",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  identityChipText: { fontSize: 11, fontWeight: "600" },

  statsCardUnified: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#151519",
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 12,
    marginTop: 24,
  },
  statColumnUnified: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statDivider: {
    width: 1,
    height: 38,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  statLabelUnified: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValueUnified: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  statSubValueUnified: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 2,
  },
  topActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 20,
  },
  miniScoreCard: {
    backgroundColor: "#1C251D",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(59, 140, 88, 0.15)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 85,
  },
  miniScoreLabel: {
    color: "#8E9A90",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  miniScoreValue: {
    fontSize: 16,
    fontWeight: "800",
    marginTop: 2,
  },
  miniRequestButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#FF4D8D",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  miniRequestedButton: {
    backgroundColor: "#3B8C58",
  },
  miniRequestButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  infoCard: {
    backgroundColor: "#151519",
    borderRadius: 24,
    padding: 20,
    marginTop: 22,
  },
  cardTitle: { fontSize: 20, fontWeight: "700", marginBottom: 14 },
  lookingForRow: { flexDirection: "row", gap: 10 },
  lookingForChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#24242B",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  lookingForChipActive: { backgroundColor: "#FF4D8D", borderColor: "#FF4D8D" },
  lookingForChipText: { fontSize: 13, fontWeight: "600" },
  lookingForChipTextActive: { color: "#fff", fontSize: 13, fontWeight: "700" },
  aboutText: { fontSize: 14, lineHeight: 22 },
  interestContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  interestChip: {
    backgroundColor: "rgba(255, 77, 141, 0.06)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 77, 141, 0.15)",
  },
  interestText: {
    color: "#FF4D8D",
    fontSize: 13,
    fontWeight: "600",
  },
  lifestyleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  lifestylePill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E24",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.03)",
    gap: 8,
  },
  lifestylePillTexts: {
    flex: 1,
  },
  lifestylePillLabel: {
    fontSize: 10,
    fontWeight: "600",
  },
  lifestylePillValue: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 1,
  },

  actionButtons: { marginTop: 30, gap: 12 },
  editButton: {
    backgroundColor: "rgba(255, 77, 141, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 77, 141, 0.3)",
    borderRadius: 18,
    height: 55,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  editButtonText: { color: "#FF4D8D", fontWeight: "700" },
  logoutButton: {
    backgroundColor: "#17171C",
    borderRadius: 18,
    height: 55,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  logoutText: { color: "#ff5c5c", fontWeight: "700" },

  // Biodata Styles
  biodataPanelUnified: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#151519",
    borderRadius: 20,
    padding: 16,
    marginTop: 22,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  biodataPanelLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  biodataIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255, 77, 141, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  biodataInfoTexts: {
    marginLeft: 12,
    flex: 1,
  },
  biodataPanelTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  biodataPanelStatus: {
    fontSize: 12,
    marginTop: 2,
  },
  biodataPanelRight: {
    marginLeft: 10,
    justifyContent: "center",
  },
  biodataActionIconsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  // Modal Styles
  updateModalBody: {
    paddingVertical: 24,
    gap: 12,
  },
  updateOptionBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    gap: 14,
    marginBottom: 8,
  },
  updateOptionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  updateOptionInfo: {
    flex: 1,
  },
  updateOptionTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  updateOptionSub: {
    fontSize: 11,
    color: "#9B9BA1",
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#151519",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
    paddingHorizontal: 20,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  modalForm: {
    paddingVertical: 20,
    paddingBottom: 40,
  },
  formSectionTitle: {
    color: "#FF4D8D",
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 12,
    marginTop: 8,
  },
  prefilledRow: {
    backgroundColor: "#1D1D24",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  prefilledLabel: {
    fontSize: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 14,
  },
  textInput: {
    backgroundColor: "#1E1E24",
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 16,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  submitGenerateButton: {
    backgroundColor: "#FF4D8D",
    borderRadius: 16,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 28,
  },
  submitGenerateButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  previewContainer: {
    flex: 1,
    backgroundColor: "#0B0B0D",
  },
  previewHeader: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  previewCloseButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  instagramPostCard: {
    width: SW,
    marginBottom: 20,
  },
  instagramPostHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  instagramPostHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  instagramPostAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#FF4D8D",
  },
  instagramPostName: {
    fontSize: 14,
    fontWeight: "700",
  },
  instagramPostLocation: {
    color: "#8E8E95",
    fontSize: 11,
    marginTop: 2,
  },
  instagramPostImage: {
    width: SW,
    height: SW,
  },
  postDeleteBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Verification Modal Styles ──
  verifySubtitle: {
    fontSize: 11,
    marginTop: 2,
    opacity: 0.7,
  },
  verifySectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 6,
    marginTop: 14,
  },
  verifyInfoCard: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  verifyInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  verifyInfoLabel: {
    fontSize: 12,
    flex: 1,
  },
  verifyInfoValue: {
    fontSize: 12,
    fontWeight: "600",
    flex: 1.5,
    textAlign: "right",
  },
  verifyMissingNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
  },
  verifyMissingText: {
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
});
