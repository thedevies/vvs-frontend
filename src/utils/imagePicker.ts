import * as ImagePicker from 'expo-image-picker';
import { CustomAlert as Alert } from './alert';

export async function pickImageWithPermissionCheck(
  options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.8,
  }
): Promise<ImagePicker.ImagePickerResult | null> {
  try {
    // 1. Check existing media library permission
    const { status: existingStatus } = await ImagePicker.getMediaLibraryPermissionsAsync();

    let finalStatus = existingStatus;

    // 2. If not granted, request permission explicitly
    if (existingStatus !== 'granted') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      finalStatus = status;
    }

    // 3. If still denied / not granted, block gallery access & show alert
    if (finalStatus !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Photo library permission was denied. Please grant permission in your device Settings to select and upload photos.',
        [{ text: 'OK' }]
      );
      return null; // BLOCK GALLERY OPENING
    }

    // 4. Permission is granted — proceed to launch image library
    return await ImagePicker.launchImageLibraryAsync(options);
  } catch (err: any) {
    console.log('[ImagePicker] Error requesting permission:', err);
    Alert.alert('Permission Error', 'Could not request media library permissions.');
    return null;
  }
}
