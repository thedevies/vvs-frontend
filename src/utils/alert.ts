import { AlertButton } from 'react-native';

type AlertConfig = {
  title: string;
  message: string;
  buttons?: AlertButton[];
  type?: 'error' | 'success' | 'info';
};

type AlertListener = (config: AlertConfig | null) => void;

let alertListener: AlertListener | null = null;

export const registerAlertListener = (listener: AlertListener) => {
  alertListener = listener;
};

export const CustomAlert = {
  alert: (
    title: string,
    message: string,
    buttons?: AlertButton[],
    type?: 'error' | 'success' | 'info'
  ) => {
    if (alertListener) {
      alertListener({ title, message, buttons, type });
    } else {
      // Fallback to native if not registered
      const { Alert } = require('react-native');
      Alert.alert(title, message, buttons);
    }
  }
};
