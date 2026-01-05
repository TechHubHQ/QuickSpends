import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../src/context/AuthContext";
import { useAccounts } from "../src/hooks/useAccounts";
import LandingScreen from "../src/screens/QSLandingScreen";

export default function Index() {
  const { user, isLoading: authLoading } = useAuth();
  const { getAccountsByUser } = useAccounts();
  const router = useRouter();
  const [isCheckingAccounts, setIsCheckingAccounts] = useState(false);

  useEffect(() => {
    async function checkUserStatus() {
      if (!authLoading && user) {
        setIsCheckingAccounts(true);
        try {
          const accounts = await getAccountsByUser(user.id);
          if (accounts && accounts.length > 0) {
            router.replace("/(tabs)/home");
          } else {
            router.replace("/setup-account");
          }
        } catch (error) {
          console.error("Error checking accounts:", error);
          router.replace("/(tabs)/home");
        } finally {
          setIsCheckingAccounts(false);
        }
      }
    }
    checkUserStatus();
  }, [authLoading, user]);

  if (authLoading || isCheckingAccounts) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  return <LandingScreen />;
}
