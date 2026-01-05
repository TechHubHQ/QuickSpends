import { Stack } from "expo-router";
import { useEffect } from "react";
import Toast from 'react-native-toast-message';
import { toastConfig } from "../src/components/QSToastConfig";
import { AlertProvider } from "../src/context/AlertContext";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { NotificationPreferencesProvider } from "../src/context/NotificationPreferencesContext";
import { useNotifications } from "../src/hooks/useNotifications";
import { useTransactions } from "../src/hooks/useTransactions";
import { ThemeProvider } from "../src/theme/ThemeContext";

function AppContent() {
  const { user } = useAuth();
  const { processRecurringTransactions } = useTransactions();
  const { checkAllNotifications } = useNotifications();

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
