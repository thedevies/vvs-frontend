import React, { createContext, useContext, useState } from 'react';

export type Language = 'en' | 'mr';

export const translations = {
  en: {
    // Common
    appName: 'VVS',
    save: 'Save',
    cancel: 'Cancel',
    back: 'Back',

    // Bottom Nav
    home: 'Home',
    matches: 'Matches',
    chats: 'Chats',
    profile: 'Profile',

    // Home Screen
    heroTitleLine1: 'Find Your Perfect Match',
    heroTitleLine2: 'Within Our Community',
    heroBadge: '🦚 Vasudev Vivah Sohala',
    heroSub: 'Exclusively for the Vasudev community',
    heroPrimary: 'View Profiles',
    heroExplore: 'Explore',
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
    changePassword: 'Change Password',
    privacySettings: 'Privacy Settings',
    notificationSettings: 'Notification Settings',
    helpCenter: 'Help Center',
    reportProblem: 'Report Problem',
    termsConditions: 'Terms & Conditions',
    privacyPolicy: 'Privacy Policy',
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

    // Bottom Nav
    home: 'मुख्यपृष्ठ',
    matches: 'जोडीदार',
    chats: 'संदेश',
    profile: 'प्रोफाइल',

    // Home Screen
    heroTitleLine1: 'योग्य जोडीदार शोधा',
    heroTitleLine2: 'आपल्याच समाजात',
    heroBadge: '🦚 वासुदेव विवाह सोहळा',
    heroSub: 'फक्त वासुदेव समाजासाठी',
    heroPrimary: 'प्रोफाइल पाहा',
    heroExplore: 'शोधा',
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
    changePassword: 'पासवर्ड बदला',
    privacySettings: 'गोपनीयता सेटिंग्ज',
    notificationSettings: 'सूचना सेटिंग्ज',
    helpCenter: 'मदत केंद्र',
    reportProblem: 'समस्या नोंदवा',
    termsConditions: 'अटी व शर्ती',
    privacyPolicy: 'गोपनीयता धोरण',
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
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: TranslationKey): string => {
    return translations[language][key] ?? translations.en[key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);