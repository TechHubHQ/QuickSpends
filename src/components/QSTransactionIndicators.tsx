import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface QSTransactionIndicatorsProps {
    tripId?: string | number | null;
    savingsId?: string | number | null;
    loanId?: string | number | null;
    hideTrip?: boolean;
}

export const QSTransactionIndicators: React.FC<QSTransactionIndicatorsProps> = ({
    tripId,
    savingsId,
    loanId,
    hideTrip = false,
}) => {
    if ((!tripId || hideTrip) && !savingsId && !loanId) return null;

    return (
        <View style={styles.container}>
            {!!tripId && !hideTrip && (
                <View style={[styles.badge, { backgroundColor: '#FBBF2420' }]}>
                    <MaterialIcons name="flight" size={10} color="#FBBF24" />
                    <Text style={[styles.badgeText, { color: '#FBBF24' }]}>TRIP</Text>
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
