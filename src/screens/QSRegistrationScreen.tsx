import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useColorScheme
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { QSButton } from "../components/QSButton";
import { useAuth } from "../context/AuthContext";
import { createStyles } from "../styles/QSRegistration.styles";

export default function QSRegistrationScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // New Theme Colors matching Tailwind config
  const theme = {
    background: isDark ? "#0B1D35" : "#f6f8fa",
    surface: isDark ? "#162A45" : "#FFFFFF",
    text: isDark ? "#FFFFFF" : "#111418",
    textSecondary: isDark ? "#CBD5E1" : "#637588",
    inputBorder: isDark ? "#2D4A70" : "#dce0e5",
    primary: "#0EA5E9", // Updated from Teal to Blue
    inputPlaceholder: isDark ? "#526071" : "#637588",
  };

  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const { signUp, isLoading: authLoading } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
  }>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!fullName.trim()) newErrors.fullName = "Full Name is required";
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Invalid email address";
    }
    if (!password.trim()) {
      newErrors.password = "Password is required";
    } else if (password.trim().length < 8) {
      newErrors.password = "Minimum 8 characters required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (validateForm()) {
      const { error } = await signUp(email.trim(), password.trim(), fullName.trim());

      if (!error) {
        Toast.show({
          type: 'success',
          text1: 'Registration Successful',
          text2: 'Please verify your email and then log in.'
        });
        router.replace("/login");
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: error.message || 'Registration failed.'
        });
      }
    }
  };

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "bottom"]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <Pressable
            style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => router.back()}
          >
            <MaterialCommunityIcons name="chevron-left" size={20} color={theme.text} style={styles.backIcon} />
          </Pressable>
          <Text style={styles.headerTitle}>QuickSpends</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Title Section */}
          <View style={styles.formSection}>
            <View style={styles.titleSection}>
              <Text style={styles.mainTitle}>Let's get started</Text>
              <Text style={styles.subTitle}>
                Track expenses and split bills in seconds.
              </Text>
            </View>

            {/* Form Fields */}
            {/* Full Name */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="account-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[
                    styles.input,
                    errors.fullName && styles.inputError,
                  ]}
                  placeholder="Your full name"
                  placeholderTextColor={theme.inputPlaceholder}
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
              {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
            </View>

            {/* Email Address */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="email-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[
                    styles.input,
                    errors.email && styles.inputError,
                  ]}
                  placeholder="yourname@gmail.com"
                  placeholderTextColor={theme.inputPlaceholder}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && !errors.email && (
                  <MaterialCommunityIcons name="check-circle" size={20} color={theme.primary} style={styles.inputSuccessIcon} />
                )}
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="lock-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[
                    styles.passwordInput,
                    errors.password && styles.inputError,
                  ]}
                  placeholder="Min. 8 characters"
                  placeholderTextColor={theme.inputPlaceholder}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <MaterialCommunityIcons name={showPassword ? "eye" : "eye-off"} size={20} color={theme.textSecondary} />
                </Pressable>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            <QSButton
              title="Create Account"
              onPress={handleRegister}
              loading={authLoading}
            />

            {/* Footer */}
            <View style={styles.footerSection}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <Pressable onPress={() => router.push("/login")}>
                <Text style={styles.footerLinkText}>Log In</Text>
              </Pressable>
            </View>
            <View style={styles.bottomSpacer} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
