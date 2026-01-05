import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Platform, Text, TouchableOpacity, View, ViewStyle } from "react-native";
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

    const displayTitle = title || user?.username || "Friend";
    const displaySubtitle = subtitle || "Welcome back,";

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
                        <Text style={styles.greetingLabel}>{displaySubtitle}</Text>
                        <Text style={styles.userName}>{displayTitle}</Text>
                    </View>
                </View>
            )}

            {showBack && (
                <View style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingTop: Platform.OS === "ios" ? 20 : 40,
                    paddingBottom: 16,
                    pointerEvents: 'none'
                }}>
                    <Text style={[styles.userName, { fontSize: 18 }]}>{title}</Text>
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
                                <View style={{
                                    position: 'absolute',
                                    top: 0,
                                    right: 0,
                                    width: 10,
                                    height: 10,
                                    borderRadius: 5,
                                    backgroundColor: '#EF4444',
                                    borderWidth: 1.5,
                                    borderColor: theme.colors.card
                                }} />
                            )}
                        </View>
                    </TouchableOpacity>
                ) : (
                    // Default to Bell Icon if nothing else is provided
                    <TouchableOpacity style={styles.iconButton} onPress={handleNotificationPress}>
                        <View>
                            <MaterialCommunityIcons name="bell-outline" size={24} color={theme.colors.text} />
                            {unreadCount > 0 && (
                                <View style={{
                                    position: 'absolute',
                                    top: 0,
                                    right: 0,
                                    width: 10,
                                    height: 10,
                                    borderRadius: 5,
                                    backgroundColor: '#EF4444',
                                    borderWidth: 1.5,
                                    borderColor: theme.colors.card
                                }} />
                            )}
                        </View>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};
