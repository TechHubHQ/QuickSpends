import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Toast from "react-native-toast-message";
import { QSAccountPicker } from "../components/QSAccountPicker";
import { QSAlertModal } from "../components/QSAlertModal";
import { QSButton } from "../components/QSButton";
import { QSDatePicker } from "../components/QSDatePicker";
import { QSHeader } from "../components/QSHeader";
import { QSTransactionPicker } from "../components/QSTransactionPicker";
import { useAuth } from "../context/AuthContext";
import { Account, useAccounts } from "../hooks/useAccounts";
import { Category, useCategories } from "../hooks/useCategories";
import { RepaymentSchedule, useLoans } from "../hooks/useLoans";
import { useTransactions } from "../hooks/useTransactions";
import { createStyles } from "../styles/QSCreateLoan.styles";
import { useTheme } from "../theme/ThemeContext";

export default function QSAddLoanScreen() {
    const { loanId } = useLocalSearchParams<{ loanId: string }>();
    const { theme } = useTheme();
    const router = useRouter();
    const { user } = useAuth();
    const { addLoan, getLoan, updateLoan, getRepaymentSchedule } = useLoans();

    const styles = useMemo(() => createStyles(theme), [theme]);

    const { getAccountsByUser } = useAccounts();
    const { addTransaction, getTransactionsByAccount, updateTransaction, linkTransactionsToLoan } = useTransactions();
    const { getCategories } = useCategories();
    const [loanName, setLoanName] = useState("");
    const [personName, setPersonName] = useState("");
    const [amount, setAmount] = useState("");
    const [interestRate, setInterestRate] = useState("0");
    const [interestType, setInterestType] = useState<'yearly' | 'monthly'>('yearly');
    const [type, setType] = useState<'lent' | 'borrowed'>('lent');
    const [loanType, setLoanType] = useState("Personal");
    const [paymentType, setPaymentType] = useState("EMI");
    const [emiAmount, setEmiAmount] = useState("");
    const [tenure, setTenure] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [lenderType, setLenderType] = useState<'person' | 'bank'>('person');
    const [isCcConversion, setIsCcConversion] = useState(false);
    const [ccTransactions, setCcTransactions] = useState<any[]>([]); // Using any for now, will type properly
    const [selectedCcTxns, setSelectedCcTxns] = useState<Set<string>>(new Set());
    const [isTxnPickerVisible, setIsTxnPickerVisible] = useState(false);
    const [extraCharges, setExtraCharges] = useState("");
    const [schedule, setSchedule] = useState<Omit<RepaymentSchedule, 'id' | 'loan_id' | 'status'>[]>([]);
    const [editingScheduleIndex, setEditingScheduleIndex] = useState<number | null>(null);
    const [scheduleDate, setScheduleDate] = useState<Date>(new Date());
    const [showScheduleDatePicker, setShowScheduleDatePicker] = useState(false);

    // ... existing states ...
    const [loading, setLoading] = useState(false);

    const loanTypes = ["Personal", "Home", "Car", "Education", "Business", "Gold", "Other"];
    const paymentTypes = ["EMI", "Bullet", "Interest-only", "Other"];

    const [accounts, setAccounts] = useState<Account[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [isPickerVisible, setIsPickerVisible] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Alert Modal State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: "", message: "" });

    React.useEffect(() => {
        if (user) {
            getAccountsByUser(user.id).then(setAccounts);
        }
    }, [user]);

    const fetchLoanData = useCallback(async () => {
        if (loanId) {
            const loan = await getLoan(loanId);
            if (loan) {
                setLoanName(loan.name || "");
                setPersonName(loan.person_name);
                setAmount(loan.total_amount.toString());
                setInterestRate(loan.interest_rate.toString());
                setType(loan.type);
                setInterestType(loan.interest_type || 'yearly');
                setLoanType(loan.loan_type || "Personal");
                setPaymentType(loan.payment_type || "EMI");
                setEmiAmount(loan.emi_amount?.toString() || "");
                setTenure(loan.tenure_months?.toString() || "");
                setDueDate(loan.next_due_date || "");
            }
        }
    }, [loanId, getLoan]);

    React.useEffect(() => {
        fetchLoanData();
    }, [fetchLoanData]);

    React.useEffect(() => {
        if (loanId) {
            getRepaymentSchedule(loanId).then(data => {
                // map to schedule format
                if (data && data.length > 0) {
                    setSchedule(data.map(item => ({
                        due_date: item.due_date,
                        amount: item.amount,
                        installment_number: item.installment_number,
                    })));
                }
            });
        }
    }, [getRepaymentSchedule, loanId]);

    const handleCcAccountSelect = async (account: Account) => {
        setSelectedAccount(account);
        setIsPickerVisible(false);
        const txns = await getTransactionsByAccount(account.id);
        // Filter for expenses that are NOT already part of a loan or split (though split checking is complex, assuming simple case for now)
        // Also exclude transfers? Yes, usually only expenses are converted.
        // And exclude those already having loan_id
        const eligibleTxns = txns.filter((t: any) =>
            t.type === 'expense' && !t.loan_id
        );
        setCcTransactions(eligibleTxns);
    };

    const handleToggleTxn = (txnId: string, txnAmount: number) => {
        const newSet = new Set(selectedCcTxns);
        if (newSet.has(txnId)) {
            newSet.delete(txnId);
        } else {
            newSet.add(txnId);
        }
        setSelectedCcTxns(newSet);
    };

    // Calculate Total Amount
    React.useEffect(() => {
        if (isCcConversion) {
            let total = 0;
            selectedCcTxns.forEach(id => {
                const txn = ccTransactions.find(t => t.id === id);
                if (txn) total += txn.amount;
            });
            if (extraCharges) {
                total += parseFloat(extraCharges) || 0;
            }
            setAmount(total.toString());
            // Force Payment Type to EMI
            setPaymentType('EMI');
        }
    }, [selectedCcTxns, extraCharges, isCcConversion, ccTransactions]);

    // Generate Schedule automatically
    React.useEffect(() => {
        if (paymentType === 'EMI' && tenure && emiAmount && (!loanId)) { // Only auto-generate for new loans or if explicitly requested
            // Simple generation logic
            const count = parseInt(tenure);
            const monthlyAmount = parseFloat(emiAmount);
            if (count > 0 && monthlyAmount > 0) {
                const newSchedule: Omit<RepaymentSchedule, 'id' | 'loan_id' | 'status'>[] = [];
                let currentDueDate = dueDate ? new Date(dueDate) : new Date();
                if (!dueDate) {
                    currentDueDate.setMonth(currentDueDate.getMonth() + 1); // Default to next month
                }

                // If schedule already exists and length matches, try to keep it? 
                // For now, let's just regenerate if tenure changes. 
                // But we want to avoid overwriting user edits if they just change amount but keep tenure.
                // Let's only regenerate if the length is different or it's empty.

                if (schedule.length !== count) {
                    for (let i = 0; i < count; i++) {
                        newSchedule.push({
                            due_date: currentDueDate.toISOString(),
                            amount: monthlyAmount,
                            installment_number: i + 1
                        });
                        // Add 1 month for next due date
                        currentDueDate = new Date(currentDueDate); // clone
                        currentDueDate.setMonth(currentDueDate.getMonth() + 1);
                    }
                    setSchedule(newSchedule);
                } else {
                    // If schedule exists, maybe just update amounts if they match the old EMI amount? 
                    // Or just leave it to user.
                    // A safer bet is to update all amounts if they equal the *previous* emi amount, but that's complex.
                    // Let's just update all amounts to the new EMI amount for now, provided they haven't been customized?
                    // Simpler: Just regenerate is usually expected unless we track "customized" flag.
                    // Let's regenerate for now to ensure consistency, but maybe we can be smarter later.

                    // actually, if user is typing, we don't want to constantly reset dates.
                    // So let's only update amounts.
                    const updated = schedule.map(s => ({ ...s, amount: monthlyAmount }));
                    // Only set if different
                    if (JSON.stringify(updated) !== JSON.stringify(schedule)) {
                        setSchedule(updated);
                    }
                }
            }
        }
    }, [tenure, emiAmount, dueDate, paymentType, loanId]);

    // Fetch schedule for existing loan
    const fetchSchedule = useCallback(async () => {
        if (loanId) {
            // We need a getRepaymentSchedule from useLoans, but it's not exported/fetched yet in fetchLoanData
            // Implementation plan said to add getRepaymentSchedule.
            // I should use it here.

            // Wait, I need to destructure it from useLoans
            // const { getRepaymentSchedule } = useLoans(); // already have destructuring at top, need to add it there
        }
    }, [loanId]);

    // I need to update the destructuring at the top of the component first.


    const handleSave = async () => {
        if (!user) return;
        if (!amount || (!loanId && !selectedAccount && !isCcConversion) || (isCcConversion && !selectedAccount)) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: !loanId && !selectedAccount ? 'Please select an account' : 'Please fill in all fields'
            });
            return;
        }

        setLoading(true);
        const loanData = {
            name: loanName || (isCcConversion ? `CC Clean-up - ${new Date().toLocaleDateString()}` : undefined),
            person_name: isCcConversion ? (selectedAccount?.name || 'Credit Card') : personName,
            total_amount: parseFloat(amount),
            interest_rate: parseFloat(interestRate) || 0,
            interest_type: interestType,
            type,
            loan_type: loanType,
            payment_type: paymentType,
            emi_amount: emiAmount ? parseFloat(emiAmount) : undefined,
            tenure_months: tenure ? parseInt(tenure) : undefined,
            next_due_date: dueDate || undefined,
        };

        if (loanId) {
            const success = await updateLoan(loanId, loanData);

            if (success) {
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Loan updated successfully'
                });
                router.back();
            }
        } else {
            const newLoanId = await addLoan({
                user_id: user.id,
                ...loanData
            }, schedule);

            if (newLoanId) {
                if (isCcConversion && selectedAccount) {
                    // Link original transactions to this Loan
                    await linkTransactionsToLoan(Array.from(selectedCcTxns), newLoanId);
                } else if (selectedAccount) {
                    // Standard Loan Creation Flow
                    const txnType = type === 'lent' ? 'expense' : 'income';
                    const categories = await getCategories(txnType);

                    // Priority 1: Exact "Loans & Debt" or similar (Parent)
                    let loanCategory = categories.find((c: Category) => c.name === 'Loans & Debt' && !c.parent_id);

                    // Priority 2: Any category containing "Loan"
                    if (!loanCategory) {
                        loanCategory = categories.find((c: Category) => c.name.toLowerCase().includes('loan') && !c.parent_id);
                    }

                    // Priority 3: "Other"
                    if (!loanCategory) {
                        loanCategory = categories.find((c: Category) => c.name === 'Other' && !c.parent_id);
                    }

                    // Priority 4: First available
                    if (!loanCategory && categories.length > 0) {
                        loanCategory = categories[0];
                    }

                    const targetSubName = type === 'lent' ? 'Loan Disbursement' : 'Loan Received';
                    const subCategory = loanCategory ? categories.find((c: Category) => c.parent_id === loanCategory?.id && c.name === targetSubName) : undefined;

                    await addTransaction({
                        user_id: user.id,
                        account_id: selectedAccount.id,
                        category_id: subCategory?.id || loanCategory?.id,
                        name: type === 'lent' ? `Loan to ${personName}` : `Loan from ${personName}`,
                        description: loanName || (type === 'lent' ? `Lent money to ${personName}` : `Borrowed money from ${personName}`),
                        amount: parseFloat(amount),
                        type: txnType,
                        date: new Date().toISOString(),
                        loan_id: newLoanId
                    });
                }

                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Loan record created and transaction recorded'
                });
                router.back();
            }
        }
        setLoading(false);
    };

    return (
        <View style={styles.container}>


            <ScrollView contentContainerStyle={{}}>
                <QSHeader title={loanId ? "Edit Loan" : "New Loan"} showBack onBackPress={() => router.back()} />
                <View style={styles.scrollContent}>
                    <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.typeContainer}>
                        {(['lent', 'borrowed'] as const).map((t) => (
                            <TouchableOpacity
                                key={t}
                                style={[
                                    styles.typeButton,
                                    type === t && { backgroundColor: theme.colors.primary }
                                ]}
                                onPress={() => {
                                    setType(t);
                                    if (t === 'lent') setIsCcConversion(false);
                                }}
                            >
                                <Text style={[
                                    styles.typeText,
                                    type === t ? { color: theme.colors.onPrimary } : { color: theme.colors.text }
                                ]}>
                                    {t.charAt(0).toUpperCase() + t.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </Animated.View>

                    {type === 'borrowed' && !loanId && (
                        <Animated.View entering={FadeInDown.delay(120).springify()}>
                            <TouchableOpacity
                                style={[
                                    styles.convertButton,
                                    isCcConversion && { backgroundColor: theme.colors.primary + '10' }
                                ]}
                                onPress={() => {
                                    setIsCcConversion(!isCcConversion);
                                    // Reset some states
                                    if (!isCcConversion) {
                                        setLoanName("");
                                        setPersonName("");
                                        setAmount("");
                                        setSelectedAccount(null);
                                        setPaymentType('EMI');
                                        setIsPickerVisible(true); // Auto-open picker for convenience
                                    }
                                }}
                            >
                                <MaterialCommunityIcons
                                    name={isCcConversion ? "close-circle-outline" : "credit-card-refresh-outline"}
                                    size={20}
                                    color={theme.colors.primary}
                                />
                                <Text style={styles.convertButtonText}>
                                    {isCcConversion ? "Cancel Conversion" : "Convert Credit Card Dues"}
                                </Text>
                            </TouchableOpacity>
                        </Animated.View>
                    )}

                    {isCcConversion ? (
                        <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.inputGroup}>
                            <Text style={styles.label}>Select Credit Card</Text>
                            <TouchableOpacity
                                style={styles.inputWrapper}
                                onPress={() => setIsPickerVisible(true)}
                            >
                                <MaterialCommunityIcons name="credit-card" size={20} color={theme.colors.primary} style={{ marginRight: 12 }} />
                                <Text style={[styles.input, { paddingVertical: 16 }]}>
                                    {selectedAccount ? selectedAccount.name : "Select Credit Card"}
                                </Text>
                                <MaterialCommunityIcons name="chevron-down" size={20} color={theme.colors.textSecondary} />
                            </TouchableOpacity>

                            {selectedAccount && ccTransactions.length === 0 && (
                                <Text style={{ color: theme.colors.textSecondary, marginTop: 8 }}>No eligible expenses found. (Only unconverted expenses shown)</Text>
                            )}

                            {ccTransactions.length > 0 && (
                                <View style={{ marginTop: 16 }}>
                                    <Text style={[styles.label, { marginBottom: 8 }]}>Transactions</Text>
                                    <TouchableOpacity
                                        style={[styles.inputWrapper, { justifyContent: 'space-between' }]}
                                        onPress={() => setIsTxnPickerVisible(true)}
                                    >
                                        <View>
                                            <Text style={{ color: theme.colors.text, fontSize: 16 }}>
                                                {selectedCcTxns.size > 0 ? `${selectedCcTxns.size} Selected` : "Select Transactions"}
                                            </Text>
                                            {selectedCcTxns.size > 0 && (
                                                <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>
                                                    Total: ₹{ccTransactions.filter(t => selectedCcTxns.has(t.id)).reduce((sum, t) => sum + t.amount, 0)}
                                                </Text>
                                            )}
                                        </View>
                                        <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                            )}

                            <View style={[styles.inputGroup, { marginTop: 16 }]}>
                                <Text style={styles.label}>Additional Charges / Processing Fee</Text>
                                <View style={styles.inputWrapper}>
                                    <Text style={styles.currency}>₹</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="0.00"
                                        placeholderTextColor={theme.isDark ? '#64748B' : '#94A3B8'}
                                        keyboardType="decimal-pad"
                                        value={extraCharges}
                                        onChangeText={setExtraCharges}
                                    />
                                </View>
                            </View>

                            <View style={[styles.inputGroup, { marginTop: 16 }]}>
                                <Text style={styles.label}>Total Loan Amount</Text>
                                <Text style={{ fontSize: 24, fontWeight: '700', color: theme.colors.primary }}>₹{amount || '0.00'}</Text>
                            </View>

                        </Animated.View>
                    ) : (
                        <>
                            <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.inputGroup}>
                                <Text style={styles.label}>Loan Name (Optional)</Text>
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. Car Loan, Friend's Wedding"
                                        placeholderTextColor={theme.isDark ? '#64748B' : '#94A3B8'}
                                        value={loanName}
                                        onChangeText={setLoanName}
                                    />
                                </View>
                            </Animated.View>

                            {!isCcConversion && type === 'borrowed' && (
                                <Animated.View entering={FadeInDown.delay(180).springify()} style={styles.inputGroup}>
                                    <Text style={styles.label}>Source Type</Text>
                                    <View style={styles.typeContainer}>
                                        {(['person', 'bank'] as const).map((t) => (
                                            <TouchableOpacity
                                                key={t}
                                                style={[
                                                    styles.typeButton,
                                                    lenderType === t && { backgroundColor: theme.colors.primary }
                                                ]}
                                                onPress={() => setLenderType(t)}
                                            >
                                                <Text style={[
                                                    styles.typeText,
                                                    lenderType === t ? { color: theme.colors.onPrimary } : { color: theme.colors.text }
                                                ]}>
                                                    {t.charAt(0).toUpperCase() + t.slice(1)}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </Animated.View>
                            )}

                            <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.inputGroup}>
                                <Text style={styles.label}>
                                    {lenderType === 'bank' && type === 'borrowed' ? 'Bank Name' : 'Person Name'}
                                </Text>
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder={lenderType === 'bank' && type === 'borrowed' ? "e.g. HDFC Bank, SBI" : "Who is this with?"}
                                        placeholderTextColor={theme.isDark ? '#64748B' : '#94A3B8'}
                                        value={personName}
                                        onChangeText={setPersonName}
                                    />
                                </View>
                            </Animated.View>

                            <View style={styles.row}>
                                <Animated.View entering={FadeInDown.delay(250).springify()} style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.label}>Loan Type</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipContainer}>
                                        {loanTypes.map((t) => (
                                            <TouchableOpacity
                                                key={t}
                                                style={[
                                                    styles.chip,
                                                    loanType === t && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                                                ]}
                                                onPress={() => setLoanType(t)}
                                            >
                                                <Text style={[
                                                    styles.chipText,
                                                    loanType === t && { color: theme.colors.onPrimary }
                                                ]}>{t}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </Animated.View>
                            </View>

                            <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.inputGroup}>
                                <Text style={styles.label}>Total Amount</Text>
                                <View style={styles.inputWrapper}>
                                    <Text style={styles.currency}>₹</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="0.00"
                                        placeholderTextColor={theme.isDark ? '#64748B' : '#94A3B8'}
                                        keyboardType="decimal-pad"
                                        value={amount}
                                        onChangeText={setAmount}
                                    />
                                </View>
                            </Animated.View>
                        </>
                    )}

                    <View style={styles.row}>
                        <Animated.View entering={FadeInDown.delay(350).springify()} style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Interest Rate (%)</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="0"
                                    placeholderTextColor={theme.isDark ? '#64748B' : '#94A3B8'}
                                    keyboardType="decimal-pad"
                                    value={interestRate}
                                    onChangeText={setInterestRate}
                                />
                                <View style={styles.interestToggle}>
                                    {(['yearly', 'monthly'] as const).map((t) => (
                                        <TouchableOpacity
                                            key={t}
                                            style={[
                                                styles.toggleButton,
                                                interestType === t && { backgroundColor: theme.colors.primary },
                                                isCcConversion && interestType !== t && { opacity: 0.5 }
                                            ]}
                                            onPress={() => !isCcConversion && setInterestType(t)}
                                            disabled={isCcConversion}
                                        >
                                            <Text style={[
                                                styles.toggleText,
                                                interestType === t ? { color: theme.colors.onPrimary } : { color: theme.colors.text }
                                            ]}>
                                                {t === 'yearly' ? '/yr' : '/mo'}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </Animated.View>
                    </View>

                    <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.inputGroup}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                            <Text style={[styles.label, { marginBottom: 0, marginRight: 8 }]}>Payment Type</Text>
                            <TouchableOpacity onPress={() => {
                                setAlertConfig({
                                    title: "Payment Types",
                                    message: "• EMI: Pay a fixed amount (Principal + Interest) every month.\n\n" +
                                        "• Bullet: Pay NOTHING during the tenure. Pay the entire Principal + Interest in one shot at the end.\n\n" +
                                        "• Interest-only: Pay ONLY the interest every month. Pay the Principal amount at the end of the tenure."
                                });
                                setAlertVisible(true);
                            }}>
                                <MaterialCommunityIcons name="information-outline" size={20} color={theme.colors.primary} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipContainer}>
                            {paymentTypes.map((t) => (
                                <TouchableOpacity
                                    key={t}
                                    style={[
                                        styles.chip,
                                        paymentType === t && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                                        isCcConversion && paymentType !== t && { opacity: 0.5 }
                                    ]}
                                    onPress={() => !isCcConversion && setPaymentType(t)}
                                    disabled={isCcConversion}
                                >
                                    <Text style={[
                                        styles.chipText,
                                        paymentType === t && { color: theme.colors.onPrimary }
                                    ]}>{t}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </Animated.View>



                    <Animated.View entering={FadeInDown.delay(450).springify()} style={styles.inputGroup}>
                        <View style={styles.row}>
                            {paymentType === 'EMI' && (
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.label}>EMI Amount</Text>
                                    <View style={styles.inputWrapper}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="0.00"
                                            placeholderTextColor={theme.isDark ? '#64748B' : '#94A3B8'}
                                            keyboardType="decimal-pad"
                                            value={emiAmount}
                                            onChangeText={setEmiAmount}
                                        />
                                    </View>
                                </View>
                            )}
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Tenure (Months)</Text>
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. 12"
                                        placeholderTextColor={theme.isDark ? '#64748B' : '#94A3B8'}
                                        keyboardType="number-pad"
                                        value={tenure}
                                        onChangeText={setTenure}
                                    />
                                </View>
                            </View>
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{paymentType === 'EMI' ? 'First Installment Date' : 'Due Date / Start Date'}</Text>
                            <TouchableOpacity
                                style={styles.inputWrapper}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <MaterialCommunityIcons name="calendar-clock" size={20} color={theme.colors.primary} style={{ marginRight: 12 }} />
                                <Text style={[styles.input, { color: theme.colors.text, textAlignVertical: 'center', paddingTop: 16 }]}>
                                    {dueDate ? new Date(dueDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : "Select Date"}
                                </Text>
                                <MaterialCommunityIcons name="chevron-down" size={20} color={theme.colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    </Animated.View>

                    {paymentType === 'EMI' && schedule.length > 0 && (
                        <Animated.View entering={FadeInDown.delay(480).springify()} style={{ marginTop: 24 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <Text style={{ fontSize: 18, fontWeight: '700', color: theme.colors.text }}>Repayment Schedule</Text>
                                <View style={{ backgroundColor: theme.colors.primary + '20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
                                    <Text style={{ color: theme.colors.primary, fontWeight: '600', fontSize: 12 }}>
                                        {schedule.length} Installments
                                    </Text>
                                </View>
                            </View>

                            <View style={{ backgroundColor: theme.isDark ? '#1E293B' : '#F8FAFC', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.isDark ? '#334155' : '#E2E8F0' }}>
                                {schedule.map((item, index) => (
                                    <View key={index} style={{ flexDirection: 'row', marginBottom: index === schedule.length - 1 ? 0 : 24, position: 'relative' }}>
                                        {/* Timeline Line */}
                                        {index !== schedule.length - 1 && (
                                            <View style={{ position: 'absolute', left: 14, top: 28, bottom: -24, width: 2, backgroundColor: theme.colors.primary + '30' }} />
                                        )}

                                        {/* Number Bubble */}
                                        <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12, zIndex: 1 }}>
                                            <Text style={{ color: theme.colors.onPrimary, fontWeight: 'bold', fontSize: 12 }}>{item.installment_number}</Text>
                                        </View>

                                        <View style={{ flex: 1 }}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        setEditingScheduleIndex(index);
                                                        setScheduleDate(new Date(item.due_date));
                                                        setShowScheduleDatePicker(true);
                                                    }}
                                                    style={{ flexDirection: 'row', alignItems: 'center' }}
                                                >
                                                    <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text }}>
                                                        {new Date(item.due_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </Text>
                                                    <MaterialCommunityIcons name="pencil-outline" size={14} color={theme.colors.textSecondary} style={{ marginLeft: 8 }} />
                                                </TouchableOpacity>
                                            </View>

                                            <View style={[styles.inputWrapper, { height: 40, marginTop: 4, backgroundColor: theme.isDark ? '#0F172A' : '#FFFFFF', borderColor: theme.isDark ? '#334155' : '#E2E8F0' }]}>
                                                <Text style={{ color: theme.colors.textSecondary, marginRight: 8, fontSize: 14 }}>₹</Text>
                                                <TextInput
                                                    style={[styles.input, { height: '100%', paddingVertical: 0 }]}
                                                    value={item.amount.toString()}
                                                    keyboardType="decimal-pad"
                                                    onChangeText={(text) => {
                                                        const newAmount = parseFloat(text) || 0;
                                                        const newSchedule = [...schedule];
                                                        newSchedule[index].amount = newAmount;
                                                        setSchedule(newSchedule);
                                                    }}
                                                />
                                            </View>
                                        </View>
                                    </View>
                                ))}
                                <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.isDark ? '#334155' : '#E2E8F0' }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <Text style={{ color: theme.colors.textSecondary }}>Principal Amount</Text>
                                        <Text style={{ color: theme.colors.text, fontWeight: '600' }}>₹{parseFloat(amount || '0').toFixed(2)}</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <Text style={{ color: theme.colors.textSecondary }}>Total Interest</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginRight: 4 }}>
                                                ({((schedule.reduce((acc, curr) => acc + (curr.amount || 0), 0) - (parseFloat(amount || '0'))) / (parseFloat(amount || '1')) * 100).toFixed(1)}%)
                                            </Text>
                                            <Text style={{ color: theme.colors.error, fontWeight: '600' }}>
                                                + ₹{(schedule.reduce((acc, curr) => acc + (curr.amount || 0), 0) - (parseFloat(amount || '0'))).toFixed(2)}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 1, borderTopColor: theme.isDark ? '#334155' : '#E2E8F0', borderStyle: 'dashed' }}>
                                        <Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.text }}>Total Payable</Text>
                                        <Text style={{ fontSize: 18, fontWeight: '700', color: theme.colors.primary }}>
                                            ₹{schedule.reduce((acc, curr) => acc + (curr.amount || 0), 0).toFixed(2)}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </Animated.View>
                    )}

                    {!loanId && (
                        <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.inputGroup}>
                            <Text style={styles.label}>Disbursement Account</Text>
                            <TouchableOpacity
                                style={styles.inputWrapper}
                                onPress={() => setIsPickerVisible(true)}
                            >
                                <MaterialCommunityIcons
                                    name={selectedAccount ? (selectedAccount.type === 'bank' ? 'bank' : selectedAccount.type === 'card' ? 'credit-card' : 'cash') : 'wallet-outline'}
                                    size={20}
                                    color={theme.colors.primary}
                                    style={{ marginRight: 12 }}
                                />
                                <Text style={[styles.input, { paddingVertical: 16 }]}>
                                    {selectedAccount ? selectedAccount.name : "Select account"}
                                </Text>
                                <MaterialCommunityIcons name="chevron-down" size={20} color={theme.colors.textSecondary} />
                            </TouchableOpacity>
                        </Animated.View>
                    )}



                    {/* General Loan Summary */}
                    {
                        (amount && tenure && (paymentType !== 'EMI' || schedule.length === 0)) ? (
                            <Animated.View entering={FadeInDown.delay(600).springify()} style={{ marginVertical: 24, padding: 16, backgroundColor: theme.isDark ? '#1E293B' : '#F8FAFC', borderRadius: 16, borderWidth: 1, borderColor: theme.isDark ? '#334155' : '#E2E8F0' }}>
                                <Text style={{ fontSize: 18, fontWeight: '700', color: theme.colors.text, marginBottom: 16 }}>Loan Summary</Text>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <Text style={{ color: theme.colors.textSecondary }}>Principal Amount</Text>
                                    <Text style={{ color: theme.colors.text, fontWeight: '600' }}>₹{parseFloat(amount).toFixed(2)}</Text>
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <Text style={{ color: theme.colors.textSecondary }}>Total Interest</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginRight: 4 }}>
                                            ({(() => {
                                                const P = parseFloat(amount);
                                                const R = parseFloat(interestRate) || 0;
                                                const N = parseInt(tenure) || 0;
                                                let interest = 0;
                                                if (interestType === 'monthly') {
                                                    interest = P * (R / 100) * N;
                                                } else {
                                                    interest = P * (R / 100) * (N / 12);
                                                }
                                                return ((interest / P) * 100).toFixed(1);
                                            })()}%)
                                        </Text>
                                        <Text style={{ color: theme.colors.error, fontWeight: '600' }}>
                                            + ₹{(() => {
                                                const P = parseFloat(amount);
                                                const R = parseFloat(interestRate) || 0;
                                                const N = parseInt(tenure) || 0;
                                                if (interestType === 'monthly') {
                                                    return (P * (R / 100) * N).toFixed(2);
                                                } else {
                                                    return (P * (R / 100) * (N / 12)).toFixed(2);
                                                }
                                            })()}
                                        </Text>
                                    </View>
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 1, borderTopColor: theme.isDark ? '#334155' : '#E2E8F0', borderStyle: 'dashed' }}>
                                    <Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.text }}>Estimated Total</Text>
                                    <Text style={{ fontSize: 18, fontWeight: '700', color: theme.colors.primary }}>
                                        ₹{(() => {
                                            const P = parseFloat(amount);
                                            const R = parseFloat(interestRate) || 0;
                                            const N = parseInt(tenure) || 0;
                                            let interest = 0;
                                            if (interestType === 'monthly') {
                                                interest = P * (R / 100) * N;
                                            } else {
                                                interest = P * (R / 100) * (N / 12);
                                            }
                                            return (P + interest).toFixed(2);
                                        })()}
                                    </Text>
                                </View>
                            </Animated.View>
                        ) : null
                    }

                    <Animated.View entering={FadeInDown.delay(550).springify()} style={styles.buttonContainer}>
                        <QSButton
                            title={loanId ? "Update Loan" : "Create Loan"}
                            onPress={handleSave}
                            loading={loading}
                            variant="primary"
                        />
                    </Animated.View>

                    <QSTransactionPicker
                        visible={isTxnPickerVisible}
                        onClose={() => setIsTxnPickerVisible(false)}
                        transactions={ccTransactions}
                        selectedIds={selectedCcTxns}
                        onToggle={handleToggleTxn}
                    />

                    <QSAccountPicker
                        visible={isPickerVisible}
                        onClose={() => setIsPickerVisible(false)}
                        accounts={isCcConversion ? accounts.filter(a => a.type === 'card' && a.card_type === 'credit') : accounts}
                        selectedId={selectedAccount?.id}
                        onSelect={(account) => {
                            if (isCcConversion) {
                                handleCcAccountSelect(account as Account);
                            } else {
                                setSelectedAccount(account as Account | null);
                                setIsPickerVisible(false);
                            }
                        }}
                    />

                    <QSDatePicker
                        visible={showDatePicker}
                        onClose={() => setShowDatePicker(false)}
                        selectedDate={dueDate ? new Date(dueDate) : new Date()}
                        onSelect={(date) => setDueDate(date.toISOString())}
                    />

                    <QSDatePicker
                        visible={showScheduleDatePicker}
                        onClose={() => setShowScheduleDatePicker(false)}
                        selectedDate={scheduleDate}
                        onSelect={(date) => {
                            if (editingScheduleIndex !== null) {
                                const newSchedule = [...schedule];
                                newSchedule[editingScheduleIndex].due_date = date.toISOString();
                                setSchedule(newSchedule);
                            }
                        }}
                    />
                    {/* Closing the wrapper view */}
                </View>
            </ScrollView>

            <QSAlertModal
                visible={alertVisible}
                title={alertConfig.title}
                message={alertConfig.message}
                onClose={() => setAlertVisible(false)}
                buttons={[{ text: "Got it", onPress: () => setAlertVisible(false) }]}
            />
        </View>
    );
}

