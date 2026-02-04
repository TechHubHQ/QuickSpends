import React from "react";
import { Platform, Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { Avatar } from "./Avatar";

interface GroupMember {
    id: string;
    username: string;
    avatar?: string;
}

interface Group {
    id: string;
    name: string;
    members: GroupMember[];
    owedAmount?: number; // Positive = you are owed, Negative = you owe
    totalTransactions?: number;
    totalSplits?: number;
}

interface QSGroupCardProps {
    group: Group;
    onPress: () => void;
}

export const QSGroupCard: React.FC<QSGroupCardProps> = ({ group, onPress }) => {
    const { theme } = useTheme();
    const isDark = theme.isDark;

    // Default avatars if none provided
    const getAvatarColor = (name: string) => {
        const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#EC4899'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    }

    const visibleMembers = group.members.slice(0, 3);
    const extramembers = group.members.length > 3 ? group.members.length - 3 : 0;

    // Use owedAmount from props (calculated in useGroups)
    // Default to 0 if undefined (though it should be defined now)
    const amount = group.owedAmount ?? 0;
    const isSettled = Math.abs(amount) < 1; // Tolerance for float errors
    const isOwed = amount > 0;

    const hasTransactions = (group.totalTransactions || 0) > 0;
    const hasSplits = (group.totalSplits || 0) > 0;

    const getStatusText = () => {
        if (!hasTransactions) return "No expenses yet";
        if (!hasSplits) return "No shared expenses";
        if (isSettled) return "Settled up";
        return isOwed ? `You are owed ₹${Math.abs(amount).toFixed(0)}` : `You owe ₹${Math.abs(amount).toFixed(0)}`;
    };

    const getStatusColor = () => {
        if (!hasTransactions || !hasSplits || isSettled) return theme.colors.textSecondary;
        return isOwed ? theme.colors.primary : theme.colors.error;
    };

    return (
        <Pressable
            style={({ pressed }) => [styles.container, {
                backgroundColor: theme.colors.card, // surface-light / surface-dark
                borderColor: theme.colors.border, // slate-200 / slate-700
                opacity: pressed ? 0.7 : 1
            }]}
            onPress={onPress}
        >
            {/* Avatar Stack */}
            <View style={styles.avatarStack}>
                {visibleMembers.map((member, index) => (
                    <View
                        key={member.id}
                        style={[
                            styles.avatarWrapper,
                            {
                                borderColor: theme.colors.card,
                                zIndex: 10 - index,
                                marginLeft: index === 0 ? 0 : -10
                            }
                        ]}
                    >
                        <Avatar
                            seed={member.avatar || member.username}
                            size={32}
                            variant="beam"
                        />
                    </View>
                ))}
                {extramembers > 0 && (
                    <View
                        style={[
                            styles.avatarWrapper,
                            {
                                borderColor: theme.colors.card,
                                backgroundColor: isDark ? '#1e293b' : '#334155',
                                zIndex: 0,
                                marginLeft: -10,
                                alignItems: 'center',
                                justifyContent: 'center'
                            }
                        ]}
                    >
                        <Text style={[styles.avatarText, { fontSize: 10 }]}>+{extramembers}</Text>
                    </View>
                )}
            </View>

            {/* Info */}
            <View style={styles.infoContainer}>
                <Text style={[styles.groupName, { color: theme.colors.text }]} numberOfLines={1}>
                    {group.name}
                </Text>
                <Text
                    style={[
                        styles.statusText,
                        {
                            color: getStatusColor()
                        }
                    ]}
                    numberOfLines={1}
                >
                    {getStatusText()}
                </Text>
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 192, // w-48 (12rem * 16)
        padding: 16, // p-4
        borderRadius: 16, // rounded-2xl
        borderWidth: 1,
        flexDirection: 'column',
        gap: 12,
        marginRight: 16,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
            web: {
                boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.05)",
            }
        }),
    } as ViewStyle,
    avatarStack: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarWrapper: {
        width: 32, // size-8
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 12,
    },
    infoContainer: {
        gap: 4,
    },
    groupName: {
        fontSize: 16,
        fontWeight: '700', // font-bold
    },
    statusText: {
        fontSize: 12, // text-xs
        fontWeight: '500', // font-medium
    },
});
