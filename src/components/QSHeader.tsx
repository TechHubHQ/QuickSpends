import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Text, TouchableOpacity, View, ViewStyle } from "react-native";
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
                    <TouchableOpacity style={styles.iconButton} onPress={onBackPress}>
                        <MaterialCommunityIcons name="chevron-left" size={28} color={theme.colors.text} />
                    </TouchableOpacity>
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

            {/* Centered Title (Only if showBack is true and we want a centered title effect - 
                but based on user request "showing text which is not making sense", 
                we might just want a simple left-aligned title or standard header.
                Code below was overlaying title. Let's simplify. 
                If showBack is true, we usually want the title next to back button or centered.
                The previous implementation had a centered absolute view. 
                Let's keep it but ensure it doesn't conflict if title is meant to be on the left.
                Actually, standard iOS/Android headers often have title in the middle or left.
                Let's stick to the LEFT aligned title next to back button for non-home screens if explicit title provided?
                OR keep the center logic but fix the "Welcome Back" confusion.
            */}

            {showBack && title && (
                <View style={styles.centerTitleContainer}>
                    <Text style={[styles.userName, { fontSize: 18, textAlign: 'center' }]} numberOfLines={1}>{title}</Text>
                </View>
            )}

            <View style={styles.rightSection}>
                {rightElement ? (
                    rightElement
                ) : rightIcon ? (
                    <TouchableOpacity style={styles.iconButton} onPress={onRightPress}>
                        <View>
                            <MaterialCommunityIcons name={rightIcon} size={24} color={theme.colors.text} />
                            {String(rightIcon).includes('bell') && unreadCount > 0 && (
                                <View style={styles.badge} />
                            )}
                        </View>
                    </TouchableOpacity>
                ) : (
                    // Default to Bell Icon if nothing else is provided ONLY if it's the home styled header (no back button)
                    // If it's a sub-screen (showBack=true), we usually don't want a bell unless asked.
                    // But legacy code showed bell. Let's keep it but maybe restricted?
                    // User didn't complain about bell, just "narrowed icons".
                    <TouchableOpacity style={styles.iconButton} onPress={handleNotificationPress}>
                        <View>
                            <MaterialCommunityIcons name="bell-outline" size={24} color={theme.colors.text} />
                            {unreadCount > 0 && (
                                <View style={styles.badge} />
                            )}
                        </View>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};
