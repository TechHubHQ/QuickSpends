import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Pressable, Text, View, ViewStyle } from "react-native";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../hooks/useNotifications";
import { createStyles } from "../styles/components/QSHeader.styles";
import { useTheme } from "../theme/ThemeContext";
import { Avatar } from "./Avatar";

interface QSHeaderProps {
    title?: string;
    subtitle?: string;
    rightIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
    onRightPress?: () => void;
    showBack?: boolean;
    onBackPress?: () => void;
    style?: ViewStyle;
    rightElement?: React.ReactNode;
}

export const QSHeader: React.FC<QSHeaderProps> = ({
    title,
    subtitle,
    rightIcon,
    onRightPress,
    showBack,
    onBackPress,
    style,
    rightElement
}) => {
    const { theme } = useTheme();
    const { user } = useAuth();
    const router = useRouter(); // Use Expo Router
    const styles = createStyles(theme);

    // Logic: If title is provided, we assume it's a specific screen (like "Settings").
    // In that case, we don't want "Welcome back" as subtitle by default.
    // We only use "Welcome back" if it's the home screen (no title provided, or explicit home context).

    // If title is NOT provided, we act like the Home Header (User name + Welcome back).
    const isHomeHeader = !title;

    const displayTitle = title || user?.username || "Friend";
    // If it's home header, default subtitle is "Welcome back,". If it's a specific page, default is empty.
    const displaySubtitle = subtitle !== undefined ? subtitle : (isHomeHeader ? "Welcome back," : null);

    const [unreadCount, setUnreadCount] = useState(0);
    const { getUnreadCount, checkAllNotifications } = useNotifications();

    useEffect(() => {
        const checkNotifications = async () => {
            if (user) {
                // Determine whether to run checks? Maybe not here to avoid performance hit on every render.
                // Just fetch count.
                const count = await getUnreadCount(user.id);
                setUnreadCount(count);
            }
        };

        checkNotifications();
        // Poll every 10 seconds
        const interval = setInterval(checkNotifications, 10000);
        return () => clearInterval(interval);
    }, [user, getUnreadCount]);

    // Default Right Action (Notifications)
    const handleNotificationPress = () => {
        router.push("/notifications");
    };

    return (
        <View style={[styles.header, style]}>
            <View style={styles.leftSection}>
                {showBack ? (
                    <Pressable
                        style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.7 }]}
                        onPress={onBackPress}
                    >
                        <MaterialCommunityIcons name="chevron-left" size={28} color={theme.colors.text} />
                    </Pressable>
                ) : (
                    <View style={styles.profileSection}>
                        <View style={styles.profileImage}>
                            <Avatar
                                seed={user?.avatar || user?.profile_url || user?.username || "User"}
                                size={44}
                                style={{ borderRadius: 22 }}
                            />
                        </View>
                        <View>
                            {displaySubtitle && <Text style={styles.greetingLabel}>{displaySubtitle}</Text>}
                            <Text style={styles.userName}>{displayTitle}</Text>
                        </View>
                    </View>
                )}
            </View>

            {/* Centered Title (Only if showBack is true and we want a centered title effect) */}
            {showBack && title && (
                <View style={styles.centerTitleContainer}>
                    <Text style={[styles.userName, { fontSize: 18, textAlign: 'center' }]} numberOfLines={1}>{title}</Text>
                </View>
            )}

            <View style={styles.rightSection}>
                {rightElement ? (
                    rightElement
                ) : rightIcon ? (
                    <Pressable
                        style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.7 }]}
                        onPress={onRightPress}
                    >
                        <View>
                            <MaterialCommunityIcons name={rightIcon} size={24} color={theme.colors.text} />
                            {String(rightIcon).includes('bell') && unreadCount > 0 && (
                                <View style={styles.badge} />
                            )}
                        </View>
                    </Pressable>
                ) : (
                    <Pressable
                        style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.7 }]}
                        onPress={handleNotificationPress}
                    >
                        <View>
                            <MaterialCommunityIcons name="bell-outline" size={24} color={theme.colors.text} />
                            {unreadCount > 0 && (
                                <View style={styles.badge} />
                            )}
                        </View>
                    </Pressable>
                )}
            </View>
        </View>
    );
};
