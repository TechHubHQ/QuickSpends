import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Toast from "react-native-toast-message";
import { QSAccountPicker } from "../components/QSAccountPicker";
import { QSButton } from "../components/QSButton";
import { QSCategoryPicker } from "../components/QSCategoryPicker";
import { QSCreateCategorySheet } from "../components/QSCreateCategorySheet";
import { QSDatePicker } from "../components/QSDatePicker";
import { QSHeader } from "../components/QSHeader";
import { QSLoanPicker } from "../components/QSLoanPicker";
import { QSSavingsPicker } from "../components/QSSavingsPicker";
import { QSTripPicker } from "../components/QSTripPicker";
import { QSTagPicker } from "../components/QSTagPicker";
import { useAuth } from "../context/AuthContext";
import { useAccounts } from "../hooks/useAccounts";
import { useCategories } from "../hooks/useCategories";
import { useLoans } from "../hooks/useLoans";
import { useNotifications } from "../hooks/useNotifications";
import { useSavings } from "../hooks/useSavings";
import { useTransactions } from "../hooks/useTransactions";
import { useTrips } from "../hooks/useTrips";
import { createStyles } from "../styles/QSAddTransaction.styles";
import { useTheme } from "../theme/ThemeContext";
import { NwsType, NWS_DISPLAY, classifyNws } from "../utils/nwsClassification";

type TransactionType = 'income' | 'expense' | 'transfer';
type RecurringType = 'one-time' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

const LINK_PILLS = [
  { key: 'tag', icon: 'tag', label: 'Tag', color: '#8B5CF6' },
  { key: 'trip', icon: 'airplane', label: 'Trip', color: '#FBBF24' },
  { key: 'savings', icon: 'piggy-bank', label: 'Savings', color: '#E91E63' },
  { key: 'loan', icon: 'handshake', label: 'Loan', color: '#FF5722' },
] as const;

