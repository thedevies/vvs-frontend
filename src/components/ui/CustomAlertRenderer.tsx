import React, { useState, useEffect } from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../themed-text';
import { registerAlertListener } from '@/utils/alert';
import { AlertButton } from 'react-native';

export default function CustomAlertRenderer() {
  const [config, setConfig] = useState<{
    title: string;
    message: string;
    buttons?: AlertButton[];
  } | null>(null);

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

  return (
    <Modal
      transparent
      visible={true}
      animationType="fade"
      onRequestClose={() => setConfig(null)}
    >
      <View style={styles.overlay}>
        <View style={styles.alertCard}>
          <ThemedText style={styles.title}>{config.title}</ThemedText>
          <ThemedText style={styles.message}>{config.message}</ThemedText>
          
          <View style={styles.buttonsRow}>
            {buttons.map((btn, index) => {
              const isCancel = btn.style === 'cancel';
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    isCancel ? styles.cancelButton : styles.confirmButton,
                  ]}
                  onPress={() => handleButtonPress(btn)}
                >
                  <ThemedText style={[
                    styles.buttonText,
                    isCancel ? styles.cancelButtonText : styles.confirmButtonText
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  alertCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#17171C',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 141, 0.2)',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    color: '#B0B0B5',
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
  cancelButton: {
    backgroundColor: '#232329',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  confirmButtonText: {
    color: '#fff',
  },
  cancelButtonText: {
    color: '#9B9BA1',
  },
});
