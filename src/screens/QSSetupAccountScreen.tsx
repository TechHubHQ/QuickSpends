import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useAuth } from "../context/AuthContext";
import { useAccounts } from "../hooks/useAccounts";
import { createStyles } from "../styles/QSSetupAccount.styles";

type AccountType = 'bank' | 'debit' | 'credit' | 'wallet';

interface AccountTypeOption {
    id: AccountType;
    label: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    color: string;
}

const ACCOUNT_TYPES: AccountTypeOption[] = [
    { id: 'credit', label: 'Credit Card', icon: 'credit-card', color: '#137FEC' },
    { id: 'bank', label: 'Debit / Bank', icon: 'bank', color: '#10B981' },
    { id: 'wallet', label: 'Cash Wallet', icon: 'cash', color: '#F59E0B' },
];

export default function QSSetupAccountScreen() {
    const router = useRouter();
    const { accountId } = useLocalSearchParams<{ accountId: string }>();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";
    const { user } = useAuth();
    const { createAccount, updateAccount, getAccountsByUser, loading } = useAccounts();
    const [hasAccounts, setHasAccounts] = useState(true);

    // Matching HTML reference background-dark: #101922, card-dark: #1c2936
    const theme = {
        background: isDark ? "#101922" : "#F6F7F8",
        surface: isDark ? "#1C2936" : "#FFFFFF",
        text: isDark ? "#FFFFFF" : "#1E293B",
        primary: "#137FEC",
        error: "#EF4444",
    };

    const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

    const [accountName, setAccountName] = useState("");
    const [selectedType, setSelectedType] = useState<AccountType>('credit');
    const [balance, setBalance] = useState("");
    const [creditLimit, setCreditLimit] = useState("");
    const [last4, setLast4] = useState("");
    const [errors, setErrors] = useState<{
        name?: string;
        balance?: string;
        creditLimit?: string;
        last4?: string;
    }>({});

    React.useEffect(() => {
        if (user) {
            getAccountsByUser(user.id).then(accounts => {
                setHasAccounts(accounts.length > 0);
                if (accountId) {
                    const account = accounts.find(a => a.id === accountId);
                    if (account) {
                        setAccountName(account.name);
                        setBalance(account.balance.toString());
                        if (account.type === 'cash') setSelectedType('wallet');
                        else if (account.type === 'card' && account.card_type === 'credit') {
                            setSelectedType('credit');
                            setCreditLimit(account.credit_limit?.toString() || "");
                        }
                        else if (account.type === 'card' && account.card_type === 'debit') setSelectedType('debit');
                        else setSelectedType('bank');

                        if (account.account_number_last_4) setLast4(account.account_number_last_4);
                    }
                }
            });
        }
    }, [accountId, user, getAccountsByUser]);

    const validateForm = () => {
        const newErrors: typeof errors = {};
        if (!accountName.trim()) newErrors.name = "Account name is required";
        if (!accountId && !balance.trim()) newErrors.balance = "Initial balance is required";
        if (selectedType === 'credit' && !creditLimit.trim()) {
            newErrors.creditLimit = "Credit limit is required";
        }
        if (selectedType !== 'wallet' && last4.trim() && !/^\d{4}$/.test(last4)) {
            newErrors.last4 = "Must be exactly 4 digits";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) return;
        if (!user) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'User session not found'
            });
            return;
        }

        const typeMap: Record<AccountType, 'bank' | 'cash' | 'card'> = {
            bank: 'bank',
            debit: 'card',
            credit: 'card',
            wallet: 'cash',
        };

        const cardTypeMap: Record<AccountType, 'credit' | 'debit' | undefined> = {
            bank: 'debit',
            debit: 'debit',
            credit: 'credit',
            wallet: undefined,
        };

        if (accountId) {
            const success = await updateAccount(accountId, {
                name: accountName,
                type: typeMap[selectedType],
                card_type: cardTypeMap[selectedType],
                credit_limit: selectedType === 'credit' ? parseFloat(creditLimit) : undefined,
                account_number_last_4: selectedType !== 'wallet' ? last4 : undefined,
            });

            if (success) {
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Account updated successfully!'
                });
                router.back();
            }
        } else {
            const success = await createAccount({
                user_id: user.id,
                name: accountName,
                type: typeMap[selectedType],
                card_type: cardTypeMap[selectedType],
                credit_limit: selectedType === 'credit' ? parseFloat(creditLimit) : undefined,
                balance: parseFloat(balance),
                account_number_last_4: selectedType !== 'wallet' ? last4 : undefined,
                currency: 'INR',
            });

            if (success) {
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Account created successfully!'
                });
                if (!hasAccounts) {
                    router.replace("/(tabs)/home");
                } else {
                    router.back();
                }
            }
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
            <View style={styles.headerSection}>
                {hasAccounts && (
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
                    </TouchableOpacity>
                )}
                <Text style={styles.headerTitle}>{accountId ? "Edit Account" : "New Account"}</Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.formSection}>
                        {/* Account Name */}
                        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.inputContainer}>
                            <Text style={styles.label}>Account Name</Text>
                            <View style={styles.inputWrapper}>
                                <MaterialCommunityIcons name="pencil" size={20} color="#94A3B8" style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, errors.name && styles.inputError]}
                                    placeholder="e.g. Chase Sapphire"
                                    placeholderTextColor="#64748B"
                                    value={accountName}
                                    onChangeText={setAccountName}
                                />
                            </View>
                            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                        </Animated.View>

                        {/* Last 4 Digits (Hidden for Wallet) */}
                        {selectedType !== 'wallet' && (
                            <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.inputContainer}>
                                <Text style={styles.label}>
                                    {selectedType === 'credit' ? 'Card Number (Last 4)' : 'Account Number (Last 4)'}
                                </Text>
                                <View style={styles.inputWrapper}>
                                    <MaterialCommunityIcons name="dialpad" size={20} color="#94A3B8" style={styles.inputIcon} />
                                    <TextInput
                                        style={[styles.input, errors.last4 && styles.inputError]}
                                        placeholder="e.g. 1234"
                                        placeholderTextColor="#64748B"
                                        value={last4}
                                        onChangeText={(text) => setLast4(text.replace(/[^0-9]/g, '').slice(0, 4))}
                                        keyboardType="number-pad"
                                    />
                                </View>
                                {errors.last4 && <Text style={styles.errorText}>{errors.last4}</Text>}
                            </Animated.View>
                        )}

                        {/* Account Type Grid */}
                        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.inputContainer}>
                            <Text style={styles.label}>Account Type</Text>
                            <View style={styles.grid}>
                                {ACCOUNT_TYPES.map((type) => (
                                    <TouchableOpacity
                                        key={type.id}
                                        style={[
                                            styles.typeCard,
                                            selectedType === type.id && styles.typeCardSelected
                                        ]}
                                        onPress={() => setSelectedType(type.id)}
                                    >
                                        <View style={[
                                            styles.typeIconWrapper,
                                            { backgroundColor: selectedType === type.id ? type.color : `${type.color}15` }
                                        ]}>
                                            <MaterialCommunityIcons
                                                name={type.icon}
                                                size={24}
                                                color={selectedType === type.id ? "#FFF" : type.color}
                                            />
                                        </View>
                                        <Text style={styles.typeLabel}>{type.label}</Text>
                                        {selectedType === type.id && (
                                            <MaterialCommunityIcons
                                                name="check-circle"
                                                size={20}
                                                color={type.color}
                                                style={styles.checkCircle}
                                            />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </Animated.View>

                        {/* Credit Limit (if Credit Card) */}
                        {selectedType === 'credit' && (
                            <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.inputContainer}>
                                <Text style={styles.label}>Credit Limit</Text>
                                <View style={styles.inputWrapper}>
                                    <MaterialCommunityIcons name="currency-inr" size={20} color="#94A3B8" style={styles.inputIcon} />
                                    <TextInput
                                        style={[styles.input, errors.creditLimit && styles.inputError]}
                                        placeholder="0.00"
                                        placeholderTextColor="#64748B"
                                        value={creditLimit}
                                        onChangeText={setCreditLimit}
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                                {errors.creditLimit && <Text style={styles.errorText}>{errors.creditLimit}</Text>}
                            </Animated.View>
                        )}

                        {/* Initial Balance - Only show when creating */}
                        {!accountId && (
                            <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.inputContainer}>
                                <Text style={styles.label}>
                                    {selectedType === 'credit' ? 'Available Limit' : 'Initial Balance'}
                                </Text>
                                <View style={styles.balanceCard}>
                                    <View style={styles.currencyBadge}>
                                        <Text style={styles.currencyText}>INR</Text>
                                    </View>
                                    <View style={styles.balanceInputContainer}>
                                        <Text style={styles.currencySymbol}>₹</Text>
                                        <TextInput
                                            style={styles.balanceInput}
                                            placeholder="0"
                                            placeholderTextColor={isDark ? "#334155" : "#CBD5E1"}
                                            value={balance}
                                            onChangeText={setBalance}
                                            keyboardType="decimal-pad"
                                            autoFocus={false}
                                        />
                                    </View>
                                    <Text style={styles.helperText}>Enter the current balance</Text>
                                </View>
                                {errors.balance && <Text style={styles.errorText}>{errors.balance}</Text>}
                            </Animated.View>
                        )}
                    </View>
                </ScrollView>

                {/* Create Button Footer */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.createButton, loading && { opacity: 0.7 }]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <>
                                <Text style={styles.createButtonText}>{accountId ? "Save Changes" : "Create Account"}</Text>
                                <MaterialCommunityIcons name="arrow-right" size={20} color="#FFF" />
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
