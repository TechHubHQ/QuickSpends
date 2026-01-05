import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { QSButton } from "../components/QSButton";
import { useAuth } from "../context/AuthContext";
import { useUser } from "../hooks/useUser";
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
  const { createUser, loading: dbLoading } = useUser();
  const { signIn } = useAuth();

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    fullName?: string;
    phoneNumber?: string;
    password?: string;
  }>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!fullName.trim()) newErrors.fullName = "Full Name is required";
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone Number is required";
    } else if (!/^\d{10}$/.test(phoneNumber.trim())) {
      newErrors.phoneNumber = "Invalid phone number";
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
      const userId = await createUser(fullName, phoneNumber, password);
      if (userId) {
        const trimmedPhone = phoneNumber.trim();
        const trimmedName = fullName.trim();
        await signIn({
          id: userId,
          phone: trimmedPhone,
          username: trimmedName,
          avatar: undefined,
        });
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Account created successfully!'
        });
        router.replace("/");
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Registration failed. This phone number might already be registered.'
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialCommunityIcons name="chevron-left" size={20} color={theme.text} style={styles.backIcon} />
          </TouchableOpacity>
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

            {/* Phone Number */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="cellphone" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[
                    styles.input,
                    errors.phoneNumber && styles.inputError,
                  ]}
                  placeholder="1234567890"
                  placeholderTextColor={theme.inputPlaceholder}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                />
                {phoneNumber.length === 10 && !errors.phoneNumber && (
                  <MaterialCommunityIcons name="check-circle" size={20} color={theme.primary} style={styles.inputSuccessIcon} />
                )}
              </View>
              {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
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
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <MaterialCommunityIcons name={showPassword ? "eye" : "eye-off"} size={20} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            <QSButton
              title="Create Account"
              onPress={handleRegister}
              loading={dbLoading}
            />

            {/* Footer */}
            <View style={styles.footerSection}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => router.push("/login")}>
                <Text style={styles.footerLinkText}>Log In</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.bottomSpacer} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
