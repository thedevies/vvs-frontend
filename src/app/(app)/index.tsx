import React, { useRef, useState, useEffect } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  ImageBackground,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import BottomNavigation from '@/components/navigation/BottomNavigation';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { profileApi, BASE_URL } from '@/utils/api';
import AuthModal from '@/components/ui/AuthModal';

const { width: SW } = Dimensions.get('window');

// ─── Theme (same as profile.tsx / settings.tsx) ───────────────────────────────
const DARK  = '#0B0B0D';
const CARD  = '#17171C';
const CARD2 = '#1A1A24';
const WHITE = '#FFFFFF';
const MUTED = '#8E8E95';
const PINK  = '#FF4D8D';

// ─── Static data ──────────────────────────────────────────────────────────────

const steps = [
  { number: '01', emoji: '📝', en: 'Create Profile',   mr: 'प्रोफाइल तयार करा', descEn: 'Fill in your details, family background and expectations.', descMr: 'आपली माहिती, कौटुंबिक पार्श्वभूमी आणि अपेक्षा भरा.' },
  { number: '02', emoji: '🔍', en: 'Discover Matches', mr: 'जोडीदार शोधा',       descEn: 'Browse verified profiles from the VVS community.',          descMr: 'VVS समुदायातील सत्यापित प्रोफाइल पाहा.' },
  { number: '03', emoji: '💬', en: 'Connect & Talk',   mr: 'संपर्क साधा',        descEn: 'Send interest and start a meaningful conversation.',         descMr: 'स्वारस्य पाठवा आणि अर्थपूर्ण संवाद सुरू करा.' },
  { number: '04', emoji: '💍', en: 'Solemnize',        mr: 'विवाह सोहळा',        descEn: 'Meet families and complete your sacred union.',              descMr: 'कुटुंबाला भेटा आणि आपला पवित्र विवाह पूर्ण करा.' },
];

const events = [
  { emoji: '🪔', dateMr: '15 जून 2025',    dateEn: '15 Jun 2025', titleMr: 'VVS मेळावा — पुणे',  titleEn: 'VVS Gathering — Pune',   descMr: 'वार्षिक विवाह परिचय सोहळा',    descEn: 'Annual matrimonial introduction event',       tagMr: 'आगामी',       tagEn: 'Upcoming',    color: '#F5A623' },
  { emoji: '🌸', dateMr: '22 जुलै 2025',   dateEn: '22 Jul 2025', titleMr: 'VVS मेळावा — नाशिक', titleEn: 'VVS Gathering — Nashik', descMr: 'समुदाय विवाह परिचय कार्यक्रम', descEn: 'Community matrimonial introduction program', tagMr: 'नोंदणी सुरू', tagEn: 'Registering', color: '#4CD964' },
  { emoji: '🎊', dateMr: '10 ऑगस्ट 2025', dateEn: '10 Aug 2025', titleMr: 'VVS मेळावा — मुंबई', titleEn: 'VVS Gathering — Mumbai', descMr: 'विशेष विवाह परिचय सत्र',        descEn: 'Special matrimonial introduction session',   tagMr: 'लवकरच',       tagEn: 'Coming Soon', color: '#5AC8FA' },
];

