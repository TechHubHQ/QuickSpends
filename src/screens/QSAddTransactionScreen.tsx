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
import { QSTripPicker } from "../components/QSTripPicker";
import { useAuth } from "../context/AuthContext";
import { useAccounts } from "../hooks/useAccounts";
import { useCategories } from "../hooks/useCategories";
import { useGroups } from "../hooks/useGroups";
import { useNotifications } from "../hooks/useNotifications";
import { useTransactions } from "../hooks/useTransactions";
import { useTrips } from "../hooks/useTrips";
import { createStyles } from "../styles/QSAddTransaction.styles";
import { useTheme } from "../theme/ThemeContext";

type TransactionType = 'income' | 'expense' | 'transfer';
type RecurringType = 'one-time' | 'weekly' | 'monthly';

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

    // Parse edit transaction if available
    const editTransaction = params.editTransaction ? JSON.parse(params.editTransaction as string) : null;

    const [type, setType] = useState<TransactionType>((params.initialType as TransactionType) || 'expense');
    const [isRecurring, setIsRecurring] = useState(false);
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date());
    const [recurringType, setRecurringType] = useState<RecurringType>('one-time');

    const [accountId, setAccountId] = useState('');
    const [toAccountId, setToAccountId] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [subCategoryId, setSubCategoryId] = useState(''); // New State
    const [isGroup, setIsGroup] = useState(false);
    const [isTrip, setIsTrip] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState('');
    const [selectedTripId, setSelectedTripId] = useState('');

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

    const [accounts, setAccounts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    // We will derive sub-categories from 'categories' based on 'categoryId' selection
    const [groups, setGroups] = useState<any[]>([]);
    const [trips, setTrips] = useState<any[]>([]);

    // Pre-fill data if editing
    useEffect(() => {
        if (editTransaction) {
            setType(editTransaction.type);
            setName(editTransaction.name);
            setAmount(editTransaction.amount.toString());
            setDescription(editTransaction.description || '');
            setDate(new Date(editTransaction.date));
            setAccountId(editTransaction.account_id);
            setCategoryId(editTransaction.category_id || '');

            // Set Subcategory logic if implemented (checking if category has parent)
            // simplified for now as we don't have full category tree in context initially

            if (editTransaction.group_id) {
                setIsGroup(true);
                setSelectedGroupId(editTransaction.group_id);
            }
            if (editTransaction.trip_id) {
                setIsTrip(true);
                setSelectedTripId(editTransaction.trip_id);
            }
            if (editTransaction.to_account_id) {
                setToAccountId(editTransaction.to_account_id);
            }

            // Recurring pre-fill
            if (editTransaction.recurring_id) {
                // We'd ideally need to fetch the recurring config to know frequency
                // For now, let's just assume if it has recurring_id it was recurring, 
                // but since we don't have the frequency easily without another fetch, 
                // we might skip pre-filling frequency or default to monthly.
                setIsRecurring(true);
            }
        }
    }, [params.editTransaction]);

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

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user, type]);

    const fetchData = async () => {
        if (!user) return;
        const [accs, cats, grps, trps] = await Promise.all([
            getAccountsByUser(user.id),
            getCategories(type === 'transfer' ? 'expense' : type as any),
            getGroupsByUser(user.id),
            getTripsByUser(user.id)
        ]);
        setAccounts(accs);
        setCategories(cats);
        setGroups(grps);
        setTrips(trps);

        if (accs.length > 0 && !accountId) setAccountId(accs[0].id);

        // Reset category when type changes or if invalid
        const isValidIdx = cats.findIndex(c => c.id === categoryId);
        if (isValidIdx === -1) {
            setCategoryId('');
            setSubCategoryId('');
        }
    };

    const getSelectedCategory = () => categories.find(c => c.id === categoryId);
    const getSelectedSubCategory = () => categories.find(c => c.id === subCategoryId);
    const getSelectedAccount = () => accounts.find(a => a.id === accountId);
    const getSelectedToAccount = () => accounts.find(a => a.id === toAccountId);
    const getSelectedGroup = () => groups.find(g => g.id === selectedGroupId);
    const getSelectedTrip = () => trips.find(t => t.id === selectedTripId);

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
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Please select a destination account for transfer'
            });
            return;
        }

        if (type === 'transfer' && accountId === toAccountId) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Source and Destination accounts cannot be the same'
            });
            return;
        }

        if (editTransaction) {
            const success = await updateTransaction(editTransaction.id, {
                account_id: accountId,
                category_id: categoryId || undefined,
                name: name || (type === 'transfer' ? 'Transfer' : 'Transaction'),
                description: description || undefined,
                amount: parseFloat(amount),
                type,
                date: date.toISOString(),
                group_id: isGroup ? selectedGroupId : undefined,
                trip_id: isTrip ? selectedTripId : undefined,
                to_account_id: type === 'transfer' ? toAccountId : undefined,
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
            const success = await addTransaction({
                user_id: user.id,
                account_id: accountId,
                category_id: categoryId || undefined,
                name: name || (type === 'transfer' ? 'Transfer' : 'Transaction'),
                description,
                amount: parseFloat(amount),
                type,
                date: date.toISOString(),
                group_id: isGroup ? selectedGroupId : undefined,
                trip_id: isTrip ? selectedTripId : undefined,
                to_account_id: type === 'transfer' ? toAccountId : undefined,
            }, isRecurring ? { frequency: recurringType === 'one-time' ? 'monthly' : recurringType as 'weekly' | 'monthly' } : undefined);

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
                <QSHeader
                    title={editTransaction ? "Edit Transaction" : "Add Transaction"}
                    showBack
                    onBackPress={() => router.back()}
                />

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
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
                        <View style={styles.inputWrapper}>
                            <View style={styles.iconContainer}>
                                <MaterialCommunityIcons name="note-edit" size={20} color="#A78BFA" />
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="Add notes (optional)"
                                placeholderTextColor={theme.isDark ? '#475569' : '#94A3B8'}
                                value={description}
                                onChangeText={setDescription}
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
                                <Text style={styles.label}>From Account</Text>
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

                            {/* To Account */}
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
                            <View style={styles.recurringContainer}>
                                {(['weekly', 'monthly'] as RecurringType[]).map((r) => (
                                    <TouchableOpacity
                                        key={r}
                                        style={[
                                            styles.recurringButton,
                                            recurringType === r && styles.activeRecurringButton
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
                            </View>
                        </View>
                    )}
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
                excludeId={type === 'transfer' ? toAccountId : undefined}
            />

            <QSAccountPicker
                visible={showToAccountPicker}
                onClose={() => setShowToAccountPicker(false)}
                accounts={accounts}
                selectedId={toAccountId}
                onSelect={(acc) => setToAccountId(acc ? acc.id : '')}
                excludeId={accountId}
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
        </>
    );
}
