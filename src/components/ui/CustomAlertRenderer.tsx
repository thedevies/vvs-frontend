import React, { useState, useEffect } from 'react';
import { Modal, StyleSheet, TouchableOpacity, View, AlertButton } from 'react-native';
import { ThemedText } from '../themed-text';
import { registerAlertListener } from '@/utils/alert';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/context/ThemeContext';

type AlertConfig = {
  title: string;
  message: string;
  buttons?: AlertButton[];
  type?: 'error' | 'success' | 'info';
};

const isErrorAlert = (title: string, message: string) => {
  const lowerTitle = (title || '').toLowerCase();
  const lowerMsg = (message || '').toLowerCase();
  
  const errorWords = [
    'error', 'fail', 'invalid', 'wrong', 'denied', 'permission', 
    'needed', 'required', 'too long', 'declined', 'validation',
    'restricted', 'not allowed', 'cannot', 'could not', 'limit'
  ];
  
  return errorWords.some(word => lowerTitle.includes(word) || lowerMsg.includes(word));
};

export default function CustomAlertRenderer() {
  const [config, setConfig] = useState<AlertConfig | null>(null);
  const { colors, isDark } = useAppTheme();

  useEffect(() => {
    registerAlertListener((cfg) => {
      setConfig(cfg);
    });
    return () => {
      registerAlertListener(() => {});
    };
  }, []);

  if (!config) return null;

  const handleButtonPress = (btn?: AlertButton) => {
    setConfig(null);
    if (btn && btn.onPress) {
      btn.onPress();
    }
  };

  const hasButtons = config.buttons && config.buttons.length > 0;
  const buttons = hasButtons ? config.buttons! : [{ text: 'OK' }];

  const isError = config.type === 'error' || isErrorAlert(config.title, config.message);

  return (
    <Modal
      transparent
      visible={true}
      animationType="fade"
      onRequestClose={() => setConfig(null)}
    >
      <View style={styles.overlay}>
        <View style={[
          styles.alertCard,
          {
            backgroundColor: colors.card,
            borderColor: isError ? 'rgba(239, 68, 68, 0.4)' : colors.border,
          }
        ]}>
          {isError ? (
            <Ionicons name="alert-circle-outline" size={44} color="#EF4444" style={{ marginBottom: 12 }} />
          ) : (
            <Ionicons name="information-circle-outline" size={44} color="#FF4D8D" style={{ marginBottom: 12 }} />
          )}

          <ThemedText style={[
            styles.title,
            { color: isError ? '#EF4444' : colors.text }
          ]}>
            {config.title}
          </ThemedText>
          <ThemedText style={[styles.message, { color: colors.textSecondary }]}>
            {config.message}
          </ThemedText>
          
          <View style={styles.buttonsRow}>
            {buttons.map((btn, index) => {
              const isCancel = btn.style === 'cancel';
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    isCancel 
                      ? [styles.cancelButton, { backgroundColor: isDark ? '#232329' : '#F3F4F6', borderColor: colors.border }] 
                      : (isError ? styles.errorButton : styles.confirmButton),
                  ]}
                  onPress={() => handleButtonPress(btn)}
                >
                  <ThemedText style={[
                    styles.buttonText,
                    isCancel ? [styles.cancelButtonText, { color: colors.textSecondary }] : styles.confirmButtonText
                  ]}>
                    {btn.text}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  alertCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    justifyContent: 'center',
  },
  button: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#FF4D8D',
  },
  errorButton: {
    backgroundColor: '#EF4444',
  },
  cancelButton: {
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  confirmButtonText: {
    color: '#fff',
  },
  cancelButtonText: {
  },
});