const testimonials = [
  { coupleMr: 'राहुल & प्रिया', coupleEn: 'Rahul & Priya', cityMr: 'पुणे',   quoteMr: 'VVS मुळे आम्हाला योग्य जोडीदार मिळाला. हे व्यासपीठ आमच्यासाठी वरदान ठरले!', quoteEn: 'VVS helped us find the perfect match. This platform was a blessing for us!',       married: 'Married • March 2024', avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=400&auto=format&fit=crop' },
  { coupleMr: 'अमित & सोनाली', coupleEn: 'Amit & Sonali', cityMr: 'नाशिक', quoteMr: 'समाजाच्या बंधनात राहून योग्य निर्णय घेता आला. VVS ला धन्यवाद!',               quoteEn: 'We could make the right decision within our community. Thank you VVS!',           married: 'Married • July 2024',  avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=400&auto=format&fit=crop' },
];

// ─── Sub-components (receive isMr so they re-render on language change) ────────

function SectionHeading({ mr, en, isMr }: { mr: string; en: string; isMr: boolean }) {
  return (
    <View style={styles.sectionHeading}>
      <ThemedText style={styles.sectionTitle}>{isMr ? mr : en}</ThemedText>
      <View style={styles.sectionLine} />
    </View>
  );
}

function CollapsibleHeading({
  mr,
  en,
  isMr,
  expanded,
  onPress,
}: {
  mr: string;
  en: string;
  isMr: boolean;
  expanded: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.collapsibleHeading} onPress={onPress} activeOpacity={0.85}>
      <ThemedText style={styles.sectionTitle}>{isMr ? mr : en}</ThemedText>
      <View style={styles.chevronWrap}>
        <Feather name={expanded ? 'chevron-down' : 'chevron-right'} size={18} color={WHITE} />
      </View>
    </TouchableOpacity>
  );
}

function AboutSection({ isMr }: { isMr: boolean }) {
  return (
    <View style={styles.card}>
      <View style={styles.aboutIconRow}>
        <ThemedText style={styles.aboutIcon}>🦚</ThemedText>
        <View style={styles.pill}>
          <ThemedText style={styles.pillText}>{isMr ? 'पिढ्यानपिढ्या' : 'Since generations'}</ThemedText>
        </View>
      </View>
      <ThemedText style={styles.aboutTitle}>वासुदेव विवाह सोहळा</ThemedText>
      <ThemedText style={styles.aboutSub}>VVS Community</ThemedText>
      <ThemedText style={styles.aboutBody}>
        {isMr
          ? 'वासुदेव विवाह सोहळा (VVS) ही एक विशेष समाजसेवी संस्था आहे जी वासुदेव समाजातील तरुण-तरुणींसाठी योग्य जीवनसाथी शोधण्यास मदत करते. आमचे उद्दिष्ट म्हणजे परंपरा जपत आधुनिक पद्धतीने विवाह जुळवणे.'
          : 'VVS is a dedicated platform exclusively for the Vasudev community, helping young individuals find the right life partner while honoring cultural traditions and values.'}
      </ThemedText>
      <View style={styles.aboutStats}>
        {[
          { n: '12K+', labelMr: 'प्रोफाइल', labelEn: 'Profiles' },
          { n: '850+', labelMr: 'विवाह',    labelEn: 'Marriages' },
          { n: '48+',  labelMr: 'शहरे',     labelEn: 'Cities' },
        ].map((s) => (
          <View key={s.n} style={styles.aboutStat}>
            <ThemedText style={styles.aboutStatNum}>{s.n}</ThemedText>
            <ThemedText style={styles.aboutStatLbl}>{isMr ? s.labelMr : s.labelEn}</ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

function HowItWorksSection({ isMr }: { isMr: boolean }) {
  return (
    <View>
      {steps.map((s, i) => (
        <View key={i} style={styles.stepRow}>
          <View style={styles.stepLeft}>
            <View style={styles.stepNumBox}>
              <ThemedText style={styles.stepNum}>{s.number}</ThemedText>
            </View>
            {i < steps.length - 1 && <View style={styles.stepConnector} />}
          </View>
          <View style={[styles.card, styles.stepCard]}>
            <View style={styles.stepEmojiRow}>
              <ThemedText style={styles.stepEmoji}>{s.emoji}</ThemedText>
              <ThemedText style={styles.stepTitle}>{isMr ? s.mr : s.en}</ThemedText>
            </View>
            <ThemedText style={styles.stepDesc}>{isMr ? s.descMr : s.descEn}</ThemedText>
          </View>
        </View>
      ))}
    </View>
  );
}

function EventsSection({ isMr }: { isMr: boolean }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
      {events.map((e, i) => (
        <View key={i} style={[styles.card, styles.eventCard]}>
          <View style={styles.eventTagRow}>
            <View style={[styles.eventTag, { backgroundColor: e.color + '22', borderColor: e.color + '55' }]}>
              <ThemedText style={[styles.eventTagText, { color: e.color }]}>{isMr ? e.tagMr : e.tagEn}</ThemedText>
            </View>
            <ThemedText style={styles.eventEmoji}>{e.emoji}</ThemedText>
          </View>
          <ThemedText style={styles.eventDate}>{isMr ? e.dateMr : e.dateEn}</ThemedText>
          <ThemedText style={styles.eventTitle}>{isMr ? e.titleMr : e.titleEn}</ThemedText>
          <ThemedText style={styles.eventDesc}>{isMr ? e.descMr : e.descEn}</ThemedText>
          <TouchableOpacity style={styles.pinkBtn}>
            <ThemedText style={styles.pinkBtnText}>{isMr ? 'नोंदणी करा' : 'Register'}</ThemedText>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

function TestimonialsSection({ isMr }: { isMr: boolean }) {
  return (
    <View style={{ gap: 16 }}>
      {testimonials.map((t, i) => (
        <View key={i} style={styles.card}>
          <View style={styles.testimonialTop}>
            <View>
              <ImageBackground source={{ uri: t.avatar }} style={styles.testimonialAvatar} imageStyle={{ borderRadius: 30 }} />
              <View style={styles.heartBadge}>
                <ThemedText style={{ fontSize: 11 }}>💍</ThemedText>
              </View>
            </View>
            <View style={styles.testimonialMeta}>
              <ThemedText style={styles.testimonialCouple}>{isMr ? t.coupleMr : t.coupleEn}</ThemedText>
              <ThemedText style={styles.testimonialCity}>📍 {t.cityMr}</ThemedText>
              <ThemedText style={styles.testimonialMarried}>{t.married}</ThemedText>
            </View>
          </View>
          <ThemedText style={styles.testimonialQuote}>"{isMr ? t.quoteMr : t.quoteEn}"</ThemedText>
        </View>
      ))}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { language } = useLanguage();
  const { isAuthenticated, profileCompleted, user } = useAuth();
  const isMr = language === 'mr';
  const scrollY = useRef(new Animated.Value(0)).current;
  const [aboutOpen, setAboutOpen] = useState(false);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [eventsOpen, setEventsOpen] = useState(false);

  // Real matches state & Auth Modal state
  const [realMatches, setRealMatches] = useState<any[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);

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

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      console.log('[Home] Loading real matches from backend...');
      const response = await profileApi.getAllProfiles(1, 10);
      if (response.data) {
        setRealMatches(response.data);
      }
    } catch (err: any) {
      console.log('[Home] Failed to load matches:', err.message);
    }
  };

  const heroOpacity = scrollY.interpolate({
    inputRange: [0, 300],
    outputRange: [1, 0.3],
    extrapolate: 'clamp',
  });

  const handlePrimaryAction = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    if (profileCompleted) {
      router.push('/explore');
    } else {
      router.push('/edit-profile');
    }
  };

  const handleExploreAction = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    router.push('/explore');
  };

  const primaryLabel = profileCompleted
    ? (isMr ? 'शोधा' : 'Explore Profiles')
    : (isMr ? 'प्रोफाइल पूर्ण करा' : 'Complete Profile');

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}>

        {/* ── Hero ── */}
        <Animated.View style={{ opacity: heroOpacity }}>
          <ImageBackground
            source={{ uri: 'https://imgs.search.brave.com/5N3BuKcZGSaIBczY-iE6H99tw2tlKBNtmkfw69VoK4I/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pLnBp/bmltZy5jb20vb3Jp/Z2luYWxzLzg2L2Fm/LzkyLzg2YWY5MjNi/YTEwMjZkNGJjOWE0/OGRmNDc1YmM1OGUw/LmpwZw' }}
            style={styles.hero}
            imageStyle={styles.heroImg}>
            <SafeAreaView style={styles.heroOverlay}>
              <View style={styles.heroBadge}>
                <ThemedText style={styles.heroBadgeText}>
                  🦚 {isMr ? 'वासुदेव विवाह सोहळा' : 'Vasudev Vivah Sohala'}
                </ThemedText>
              </View>
              <View style={styles.heroContent}>
                <ThemedText style={styles.heroTitle}>
                  {isMr ? 'योग्य जोडीदार\nआपल्याच समाजात' : 'Find Your Perfect Match\nWithin Our Community'}
                </ThemedText>
                <ThemedText style={styles.heroSub}>
                  {isMr ? 'फक्त वासुदेव समाजासाठी' : 'Exclusively for the Vasudev community'}
                </ThemedText>
                <View style={styles.heroBtnRow}>
                  {!profileCompleted ? (
                    <>
                      <TouchableOpacity style={styles.heroPrimary} onPress={handlePrimaryAction}>
                        <ThemedText style={styles.heroPrimaryText}>
                          {primaryLabel}
                        </ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.heroSecondary} onPress={handleExploreAction}>
                        <ThemedText style={styles.heroSecondaryText}>
                          {isMr ? 'शोधा' : 'Explore'}
                        </ThemedText>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity style={styles.heroPrimary} onPress={handleExploreAction}>
                      <ThemedText style={styles.heroPrimaryText}>
                        {isMr ? 'शोधा' : 'Explore Profiles'}
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </SafeAreaView>
          </ImageBackground>
        </Animated.View>

        {/* ── Trending Matches ── */}
        <View style={styles.section}>
          <SectionHeading mr="आजचे जोडीदार" en="Latest Profiles" isMr={isMr} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
            {realMatches.filter((profile) => {
              if (!isAuthenticated || !user || !user.profile) return true;
              const lookingFor = (user.profile.lookingFor || '').toLowerCase();
              const gender = (profile.gender || '').toLowerCase();
              if (lookingFor === 'bride' || lookingFor === 'female') {
                return gender === 'female';
              }
              if (lookingFor === 'groom' || lookingFor === 'male') {
                return gender === 'male';
              }
              return true;
            }).map((profile) => {
              const age = getAge(profile.dateOfBirth);
              const imageUrl = getPhotoUrl(profile.profilePhoto);
              const locationStr = [profile.city, profile.state, profile.country].filter(Boolean).join(', ') || 'Not set';

              const handleConnect = () => {
                if (!isAuthenticated) {
                  setShowAuthModal(true);
                  return;
                }
                Alert.alert('Connect', `Sending connection request to ${profile.fullName}...`);
              };

              const handleCardPress = () => {
                if (!isAuthenticated) {
                  setShowAuthModal(true);
                  return;
                }
                router.push({
                  pathname: '/profile',
                  params: {
                    view: 'other',
                    profileId: String(profile.id),
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
              };

              return (
                <TouchableOpacity
                  key={profile.id}
                  activeOpacity={0.9}
                  onPress={handleCardPress}
                  style={[styles.card, styles.profileCard]}
                >
                  <ImageBackground
                    source={{ uri: imageUrl }}
                    style={styles.profileImg}
                    imageStyle={styles.profileImgStyle}>
                    <View style={styles.activePill}>
                      <View style={styles.activeDot} />
                      <ThemedText style={styles.activeText}>{isMr ? 'सक्रिय' : 'Active'}</ThemedText>
                    </View>
                  </ImageBackground>
                  <View style={styles.profileBody}>
                    <ThemedText style={styles.profileName}>{profile.fullName}</ThemedText>
                    <ThemedText style={styles.profileRole}>{profile.profession || 'Not set'}</ThemedText>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Success Stories ── */}
        <View style={styles.section}>
          <SectionHeading mr="यशोगाथा" en="Success Stories" isMr={isMr} />
          <TestimonialsSection isMr={isMr} />
        </View>

        {/* ── CTA Banner ── */}
        <View style={styles.ctaBanner}>
          <ThemedText style={styles.ctaEmoji}>🦚</ThemedText>
          <ThemedText style={styles.ctaTitle}>
            {isMr ? 'आजच सुरुवात करा' : 'Start Your Journey Today'}
          </ThemedText>
          <ThemedText style={styles.ctaSub}>
            {isMr
              ? 'हजारो वासुदेव समाजातील सदस्यांसोबत सामील व्हा.'
              : 'Join thousands from the Vasudev community finding their soulmate.'}
          </ThemedText>
          <TouchableOpacity style={[styles.pinkBtn, styles.ctaBtn]} onPress={handlePrimaryAction}>
            <ThemedText style={styles.pinkBtnText}>
              {profileCompleted
                ? (isMr ? 'प्रोफाइलला भेट द्या' : 'Visit Profile')
                : (isMr ? 'प्रोफाइल तयार करा' : 'Create Profile')}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* ── About ── */}
        <View style={styles.section}>
          <CollapsibleHeading
            mr="आमच्याबद्दल"
            en="About Community"
            isMr={isMr}
            expanded={aboutOpen}
            onPress={() => setAboutOpen((prev) => !prev)}
          />
          {aboutOpen && (
            <View style={styles.collapsibleBody}>
              <AboutSection isMr={isMr} />
            </View>
          )}
        </View>

        {/* ── How It Works ── */}
        <View style={styles.section}>
          <CollapsibleHeading
            mr="कसे कार्य करते?"
            en="How It Works"
            isMr={isMr}
            expanded={howItWorksOpen}
            onPress={() => setHowItWorksOpen((prev) => !prev)}
          />
          {howItWorksOpen && (
            <View style={styles.collapsibleBody}>
              <HowItWorksSection isMr={isMr} />
            </View>
          )}
        </View>

        {/* ── Upcoming Events ── */}
        <View style={styles.section}>
          <CollapsibleHeading
            mr="आगामी कार्यक्रम"
            en="Upcoming Events"
            isMr={isMr}
            expanded={eventsOpen}
            onPress={() => setEventsOpen((prev) => !prev)}
          />
          {eventsOpen && (
            <View style={styles.collapsibleBody}>
              <EventsSection isMr={isMr} />
            </View>
          )}
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <ThemedText style={styles.footerLabel}>Powered by</ThemedText>
          <ThemedText style={styles.footerCompany}>DHRUVEXA</ThemedText>
          <ThemedText style={styles.footerText}>TECHNOLOGIES</ThemedText>
        </View>

      </Animated.ScrollView>

      <BottomNavigation />
      <AuthModal visible={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DARK },
  scrollContent: { paddingBottom: 80 },

  // Hero
  hero: { height: 680 },
  heroImg: { borderBottomLeftRadius: 36, borderBottomRightRadius: 36 },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5,5,10,0.62)',
    paddingHorizontal: 22,
  },
  heroBadge: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,77,141,0.15)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: PINK + '55',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  heroBadgeText: { color: PINK, fontWeight: '700', fontSize: 13 },
  heroContent: { flex: 1, justifyContent: 'center' },
  heroTitle: { color: WHITE, fontSize: 36, fontWeight: '900', lineHeight: 46 },
  heroSub: { color: '#B0B0BE', marginTop: 12, fontSize: 13, lineHeight: 20 },
  heroBtnRow: { flexDirection: 'row', gap: 12, marginTop: 28 },
  heroPrimary: {
    backgroundColor: PINK,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
  },
  heroPrimaryText: { color: WHITE, fontWeight: '800', fontSize: 15 },
  heroSecondary: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
  },
  heroSecondaryText: { color: WHITE, fontWeight: '600', fontSize: 15 },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 18,
    marginTop: -38,
  },
  statCard: {
    flex: 1,
    backgroundColor: CARD,
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
  },
  statNum: { color: PINK, fontSize: 22, fontWeight: '800' },
  statLbl: { color: MUTED, fontSize: 11, marginTop: 4 },

  // Section
  section: { marginTop: 36, paddingHorizontal: 18 },
  sectionHeading: { marginBottom: 18 },
  sectionTitle: { color: WHITE, fontSize: 22, fontWeight: '900' },
  sectionLine: { width: 40, height: 3, backgroundColor: PINK, borderRadius: 99, marginTop: 8 },
  collapsibleHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: CARD,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  chevronWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  collapsibleBody: {
    marginTop: 14,
  },

  // Card base (shared)
  card: { backgroundColor: CARD, borderRadius: 24, padding: 20 },

  // About
  aboutIconRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  aboutIcon: { fontSize: 36 },
  pill: {
    backgroundColor: PINK + '22',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: PINK + '44',
  },
  pillText: { color: PINK, fontSize: 11, fontWeight: '700' },
  aboutTitle: { color: WHITE, fontSize: 22, fontWeight: '900' },
  aboutSub: { color: PINK, fontSize: 13, fontWeight: '700', marginTop: 2, marginBottom: 12 },
  aboutBody: { color: '#C8C8D8', fontSize: 14, lineHeight: 22 },
  aboutStats: {
    flexDirection: 'row',
    marginTop: 20,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#FFFFFF11',
    justifyContent: 'space-around',
  },
  aboutStat: { alignItems: 'center' },
  aboutStatNum: { color: WHITE, fontSize: 24, fontWeight: '900' },
  aboutStatLbl: { color: MUTED, fontSize: 11, marginTop: 4, textAlign: 'center' },

  // Matches
  hScroll: { gap: 16, paddingBottom: 4 },
  profileCard: { width: SW * 0.68, padding: 0, overflow: 'hidden' },
  profileImg: { height: 300, justifyContent: 'flex-end', padding: 14 },
  profileImgStyle: { borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  activePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
  },
  activeDot: { width: 8, height: 8, borderRadius: 99, backgroundColor: '#3BFF87' },
  activeText: { color: WHITE, fontSize: 11 },
  profileBody: { padding: 18 },
  profileName: { color: WHITE, fontSize: 20, fontWeight: '800' },
  profileRole: { color: '#C0C0CC', marginTop: 4, fontSize: 13 },
  profileCity: { color: MUTED, marginTop: 3, fontSize: 12, marginBottom: 14 },

  // Shared pink button
  pinkBtn: { backgroundColor: PINK, paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  pinkBtnText: { color: WHITE, fontWeight: '800', fontSize: 13 },

  // Steps
  stepRow: { flexDirection: 'row', gap: 14, minHeight: 120 },
  stepLeft: { alignItems: 'center', width: 44 },
  stepNumBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PINK + '22',
    borderWidth: 1.5,
    borderColor: PINK,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNum: { color: PINK, fontWeight: '900', fontSize: 13 },
  stepConnector: { flex: 1, width: 1.5, backgroundColor: PINK + '33', marginVertical: 4 },
  stepCard: { flex: 1, borderRadius: 20, marginBottom: 14, padding: 16 },
  stepEmojiRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  stepEmoji: { fontSize: 26 },
  stepTitle: { color: WHITE, fontWeight: '800', fontSize: 15 },
  stepDesc: { color: '#C0C0CC', fontSize: 13, lineHeight: 19, marginTop: 4 },

  // Events
  eventCard: { width: SW * 0.78 },
  eventTagRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  eventTag: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  eventTagText: { fontSize: 11, fontWeight: '700' },
  eventEmoji: { fontSize: 28 },
  eventDate: { color: MUTED, fontSize: 12, marginBottom: 6 },
  eventTitle: { color: WHITE, fontSize: 18, fontWeight: '900' },
  eventDesc: { color: '#C0C0CC', fontSize: 13, marginTop: 6, lineHeight: 19 },

  // Testimonials
  testimonialTop: { flexDirection: 'row', gap: 14, marginBottom: 14 },
  testimonialAvatar: { width: 60, height: 60, borderRadius: 30 },
  heartBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: CARD2,
    borderRadius: 99,
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  testimonialMeta: { flex: 1, justifyContent: 'center' },
  testimonialCouple: { color: WHITE, fontSize: 16, fontWeight: '800' },
  testimonialCity: { color: PINK, fontSize: 12, marginTop: 3 },
  testimonialMarried: { color: '#3BFF87', fontSize: 11, marginTop: 3, fontWeight: '600' },
  testimonialQuote: { color: '#D0D0DC', fontSize: 14, lineHeight: 22, fontStyle: 'italic' },

  // CTA
  ctaBanner: {
    margin: 18,
    marginTop: 36,
    backgroundColor: CARD,
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
  },
  ctaEmoji: { fontSize: 44, marginBottom: 12 },
  ctaTitle: { color: WHITE, fontSize: 26, fontWeight: '900', textAlign: 'center' },
  ctaSub: { color: MUTED, fontSize: 13, marginTop: 10, textAlign: 'center', lineHeight: 20 },
  ctaBtn: { marginTop: 20, paddingHorizontal: 28, paddingVertical: 15, borderRadius: 18 },

  // Footer
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    marginTop: 30,
    backgroundColor: '#0A0A0E',
  },
  footerLabel: {
    color: '#77777C',
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  footerCompany: {
    color: '#FF4D8D',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 4,
    marginTop: 4,
  },
  footerText: {
    color: '#B0B0BE',
    fontSize: 11,
    letterSpacing: 6,
    textTransform: 'uppercase',
    marginTop: 2,
    marginLeft: 6,
  },
});