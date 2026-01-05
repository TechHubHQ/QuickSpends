import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme/ThemeContext";

interface QSTransactionIndicatorsProps {
    isSplit?: boolean | number;
    tripId?: string | number | null;
    groupId?: string | number | null;
    savingsId?: string | number | null;
    loanId?: string | number | null;
    hideTrip?: boolean;
    hideGroup?: boolean;
}

export const QSTransactionIndicators: React.FC<QSTransactionIndicatorsProps> = ({
    isSplit,
    tripId,
    groupId,
    savingsId,
    loanId,
    hideTrip = false,
    hideGroup = false,
}) => {
    const { theme } = useTheme();

    if (!isSplit && (!tripId || hideTrip) && (!groupId || hideGroup) && !savingsId && !loanId) return null;

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
            {!!savingsId && (
                <View style={[styles.badge, { backgroundColor: '#E91E6320' }]}>
                    <MaterialCommunityIcons name="piggy-bank" size={10} color="#E91E63" />
                    <Text style={[styles.badgeText, { color: '#E91E63' }]}>SAVING</Text>
                </View>
            )}
            {!!loanId && (
                <View style={[styles.badge, { backgroundColor: '#FF572220' }]}>
                    <MaterialCommunityIcons name="handshake" size={10} color="#FF5722" />
                    <Text style={[styles.badgeText, { color: '#FF5722' }]}>LOAN</Text>
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
