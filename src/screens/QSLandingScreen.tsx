import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  ScrollView,
  Text,
  View,
  useColorScheme
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { QSButton } from "../components/QSButton";
import { QSLogo } from "../components/QSLogo";
import { createStyles } from "../styles/QSLanding.styles";

export default function QSLandingScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const theme = {
    background: isDark ? "#0B1121" : "#F8FAFC",
    backgroundTransparent: isDark
      ? "rgba(11, 17, 33, 0.85)"
      : "rgba(248, 250, 252, 0.85)",
    text: isDark ? "#FFFFFF" : "#0F172A", // slate-900
    textSecondary: isDark ? "#94A3B8" : "#64748B", // slate-400 : slate-500
    textTertiary: isDark ? "#64748B" : "#94A3B8",
    cardBg: isDark ? "rgba(30, 41, 59, 0.9)" : "#FFFFFF", // Increased opacity for dark mode
    cardBorder: isDark ? "rgba(255, 255, 255, 0.1)" : "#E2E8F0", // Increased border visibility
  };

  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const handleCreateAccount = () => {
    router.push("/registration");
  };

  const handleSignIn = () => {
    router.push("/login"); // Navigate to Login Screen
  };

  const features = [
    {
      id: "1",
      icon: "account-multiple-plus",
      title: "Split Instantly",
      description: "No more awkward math after dinner.",
      color: "#0EA5E9", // primary
      bgColor: "rgba(14, 165, 233, 0.2)",
    },
    {
      id: "2",
      icon: "trending-up",
      title: "Track Growth",
      description: "Real-time analytics for your savings.",
      color: "#2DD4BF", // teal-400
      bgColor: "rgba(45, 212, 191, 0.2)",
    },
    {
      id: "3",
      icon: "piggy-bank",
      title: "Save Goals",
      description: "Plan for that dream vacation.",
      color: "#EF4444", // red-500
      bgColor: "rgba(239, 68, 68, 0.2)",
    },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >

          {/* Main Content */}
          <View style={styles.mainContent}>
            {/* Visual Card */}
            <View style={styles.mainCardContainer}>
              <View style={styles.imageContainer}>
                <QSLogo />
              </View>
              <Text style={styles.appName}>QuickSpends</Text>
            </View>

            {/* Headings */}
            <View style={styles.textSection}>
              <Text style={styles.mainHeading}>
                Master Your <Text style={styles.highlightText}>Money</Text>{" "}
                Together
              </Text>
              <Text style={styles.description}>
                Track personal expenses and split group bills in seconds. No
                friction, just QuickSpends.
              </Text>
            </View>

            {/* Features Scroll */}
            <View style={styles.featuresContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.featuresScroll}
                snapToInterval={272} // card width + margin
                decelerationRate="fast"
              >
                {features.map((item) => (
                  <View
                    key={item.id}
                    style={styles.featureCard}
                  >
                    <View
                      style={[
                        styles.featureIconContainer,
                        { backgroundColor: item.bgColor },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={item.icon as any}
                        size={24}
                        color={item.color}
                      />
                    </View>
                    <View>
                      <Text style={styles.featureTitle}>
                        {item.title}
                      </Text>
                      <Text
                        style={styles.featureDescription}
                      >
                        {item.description}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </ScrollView>

        {/* Bottom CTA Section */}
        <View style={styles.ctaContainer}>
          <View style={styles.ctaContent}>
            <QSButton
              title="Create Account"
              onPress={handleCreateAccount}
            />

            <QSButton
              title="I have an account"
              onPress={handleSignIn}
              variant="secondary"
              textStyle={{ color: theme.text }}
              style={{ borderColor: theme.cardBorder }}

            />
          </View>
          <View
            style={styles.bottomIndicator}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}
