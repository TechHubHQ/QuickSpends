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
import { QSLogo } from "../components/QSLogo";
import { useAuth } from "../context/AuthContext";
import { createStyles } from "../styles/QSLogin.styles";

export default function QSLoginScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";
    const { signIn, isLoading: authLoading } = useAuth();

    const theme = {
        background: isDark ? "#0F172A" : "#F1F5F9",
        surface: isDark ? "#1E293B" : "#FFFFFF",
        text: isDark ? "#FFFFFF" : "#0F172A",
        textSecondary: isDark ? "#94A3B8" : "#64748B",
        primary: "#0EA5E9", // Updated from Teal to Blue
        inputBorder: isDark ? "#334155" : "#E2E8F0",
        inputBg: isDark ? "#1E293B" : "#FFFFFF",
        placeholder: isDark ? "#64748B" : "#94A3B8",
    };

    const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]) as any;

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        const trimmedEmail = email.trim();
        const trimmedPassword = password.trim();

        if (!trimmedEmail || !trimmedPassword) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Please fill in all fields'
            });
            return;
        }

        const { error } = await signIn(trimmedEmail, trimmedPassword);

        if (!error) {
            router.replace("/");
        } else {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'Invalid email or password'
            });
        }
    };

    return (
        <SafeAreaView
            style={styles.container}
            edges={["top", "bottom"]}
        >
            <View style={styles.accentBlueBlob} />
            <View style={styles.primaryBlob} />

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header Section */}
                    <View style={styles.headerContainer}>
                        <View style={styles.mainCardContainer}>
                            <View style={styles.imageContainer}>
                                <QSLogo />
                            </View>
                        </View>
                        <Text style={styles.appName}>QuickSpends</Text>
                        <Text style={styles.tagline}>
                            Manage your money, simply.
                        </Text>
                    </View>

                    {/* Form Section */}
                    <View style={styles.formContainer}>
                        {/* Email Input */}
                        <View style={styles.inputGroup}>
                            <View style={styles.inputIconContainer}>
                                <MaterialCommunityIcons name="email-outline" size={20} color={theme.textSecondary} />
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="Email Address"
                                placeholderTextColor={theme.placeholder}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"

                            />
                        </View>

                        {/* Password Input */}
                        <View style={styles.inputGroup}>
                            <View style={styles.inputIconContainer}>
                                <MaterialCommunityIcons name="lock-outline" size={20} color={theme.textSecondary} />
                            </View>
                            <TextInput
                                style={[styles.input, styles.passwordInput]}
                                placeholder="Password"
                                placeholderTextColor={theme.placeholder}
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={setPassword}

                            />
                            <Pressable
                                onPress={() => setShowPassword(!showPassword)}
                                style={styles.eyeIconContainer}
                            >
                                <MaterialCommunityIcons
                                    name={showPassword ? "eye" : "eye-off"}
                                    size={20}
                                    color={theme.textSecondary}
                                />
                            </Pressable>
                        </View>

                        {/* Forgot Password */}
                        <View style={styles.forgotPasswordContainer}>
                            <Pressable>
                                <Text style={styles.forgotPasswordText}>
                                    Forgot Password?
                                </Text>
                            </Pressable>
                        </View>

                        {/* Login Button */}
                        <QSButton
                            title="Log In"
                            onPress={handleLogin}
                            loading={authLoading}

                        />

                        {/* Signup Link */}
                        <View style={styles.signupContainer}>
                            <Text style={styles.signupText}>
                                Don't have an account?{" "}
                                <Text
                                    style={styles.signupLink}
                                    onPress={() => router.push("/registration")}
                                >
                                    Sign Up
                                </Text>
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
