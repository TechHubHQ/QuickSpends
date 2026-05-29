import { Stack } from "expo-router";
import { DatabaseProvider } from "../context/DatabaseContext";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <DatabaseProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </DatabaseProvider>
    </SafeAreaProvider>
  );
}
