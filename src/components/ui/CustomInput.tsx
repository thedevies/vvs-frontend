import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

export default function CustomInput({
  placeholder,
  secureTextEntry,
  ...props
}: TextInputProps) {
  return (
    <View style={styles.container}>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#777"
        style={styles.input}
        secureTextEntry={secureTextEntry}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#17171C',
    borderRadius: 18,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  input: {
    height: 58,
    color: '#fff',
    fontSize: 16,
  },
});