import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme/ThemeContext";

interface QSTransactionIndicatorsProps {
    isSplit?: boolean | number;
    tripId?: string | number | null;
    groupId?: string | number | null;
    hideTrip?: boolean;
    hideGroup?: boolean;
}

export const QSTransactionIndicators: React.FC<QSTransactionIndicatorsProps> = ({
    isSplit,
    tripId,
    groupId,
    hideTrip = false,
    hideGroup = false,
}) => {
    const { theme } = useTheme();

    if (!isSplit && (!tripId || hideTrip) && (!groupId || hideGroup)) return null;

    return (
        <View style={styles.container}>
            {!!isSplit && (
                <View style={[styles.badge, { backgroundColor: theme.colors.primary + '20' }]}>
                    <MaterialIcons name="call-split" size={10} color={theme.colors.primary} />
                    <Text style={[styles.badgeText, { color: theme.colors.primary }]}>SPLIT</Text>
                </View>
            )}
            {!!tripId && !hideTrip && (
                <View style={[styles.badge, { backgroundColor: '#FBBF2420' }]}>
                    <MaterialIcons name="flight" size={10} color="#FBBF24" />
                    <Text style={[styles.badgeText, { color: '#FBBF24' }]}>TRIP</Text>
                </View>
            )}
            {!!groupId && !hideGroup && (
                <View style={[styles.badge, { backgroundColor: '#EC489920' }]}>
                    <MaterialCommunityIcons name="account-group" size={10} color="#EC4899" />
                    <Text style={[styles.badgeText, { color: '#EC4899' }]}>GROUP</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
    },
    badgeText: {
        fontSize: 8,
        fontWeight: 'bold',
        marginLeft: 2,
    },
});
