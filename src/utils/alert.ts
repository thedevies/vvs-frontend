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

export const sanitizeErrorMessage = (message: string): string => {
  if (!message) return 'Something went wrong. Please try again.';

  const msgLower = message.toLowerCase();

  // 1. Session expiration
  if (
    msgLower.includes('session_expired') ||
    msgLower.includes('unauthorized') ||
    msgLower.includes('jwt expired') ||
    msgLower.includes('token expired')
  ) {
    return 'Your session has expired. Please log in again to continue.';
  }

  // 2. Network / server down
  if (
    msgLower.includes('network request failed') ||
    msgLower.includes('failed to connect') ||
    msgLower.includes('network error') ||
    msgLower.includes('connection refused')
  ) {
    return 'We are unable to connect to our servers right now. Please check your internet connection and try again.';
  }

  // 3. API endpoint not found / system method errors / db crash
  if (
    msgLower.includes('cannot post') ||
    msgLower.includes('cannot get') ||
    msgLower.includes('cannot patch') ||
    msgLower.includes('cannot delete') ||
    msgLower.includes('status 500') ||
    msgLower.includes('status 404') ||
    msgLower.includes('internal server error') ||
    msgLower.includes('prisma') ||
    msgLower.includes('database') ||
    msgLower.includes('invariant violation')
  ) {
    return 'A temporary system issue occurred. We are working to resolve it. Please try again in a few moments.';
  }

  // 4. File uploads limits / failures
  if (
    msgLower.includes('upload failed') ||
    msgLower.includes('could not upload') ||
    msgLower.includes('failed to upload')
  ) {
    return 'We were unable to upload your file. Please ensure it is a valid format and try again.';
  }

  // 5. Short/polite messages already format, just return them
  return message;
};

export const CustomAlert = {
  alert: (
    title: string,
    message: string,
    buttons?: AlertButton[],
    type?: 'error' | 'success' | 'info'
  ) => {
    // Sanitize the message if it is an error type or if title indicates an error
    const lowerTitle = (title || '').toLowerCase();
    const isError =
      type === 'error' ||
      lowerTitle.includes('error') ||
      lowerTitle.includes('fail') ||
      lowerTitle.includes('validation') ||
      lowerTitle.includes('invalid') ||
      lowerTitle.includes('wrong');

    const sanitizedMessage = isError ? sanitizeErrorMessage(message) : message;

    if (alertListener) {
      alertListener({ title, message: sanitizedMessage, buttons, type });
    } else {
      // Fallback to native if not registered
      const { Alert } = require('react-native');
      Alert.alert(title, sanitizedMessage, buttons);
    }
  }
};
