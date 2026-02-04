import { Stack } from "expo-router";
import { useEffect } from "react";
import { LogBox, Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import { toastConfig } from "../src/components/QSToastConfig";
import { AlertProvider } from "../src/context/AlertContext";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { NotificationPreferencesProvider } from "../src/context/NotificationPreferencesContext";
import { useNotifications } from "../src/hooks/useNotifications";
import { useTransactions } from "../src/hooks/useTransactions";
import { useWidgetDeepLink } from "../src/hooks/useWidgetDeepLink";
import { Logger } from "../src/services/logger";
import { ThemeProvider } from "../src/theme/ThemeContext";

LogBox.ignoreLogs([
  /"shadow\*" style props are deprecated/,
  /props.pointerEvents is deprecated/,
  /Unknown event handler property `onStartShouldSetResponder`/,
  /Unknown event handler property `onResponderTerminationRequest`/,
  /Unknown event handler property `onResponderGrant`/,
  /Unknown event handler property `onResponderMove`/,
  /Unknown event handler property `onResponderRelease`/,
  /Unknown event handler property `onResponderTerminate`/,
  /Unknown event handler property `onPressOut`/,
  /TouchableMixin is deprecated/,
]);

// Web-specific console error filtering for React 19 unknown property warnings
if (Platform.OS === 'web' && __DEV__) {
  const originalError = console.error;
  console.error = (...args) => {
    const message = args[0];
    if (
      typeof message === 'string' &&
      (message.includes('Unknown event handler property `onStartShouldSetResponder`') ||
        message.includes('Unknown event handler property `onResponderTerminationRequest`') ||
        message.includes('Unknown event handler property `onResponderGrant`') ||
        message.includes('Unknown event handler property `onResponderMove`') ||
        message.includes('Unknown event handler property `onResponderRelease`') ||
        message.includes('Unknown event handler property `onResponderTerminate`') ||
        message.includes('Unknown event handler property `onPressOut`'))
    ) {
      return;
    }
    originalError(...args);
  };
}

function AppContent() {
  const { user } = useAuth();
  const { processRecurringTransactions } = useTransactions();
  const { checkAllNotifications } = useNotifications();
  
  // Handle widget deep links
  useWidgetDeepLink();

  useEffect(() => {
    if (user) {
      processRecurringTransactions(user.id);
      checkAllNotifications(user.id);
    }
  }, [user]);

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
      <Toast config={toastConfig} position="bottom" bottomOffset={40} />
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    Logger.info('App Initialized');
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider>
        <AlertProvider>
          <NotificationPreferencesProvider>
            <AppContent />
          </NotificationPreferencesProvider>
        </AlertProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
