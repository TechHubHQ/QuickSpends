import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { Account } from "../hooks/useAccounts";
import { createStyles } from "../styles/components/QSAccountCard.styles";
import { useTheme } from "../theme/ThemeContext";

interface QSAccountCardProps {
    account: Account;
    monthIn?: number;
    monthOut?: number;
}

export const QSAccountCard: React.FC<QSAccountCardProps> = ({ account, monthIn, monthOut }) => {
    const { theme } = useTheme();
    const { user } = useAuth();
    const hasStats = monthIn !== undefined || monthOut !== undefined;
    const styles = createStyles(theme, hasStats);

    const isCredit = account.type === 'card' && account.card_type === 'credit';
    const isDebit = account.type === 'card' && account.card_type === 'debit';
    const isBank = account.type === 'bank';
    const isCash = account.type === 'cash';

    // Design tokens based on account type
    const getCardGradient = () => {
        if (isCredit || isCash) {
            return ['#1e293b', '#0f172a', '#020617'] as const;
        }
        if (isBank || isDebit) {
            return ['#137fec', '#1068c4', '#0d54a1'] as const;
        }
        return ['#4A5568', '#2D3748', '#1A202C'] as const;
    };

    const getDecorationColors = () => {
        if (isCash) return {
            c1: ['rgba(52, 211, 153, 0.3)', 'transparent'] as const,
            c2: ['rgba(59, 130, 246, 0.15)', 'transparent'] as const
        };
        if (isCredit) return {
            c1: ['rgba(30, 144, 255, 0.35)', 'transparent'] as const,
            c2: ['rgba(168, 85, 247, 0.15)', 'transparent'] as const
        };
        return {
            c1: ['rgba(255, 255, 255, 0.15)', 'transparent'] as const,
            c2: ['rgba(255, 255, 255, 0.08)', 'transparent'] as const
        };
    }

    const decColors = getDecorationColors();

    const getIcon = () => {
        if (isBank) return 'bank';
        if (isCash) return 'cash';
        return 'credit-card';
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatName = (name: string) => {
        const words = name.split(' ');
        if (words.length > 2) {
            return words.slice(0, 2).join(' ') + '\n' + words.slice(2).join(' ');
        }
        return name;
    };

    // Credit Card Logic: Primary Display is Available Balance (which is now stored as balance)
    const showAvailable = isCredit;
    const primaryAmount = account.balance;
    const primaryLabel = showAvailable ? "AVAILABLE BALANCE" : (isCash ? "CASH ON HAND" : "BALANCE");

    return (
        <View style={styles.cardContainer}>
            <LinearGradient
                colors={getCardGradient()}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                <View style={styles.glassOverlay} />
                <LinearGradient
                    colors={decColors.c1 as any}
                    start={{ x: 1, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.decorationCircle1}
                />
                <LinearGradient
                    colors={decColors.c2 as any}
                    start={{ x: 0, y: 1 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.decorationCircle2}
                />

                {/* Top Row: Bank Name / Logo and Type */}
                <View style={styles.topRow}>
                    <View style={styles.bankInfo}>
                        <View style={styles.bankIcon}>
                            <MaterialCommunityIcons name={getIcon() as any} size={18} color={isCash ? "#34D399" : "#FFFFFF"} />
                        </View>
                        <View>
                            <Text style={styles.bankName}>{account.name}</Text>
                            {isCash && <Text style={[styles.typeText, { opacity: 0.6, fontSize: 10, marginTop: 2 }]}>Personal Cash</Text>}
                        </View>
                    </View>
                    <View style={styles.typeBadge}>
                        <Text style={styles.typeText}>{account.currency || 'INR'}</Text>
                    </View>
                </View>

                {/* Middle Row: Chip and Balance */}
                <View style={styles.middleRow}>
                    {(isCredit || isDebit || isBank) && (
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View style={styles.chipContainer}>
                                <View style={styles.chip}>
                                    <View style={styles.chipGrid} />
                                </View>
                                <MaterialCommunityIcons name="contactless-payment" size={24} color="rgba(255,255,255,0.4)" />
                            </View>

                            <View style={{ alignItems: 'flex-end', opacity: 0.8 }}>
                                <Text style={[styles.statLabel, { fontSize: 8, marginBottom: 0 }]}>CARD HOLDER</Text>
                                <Text style={styles.userName}>
                                    {user?.username || 'QUE SPENDER'}
                                </Text>
                            </View>
                        </View>
                    )}

                    {!isCash && (
                        <View style={{ marginTop: 15, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#34D399' }} />
                            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}>ACTIVE</Text>
                        </View>
                    )}

                    {isCash && (
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', paddingBottom: 5 }}>
                            <View>
                                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 }}>LIQUID ASSET</Text>
                                <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#34D399', shadowColor: '#34D399', shadowRadius: 4, shadowOpacity: 0.5 }} />
                                    <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: '700' }}>RECONCILED</Text>
                                </View>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={[styles.balanceLabel, { fontSize: 10 }]}>{primaryLabel}</Text>
                                <Text style={[styles.balanceAmount, { fontSize: 36, lineHeight: 40 }]}>{formatCurrency(primaryAmount)}</Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Bottom Row / Stats Row */}
                {isCash && (monthIn !== undefined || monthOut !== undefined) ? (
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Month In</Text>
                            <View style={styles.statValueContainer}>
                                <MaterialCommunityIcons name="arrow-up" size={14} color="#34D399" />
                                <Text style={[styles.statValue, { color: '#34D399' }]}>{formatCurrency(monthIn || 0)}</Text>
                            </View>
                        </View>
                        <View style={[styles.statItem, { alignItems: 'flex-end' }]}>
                            <Text style={styles.statLabel}>Month Out</Text>
                            <View style={styles.statValueContainer}>
                                <MaterialCommunityIcons name="arrow-down" size={14} color="#FCA5A5" />
                                <Text style={styles.statValue}>{formatCurrency(monthOut || 0)}</Text>
                            </View>
                        </View>
                    </View>
                ) : (
                    <View style={styles.bottomRow}>
                        <Text style={styles.accountNumber}>
                            {account.account_number_last_4 ? `•••• ${account.account_number_last_4}` : '•••• ••••'}
                        </Text>
                        {!isCash && (
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={[styles.balanceLabel, { fontSize: 10, opacity: 0.6 }]}>{primaryLabel}</Text>
                                <Text style={[styles.balanceAmount, { fontSize: 24 }]}>{formatCurrency(primaryAmount)}</Text>
                            </View>
                        )}
                    </View>
                )}
            </LinearGradient>
        </View>
    );
};
