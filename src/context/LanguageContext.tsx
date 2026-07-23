import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

export type Language = 'en' | 'mr';

export const translations = {
  en: {
    // Common
    appName: 'VVS',
    save: 'Save',
    cancel: 'Cancel',
    back: 'Back',
    ok: 'OK',
    error: 'Error',
    success: 'Success',
    sent: 'Sent',
    loading: 'Loading...',

    // Bottom Nav
    home: 'Home',
    matches: 'Matches',
    chats: 'Chats',
    profile: 'Profile',
    explore: 'Explore',
    requests: 'Requests',
    upload: 'Upload',
    quickAction: 'Quick Action',
    addSuccessStory: 'Add Success Story',
    shareJourney: 'Share your journey & married story',
    uploadProfilePhoto: 'Upload Profile / Gallery Photo',
    addPhotosToGallery: 'Add photos to your profile gallery',

    // Home Screen
    heroTitleLine1: 'Find Your Perfect Match',
    heroTitleLine2: 'Within Our Community',
    heroBadge: '🦚 Vasudev Vivah Sohala',
    heroSub: 'Exclusively for the Vasudev community',
    heroPrimary: 'View Profiles',
    aboutTitle: 'About VVS Community',
    howItWorks: 'How It Works',
    upcomingEvents: 'Upcoming Events',
    successStories: 'Success Stories',
    trendingMatches: 'Trending Matches',
    register: 'Register',
    connect: 'Connect',
    ctaTitle: 'Start Your Journey Today',
    ctaSub: 'Join thousands from the Vasudev community finding their soulmate.',
    ctaBtn: 'Create Profile',

    // Auth Screens (Welcome, Mobile, OTP, Email, Forgot Password)
    welcomeTo: 'Welcome to',
    brandTitle: 'वासुदेव विवाह सोहळा',
    welcomeSub: 'Find someone who matches your energy, ambition, and lifestyle.',
    logIn: 'Log In',
    continueWithGoogle: 'Continue with Google',
    continueWithEmail: 'Continue with Email',
    continueWithMobile: 'Continue with Mobile',
    byContinuingAgree: 'By continuing, you agree to our',
    termsOfService: 'Terms of Service',
    and: 'and',
    privacyPolicy: 'Privacy Policy',
    whatsYourNumber: "What's your number?",
    mobileSub: "We'll send a 6-digit OTP to verify your mobile number. If you're new, an account will be created automatically.",
    mobilePlaceholder: 'Mobile Number (10 digits)',
    iAgreeTo: 'I agree to the',
    termsAndConditions: 'Terms and Conditions',
    sendOtp: 'Send OTP',
    sendingOtp: 'Sending OTP...',
    otpGeneratedDev: 'OTP Generated (Dev Mode)',
    otpDevNote: 'This OTP is shown here because no SMS gateway is configured yet. Use this code on the next screen.',
    mobileHint: '💡 Both new and existing users can continue with their mobile number.',
    enterOtp: 'Enter OTP',
    otpSub: "We've sent a 6-digit verification code to",
    yourMobile: 'your mobile',
    yourOtpDev: 'Your OTP (Dev Mode)',
    otpCardDevNote: 'No SMS gateway configured yet. Enter this code below to verify.',
    verifyAndContinue: 'Verify & Continue',
    verifying: 'Verifying...',
    didntReceiveCode: "Didn't receive code?",
    resendOtp: 'Resend OTP',
    resending: 'Resending...',
    emailLogin: 'Email Login',
    emailSub: 'Email authentication is coming soon. Please use your mobile number to sign in for now.',
    comingSoon: 'Coming Soon',
    comingSoonDesc: "We're working on adding email-based authentication. For now, you can sign in using your mobile number.",
    resetPassword: 'Reset Password',
    resetSub: 'Enter your email address and we will send you a link to reset your password.',
    emailAddress: 'Email Address',
    sendResetLink: 'Send Reset Link',
    rememberPassword: 'Remember your password? Login',
    acceptAndAgree: 'Accept & Agree',
    mobileErrorDigits: 'Mobile number must be exactly 10 digits (e.g. 9876543210).',
    termsError: 'Please accept terms and conditions',
    invalidOtpError: 'Invalid OTP. Please try again.',

    // Chats Screen
    messages: 'Messages',
    newMatches: 'New Matches',
    searchChats: 'Search chats...',

    // Explore / Matches Screen
    discover: 'Discover',
    profilesPickedForYou: 'Profiles picked for you',
    searchPlaceholder: 'Search by name, role, city...',
    ageRange: 'Age range',
    location: 'Location',
    enterCity: 'Enter a city',
    clearFilters: 'Clear filters',
    clearAllFilters: 'Clear all filters',
    findingProfiles: 'Finding profiles…',
    noProfilesMatch: 'No profiles match your filters',
    noProfilesBody: 'Try widening the age range, or changing education and location.',
    sendInterest: 'Send Interest',
    interestSent: 'Request Sent',
    accept: 'Accept',
    decline: 'Decline',
    connected: 'Connected',

    // Requests Screen
    received: 'Received',
    noRequestsYet: 'No interest requests yet',

    // Success Stories
    successStoriesTitle: 'Success Stories',
    successStoriesSub: 'Happy couples from Vasudev community',
    addYourStory: 'Add Your Story',

    // Profile Screen
    myProfile: 'My Profile',
    editProfile: 'Edit Profile',
    aboutMe: 'About Me',
    interests: 'Interests',
    lifestyle: 'Lifestyle',
    photos: 'Photos',
    logout: 'Logout',
    height: 'Height',
    education: 'Education',
    profession: 'Profession',
    religion: 'Religion',
    smoking: 'Smoking',
    drinking: 'Drinking',
    lookingFor: 'Looking For',
    seriousRelationship: 'Serious Relationship',
    no: 'No',
    occasionally: 'Occasionally',
    bioText: 'AI Engineer • Entrepreneur • Looking for meaningful connection.',
    aboutMeText: 'Passionate about technology, startups, fitness, and travel. I value emotional maturity, ambition, and authenticity.',

    // Settings Screen
    settings: 'Settings',
    account: 'Account',
    support: 'Support',
    language: 'Language',
    appLanguage: 'App Language',
    changeMobileNumber: 'Change Mobile Number',
    privacySettings: 'Privacy Settings',
    notificationSettings: 'Notification Settings',
    helpCenter: 'Help Center',
    reportProblem: 'Report Problem',
    termsConditions: 'Terms & Conditions',
    deleteAccount: 'Delete Account',
    english: 'English',
    marathi: 'मराठी',
  },
  mr: {
    // Common
    appName: 'VVS',
    save: 'जतन करा',
    cancel: 'रद्द करा',
    back: 'मागे',
    ok: 'ठीक आहे',
    error: 'त्रुटी',
    success: 'यशस्वी',
    sent: 'पाठवले',
    loading: 'लोड होत आहे...',

    // Bottom Nav
    home: 'मुख्यपृष्ठ',
    matches: 'जोडीदार',
    chats: 'संदेश',
    profile: 'प्रोफाइल',
    explore: 'शोधा',
    requests: 'विनंत्या',
    upload: 'अपलोड',
    quickAction: 'जलद कृती',
    addSuccessStory: 'यशोगाथा जोडा',
    shareJourney: 'तुमचा प्रवास आणि लग्नाची कहाणी शेअर करा',
    uploadProfilePhoto: 'प्रोफाइल / गॅलरी फोटो अपलोड करा',
    addPhotosToGallery: 'तुमच्या प्रोफाइल गॅलरीत फोटो जोडा',

    // Home Screen
    heroTitleLine1: 'योग्य जोडीदार शोधा',
    heroTitleLine2: 'आपल्याच समाजात',
    heroBadge: '🦚 वासुदेव विवाह सोहळा',
    heroSub: 'फक्त वासुदेव समाजासाठी',
    heroPrimary: 'प्रोफाइल पाहा',
    aboutTitle: 'VVS समुदायाबद्दल',
    howItWorks: 'कसे कार्य करते?',
    upcomingEvents: 'आगामी कार्यक्रम',
    successStories: 'यशोगाथा',
    trendingMatches: 'आजचे जोडीदार',
    register: 'नोंदणी करा',
    connect: 'संपर्क करा',
    ctaTitle: 'आजच सुरुवात करा',
    ctaSub: 'हजारो वासुदेव समाजातील सदस्यांसोबत सामील व्हा.',
    ctaBtn: 'प्रोफाइल तयार करा',

    // Auth Screens (Welcome, Mobile, OTP, Email, Forgot Password)
    welcomeTo: 'आपले स्वागत आहे',
    brandTitle: 'वासुदेव विवाह सोहळा',
    welcomeSub: 'तुमच्या उर्जेला, महत्त्वाकांक्षेला आणि जीवनशैलीला साजेसा जोडीदार शोधा.',
    logIn: 'लॉग इन करा',
    continueWithGoogle: 'Google सह पुढे जा',
    continueWithEmail: 'ईमेलसह पुढे जा',
    continueWithMobile: 'मोबाईलसह पुढे जा',
    byContinuingAgree: 'पुढे जाण्याद्वारे, तुम्ही आमच्या',
    termsOfService: 'सेवा अटींशी',
    and: 'आणि',
    privacyPolicy: 'गोपनीयता धोरणाशी सहमत आहात',
    whatsYourNumber: 'तुमचा मोबाईल नंबर काय आहे?',
    mobileSub: 'आम्ही तुमच्या मोबाईल नंबरच्या पडताळणीसाठी ६-अंकी OTP पाठवू. नवीन असल्यास खाते आपोआप तयार होईल.',
    mobilePlaceholder: 'मोबाईल नंबर (१० अंक)',
    iAgreeTo: 'मी ',
    termsAndConditions: 'अटी आणि शर्तींशी सहमत आहे',
    sendOtp: 'OTP पाठवा',
    sendingOtp: 'OTP पाठवत आहे...',
    otpGeneratedDev: 'OTP तयार झाला (डेव्ह मोड)',
    otpDevNote: 'कोणताही SMS गेटवे सेट केलेला नसल्यामुळे हा OTP येथे दाखवला आहे. पुढील स्क्रीनवर हा कोड वापरा.',
    mobileHint: '💡 नवीन आणि हयात दोन्ही वापरकर्ते त्यांच्या मोबाईल नंबरसह पुढे जाऊ शकतात.',
    enterOtp: 'OTP प्रविष्ट करा',
    otpSub: 'आम्ही ६-अंकी पडताळणी कोड येथे पाठवला आहे: ',
    yourMobile: 'तुमच्या मोबाईलवर',
    yourOtpDev: 'तुमचा OTP (डेव्ह मोड)',
    otpCardDevNote: 'अद्याप कोणताही SMS गेटवे कॉन्फिगर केलेला नाही. पडताळणीसाठी खाली हा कोड टाका.',
    verifyAndContinue: 'पडताळणी करा आणि पुढे जा',
    verifying: 'पडताळणी करत आहे...',
    didntReceiveCode: 'कोड मिळाला नाही?',
    resendOtp: 'पुन्हा OTP पाठवा',
    resending: 'पुन्हा पाठवत आहे...',
    emailLogin: 'ईमेल लॉगिन',
    emailSub: 'ईमेल प्रमाणीकरण लवकरच येत आहे. सध्या साइन इन करण्यासाठी मोबाईल नंबर वापरा.',
    comingSoon: 'लवकरच येत आहे',
    comingSoonDesc: 'आम्ही ईमेल प्रमाणीकरण जोडण्यावर काम करत आहोत. सध्या मोबाईल नंबर वापरून साइन इन करू शकता.',
    resetPassword: 'पासवर्ड रीसेट करा',
    resetSub: 'तुमचा ईमेल पत्ता टाका आणि आम्ही पासवर्ड रीसेट करण्यासाठी लिंक पाठवू.',
    emailAddress: 'ईमेल पत्ता',
    sendResetLink: 'रीसेट लिंक पाठवा',
    rememberPassword: 'पासवर्ड आठवतोय? लॉगिन करा',
    acceptAndAgree: 'स्वीकारा आणि सहमत व्हा',
    mobileErrorDigits: 'मोबाईल नंबर नक्की १० अंकांचा असणे आवश्यक आहे.',
    termsError: 'कृपया अटी व शर्ती स्वीकारा',
    invalidOtpError: 'अवैध OTP. कृपया पुन्हा प्रयत्न करा.',

    // Chats Screen
    messages: 'संदेश',
    newMatches: 'नवीन जोडीदार',
    searchChats: 'संदेश शोधा...',

    // Explore / Matches Screen
    discover: 'शोधा',
    profilesPickedForYou: 'तुमच्यासाठी निवडलेले प्रोफाईल',
    searchPlaceholder: 'नाव, व्यवसाय, शहराने शोधा...',
    ageRange: 'वयाची मर्यादा',
    location: 'ठिकाण',
    enterCity: 'शहर टाका',
    clearFilters: 'फिल्टर साफ करा',
    clearAllFilters: 'सर्व फिल्टर साफ करा',
    findingProfiles: 'प्रोफाईल शोधत आहे…',
    noProfilesMatch: 'कोणतेही प्रोफाईल जुळत नाही',
    noProfilesBody: 'वयाची मर्यादा किंवा शिक्षण आणि शहर बदलून पहा.',
    sendInterest: 'आवडी नोंदवा',
    interestSent: 'विनंती पाठवली',
    accept: 'स्वीकारा',
    decline: 'नकार द्या',
    connected: 'जोडले गेले',

    // Requests Screen
    received: 'आलेले',
    noRequestsYet: 'अद्याप कोणत्याही आवडीच्या विनंत्या नाहीत',

    // Success Stories
    successStoriesTitle: 'यशोगाथा',
    successStoriesSub: 'वासुदेव समाजातील आनंदी जोडपे',
    addYourStory: 'तुमची कहाणी जोडा',

    // Profile Screen
    myProfile: 'माझे प्रोफाइल',
    editProfile: 'प्रोफाइल संपादित करा',
    aboutMe: 'माझ्याबद्दल',
    interests: 'आवडी',
    lifestyle: 'जीवनशैली',
    photos: 'फोटो',
    logout: 'बाहेर पडा',
    height: 'उंची',
    education: 'शिक्षण',
    profession: 'व्यवसाय',
    religion: 'धर्म',
    smoking: 'धूम्रपान',
    drinking: 'मद्यपान',
    lookingFor: 'शोधत आहे',
    seriousRelationship: 'गंभीर नाते',
    no: 'नाही',
    occasionally: 'कधीकधी',
    bioText: 'AI अभियंता • उद्योजक • अर्थपूर्ण नाते शोधत आहे.',
    aboutMeText: 'तंत्रज्ञान, स्टार्टअप, फिटनेस आणि प्रवासाची आवड. भावनिक परिपक्वता, महत्त्वाकांक्षा आणि सत्यता यांना महत्त्व देतो.',

    // Settings Screen
    settings: 'सेटिंग्ज',
    account: 'खाते',
    support: 'मदत',
    language: 'भाषा',
    appLanguage: 'अ‍ॅपची भाषा',
    changeMobileNumber: 'मोबाईल नंबर बदला',
    privacySettings: 'गोपनीयता सेटिंग्ज',
    notificationSettings: 'सूचना सेटिंग्ज',
    helpCenter: 'मदत केंद्र',
    reportProblem: 'समस्या नोंदवा',
    termsConditions: 'अटी व शर्ती',
    deleteAccount: 'खाते हटवा',
    english: 'English',
    marathi: 'मराठी',
  },
};

type TranslationKey = keyof typeof translations.en;

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    SecureStore.getItemAsync('app_language').then((savedLang) => {
      if (savedLang === 'en' || savedLang === 'mr') {
        setLanguageState(savedLang);
      }
    });
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    SecureStore.setItemAsync('app_language', lang);
  };

  const t = (key: TranslationKey): string => {
    return translations[language]?.[key] ?? translations.en[key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);