export default function QSAddTransactionScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    const params = useLocalSearchParams();
    const { user } = useAuth();
    const styles = createStyles(theme);

    const { getAccountsByUser } = useAccounts();
    const { getCategories } = useCategories();
    const { getTripsByUser } = useTrips();
    const { addCategory } = useCategories();
    const { addTransaction, updateTransaction, loading: saving } = useTransactions();
    const { checkAllNotifications } = useNotifications();
    const { getSavingsGoals } = useSavings();
    const { getLoans } = useLoans();

    const editTransaction = params.editTransaction ? JSON.parse(params.editTransaction as string) : null;

    const [type, setType] = useState<TransactionType>(editTransaction?.type || (params.initialType as TransactionType) || 'expense');
    const [isRecurring, setIsRecurring] = useState(!!editTransaction?.recurring_id);
    const [name, setName] = useState(editTransaction?.name || '');
    const [amount, setAmount] = useState(editTransaction?.amount?.toString() || '');
    const [description, setDescription] = useState(editTransaction?.description || '');
    const [date, setDate] = useState(editTransaction ? new Date(editTransaction.date) : new Date());
    const [recurringType, setRecurringType] = useState<RecurringType>('one-time');
    const [customInterval, setCustomInterval] = useState('1');
    const [customFrequency, setCustomFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
    const [endCondition, setEndCondition] = useState<'never' | 'after_occurrences' | 'on_date'>('never');
    const [totalOccurrences, setTotalOccurrences] = useState('5');
    const [endDate, setEndDate] = useState(new Date());
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);

    const [accountId, setAccountId] = useState(editTransaction?.account_id || '');
    const [toAccountId, setToAccountId] = useState(editTransaction?.to_account_id || '');
    const [categoryId, setCategoryId] = useState(editTransaction?.category_id || '');
    const [subCategoryId, setSubCategoryId] = useState('');
    const [isTrip, setIsTrip] = useState(!!editTransaction?.trip_id);
    const [selectedTripId, setSelectedTripId] = useState(editTransaction?.trip_id || '');

    // Bottom sheet visibility states
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);
    const [showSubCategoryPicker, setShowSubCategoryPicker] = useState(false);
    const [showCreateCategory, setShowCreateCategory] = useState(false);
    const [creatingParentId, setCreatingParentId] = useState<string | undefined>(undefined);

    const [showAccountPicker, setShowAccountPicker] = useState(false);
    const [showToAccountPicker, setShowToAccountPicker] = useState(false);
    const [showTripPicker, setShowTripPicker] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showSavingsPicker, setShowSavingsPicker] = useState(false);
    const [showLoanPicker, setShowLoanPicker] = useState(false);

    const [accounts, setAccounts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [trips, setTrips] = useState<any[]>([]);
    const [savingsGoals, setSavingsGoals] = useState<any[]>([]);
    const [loans, setLoans] = useState<any[]>([]);

    const [savingsId, setSavingsId] = useState(editTransaction?.savings_id || '');
    const [loanId, setLoanId] = useState(editTransaction?.loan_id || '');
    const [isSavings, setIsSavings] = useState(!!editTransaction?.savings_id);
    const [savingsAction, setSavingsAction] = useState<'contribute' | 'withdraw'>('contribute');
    const [isLoan, setIsLoan] = useState(!!editTransaction?.loan_id);
    const [selectedTag, setSelectedTag] = useState<any>(
        editTransaction?.tag_id ? {
            id: editTransaction.tag_id,
            name: editTransaction.tag_name || '',
            color: editTransaction.tag_color || '#6366F1',
            is_event: editTransaction.tag_is_event || false
        } : null
    );
    const [showTagPicker, setShowTagPicker] = useState(false);

    const [nwsType, setNwsType] = useState<NwsType | null>(editTransaction?.nws_type || null);

    const autoNwsType = useMemo(() => {
      if (editTransaction?.nws_type) return editTransaction.nws_type;
      if (isSavings) return 'savings' as NwsType;
      const selCat = getSelectedCategory();
      const selSub = getSelectedSubCategory();
      return classifyNws(selCat?.name, selSub?.name, savingsId || null);
    }, [categoryId, subCategoryId, savingsId, isSavings, editTransaction]);

    useEffect(() => {
      if (!nwsType) {
        setNwsType(autoNwsType);
      }
    }, [autoNwsType]);

    // Track which link pills are active
    const [activeLinks, setActiveLinks] = useState<Record<string, boolean>>({
        tag: !!selectedTag,
        trip: !!editTransaction?.trip_id,
        savings: !!editTransaction?.savings_id,
        loan: !!editTransaction?.loan_id,
    });

    useEffect(() => {
        if (editTransaction) {
        }
    }, [params.editTransaction]);

    useEffect(() => {
        if (params.savingsId) {
            setIsSavings(true);
            setSavingsId(params.savingsId as string);
            setActiveLinks(prev => ({ ...prev, savings: true }));
            if (params.initialType === 'transfer') {
                setType('transfer');
                setSavingsAction('contribute');
            } else if (params.initialType === 'expense') {
                setType('expense');
                setSavingsAction('withdraw');
            }
        }
    }, [params.savingsId, params.initialType]);

    useEffect(() => {
        if (isSavings) {
            if (savingsAction === 'contribute') {
                setType('transfer');
            } else {
                setType('expense');
            }
        }
    }, [isSavings, savingsAction]);

    useEffect(() => {
        if (params.tripId) {
            setIsTrip(true);
            setActiveLinks(prev => ({ ...prev, trip: true }));
            const tripId = params.tripId as string;
            setSelectedTripId(tripId);
        }
    }, [params.tripId]);

    useEffect(() => {
        if (params.loanId) {
            setIsLoan(true);
            setActiveLinks(prev => ({ ...prev, loan: true }));
            setLoanId(params.loanId as string);
        }
    }, [params.loanId]);

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

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user, type]);

    const fetchData = async () => {
        if (!user) return;
        const [accs, cats, trps, goals, lnz] = await Promise.all([
            getAccountsByUser(user.id),
            getCategories(type === 'transfer' ? 'expense' : type as any),
            getTripsByUser(user.id),
            getSavingsGoals(user.id),
            getLoans(user.id)
        ]);
        setAccounts(accs);
        setCategories(cats);
        setTrips(trps);
        setSavingsGoals(goals);
        setLoans(lnz);

        if (accs.length > 0 && !accountId) setAccountId(accs[0].id);

        if (editTransaction && editTransaction.category_id) {
            const existingCat = cats.find(c => c.id === editTransaction.category_id);
            if (existingCat?.parent_id) {
                setCategoryId(existingCat.parent_id);
                setSubCategoryId(existingCat.id);
            } else {
                setCategoryId(editTransaction.category_id);
                setSubCategoryId('');
            }
        } else {
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

        if ((type !== 'transfer' && !name) || !amount || !accountId) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Please fill in all mandatory fields'
            });
            return;
        }

        if (type === 'transfer' && !toAccountId) {
            if (isSavings && savingsAction === 'contribute') {
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
                trip_id: isTrip ? selectedTripId : undefined,
                to_account_id: type === 'transfer' ? toAccountId : undefined,
                savings_id: isSavings ? savingsId : undefined,
                loan_id: isLoan ? loanId : undefined,
                tag_id: selectedTag?.id || undefined,
                nws_type: nwsType,
            });

            if (success) {
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Transaction updated successfully'
                });
                checkAllNotifications(user.id);
                router.back();
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
                trip_id: isTrip ? selectedTripId : undefined,
                to_account_id: type === 'transfer' ? toAccountId : undefined,
                savings_id: isSavings ? savingsId : undefined,
                loan_id: isLoan ? loanId : undefined,
                tag_id: selectedTag?.id || undefined,
                nws_type: nwsType,
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

    const toggleLinkPill = (key: string) => {
        const nextActive = !activeLinks[key];
        setActiveLinks(prev => ({ ...prev, [key]: nextActive }));

        if (!nextActive) {
            switch (key) {
                case 'tag':
                    setSelectedTag(null);
                    break;
                case 'trip':
                    setIsTrip(false);
                    setSelectedTripId('');
                    break;
                case 'savings':
                    setIsSavings(false);
                    setSavingsId('');
                    break;
                case 'loan':
                    setIsLoan(false);
                    setLoanId('');
                    break;
            }
        }
    };

    const openLinkPicker = (key: string) => {
        switch (key) {
            case 'tag':
                setShowTagPicker(true);
                break;
            case 'trip':
                setShowTripPicker(true);
                break;
            case 'savings':
                setShowSavingsPicker(true);
                break;
            case 'loan':
                setShowLoanPicker(true);
                break;
        }
    };

    const getActiveLinkLabel = (key: string): string => {
        switch (key) {
            case 'tag':
                return selectedTag ? `#${selectedTag.name}` : '';
            case 'trip':
                return getSelectedTrip()?.name || '';
            case 'savings':
                return getSelectedSavingsGoal()?.name || '';
            case 'loan':
                return getSelectedLoan()?.person_name ? `${getSelectedLoan()?.person_name} (${getSelectedLoan()?.type})` : '';
            default:
                return '';
        }
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

                        {/* Transaction Name */}
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

                        {/* Category */}
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

                        {/* NWS Type */}
                        <Animated.View entering={FadeInDown.delay(470).springify()} style={styles.inputGroup}>
                            <Text style={styles.label}>Type</Text>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                {(['needs', 'wants', 'savings'] as NwsType[]).map((t) => {
                                    const info = NWS_DISPLAY[t];
                                    const isActive = nwsType === t;
                                    return (
                                        <TouchableOpacity
                                            key={t}
                                            style={[
                                                styles.typeButton,
                                                {
                                                    flex: 1,
                                                    borderWidth: 2,
                                                    borderColor: isActive ? info.color : theme.colors.border,
                                                    backgroundColor: isActive ? info.lightColor : theme.colors.card,
                                                },
                                            ]}
                                            onPress={() => setNwsType(t === nwsType ? null : t)}
                                        >
                                            <Text style={[styles.typeText, { color: isActive ? info.color : theme.colors.textSecondary, fontWeight: isActive ? '700' : '500' }]}>
                                                {info.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                            {nwsType !== autoNwsType && nwsType !== null && (
                                <Text style={{ fontSize: 11, color: theme.colors.textTertiary, marginTop: 4, marginLeft: 4, fontStyle: 'italic' }}>
                                    Overridden (auto: {NWS_DISPLAY[autoNwsType]?.label?.toLowerCase() ?? 'none'})
                                </Text>
                            )}
                        </Animated.View>

                        {/* Description */}
                        <Animated.View entering={FadeInDown.delay(520).springify()} style={styles.inputGroup}>
                            <Text style={styles.label}>Description</Text>
                            <View style={styles.toolbar}>
                                <TouchableOpacity
                                    style={styles.toolbarButton}
                                    onPress={() => {
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

                        {/* Account Selection */}
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

                        {/* Link Pills - Modern toggle buttons replacing Switch cards */}
                        <Animated.View entering={FadeInDown.delay(850).springify()} style={styles.linkPillsSection}>
                            <Text style={styles.linkPillsLabel}>Links</Text>
                            <View style={styles.linkPillsRow}>
                                {LINK_PILLS.map((pill) => {
                                    const isActive = activeLinks[pill.key];
                                    return (
                                        <TouchableOpacity
                                            key={pill.key}
                                            style={[
                                                styles.linkPill,
                                                isActive && styles.linkPillActive,
                                            ]}
                                            onPress={() => toggleLinkPill(pill.key)}
                                            activeOpacity={0.7}
                                        >
                                            <View
                                                style={[
                                                    styles.linkPillDot,
                                                    { backgroundColor: isActive ? pill.color : theme.colors.textTertiary },
                                                ]}
                                            />
                                            <MaterialCommunityIcons
                                                name={pill.icon as any}
                                                size={16}
                                                color={isActive ? pill.color : theme.colors.textSecondary}
                                            />
                                            <Text
                                                style={[
                                                    styles.linkPillText,
                                                    isActive && styles.linkPillTextActive,
                                                ]}
                                            >
                                                {pill.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </Animated.View>

                        {/* Expanded sections for active links */}
                        {activeLinks.tag && !selectedTag && (
                            <Animated.View entering={FadeInDown} style={styles.inputGroup}>
                                <TouchableOpacity
                                    style={[styles.inputWrapper, { borderColor: '#8B5CF640' }]}
                                    onPress={() => setShowTagPicker(true)}
                                >
                                    <View style={[styles.iconContainer, { backgroundColor: '#8B5CF615' }]}>
                                        <MaterialCommunityIcons name="tag" size={20} color="#8B5CF6" />
                                    </View>
                                    <Text style={styles.selectPlaceholder}>Select a tag or event</Text>
                                    <MaterialCommunityIcons name="chevron-down" size={24} color={theme.colors.textSecondary} />
                                </TouchableOpacity>
                            </Animated.View>
                        )}
                        {activeLinks.tag && selectedTag && (
                            <Animated.View entering={FadeInDown} style={styles.inputGroup}>
                                <View style={[styles.inputWrapper, { borderColor: '#8B5CF640' }]}>
                                    <View style={[styles.iconContainer, { backgroundColor: '#8B5CF615' }]}>
                                        <MaterialCommunityIcons
                                            name={selectedTag?.is_event ? "calendar-star" : "tag"}
                                            size={20}
                                            color={selectedTag.color}
                                        />
                                    </View>
                                    <TouchableOpacity
                                        style={styles.selectButton}
                                        onPress={() => setShowTagPicker(true)}
                                    >
                                        <Text style={[styles.selectText, { color: selectedTag.color }]}>
                                            #{selectedTag.name}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setShowTagPicker(true)}>
                                        <MaterialCommunityIcons name="chevron-down" size={24} color={theme.colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                            </Animated.View>
                        )}

                        {activeLinks.trip && !selectedTripId && (
                            <Animated.View entering={FadeInDown} style={styles.inputGroup}>
                                <TouchableOpacity
                                    style={[styles.inputWrapper, { borderColor: '#FBBF2440' }]}
                                    onPress={() => setShowTripPicker(true)}
                                >
                                    <View style={[styles.iconContainer, { backgroundColor: '#FBBF2415' }]}>
                                        <MaterialCommunityIcons name="airplane-takeoff" size={20} color="#FBBF24" />
                                    </View>
                                    <Text style={styles.selectPlaceholder}>Select a trip</Text>
                                    <MaterialCommunityIcons name="chevron-down" size={24} color={theme.colors.textSecondary} />
                                </TouchableOpacity>
                            </Animated.View>
                        )}
                        {activeLinks.trip && selectedTripId && (
                            <Animated.View entering={FadeInDown} style={styles.inputGroup}>
                                <View style={[styles.inputWrapper, { borderColor: '#FBBF2440' }]}>
                                    <View style={[styles.iconContainer, { backgroundColor: '#FBBF2415' }]}>
                                        <MaterialCommunityIcons name="airplane-takeoff" size={20} color="#FBBF24" />
                                    </View>
                                    <TouchableOpacity
                                        style={styles.selectButton}
                                        onPress={() => setShowTripPicker(true)}
                                    >
                                        <Text style={styles.selectText}>
                                            {getSelectedTrip()?.name || 'Select Trip'}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setShowTripPicker(true)}>
                                        <MaterialCommunityIcons name="chevron-down" size={24} color={theme.colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                            </Animated.View>
                        )}

                        {activeLinks.savings && (
                            <Animated.View entering={FadeInDown} style={styles.inputGroup}>
                                <View style={[styles.inputWrapper, { borderColor: '#E91E6340', marginBottom: 8 }]}>
                                    <View style={[styles.iconContainer, { backgroundColor: '#E91E6315' }]}>
                                        <MaterialCommunityIcons name="piggy-bank" size={20} color="#E91E63" />
                                    </View>
                                    <TouchableOpacity
                                        style={styles.selectButton}
                                        onPress={() => setShowSavingsPicker(true)}
                                    >
                                        <Text style={getSelectedSavingsGoal() ? styles.selectText : styles.selectPlaceholder}>
                                            {getSelectedSavingsGoal()?.name || 'Select Goal'}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setShowSavingsPicker(true)}>
                                        <MaterialCommunityIcons name="chevron-down" size={24} color={theme.colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>
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
                                        <Text style={[styles.typeText, { color: savingsAction === 'withdraw' ? '#EF4444' : theme.colors.textSecondary }]}>Withdraw</Text>
                                    </TouchableOpacity>
                                </View>
                            </Animated.View>
                        )}

                        {activeLinks.loan && (
                            <Animated.View entering={FadeInDown} style={styles.inputGroup}>
                                <View style={[styles.inputWrapper, { borderColor: '#FF572240' }]}>
                                    <View style={[styles.iconContainer, { backgroundColor: '#FF572215' }]}>
                                        <MaterialCommunityIcons name="handshake" size={20} color="#FF5722" />
                                    </View>
                                    <TouchableOpacity
                                        style={styles.selectButton}
                                        onPress={() => setShowLoanPicker(true)}
                                    >
                                        <Text style={getSelectedLoan() ? styles.selectText : styles.selectPlaceholder}>
                                            {getSelectedLoan()?.person_name ? `${getSelectedLoan()?.person_name} (${getSelectedLoan()?.type})` : 'Select Loan'}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setShowLoanPicker(true)}>
                                        <MaterialCommunityIcons name="chevron-down" size={24} color={theme.colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                            </Animated.View>
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

                        {/* Recurring Frequency */}
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

                {/* Save Button */}
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
                    setSubCategoryId('');
                    setShowCategoryPicker(false);
                    const hasSubCategories = categories.some(c => c.parent_id === cat.id);
                    if (hasSubCategories) {
                        setTimeout(() => setShowSubCategoryPicker(true), 300);
                    }
                }}
                parentId={null}
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
                parentId={categoryId}
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
                type={type === 'transfer' ? 'expense' : type}
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

            <QSTripPicker
                visible={showTripPicker}
                onClose={() => setShowTripPicker(false)}
                trips={trips}
                selectedId={selectedTripId}
                onSelect={(trip) => {
                    setSelectedTripId(trip.id);
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

            <QSTagPicker
                visible={showTagPicker}
                onClose={() => setShowTagPicker(false)}
                selectedId={selectedTag?.id}
                onSelect={(tag) => setSelectedTag(tag)}
            />
        </>
    );
}
