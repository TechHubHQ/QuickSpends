import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Toast from "react-native-toast-message";
import { QSAccountPicker } from "../components/QSAccountPicker";
import { QSButton } from "../components/QSButton";
import { QSCategoryPicker } from "../components/QSCategoryPicker";
import { QSCreateCategorySheet } from "../components/QSCreateCategorySheet";
import { QSDatePicker } from "../components/QSDatePicker";
import { QSGroupPicker } from "../components/QSGroupPicker";
import { QSHeader } from "../components/QSHeader";
import { QSLoanPicker } from "../components/QSLoanPicker";
import { QSSavingsPicker } from "../components/QSSavingsPicker";
import { QSTripPicker } from "../components/QSTripPicker";
import { useAuth } from "../context/AuthContext";
import { useAccounts } from "../hooks/useAccounts";
import { useCategories } from "../hooks/useCategories";
import { useGroups } from "../hooks/useGroups";
import { useLoans } from "../hooks/useLoans";
import { useNotifications } from "../hooks/useNotifications";
import { useSavings } from "../hooks/useSavings";
import { useTransactions } from "../hooks/useTransactions";
import { useTrips } from "../hooks/useTrips";
import { createStyles } from "../styles/QSAddTransaction.styles";
import { useTheme } from "../theme/ThemeContext";

