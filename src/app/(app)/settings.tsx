import { router } from 'expo-router';
import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { CustomAlert as Alert } from '@/utils/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { profileApi } from '@/utils/api';

export default function SettingsScreen() {
  const { t, language, setLanguage } = useLanguage();
  const { logout } = useAuth();
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [showConfirmDeactivateModal, setShowConfirmDeactivateModal] = useState(false);
  const [deactivatingAccount, setDeactivatingAccount] = useState(false);

  const confirmDeactivateAccount = async () => {
    try {
      setDeactivatingAccount(true);
      console.log('[Account] Deactivating user account...');
      const response = await profileApi.deletedOrDeactivateProfile('deactive');
      if (response.message) {
        setShowConfirmDeactivateModal(false);
        Alert.alert('Deactivated', 'Your account has been deactivated successfully.');
        await logout();
      }
    } catch (err: any) {
      console.log('[Account] Failed to deactivate account:', err);
      Alert.alert('Error', err.message || 'Failed to deactivate account.');
    } finally {
      setDeactivatingAccount(false);
    }
  };

  const confirmDeleteAccount = async () => {
    try {
      setDeletingAccount(true);
      console.log('[Account] Deleting user account...');
      const response = await profileApi.deletedOrDeactivateProfile('delete');
      if (response.message) {
        setShowConfirmDeleteModal(false);
        Alert.alert('Deleted', 'Your account has been deleted.');
        await logout();
      }
    } catch (err: any) {
      console.log('[Account] Failed to delete account:', err);
      Alert.alert('Error', err.message || 'Failed to delete account.');
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleItemPress = (key: string) => {
    if (key === 'editProfile') {
      router.push('/edit-profile');
    } else if (key === 'termsConditions') {
      setShowTermsModal(true);
    } else if (key === 'privacyPolicy') {
      setShowPrivacyModal(true);
    } else if (key === 'deleteAccount') {
      setShowConfirmDeleteModal(true);
    } else {
      Alert.alert(t(key as any), `Configure your ${t(key as any)} settings parameters.`);
    }
  };

  const SETTINGS = [
    {
      titleKey: 'support' as const,
      items: [
        { key: 'helpCenter' as const,      icon: 'help-circle-outline' },
        { key: 'reportProblem' as const,   icon: 'flag-outline' },
        { key: 'termsConditions' as const, icon: 'document-text-outline' },
        { key: 'privacyPolicy' as const,   icon: 'eye-outline' },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>{t('settings')}</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        {/* LANGUAGE TOGGLE */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>{t('language')}</ThemedText>
          <View style={styles.langCard}>
            <View style={styles.langLabelRow}>
              <Ionicons name="language-outline" size={20} color="#fff" />
              <ThemedText style={styles.langLabel}>{t('appLanguage')}</ThemedText>
            </View>
            <View style={styles.langToggle}>
              <TouchableOpacity
                style={[styles.langOption, language === 'en' && styles.langOptionActive]}
                onPress={() => setLanguage('en')}>
                <ThemedText style={[styles.langOptionText, language === 'en' && styles.langOptionTextActive]}>
                  {t('english')}
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.langOption, language === 'mr' && styles.langOptionActive]}
                onPress={() => setLanguage('mr')}>
                <ThemedText style={[styles.langOptionText, language === 'mr' && styles.langOptionTextActive]}>
                  {t('marathi')}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ACCOUNT SECTION (COLLAPSIBLE) */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>{t('account')}</ThemedText>
          
          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={() => setAccountOpen((prev) => !prev)}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIconBox}>
                <Ionicons name="person-circle-outline" size={18} color="#FF4D8D" />
              </View>
              <ThemedText style={styles.settingText}>Account Settings</ThemedText>
            </View>
            <Ionicons name={accountOpen ? 'chevron-down' : 'chevron-forward'} size={18} color="#555" />
          </TouchableOpacity>

          {accountOpen && (
            <View style={styles.accountSubOptions}>
              <TouchableOpacity 
                style={styles.subSettingItem} 
                onPress={() => handleItemPress('editProfile')}>
                <View style={styles.settingLeft}>
                  <Ionicons name="person-outline" size={16} color="#aaa" />
                  <ThemedText style={styles.subSettingText}>{t('editProfile')}</ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#555" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.subSettingItem} 
                onPress={() => handleItemPress('changePassword')}>
                <View style={styles.settingLeft}>
                  <Ionicons name="lock-closed-outline" size={16} color="#aaa" />
                  <ThemedText style={styles.subSettingText}>{t('changePassword')}</ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#555" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.subSettingItem} 
                onPress={() => setShowConfirmDeactivateModal(true)}>
                <View style={styles.settingLeft}>
                  <Ionicons name="pause-circle-outline" size={16} color="#FF9F1C" />
                  <ThemedText style={[styles.subSettingText, { color: '#FF9F1C', fontWeight: 'bold' }]}>Deactivate Account</ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#FF9F1C" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.subSettingItem, { borderBottomWidth: 0 }]} 
                onPress={() => setShowConfirmDeleteModal(true)}>
                <View style={styles.settingLeft}>
                  <Ionicons name="warning-outline" size={16} color="#ff4d4d" />
                  <ThemedText style={[styles.subSettingText, { color: '#ff4d4d', fontWeight: 'bold' }]}>Danger Zone (Delete Account)</ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#ff4d4d" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* SETTINGS SECTIONS */}
        {SETTINGS.map((section, i) => (
          <View key={i} style={styles.section}>
            <ThemedText style={styles.sectionTitle}>{t(section.titleKey)}</ThemedText>
            {section.items.map((item, j) => (
              <TouchableOpacity key={j} style={styles.settingItem} onPress={() => handleItemPress(item.key)}>
                <View style={styles.settingLeft}>
                  <View style={styles.settingIconBox}>
                    <Ionicons name={item.icon as any} size={18} color="#aaa" />
                  </View>
                  <ThemedText style={styles.settingText}>{t(item.key)}</ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#555" />
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* LOGOUT BUTTON */}
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color="#FF4D8D" />
          <ThemedText style={styles.logoutText}>{t('logout')}</ThemedText>
        </TouchableOpacity>

      </ScrollView>
      {/* TERMS & CONDITIONS MODAL */}
      <Modal visible={showTermsModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>{t('termsConditions')}</ThemedText>
              <TouchableOpacity onPress={() => setShowTermsModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
              <ThemedText style={styles.policySubTitle}>Last Updated: July 2026</ThemedText>
              
              <ThemedText style={styles.policySectionHeader}>1. Acceptance of Terms</ThemedText>
              <ThemedText style={styles.policyBodyText}>
                By creating an account on VVS Matrimony, you agree to be bound by these Terms and Conditions. If you do not agree, please do not access or use our services.
              </ThemedText>

              <ThemedText style={styles.policySectionHeader}>2. Eligibility & Verification</ThemedText>
              <ThemedText style={styles.policyBodyText}>
                This platform is exclusively for members of the Vasudev community who are of legal marriageable age (18 for women, 21 for men). Profile information must be accurate, truthful, and updated.
              </ThemedText>

              <ThemedText style={styles.policySectionHeader}>3. Content Moderation & Safety</ThemedText>
              <ThemedText style={styles.policyBodyText}>
                We enforce a zero-tolerance policy against inappropriate content, nudity, harassment, or fraudulent profiles. Any violation will result in immediate termination of account access and removal from our database.
              </ThemedText>

              <ThemedText style={styles.policySectionHeader}>4. Code of Conduct</ThemedText>
              <ThemedText style={styles.policyBodyText}>
                Members must respect fellow users' privacy. You agree not to distribute or spam other members, and only send connections or interest requests in good faith for matrimonial purposes.
              </ThemedText>

              <ThemedText style={styles.policySectionHeader}>5. Limitation of Liability</ThemedText>
              <ThemedText style={styles.policyBodyText}>
                VVS Matrimony does not conduct background checks on members' personal or financial status. Users are advised to independently verify all details before proceeding with matrimonial alliances.
              </ThemedText>

            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* PRIVACY POLICY MODAL */}
      <Modal visible={showPrivacyModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>{t('privacyPolicy')}</ThemedText>
              <TouchableOpacity onPress={() => setShowPrivacyModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
              <ThemedText style={styles.policySubTitle}>Last Updated: July 2026</ThemedText>

              <ThemedText style={styles.policySectionHeader}>1. Information We Collect</ThemedText>
              <ThemedText style={styles.policyBodyText}>
                We collect personal information including your full name, date of birth, gender, educational background, profession, contact number, photos, and matrimonial biodata to help match profiles.
              </ThemedText>

              <ThemedText style={styles.policySectionHeader}>2. How We Use Information</ThemedText>
              <ThemedText style={styles.policyBodyText}>
                Your profile information is shared with other registered users on VVS Matrimony according to your matching preferences. We use secure servers and do not sell or lease your personal data to third parties.
              </ThemedText>

              <ThemedText style={styles.policySectionHeader}>3. Media & Document Safety</ThemedText>
              <ThemedText style={styles.policyBodyText}>
                Photos and biodata PDFs are hosted securely. Other members can view your profile photo and profession, but can only view your full profile and biodata document once they are authenticated and approved by you.
              </ThemedText>

              <ThemedText style={styles.policySectionHeader}>4. Account Deletion Rights</ThemedText>
              <ThemedText style={styles.policyBodyText}>
                In compliance with Google Play Store rules, you can request permanent deletion of your account and all associated data, including profiles, photos, and biodata files, directly from the settings panel or by contacting our support desk.
              </ThemedText>

              <ThemedText style={styles.policySectionHeader}>5. Contact Support</ThemedText>
              <ThemedText style={styles.policyBodyText}>
                If you have any questions about this Privacy Policy or wish to request data deletion, please contact us at support@vvsmatrimony.org.
              </ThemedText>

            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* DEACTIVATE ACCOUNT CONFIRMATION MODAL */}
      <Modal visible={showConfirmDeactivateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.confirmDeleteModalContent}>
            <View style={styles.confirmDeleteHeader}>
              <Ionicons name="pause-circle-outline" size={32} color="#FF9F1C" />
              <ThemedText style={[styles.confirmDeleteTitle, { color: '#FF9F1C' }]}>Deactivate Your Account?</ThemedText>
            </View>

            <ScrollView contentContainerStyle={styles.confirmDeleteBody} showsVerticalScrollIndicator={false}>
              <ThemedText style={styles.confirmDeleteWarningIntro}>
                Deactivating your account will hide your profile from all other members. You can re-activate your account anytime by logging back in.
              </ThemedText>

              <ThemedText style={styles.confirmDeleteConfirmationPrompt}>
                Are you sure you want to deactivate your account?
              </ThemedText>

              <View style={styles.confirmDeleteActions}>
                <TouchableOpacity 
                  style={[styles.confirmDeleteBtnFinal, { backgroundColor: '#FF9F1C' }]} 
                  onPress={confirmDeactivateAccount}
                  disabled={deactivatingAccount}>
                  {deactivatingAccount ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <ThemedText style={styles.confirmDeleteBtnFinalText}>Yes, Deactivate My Account</ThemedText>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.cancelDeleteBtn} 
                  onPress={() => setShowConfirmDeactivateModal(false)}
                  disabled={deactivatingAccount}>
                  <ThemedText style={styles.cancelDeleteBtnText}>Cancel & Keep Active</ThemedText>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* DELETE ACCOUNT CONFIRMATION MODAL */}
      <Modal visible={showConfirmDeleteModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.confirmDeleteModalContent}>
            <View style={styles.confirmDeleteHeader}>
              <Ionicons name="warning-outline" size={32} color="#ff4d4d" />
              <ThemedText style={styles.confirmDeleteTitle}>Delete Your Account?</ThemedText>
            </View>

            <ScrollView contentContainerStyle={styles.confirmDeleteBody} showsVerticalScrollIndicator={false}>
              <ThemedText style={styles.confirmDeleteWarningIntro}>
                This is a highly critical and irreversible action. Once you proceed, the following data will be permanently destroyed and cannot be recovered:
              </ThemedText>

              <View style={styles.warningList}>
                <View style={styles.warningItem}>
                  <Ionicons name="close-circle-outline" size={18} color="#ff4d4d" />
                  <ThemedText style={styles.warningItemText}>Your personal matrimonial profile data.</ThemedText>
                </View>
                <View style={styles.warningItem}>
                  <Ionicons name="close-circle-outline" size={18} color="#ff4d4d" />
                  <ThemedText style={styles.warningItemText}>All uploaded profile and gallery photos.</ThemedText>
                </View>
                <View style={styles.warningItem}>
                  <Ionicons name="close-circle-outline" size={18} color="#ff4d4d" />
                  <ThemedText style={styles.warningItemText}>Matrimonial Biodata documents (PDFs).</ThemedText>
                </View>
                <View style={styles.warningItem}>
                  <Ionicons name="close-circle-outline" size={18} color="#ff4d4d" />
                  <ThemedText style={styles.warningItemText}>All active connection interests and chats.</ThemedText>
                </View>
              </View>

              <ThemedText style={styles.confirmDeleteConfirmationPrompt}>
                Are you absolutely sure you want to proceed with account deletion?
              </ThemedText>

              <View style={styles.confirmDeleteActions}>
                <TouchableOpacity 
                  style={styles.confirmDeleteBtnFinal} 
                  onPress={confirmDeleteAccount}
                  disabled={deletingAccount}>
                  {deletingAccount ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <ThemedText style={styles.confirmDeleteBtnFinalText}>Yes, Delete My Account</ThemedText>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.cancelDeleteBtn} 
                  onPress={() => setShowConfirmDeleteModal(false)}
                  disabled={deletingAccount}>
                  <ThemedText style={styles.cancelDeleteBtnText}>Cancel & Keep Account</ThemedText>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0D',
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#17171C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
  },
  section: {
    marginBottom: 26,
  },
  sectionTitle: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // Language card
  langCard: {
    backgroundColor: '#17171C',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 14,
  },
  langLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  langLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  langToggle: {
    flexDirection: 'row',
    backgroundColor: '#0B0B0D',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  langOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  langOptionActive: {
    backgroundColor: '#FF4D8D',
  },
  langOptionText: {
    color: '#888',
    fontWeight: '700',
    fontSize: 14,
  },
  langOptionTextActive: {
    color: '#fff',
  },

  // Settings items
  settingItem: {
    backgroundColor: '#17171C',
    borderRadius: 18,
    height: 58,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#222228',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: 10,
    backgroundColor: 'rgba(255, 77, 141, 0.1)',
    borderRadius: 18,
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 40,
  },
  logoutText: {
    color: '#FF4D8D',
    fontWeight: '700',
  },

  // Modal & Policy Guides Styles
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
  modalBody: {
    paddingVertical: 20,
    paddingBottom: 40,
  },
  policySubTitle: {
    color: '#8E8E95',
    fontSize: 12,
    marginBottom: 20,
  },
  policySectionHeader: {
    color: '#FF4D8D',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 18,
    marginBottom: 8,
  },
  policyBodyText: {
    color: '#CFCFD6',
    fontSize: 14,
    lineHeight: 22,
  },
  closeModalButton: {
    backgroundColor: '#FF4D8D',
    borderRadius: 16,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  closeModalButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  accountSubOptions: {
    backgroundColor: '#131317',
    borderRadius: 18,
    marginTop: -4,
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  subSettingItem: {
    height: 52,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subSettingText: {
    color: '#D0D0DC',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 12,
  },
  // Confirm Delete Modal Styles
  confirmDeleteModalContent: {
    backgroundColor: '#151519',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 24,
    paddingHorizontal: 24,
    maxHeight: '90%',
  },
  confirmDeleteHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  confirmDeleteTitle: {
    color: '#ff4d4d',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 10,
  },
  confirmDeleteBody: {
    paddingBottom: 40,
  },
  confirmDeleteWarningIntro: {
    color: '#CFCFD6',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
  warningList: {
    backgroundColor: '#1E1416',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 77, 0.1)',
    marginBottom: 24,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  warningItemText: {
    color: '#E0CCD0',
    fontSize: 13,
    fontWeight: '500',
  },
  confirmDeleteConfirmationPrompt: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  confirmDeleteActions: {
    gap: 12,
  },
  confirmDeleteBtnFinal: {
    backgroundColor: '#ff4d4d',
    borderRadius: 16,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmDeleteBtnFinalText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelDeleteBtn: {
    backgroundColor: '#222228',
    borderRadius: 16,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelDeleteBtnText: {
    color: '#aaa',
    fontSize: 15,
    fontWeight: '600',
  },
});