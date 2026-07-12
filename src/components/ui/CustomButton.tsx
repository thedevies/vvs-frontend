import { StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '../themed-text';

export default function CustomButton({
  title,
  onPress,
  disabled,
}: {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
    >
      <ThemedText style={styles.text}>{title}</ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#FF4D8D',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  text: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});