type TransactionType = 'income' | 'expense' | 'transfer';
type RecurringType = 'one-time' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export default function QSAddTransactionScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    const params = useLocalSearchParams();
    const { user } = useAuth();
    const styles = createStyles(theme);

    const { getAccountsByUser } = useAccounts();
    const { getCategories } = useCategories();
    const { getGroupsByUser } = useGroups();
    const { getTripsByUser } = useTrips();
    const { addCategory } = useCategories(); // Added hook
    const { addTransaction, updateTransaction, loading: saving } = useTransactions();
    const { checkAllNotifications } = useNotifications();
    const { getSavingsGoals } = useSavings();
    const { getLoans } = useLoans();

    // Parse edit transaction if available
    const editTransaction = params.editTransaction ? JSON.parse(params.editTransaction as string) : null;

    const [type, setType] = useState<TransactionType>(editTransaction?.type || (params.initialType as TransactionType) || 'expense');
    const [isRecurring, setIsRecurring] = useState(!!editTransaction?.recurring_id);
    const [name, setName] = useState(editTransaction?.name || '');
    const [amount, setAmount] = useState(editTransaction?.amount?.toString() || '');
    const [description, setDescription] = useState(editTransaction?.description || '');
    const [date, setDate] = useState(editTransaction ? new Date(editTransaction.date) : new Date());
    const [recurringType, setRecurringType] = useState<RecurringType>('one-time');
    // Custom recurring state
    const [customInterval, setCustomInterval] = useState('1');
    const [customFrequency, setCustomFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
    const [endCondition, setEndCondition] = useState<'never' | 'after_occurrences' | 'on_date'>('never');
    const [totalOccurrences, setTotalOccurrences] = useState('5');
    const [endDate, setEndDate] = useState(new Date());
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);

    const [accountId, setAccountId] = useState(editTransaction?.account_id || '');
    const [toAccountId, setToAccountId] = useState(editTransaction?.to_account_id || '');
    const [categoryId, setCategoryId] = useState(editTransaction?.category_id || '');
    const [subCategoryId, setSubCategoryId] = useState(''); // New State
    const [isGroup, setIsGroup] = useState(!!editTransaction?.group_id);
    const [isTrip, setIsTrip] = useState(!!editTransaction?.trip_id);
    const [selectedGroupId, setSelectedGroupId] = useState(editTransaction?.group_id || '');
    const [selectedTripId, setSelectedTripId] = useState(editTransaction?.trip_id || '');

    // Bottom sheet visibility states
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);
    const [showSubCategoryPicker, setShowSubCategoryPicker] = useState(false); // New State
    const [showCreateCategory, setShowCreateCategory] = useState(false); // New State
    const [creatingParentId, setCreatingParentId] = useState<string | undefined>(undefined); // New State

    const [showAccountPicker, setShowAccountPicker] = useState(false);
    const [showToAccountPicker, setShowToAccountPicker] = useState(false);
    const [showGroupPicker, setShowGroupPicker] = useState(false);
    const [showTripPicker, setShowTripPicker] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showSavingsPicker, setShowSavingsPicker] = useState(false);
    const [showLoanPicker, setShowLoanPicker] = useState(false);

    const [accounts, setAccounts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    // We will derive sub-categories from 'categories' based on 'categoryId' selection
    const [groups, setGroups] = useState<any[]>([]);
    const [trips, setTrips] = useState<any[]>([]);
    const [savingsGoals, setSavingsGoals] = useState<any[]>([]);
    const [loans, setLoans] = useState<any[]>([]);

    const [savingsId, setSavingsId] = useState(editTransaction?.savings_id || '');
    const [loanId, setLoanId] = useState(editTransaction?.loan_id || '');
    const [isSavings, setIsSavings] = useState(!!editTransaction?.savings_id);
    const [savingsAction, setSavingsAction] = useState<'contribute' | 'withdraw'>('contribute'); // New State
    const [isLoan, setIsLoan] = useState(!!editTransaction?.loan_id);

    // Pre-fill data if editing - cleanup redundant useEffect
    useEffect(() => {
        if (editTransaction) {
            // If already initialized, we might still need to handle complex cases like subcategories
            // but we can do that in fetchData after categories are loaded.
        }
    }, [params.editTransaction]);


    // Handle initial savingsId param
    useEffect(() => {
        if (params.savingsId) {
            setIsSavings(true);
            setSavingsId(params.savingsId as string);
            // Default to transfer if adding funds to savings (Contribute)
            if (params.initialType === 'transfer') {
                setType('transfer');
                setSavingsAction('contribute');
            } else if (params.initialType === 'expense') {
                setType('expense');
                setSavingsAction('withdraw');
            }
        }
    }, [params.savingsId, params.initialType]);

    // Update Type based on Savings Action
    useEffect(() => {
        if (isSavings) {
            if (savingsAction === 'contribute') {
                setType('transfer');
            } else {
                setType('expense');
            }
        }
    }, [isSavings, savingsAction]);

    // Handle initial params for trip/group
    useEffect(() => {
        if (params.tripId) {
            setIsTrip(true);
            const tripId = params.tripId as string;
            setSelectedTripId(tripId);

            // Auto-link group if trip is found in loaded trips and has a group
            const trip = trips.find(t => t.id === tripId);
            if (trip?.groupId) {
                setIsGroup(true);
                setSelectedGroupId(trip.groupId);
            }
        }
        if (params.groupId) {
            setIsGroup(true);
            setSelectedGroupId(params.groupId as string);
        }
    }, [params.tripId, params.groupId, trips]);

    // Handle initial loanId from params
    useEffect(() => {
        if (params.loanId) {
            setIsLoan(true);
            setLoanId(params.loanId as string);
        }
    }, [params.loanId]);

    // Handle loan auto-categorization when a loan is linked
    useEffect(() => {
        if (isLoan && loanId && categories.length > 0 && !categoryId) {
            const loanCategory = categories.find((c: any) => c.name === 'Loans & Debt' && !c.parent_id);
            if (loanCategory) {
                const targetSubName = type === 'income' ? 'EMI Received' : 'EMI Payment';
                const subCategory = categories.find((c: any) => c.parent_id === loanCategory.id && c.name === targetSubName);
                if (subCategory) {
                    setCategoryId(subCategory.id);
                } else {
                    setCategoryId(loanCategory.id);
                }
            }
        }
    }, [isLoan, loanId, categories, type, categoryId]);

    // Auto-link Trip when a Group is selected (Fix for group-trip discrepancy)
    useEffect(() => {
        if (isGroup && selectedGroupId && groups.length > 0) {
            const group = groups.find((g: any) => g.id === selectedGroupId);
            if (group?.trip_id) {
                // If group is linked to a trip, auto-select that trip
                if (!isTrip || selectedTripId !== group.trip_id) {
                    setIsTrip(true);
                    setSelectedTripId(group.trip_id);
                }
            }
        }
    }, [isGroup, selectedGroupId, groups, isTrip, selectedTripId]);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user, type]);

    const fetchData = async () => {
        if (!user) return;
        const [accs, cats, grps, trps, goals, lnz] = await Promise.all([
            getAccountsByUser(user.id),
            getCategories(type === 'transfer' ? 'expense' : type as any),
            getGroupsByUser(user.id),
            getTripsByUser(user.id),
            getSavingsGoals(user.id),
            getLoans(user.id)
        ]);
        setAccounts(accs);
        setCategories(cats);
        setGroups(grps);
        setTrips(trps);
        setSavingsGoals(goals);
        setLoans(lnz);

        if (accs.length > 0 && !accountId) setAccountId(accs[0].id);

        if (editTransaction && editTransaction.category_id) {
            // Find if existing category has a parent (meaning it's a subcategory)
            const existingCat = cats.find(c => c.id === editTransaction.category_id);
            if (existingCat?.parent_id) {
                setCategoryId(existingCat.parent_id);
                setSubCategoryId(existingCat.id);
            } else {
                setCategoryId(editTransaction.category_id);
                setSubCategoryId('');
            }
        } else {
            // Reset category when type changes or if invalid
            const isValidIdx = cats.findIndex(c => c.id === categoryId);
            if (isValidIdx === -1) {
                setCategoryId('');
                setSubCategoryId('');
            }
        }
    };

    const getSelectedCategory = () => categories.find(c => c.id === categoryId);
    const getSelectedSubCategory = () => categories.find(c => c.id === subCategoryId);
    const getSelectedAccount = () => accounts.find(a => a.id === accountId);
    const getSelectedToAccount = () => accounts.find(a => a.id === toAccountId);
    const getSelectedGroup = () => groups.find(g => g.id === selectedGroupId);
    const getSelectedTrip = () => trips.find(t => t.id === selectedTripId);
    const getSelectedSavingsGoal = () => savingsGoals.find(g => g.id === savingsId);
    const getSelectedLoan = () => loans.find(l => l.id === loanId);

    const handleCreateCategory = async (name: string, icon: string, color: string) => {
        try {
            await addCategory(name, icon, color, type === 'transfer' ? 'expense' : type, creatingParentId);
            fetchData();
        } catch (e) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to create category'
            });
        }
    };

    const handleSave = async () => {
        if (!user) return;

        // Validate mandatory fields
        // Name is only required for income/expense, not for transfer
        if ((type !== 'transfer' && !name) || !amount || !accountId) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Please fill in all mandatory fields'
            });
            return;
        }

        if (type === 'transfer' && !toAccountId) {
            // Allow if it's a savings contribution
            if (isSavings && savingsAction === 'contribute') {
                // This is valid
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Please select a destination account for transfer'
                });
                return;
            }
        }

        if (type === 'transfer' && accountId === toAccountId) {
            // Allow same account transfer ONLY if it's for a savings goal (earmarking funds) - though currently we hide ToAccount for Savings
            if (!isSavings) {
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Source and Destination accounts cannot be the same'
                });
                return;
            }
        }

        if (editTransaction) {
            const success = await updateTransaction(editTransaction.id, {
                account_id: accountId,
                category_id: (subCategoryId || categoryId) || undefined,
                name: name || (type === 'transfer' ? 'Transfer' : 'Transaction'),
                description: description || undefined,
                amount: parseFloat(amount),
                type,
                date: date.toISOString(),
                group_id: isGroup ? selectedGroupId : undefined,
                trip_id: isTrip ? selectedTripId : undefined,
                to_account_id: type === 'transfer' ? toAccountId : undefined,
                savings_id: isSavings ? savingsId : undefined,
                loan_id: isLoan ? loanId : undefined,
            });

            if (success) {
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Transaction updated successfully'
                });
                checkAllNotifications(user.id);
                router.back(); // Smooth navigation back, transactions screen will auto-refresh
            }
        } else {
            const savingsGoalName = getSelectedSavingsGoal()?.name;
            const defaultName = type === 'transfer'
                ? (isSavings && savingsAction === 'contribute' ? `Transfer to ${savingsGoalName || 'Savings'}` : 'Transfer')
                : 'Transaction';

            let recurringOptions: any = undefined;

            if (isRecurring) {
                if (recurringType === 'custom') {
                    recurringOptions = {
                        frequency: customFrequency,
                        interval: parseInt(customInterval) || 1,
                        totalOccurrences: endCondition === 'after_occurrences' ? (parseInt(totalOccurrences) || null) : undefined,
                        endDate: endCondition === 'on_date' ? endDate.toISOString() : undefined
                    };
                } else {
                    // Default fallback if somehow 'one-time' is selected but isRecurring is true
                    recurringOptions = {
                        frequency: recurringType === 'one-time' ? 'monthly' : recurringType
                    };
                }
            }

            const success = await addTransaction({
                user_id: user.id,
                account_id: accountId,
                category_id: (subCategoryId || categoryId) || undefined,
                name: name || defaultName,
                description,
                amount: parseFloat(amount),
                type,
                date: date.toISOString(),
                group_id: isGroup ? selectedGroupId : undefined,
                trip_id: isTrip ? selectedTripId : undefined,
                to_account_id: type === 'transfer' ? toAccountId : undefined,
                savings_id: isSavings ? savingsId : undefined,
                loan_id: isLoan ? loanId : undefined,
            }, recurringOptions);

            if (success) {
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Transaction added successfully'
                });
                router.back();
            }
        }
    };

    const toggleGroup = (value: boolean) => {
        setIsGroup(value);
    };

    const toggleTrip = (value: boolean) => {
        setIsTrip(value);
    };

    return (
        <>
            <View style={styles.container}>


                <ScrollView
                    showsVerticalScrollIndicator={false}
                >
                    <QSHeader
                        title={editTransaction ? "Edit Transaction" : "Add Transaction"}
                        showBack
                        onBackPress={() => router.back()}
                    />
                    <View style={styles.scrollContent}>
                        {/* Transaction Type Segmented Control */}
                        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.typeContainer}>
                            {(['income', 'expense', 'transfer'] as TransactionType[]).map((t) => (
                                <TouchableOpacity
                                    key={t}
                                    style={[styles.typeButton, type === t && styles.activeTypeButton]}
                                    onPress={() => setType(t)}
                                >
                                    <Text style={[styles.typeText, type === t && styles.activeTypeText]}>
                                        {t.charAt(0).toUpperCase() + t.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </Animated.View>

                        {/* Amount Input */}
                        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.amountSection}>
                            <Text style={styles.amountLabel}>Enter Amount</Text>
                            <View style={styles.amountInputWrapper}>
                                <Text style={styles.currencySymbol}>₹</Text>
                                <TextInput
                                    style={styles.amountInput}
                                    placeholder="0.00"
                                    placeholderTextColor={theme.isDark ? '#475569' : '#94A3B8'}
                                    keyboardType="decimal-pad"
                                    value={amount}
                                    onChangeText={setAmount}
                                />
                            </View>
                        </Animated.View>

                        {/* Transaction Name - Now available for all types */}
                        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.inputGroup}>
                            <Text style={styles.label}>Transaction Name {type === 'transfer' && '(Optional)'}</Text>
                            <View style={styles.inputWrapper}>
                                <View style={styles.iconContainer}>
                                    <MaterialCommunityIcons name="format-title" size={20} color={theme.colors.primary} />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder={type === 'transfer' ? "e.g. Bill Payment" : "e.g. Starbucks Coffee"}
                                    placeholderTextColor={theme.isDark ? '#475569' : '#94A3B8'}
                                    value={name}
                                    onChangeText={setName}
                                />
                            </View>
                        </Animated.View>

                        {/* Category - Now available for all types */}
                        <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.inputGroup}>
                            <Text style={styles.label}>Category {type === 'transfer' && '(Optional)'}</Text>
                            <View style={styles.inputWrapper}>
                                <View style={styles.iconContainer}>
                                    <MaterialCommunityIcons name="shape" size={20} color={theme.colors.primary} />
                                </View>
                                <TouchableOpacity
                                    style={styles.selectButton}
                                    onPress={() => setShowCategoryPicker(true)}
                                >
                                    <Text style={getSelectedCategory() ? styles.selectText : styles.selectPlaceholder}>
                                        {getSelectedCategory()
                                            ? (getSelectedSubCategory()
                                                ? `${getSelectedCategory()?.name} > ${getSelectedSubCategory()?.name}`
                                                : getSelectedCategory()?.name)
                                            : 'Select Category'}
                                    </Text>
                                    <MaterialCommunityIcons name="chevron-down" size={24} color={theme.isDark ? '#64748B' : '#94A3B8'} />
                                </TouchableOpacity>
                            </View>
                        </Animated.View>

                        {/* Description - Now available for all types */}
                        <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.inputGroup}>
                            <Text style={styles.label}>Description</Text>
                            <View style={styles.toolbar}>
                                <TouchableOpacity
                                    style={styles.toolbarButton}
                                    onPress={() => {
                                        const lines = description.split('\n');
                                        const newDescription = description ? (description.endsWith('\n') ? description + '• ' : description + '\n• ') : '• ';
                                        setDescription(newDescription);
                                    }}
                                >
                                    <MaterialCommunityIcons name="format-list-bulleted" size={16} color={theme.colors.primary} />
                                    <Text style={styles.toolbarButtonText}>Bullet</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.toolbarButton}
                                    onPress={() => {
                                        const lines = description.split('\n');
                                        let nextNum = 1;
                                        for (let i = lines.length - 1; i >= 0; i--) {
                                            const match = lines[i].match(/^(\d+)\.\s/);
                                            if (match) {
                                                nextNum = parseInt(match[1]) + 1;
                                                break;
                                            }
                                        }
                                        const newDescription = description ? (description.endsWith('\n') ? `${description}${nextNum}. ` : `${description}\n${nextNum}. `) : '1. ';
                                        setDescription(newDescription);
                                    }}
                                >
                                    <MaterialCommunityIcons name="format-list-numbered" size={16} color={theme.colors.primary} />
                                    <Text style={styles.toolbarButtonText}>Number</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={[styles.inputWrapper, styles.multilineInput]}>
                                <View style={styles.iconContainer}>
                                    <MaterialCommunityIcons name="note-edit" size={20} color="#A78BFA" />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Add notes (optional)"
                                    placeholderTextColor={theme.isDark ? '#475569' : '#94A3B8'}
                                    value={description}
                                    onChangeText={setDescription}
                                    multiline
                                    numberOfLines={4}
                                />
                            </View>
                        </Animated.View>

                        {/* Account Selection Logic */}
                        {type !== 'transfer' ? (
                            <Animated.View entering={FadeInDown.delay(600).springify()} style={styles.inputGroup}>
                                <Text style={styles.label}>Account</Text>
                                <View style={styles.inputWrapper}>
                                    <View style={styles.iconContainer}>
                                        <MaterialCommunityIcons name="wallet" size={20} color="#10B981" />
                                    </View>
                                    <TouchableOpacity
                                        style={styles.selectButton}
                                        onPress={() => setShowAccountPicker(true)}
                                    >
                                        <Text style={getSelectedAccount() ? styles.selectText : styles.selectPlaceholder}>
                                            {getSelectedAccount()?.name || 'Select Account'}
                                        </Text>
                                        <MaterialCommunityIcons name="chevron-down" size={24} color={theme.isDark ? '#64748B' : '#94A3B8'} />
                                    </TouchableOpacity>
                                </View>
                            </Animated.View>
                        ) : (
                            <>
                                {/* From Account */}
                                <Animated.View entering={FadeInDown.delay(600).springify()} style={styles.inputGroup}>
                                    <Text style={styles.label}>{isSavings && savingsAction === 'contribute' ? 'From Account' : 'From Account'}</Text>
                                    <View style={styles.inputWrapper}>
                                        <View style={styles.iconContainer}>
                                            <MaterialCommunityIcons name="bank-transfer-out" size={20} color="#EF4444" />
                                        </View>
                                        <TouchableOpacity
                                            style={styles.selectButton}
                                            onPress={() => setShowAccountPicker(true)}
                                        >
                                            <Text style={getSelectedAccount() ? styles.selectText : styles.selectPlaceholder}>
                                                {getSelectedAccount()?.name || 'Select Account'}
                                            </Text>
                                            <MaterialCommunityIcons name="chevron-down" size={24} color={theme.isDark ? '#64748B' : '#94A3B8'} />
                                        </TouchableOpacity>
                                    </View>
                                </Animated.View>

                                {/* To Account - Hide if it's a savings contribution */}
                                {(!isSavings || savingsAction !== 'contribute') && (
                                    <Animated.View entering={FadeInDown.delay(700).springify()} style={styles.inputGroup}>
                                        <Text style={styles.label}>To Account</Text>
                                        <View style={styles.inputWrapper}>
                                            <View style={styles.iconContainer}>
                                                <MaterialCommunityIcons name="bank-transfer-in" size={20} color="#10B981" />
                                            </View>
                                            <TouchableOpacity
                                                style={styles.selectButton}
                                                onPress={() => setShowToAccountPicker(true)}
                                            >
                                                <Text style={getSelectedToAccount() ? styles.selectText : styles.selectPlaceholder}>
                                                    {getSelectedToAccount()?.name || 'To Account'}
                                                </Text>
                                                <MaterialCommunityIcons name="chevron-down" size={24} color={theme.isDark ? '#64748B' : '#94A3B8'} />
                                            </TouchableOpacity>
                                        </View>
                                    </Animated.View>
                                )}
                            </>
                        )}

                        {/* Date */}
                        <Animated.View entering={FadeInDown.delay(800).springify()} style={styles.inputGroup}>
                            <Text style={styles.label}>Date</Text>
                            <View style={styles.inputWrapper}>
                                <View style={styles.iconContainer}>
                                    <MaterialCommunityIcons name="calendar" size={20} color="#FB923C" />
                                </View>
                                <TouchableOpacity
                                    style={styles.selectButton}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Text style={styles.selectText}>
                                        {date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </Text>
                                    <MaterialCommunityIcons name="chevron-down" size={24} color={theme.isDark ? '#64748B' : '#94A3B8'} />
                                </TouchableOpacity>
                            </View>
                        </Animated.View>

                        {/* Group and Trip Toggles */}
                        <Animated.View entering={FadeInDown.delay(900).springify()} style={styles.toggleGrid}>
                            <View style={styles.toggleCard}>
                                <View style={styles.toggleCardHeader}>
                                    <View style={styles.toggleIconContainer}>
                                        <MaterialCommunityIcons name="account-group" size={20} color="#EC4899" />
                                    </View>
                                    <Switch
                                        value={isGroup}
                                        onValueChange={toggleGroup}
                                        trackColor={{ false: theme.isDark ? 'rgba(255,255,255,0.1)' : '#D1D5DB', true: '#EC4899' }}
                                        thumbColor={isGroup ? '#FFFFFF' : '#F3F4F6'}
                                    />
                                </View>
                                <Text style={styles.toggleLabel}>Group Txn</Text>
                            </View>

                            <View style={styles.toggleCard}>
                                <View style={styles.toggleCardHeader}>
                                    <View style={styles.toggleIconContainer}>
                                        <MaterialCommunityIcons name="airplane" size={20} color="#FBBF24" />
                                    </View>
                                    <Switch
                                        value={isTrip}
                                        onValueChange={toggleTrip}
                                        trackColor={{ false: theme.isDark ? 'rgba(255,255,255,0.1)' : '#D1D5DB', true: '#FBBF24' }}
                                        thumbColor={isTrip ? '#FFFFFF' : '#F3F4F6'}
                                    />
                                </View>
                                <Text style={styles.toggleLabel}>Trip Txn</Text>
                            </View>
                        </Animated.View>

                        {/* Savings and Loan Toggles */}
                        <Animated.View entering={FadeInDown.delay(1000).springify()} style={styles.toggleGrid}>
                            <View style={styles.toggleCard}>
                                <View style={styles.toggleCardHeader}>
                                    <View style={styles.toggleIconContainer}>
                                        <MaterialCommunityIcons name="piggy-bank" size={20} color="#E91E63" />
                                    </View>
                                    <Switch
                                        value={isSavings}
                                        onValueChange={setIsSavings}
                                        trackColor={{ false: theme.isDark ? 'rgba(255,255,255,0.1)' : '#D1D5DB', true: '#E91E63' }}
                                        thumbColor={isSavings ? '#FFFFFF' : '#F3F4F6'}
                                    />
                                </View>
                                <Text style={styles.toggleLabel}>Savings Link</Text>
                            </View>

                            <View style={styles.toggleCard}>
                                <View style={styles.toggleCardHeader}>
                                    <View style={styles.toggleIconContainer}>
                                        <MaterialCommunityIcons name="handshake" size={20} color="#FF5722" />
                                    </View>
                                    <Switch
                                        value={isLoan}
                                        onValueChange={setIsLoan}
                                        trackColor={{ false: theme.isDark ? 'rgba(255,255,255,0.1)' : '#D1D5DB', true: '#FF5722' }}
                                        thumbColor={isLoan ? '#FFFFFF' : '#F3F4F6'}
                                    />
                                </View>
                                <Text style={styles.toggleLabel}>Loan Link</Text>
                            </View>
                        </Animated.View>

                        {/* Savings Selection (if enabled) */}
                        {isSavings && (
                            <View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Savings Action</Text>
                                    <View style={{ flexDirection: 'row', gap: 12 }}>
                                        <TouchableOpacity
                                            style={[
                                                styles.typeButton,
                                                { flex: 1, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: savingsAction === 'contribute' ? '#10B981' : theme.colors.border }
                                            ]}
                                            onPress={() => setSavingsAction('contribute')}
                                        >
                                            <Text style={[styles.typeText, { color: savingsAction === 'contribute' ? '#10B981' : theme.colors.textSecondary }]}>Contribute</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[
                                                styles.typeButton,
                                                { flex: 1, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: savingsAction === 'withdraw' ? '#EF4444' : theme.colors.border }
                                            ]}
                                            onPress={() => setSavingsAction('withdraw')}
                                        >
                                            <Text style={[styles.typeText, { color: savingsAction === 'withdraw' ? '#EF4444' : theme.colors.textSecondary }]}>Withdraw/Spend</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Select Savings Goal</Text>
                                    <View style={styles.inputWrapper}>
                                        <View style={styles.iconContainer}>
                                            <MaterialCommunityIcons name="piggy-bank" size={20} color="#E91E63" />
                                        </View>
                                        <TouchableOpacity
                                            style={styles.selectButton}
                                            onPress={() => setShowSavingsPicker(true)}
                                        >
                                            <Text style={getSelectedSavingsGoal() ? styles.selectText : styles.selectPlaceholder}>
                                                {getSelectedSavingsGoal()?.name || 'Select Goal'}
                                            </Text>
                                            <MaterialCommunityIcons name="chevron-down" size={24} color={theme.isDark ? '#64748B' : '#94A3B8'} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Loan Selection (if enabled) */}
                        {isLoan && (
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Select Loan</Text>
                                <View style={styles.inputWrapper}>
                                    <View style={styles.iconContainer}>
                                        <MaterialCommunityIcons name="handshake" size={20} color="#FF5722" />
                                    </View>
                                    <TouchableOpacity
                                        style={styles.selectButton}
                                        onPress={() => setShowLoanPicker(true)}
                                    >
                                        <Text style={getSelectedLoan() ? styles.selectText : styles.selectPlaceholder}>
                                            {getSelectedLoan()?.person_name ? `${getSelectedLoan()?.person_name} (${getSelectedLoan()?.type})` : 'Select Loan'}
                                        </Text>
                                        <MaterialCommunityIcons name="chevron-down" size={24} color={theme.isDark ? '#64748B' : '#94A3B8'} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {/* Group Selection (if enabled) */}
                        {isGroup && (
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Select Group</Text>
                                <View style={styles.inputWrapper}>
                                    <View style={styles.iconContainer}>
                                        <MaterialCommunityIcons name="account-group" size={20} color="#EC4899" />
                                    </View>
                                    <TouchableOpacity
                                        style={styles.selectButton}
                                        onPress={() => setShowGroupPicker(true)}
                                    >
                                        <Text style={getSelectedGroup() ? styles.selectText : styles.selectPlaceholder}>
                                            {getSelectedGroup()?.name || 'Select Group'}
                                        </Text>
                                        <MaterialCommunityIcons name="chevron-down" size={24} color={theme.isDark ? '#64748B' : '#94A3B8'} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {/* Trip Selection (if enabled) */}
                        {isTrip && (
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Select Trip</Text>
                                <View style={styles.inputWrapper}>
                                    <View style={styles.iconContainer}>
                                        <MaterialCommunityIcons name="airplane-takeoff" size={20} color="#FBBF24" />
                                    </View>
                                    <TouchableOpacity
                                        style={styles.selectButton}
                                        onPress={() => setShowTripPicker(true)}
                                    >
                                        <Text style={getSelectedTrip() ? styles.selectText : styles.selectPlaceholder}>
                                            {getSelectedTrip()?.name || 'Select Trip'}
                                        </Text>
                                        <MaterialCommunityIcons name="chevron-down" size={24} color={theme.isDark ? '#64748B' : '#94A3B8'} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {/* Recurring Transaction Toggle */}
                        <View style={styles.inputGroup}>
                            <View style={styles.recurringToggleRow}>
                                <Text style={styles.label}>Make this recurring?</Text>
                                <Switch
                                    value={isRecurring}
                                    onValueChange={setIsRecurring}
                                    trackColor={{ false: theme.isDark ? 'rgba(255,255,255,0.1)' : '#D1D5DB', true: theme.colors.primary + '80' }}
                                    thumbColor={isRecurring ? theme.colors.primary : '#F3F4F6'}
                                />
                            </View>
                        </View>

                        {/* Recurring Frequency (only if recurring is enabled) */}
                        {isRecurring && (
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Frequency</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                                    {(['daily', 'weekly', 'monthly', 'yearly', 'custom'] as RecurringType[]).map((r) => (
                                        <TouchableOpacity
                                            key={r}
                                            style={[
                                                styles.recurringButton,
                                                recurringType === r && styles.activeRecurringButton,
                                                { paddingHorizontal: 12 }
                                            ]}
                                            onPress={() => setRecurringType(r)}
                                        >
                                            <Text style={[
                                                styles.recurringText,
                                                recurringType === r && styles.activeRecurringText
                                            ]}>
                                                {r.charAt(0).toUpperCase() + r.slice(1)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>

                                {recurringType === 'custom' && (
                                    <Animated.View entering={FadeInDown} style={{ marginTop: 16, gap: 16 }}>
                                        {/* Custom Interval */}
                                        <View>
                                            <Text style={[styles.label, { fontSize: 13, marginBottom: 8 }]}>Repeat every</Text>
                                            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                                                <TextInput
                                                    style={[styles.input, { width: 80, textAlign: 'center' }]}
                                                    value={customInterval}
                                                    onChangeText={setCustomInterval}
                                                    keyboardType="number-pad"
                                                />
                                                <TouchableOpacity
                                                    style={styles.selectButton}
                                                    onPress={() => {
                                                        const freqs: any[] = ['daily', 'weekly', 'monthly', 'yearly'];
                                                        const currentIndex = freqs.indexOf(customFrequency);
                                                        const nextIndex = (currentIndex + 1) % freqs.length;
                                                        setCustomFrequency(freqs[nextIndex]);
                                                    }}
                                                >
                                                    <Text style={styles.selectText}>
                                                        {customFrequency.charAt(0).toUpperCase() + customFrequency.slice(1)}{parseInt(customInterval) > 1 ? 's' : ''}
                                                    </Text>
                                                    <MaterialCommunityIcons name="chevron-down" size={20} color={theme.colors.textSecondary} />
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        {/* End Condition */}
                                        <View>
                                            <Text style={[styles.label, { fontSize: 13, marginBottom: 8 }]}>Ends</Text>
                                            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                                                <TouchableOpacity
                                                    style={[
                                                        styles.recurringButton,
                                                        endCondition === 'never' && styles.activeRecurringButton
                                                    ]}
                                                    onPress={() => setEndCondition('never')}
                                                >
                                                    <Text style={[styles.recurringText, endCondition === 'never' && styles.activeRecurringText]}>Never</Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    style={[
                                                        styles.recurringButton,
                                                        endCondition === 'after_occurrences' && styles.activeRecurringButton
                                                    ]}
                                                    onPress={() => setEndCondition('after_occurrences')}
                                                >
                                                    <Text style={[styles.recurringText, endCondition === 'after_occurrences' && styles.activeRecurringText]}>After...</Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    style={[
                                                        styles.recurringButton,
                                                        endCondition === 'on_date' && styles.activeRecurringButton
                                                    ]}
                                                    onPress={() => setEndCondition('on_date')}
                                                >
                                                    <Text style={[styles.recurringText, endCondition === 'on_date' && styles.activeRecurringText]}>On Date</Text>
                                                </TouchableOpacity>
                                            </View>

                                            {endCondition === 'after_occurrences' && (
                                                <Animated.View entering={FadeInDown} style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                    <TextInput
                                                        style={[styles.input, { width: 80, textAlign: 'center' }]}
                                                        value={totalOccurrences}
                                                        onChangeText={setTotalOccurrences}
                                                        keyboardType="number-pad"
                                                    />
                                                    <Text style={[styles.label, { marginBottom: 0 }]}>occurrences</Text>
                                                </Animated.View>
                                            )}

                                            {endCondition === 'on_date' && (
                                                <Animated.View entering={FadeInDown} style={{ marginTop: 8 }}>
                                                    <TouchableOpacity
                                                        style={styles.selectButton}
                                                        onPress={() => setShowEndDatePicker(true)}
                                                    >
                                                        <Text style={styles.selectText}>
                                                            {endDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                        </Text>
                                                        <MaterialCommunityIcons name="calendar" size={20} color={theme.colors.textSecondary} />
                                                    </TouchableOpacity>
                                                </Animated.View>
                                            )}

                                        </View>
                                    </Animated.View>
                                )}
                            </View>
                        )}
                    </View>
                </ScrollView>

                {/* Save Button (Fixed at Bottom) */}
                <View style={styles.saveButtonContainer}>
                    <QSButton
                        title={editTransaction ? "Update Transaction" : "Save Transaction"}
                        onPress={handleSave}
                        loading={saving}
                        disabled={saving}
                        variant="primary"
                        style={styles.saveButton}
                    />
                </View>
            </View>

            {/* Bottom Sheet Pickers */}
            <QSDatePicker
                visible={showEndDatePicker}
                onClose={() => setShowEndDatePicker(false)}
                selectedDate={endDate}
                onSelect={(d) => {
                    setEndDate(d);
                    setShowEndDatePicker(false);
                }}
            />
            <QSCategoryPicker
                visible={showCategoryPicker}
                onClose={() => setShowCategoryPicker(false)}
                categories={categories}
                selectedId={categoryId}
                onSelect={(cat) => {
                    setCategoryId(cat.id);
                    setSubCategoryId(''); // Reset sub on parent change
                    setShowCategoryPicker(false);
                    // Automatically show sub-category picker only if sub-categories exist
                    const hasSubCategories = categories.some(c => c.parent_id === cat.id);
                    if (hasSubCategories) {
                        setTimeout(() => setShowSubCategoryPicker(true), 300);
                    }
                }}
                parentId={null} // Top level
                onCreateNew={() => {
                    setCreatingParentId(undefined);
                    setShowCreateCategory(true);
                }}
            />

            <QSCategoryPicker
                visible={showSubCategoryPicker}
                onClose={() => setShowSubCategoryPicker(false)}
                categories={categories}
                selectedId={subCategoryId}
                onSelect={(cat) => {
                    setSubCategoryId(cat.id);
                    setShowSubCategoryPicker(false);
                }}
                parentId={categoryId} // Filter by parent
                onCreateNew={() => {
                    setCreatingParentId(categoryId);
                    setShowCreateCategory(true);
                }}
            />

            <QSCreateCategorySheet
                visible={showCreateCategory}
                onClose={() => setShowCreateCategory(false)}
                onSave={handleCreateCategory}
                parentId={creatingParentId}
                type={type === 'transfer' ? 'expense' : type} // Default fallback
            />

            <QSAccountPicker
                visible={showAccountPicker}
                onClose={() => setShowAccountPicker(false)}
                accounts={accounts}
                selectedId={accountId}
                onSelect={(acc) => setAccountId(acc ? acc.id : '')}
                excludeId={(type === 'transfer' && !isSavings) ? toAccountId : undefined}
            />

            <QSAccountPicker
                visible={showToAccountPicker}
                onClose={() => setShowToAccountPicker(false)}
                accounts={accounts}
                selectedId={toAccountId}
                onSelect={(acc) => setToAccountId(acc ? acc.id : '')}
                excludeId={!isSavings ? accountId : undefined}
            />

            <QSGroupPicker
                visible={showGroupPicker}
                onClose={() => setShowGroupPicker(false)}
                groups={groups}
                selectedId={selectedGroupId}
                onSelect={(grp) => setSelectedGroupId(grp.id)}
            />

            <QSTripPicker
                visible={showTripPicker}
                onClose={() => setShowTripPicker(false)}
                trips={trips}
                selectedId={selectedTripId}
                onSelect={(trip) => {
                    setSelectedTripId(trip.id);
                    if (trip.groupId) {
                        setIsGroup(true);
                        setSelectedGroupId(trip.groupId);
                    }
                }}
            />

            <QSDatePicker
                visible={showDatePicker}
                onClose={() => setShowDatePicker(false)}
                selectedDate={date}
                onSelect={(selectedDate) => setDate(selectedDate)}
            />

            <QSSavingsPicker
                visible={showSavingsPicker}
                onClose={() => setShowSavingsPicker(false)}
                goals={savingsGoals}
                selectedId={savingsId}
                onSelect={(goal) => setSavingsId(goal.id)}
            />

            <QSLoanPicker
                visible={showLoanPicker}
                onClose={() => setShowLoanPicker(false)}
                loans={loans}
                selectedId={loanId}
                onSelect={(loan) => setLoanId(loan.id)}
            />
        </>
    );
}
