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
import { QSLogo } from "../components/QSLogo";
import { useAuth } from "../context/AuthContext";
import { useUser } from "../hooks/useUser";
import { createStyles } from "../styles/QSLogin.styles";

export default function QSLoginScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";
    const { getUserByPhone, loading: dbLoading } = useUser();
    const { signIn } = useAuth();

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

    const [phoneNumber, setPhoneNumber] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        const trimmedPhone = phoneNumber.trim();
        const trimmedPassword = password.trim();

        if (!trimmedPhone || !trimmedPassword) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Please fill in all fields'
            });
            return;
        }

        const user = await getUserByPhone(trimmedPhone);

        if (user && user.password_hash === trimmedPassword) {
            // Success
            await signIn({
                id: user.id,
                phone: user.phone,
                username: user.username,
                avatar: user.avatar,
            });
            router.replace("/");
        } else {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Invalid phone number or password'
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
                        {/* Phone Number Input */}
                        <View style={styles.inputGroup}>
                            <View style={styles.inputIconContainer}>
                                <MaterialCommunityIcons name="cellphone" size={20} color={theme.textSecondary} />
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="Phone Number"
                                placeholderTextColor={theme.placeholder}
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                                keyboardType="phone-pad"
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
                            <TouchableOpacity
                                onPress={() => setShowPassword(!showPassword)}
                                style={styles.eyeIconContainer}
                            >
                                <MaterialCommunityIcons
                                    name={showPassword ? "eye" : "eye-off"}
                                    size={20}
                                    color={theme.textSecondary}
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Forgot Password */}
                        <View style={styles.forgotPasswordContainer}>
                            <TouchableOpacity>
                                <Text style={styles.forgotPasswordText}>
                                    Forgot Password?
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Login Button */}
                        <QSButton
                            title="Log In"
                            onPress={handleLogin}
                            loading={dbLoading}
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
