import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';

export default function CustomInput({
  placeholder,
  secureTextEntry,
  style,
  ...props
}: TextInputProps) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={[styles.input, { color: colors.text }, style]}
        secureTextEntry={secureTextEntry}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    paddingHorizontal: 18,
    borderWidth: 1,
  },
  input: {
    height: 58,
    fontSize: 16,
  },
});