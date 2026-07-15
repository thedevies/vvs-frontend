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
import { useAppTheme } from '@/context/ThemeContext';

export default function SettingsScreen() {
  const { t, language, setLanguage } = useLanguage();
  const { logout } = useAuth();
  const { colors, isDark, toggleTheme } = useAppTheme();
  const styles = getStyles(colors);

  const [accountOpen, setAccountOpen] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [showConfirmDeactivateModal, setShowConfirmDeactivateModal] = useState(false);
  const [deactivatingAccount, setDeactivatingAccount] = useState(false);
  const [showDangerZoneModal, setShowDangerZoneModal] = useState(false);

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

  const SUPPORT_ITEMS = [
    { key: 'helpCenter' as const, icon: 'help-circle-outline' },
    { key: 'reportProblem' as const, icon: 'flag-outline' },
    { key: 'termsConditions' as const, icon: 'document-text-outline' },
    { key: 'privacyPolicy' as const, icon: 'shield-checkmark-outline' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>{t('settings')}</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        {/* ── Preferences ── */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Preferences</ThemedText>

          <View style={styles.groupCard}>
            {/* Language Row */}
            <View style={[styles.groupRow, { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
              <View style={styles.rowLeft}>
                <View style={styles.rowIconDot}>
                  <Ionicons name="language-outline" size={16} color="#FF4D8D" />
                </View>
                <ThemedText style={[styles.rowLabel, { color: colors.text }]}>{t('appLanguage')}</ThemedText>
              </View>
              <View style={[styles.segmented, { backgroundColor: colors.background }]}>
                <TouchableOpacity
                  style={[styles.segmentOption, language === 'en' && styles.segmentOptionActive]}
                  onPress={() => setLanguage('en')}>
                  <ThemedText style={[styles.segmentText, { color: colors.muted }, language === 'en' && styles.segmentTextActive]}>
                    {t('english')}
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.segmentOption, language === 'mr' && styles.segmentOptionActive]}
                  onPress={() => setLanguage('mr')}>
                  <ThemedText style={[styles.segmentText, { color: colors.muted }, language === 'mr' && styles.segmentTextActive]}>
                    {t('marathi')}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            {/* Theme Row */}
            <View style={[styles.groupRow, { borderBottomWidth: 0 }]}>
              <View style={styles.rowLeft}>
                <View style={styles.rowIconDot}>
                  <Ionicons name={isDark ? 'moon-outline' : 'sunny-outline'} size={16} color="#FF4D8D" />
                </View>
                <ThemedText style={[styles.rowLabel, { color: colors.text }]}>Appearance</ThemedText>
              </View>
              <View style={[styles.segmented, { backgroundColor: colors.background }]}>
                <TouchableOpacity
                  style={[styles.segmentOption, !isDark && styles.segmentOptionActive]}
                  onPress={() => { if (isDark) toggleTheme(); }}>
                  <ThemedText style={[styles.segmentText, { color: colors.muted }, !isDark && styles.segmentTextActive]}>
                    Light
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.segmentOption, isDark && styles.segmentOptionActive]}
                  onPress={() => { if (!isDark) toggleTheme(); }}>
                  <ThemedText style={[styles.segmentText, { color: colors.muted }, isDark && styles.segmentTextActive]}>
                    Dark
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* ── Account ── */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>{t('account')}</ThemedText>

          <View style={styles.groupCard}>
            <TouchableOpacity
              style={[
                styles.groupRow,
                accountOpen && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
              ]}
              activeOpacity={0.7}
              onPress={() => setAccountOpen((prev) => !prev)}>
              <View style={styles.rowLeft}>
                <View style={styles.rowIconDot}>
                  <Ionicons name="person-circle-outline" size={16} color="#FF4D8D" />
                </View>
                <ThemedText style={[styles.rowLabel, { color: colors.text }]}>Account Settings</ThemedText>
              </View>
              <Ionicons name={accountOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
            </TouchableOpacity>

            {accountOpen && (
              <View>
                <TouchableOpacity
                  style={[styles.subRow, { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
                  onPress={() => handleItemPress('editProfile')}>
                  <View style={styles.rowLeft}>
                    <Ionicons name="person-outline" size={16} color={colors.textSecondary ?? colors.text} style={{ width: 20 }} />
                    <ThemedText style={[styles.subRowLabel, { color: colors.text }]}>{t('editProfile')}</ThemedText>
                  </View>
                  <Ionicons name="chevron-forward" size={15} color={colors.muted} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.subRow, { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
                  onPress={() => handleItemPress('changePassword')}>
                  <View style={styles.rowLeft}>
                    <Ionicons name="lock-closed-outline" size={16} color={colors.textSecondary ?? colors.text} style={{ width: 20 }} />
                    <ThemedText style={[styles.subRowLabel, { color: colors.text }]}>{t('changePassword')}</ThemedText>
                  </View>
                  <Ionicons name="chevron-forward" size={15} color={colors.muted} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.subRow, { borderBottomWidth: 0 }]}
                  onPress={() => setShowDangerZoneModal(true)}>
                  <View style={styles.rowLeft}>
                    <Ionicons name="warning-outline" size={16} color="#ff4d4d" style={{ width: 20 }} />
                    <ThemedText style={[styles.subRowLabel, { color: '#ff4d4d', fontWeight: '700' }]}>Danger Zone</ThemedText>
                  </View>
                  <Ionicons name="chevron-forward" size={15} color="#ff4d4d" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* ── Support ── */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>{t('support')}</ThemedText>

          <View style={styles.groupCard}>
            {SUPPORT_ITEMS.map((item, idx) => (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.groupRow,
                  idx < SUPPORT_ITEMS.length - 1 && {
                    borderBottomColor: colors.border,
                    borderBottomWidth: StyleSheet.hairlineWidth,
                  },
                ]}
                activeOpacity={0.7}
                onPress={() => handleItemPress(item.key)}>
                <View style={styles.rowLeft}>
                  <View style={styles.rowIconDot}>
                    <Ionicons name={item.icon as any} size={16} color="#FF4D8D" />
                  </View>
                  <ThemedText style={[styles.rowLabel, { color: colors.text }]}>{t(item.key)}</ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={17} color={colors.muted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Logout ── */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.75}>
            <Ionicons name="log-out-outline" size={18} color="#FF4D8D" />
            <ThemedText style={styles.logoutText}>{t('logout')}</ThemedText>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* ── TERMS & CONDITIONS MODAL ── */}
      <Modal visible={showTermsModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>{t('termsConditions')}</ThemedText>
              <TouchableOpacity onPress={() => setShowTermsModal(false)} style={styles.modalXBtn}>
                <Ionicons name="close" size={20} color={colors.text} />
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

      {/* ── PRIVACY POLICY MODAL ── */}
      <Modal visible={showPrivacyModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>{t('privacyPolicy')}</ThemedText>
              <TouchableOpacity onPress={() => setShowPrivacyModal(false)} style={styles.modalXBtn}>
                <Ionicons name="close" size={20} color={colors.text} />
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

      {/* ── DEACTIVATE ACCOUNT CONFIRMATION MODAL ── */}
      <Modal visible={showConfirmDeactivateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalContent}>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowConfirmDeactivateModal(false)}>
              <Ionicons name="close" size={18} color={colors.text} />
            </TouchableOpacity>

            <View style={styles.confirmIconWrap}>
              <View style={[styles.confirmIconCircle, { backgroundColor: 'rgba(255,159,28,0.12)' }]}>
                <Ionicons name="pause-circle-outline" size={26} color="#FF9F1C" />
              </View>
              <ThemedText style={[styles.confirmTitle, { color: '#FF9F1C' }]}>Deactivate Your Account?</ThemedText>
            </View>

            <ScrollView contentContainerStyle={styles.confirmBody} showsVerticalScrollIndicator={false}>
              <ThemedText style={styles.confirmIntro}>
                Deactivating your account will hide your profile from all other members. You can re-activate your account anytime by logging back in.
              </ThemedText>

              <ThemedText style={styles.confirmPrompt}>
                Are you sure you want to deactivate your account?
              </ThemedText>

              <TouchableOpacity
                style={[styles.confirmBtnFinal, { backgroundColor: '#FF9F1C' }]}
                onPress={confirmDeactivateAccount}
                disabled={deactivatingAccount}>
                {deactivatingAccount ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <ThemedText style={styles.confirmBtnFinalText}>Yes, Deactivate My Account</ThemedText>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── DELETE ACCOUNT CONFIRMATION MODAL ── */}
      <Modal visible={showConfirmDeleteModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalContent}>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowConfirmDeleteModal(false)}>
              <Ionicons name="close" size={18} color={colors.text} />
            </TouchableOpacity>

            <View style={styles.confirmIconWrap}>
              <View style={[styles.confirmIconCircle, { backgroundColor: 'rgba(255,77,77,0.12)' }]}>
                <Ionicons name="warning-outline" size={26} color="#ff4d4d" />
              </View>
              <ThemedText style={styles.confirmTitle}>Delete Your Account?</ThemedText>
            </View>

            <ScrollView contentContainerStyle={styles.confirmBody} showsVerticalScrollIndicator={false}>
              <ThemedText style={styles.confirmIntro}>
                This is a highly critical and irreversible action. Once you proceed, the following data will be permanently destroyed and cannot be recovered:
              </ThemedText>

              <View style={styles.warningList}>
                <View style={styles.warningItem}>
                  <Ionicons name="close-circle-outline" size={17} color="#ff4d4d" />
                  <ThemedText style={styles.warningItemText}>Your personal matrimonial profile data.</ThemedText>
                </View>
                <View style={styles.warningItem}>
                  <Ionicons name="close-circle-outline" size={17} color="#ff4d4d" />
                  <ThemedText style={styles.warningItemText}>All uploaded profile and gallery photos.</ThemedText>
                </View>
                <View style={styles.warningItem}>
                  <Ionicons name="close-circle-outline" size={17} color="#ff4d4d" />
                  <ThemedText style={styles.warningItemText}>Matrimonial Biodata documents (PDFs).</ThemedText>
                </View>
                <View style={[styles.warningItem, { marginBottom: 0 }]}>
                  <Ionicons name="close-circle-outline" size={17} color="#ff4d4d" />
                  <ThemedText style={styles.warningItemText}>All active connection interests and chats.</ThemedText>
                </View>
              </View>

              <ThemedText style={styles.confirmPrompt}>
                Are you absolutely sure you want to proceed with account deletion?
              </ThemedText>

              <TouchableOpacity
                style={styles.confirmBtnFinal}
                onPress={confirmDeleteAccount}
                disabled={deletingAccount}>
                {deletingAccount ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <ThemedText style={styles.confirmBtnFinalText}>Yes, Delete My Account</ThemedText>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── DANGER ZONE MODAL ── */}
      <Modal visible={showDangerZoneModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalContent}>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowDangerZoneModal(false)}>
              <Ionicons name="close" size={18} color={colors.text} />
            </TouchableOpacity>

            <View style={styles.confirmIconWrap}>
              <View style={[styles.confirmIconCircle, { backgroundColor: 'rgba(255,77,77,0.12)' }]}>
                <Ionicons name="warning-outline" size={26} color="#ff4d4d" />
              </View>
              <ThemedText style={styles.confirmTitle}>Danger Zone</ThemedText>
            </View>

            <View style={styles.confirmBody}>
              <ThemedText style={styles.confirmIntro}>
                Select an action below to temporarily hide your account or permanently delete your data.
              </ThemedText>

              <View style={{ gap: 12, marginTop: 20 }}>
                <TouchableOpacity
                  style={[styles.confirmBtnFinal, { backgroundColor: '#FF9F1C' }]}
                  onPress={() => {
                    setShowDangerZoneModal(false);
                    setShowConfirmDeactivateModal(true);
                  }}>
                  <ThemedText style={styles.confirmBtnFinalText}>Deactivate Account</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.confirmBtnFinal, { backgroundColor: '#ff4d4d' }]}
                  onPress={() => {
                    setShowDangerZoneModal(false);
                    setShowConfirmDeleteModal(true);
                  }}>
                  <ThemedText style={styles.confirmBtnFinalText}>Delete Account</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 28,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  // ── Section ──
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // ── Grouped card & rows ──
  groupCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 58,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowIconDot: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: 'rgba(255,77,141,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '600',
  },

  // ── Segmented control ──
  segmented: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
    gap: 3,
  },
  segmentOption: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  segmentOptionActive: {
    backgroundColor: '#FF4D8D',
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: '#fff',
  },

  // ── Account sub rows ──
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
    paddingLeft: 16,
  },
  subRowLabel: {
    fontSize: 13.5,
    fontWeight: '500',
  },

  // ── Logout ──
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(255,77,141,0.35)',
    backgroundColor: 'rgba(255,77,141,0.06)',
  },
  logoutText: {
    color: '#FF4D8D',
    fontWeight: '700',
    fontSize: 14,
  },

  // ── Terms/Privacy Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 18,
    paddingHorizontal: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  modalXBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.card2 ?? colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    paddingVertical: 18,
    paddingBottom: 40,
  },
  policySubTitle: {
    color: colors.muted,
    fontSize: 12,
    marginBottom: 18,
  },
  policySectionHeader: {
    color: '#FF4D8D',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 6,
  },
  policyBodyText: {
    color: colors.text,
    fontSize: 13.5,
    lineHeight: 21,
    opacity: 0.85,
  },

  // ── Confirmation modals (deactivate/delete/danger zone) ──
  confirmModalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 22,
    paddingHorizontal: 22,
    maxHeight: '90%',
    position: 'relative',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  confirmIconWrap: {
    alignItems: 'center',
    marginBottom: 18,
    marginTop: 4,
  },
  confirmIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  confirmTitle: {
    color: '#ff4d4d',
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
  },
  confirmBody: {
    paddingBottom: 36,
  },
  confirmIntro: {
    color: colors.text,
    fontSize: 13.5,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 18,
    opacity: 0.85,
  },
  warningList: {
    backgroundColor: 'rgba(255, 77, 77, 0.05)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 77, 0.12)',
    marginBottom: 22,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 11,
  },
  warningItemText: {
    color: colors.text,
    fontSize: 12.5,
    fontWeight: '500',
    opacity: 0.9,
    flex: 1,
  },
  confirmPrompt: {
    color: colors.text,
    fontSize: 13.5,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 19,
  },
  confirmBtnFinal: {
    backgroundColor: '#ff4d4d',
    borderRadius: 14,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnFinalText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});