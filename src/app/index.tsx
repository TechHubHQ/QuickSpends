import React, { useState } from "react";
import { 
    Text, View, StyleSheet, ScrollView, TouchableOpacity, TextInput, 
    Modal, ActivityIndicator, Alert, Dimensions, Platform, FlatList
} from "react-native";
import { useDatabase } from "../context/DatabaseContext";
import { 
    Ionicons, MaterialCommunityIcons, FontAwesome6, Feather, AntDesign 
} from '@expo/vector-icons';

const { width } = Dimensions.get("window");

export default function Index() {
    const {
        isLoading,
        accounts,
        categories,
        transactions,
        budgets,
        bills,
        goals,
        investments,
        dashboard,
        handleAddTransaction,
        handleDeleteTransaction,
        handleAddAccount,
        handleDeleteAccount,
        handleAddCategory,
        handleAddBudget,
        handleDeleteBudget,
        handleAddBill,
        handlePayBill,
        handleDeleteBill,
        handleAddGoal,
        handleDepositGoal,
        handleDeleteGoal,
        handleAddInvestment,
        handleUpdateInvestmentValue,
        handleDeleteInvestment,
        handleResetAllData
    } = useDatabase();

    // UI Tab Navigation
    // Tabs: 'dashboard' | 'ledger' | 'budgets' | 'bills' | 'goals'
    const [activeTab, setActiveTab] = useState<'dashboard' | 'ledger' | 'budgets' | 'bills' | 'goals'>('dashboard');

    // Filter states for Ledger
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');

    // Modal Control States
    const [isTxnModalVisible, setIsTxnModalVisible] = useState(false);
    const [isAcctModalVisible, setIsAcctModalVisible] = useState(false);
    const [isBudgetModalVisible, setIsBudgetModalVisible] = useState(false);
    const [isBillModalVisible, setIsBillModalVisible] = useState(false);
    const [isGoalModalVisible, setIsGoalModalVisible] = useState(false);
    const [isDepositModalVisible, setIsDepositModalVisible] = useState(false);

    // Selected items for modal operations
    const [selectedGoal, setSelectedGoal] = useState<any>(null);

    // Form inputs state
    const [txnAmount, setTxnAmount] = useState("");
    const [txnType, setTxnType] = useState<'income' | 'expense' | 'transfer'>('expense');
    const [txnLabel, setTxnLabel] = useState<'need' | 'want' | 'saving' | null>('need');
    const [txnAccountId, setTxnAccountId] = useState("");
    const [txnCategoryId, setTxnCategoryId] = useState("");
    const [txnNote, setTxnNote] = useState("");
    const [txnDate, setTxnDate] = useState(new Date().toISOString().split('T')[0]);
    const [linkedType, setLinkedType] = useState<'none' | 'goal' | 'investment'>('none');
    const [linkedId, setLinkedId] = useState("");

    const [acctName, setAcctName] = useState("");
    const [acctBank, setAcctBank] = useState("");
    const [acctType, setAcctType] = useState<'credit' | 'debit' | 'wallet' | 'cash'>('debit');
    const [acctBalance, setAcctBalance] = useState("");
    const [acctCreditLimit, setAcctCreditLimit] = useState("");

    const [budgetAmount, setBudgetAmount] = useState("");
    const [budgetCategoryId, setBudgetCategoryId] = useState("");

    const [billName, setBillName] = useState("");
    const [billAmount, setBillAmount] = useState("");
    const [billCategoryId, setBillCategoryId] = useState("");
    const [billAccountId, setBillAccountId] = useState("");
    const [billDueDate, setBillDueDate] = useState(new Date().toISOString().split('T')[0]);

    const [goalName, setGoalName] = useState("");
    const [goalType, setGoalType] = useState<'saving' | 'goal'>('saving');
    const [goalTargetAmount, setGoalTargetAmount] = useState("");
    const [goalAccountId, setGoalAccountId] = useState("");
    const [goalTargetDate, setGoalTargetDate] = useState("");

    const [depositAmount, setDepositAmount] = useState("");
    const [depositAccountId, setDepositAccountId] = useState("");

    // Submit Handlers
    const submitTransaction = async () => {
        if (!txnAmount || isNaN(Number(txnAmount)) || Number(txnAmount) <= 0) {
            Alert.alert("Invalid Input", "Please enter a valid amount.");
            return;
        }
        if (!txnAccountId) {
            Alert.alert("Invalid Input", "Please select an account.");
            return;
        }

        try {
            const parsedAmount = Number(txnAmount);
            const linkObj = linkedType !== 'none' && linkedId 
                ? { type: linkedType as any, id: Number(linkedId) } 
                : undefined;

            await handleAddTransaction({
                account_id: Number(txnAccountId),
                amount: parsedAmount,
                type: txnType,
                label: txnType === 'income' ? null : txnLabel,
                category_id: txnCategoryId ? Number(txnCategoryId) : null,
                note: txnNote.trim() || null,
                transaction_date: txnDate,
            }, linkObj);

            // Clean up
            setTxnAmount("");
            setTxnNote("");
            setTxnAccountId("");
            setTxnCategoryId("");
            setLinkedType("none");
            setLinkedId("");
            setIsTxnModalVisible(false);
        } catch (error: any) {
            Alert.alert("Operation Failed", error.message || "Could not save transaction.");
        }
    };

    const submitAccount = async () => {
        if (!acctName.trim()) {
            Alert.alert("Invalid Input", "Please enter an account name.");
            return;
        }
        if (!acctBalance || isNaN(Number(acctBalance))) {
            Alert.alert("Invalid Input", "Please enter a valid balance.");
            return;
        }

        try {
            await handleAddAccount({
                acct_name: acctName.trim(),
                bank_name: acctBank.trim() || null,
                type: acctType,
                balance: Number(acctBalance),
                credit_limit: acctType === 'credit' ? Number(acctCreditLimit || 0) : 0
            });

            // Clean up
            setAcctName("");
            setAcctBank("");
            setAcctBalance("");
            setAcctCreditLimit("");
            setIsAcctModalVisible(false);
        } catch (error: any) {
            Alert.alert("Operation Failed", error.message);
        }
    };

    const submitBudget = async () => {
        if (!budgetAmount || isNaN(Number(budgetAmount)) || Number(budgetAmount) <= 0) {
            Alert.alert("Invalid Input", "Please enter a valid budget amount.");
            return;
        }
        if (!budgetCategoryId) {
            Alert.alert("Invalid Input", "Please select a category.");
            return;
        }

        try {
            await handleAddBudget({
                category_id: Number(budgetCategoryId),
                amount: Number(budgetAmount),
                period: "monthly",
                start_date: null,
                end_date: null
            });

            setBudgetAmount("");
            setBudgetCategoryId("");
            setIsBudgetModalVisible(false);
        } catch (error: any) {
            Alert.alert("Operation Failed", error.message);
        }
    };

    const submitBill = async () => {
        if (!billName.trim()) {
            Alert.alert("Invalid Input", "Please enter a bill name.");
            return;
        }
        if (!billAmount || isNaN(Number(billAmount)) || Number(billAmount) <= 0) {
            Alert.alert("Invalid Input", "Please enter a valid amount.");
            return;
        }

        try {
            await handleAddBill({
                name: billName.trim(),
                amount: Number(billAmount),
                category_id: billCategoryId ? Number(billCategoryId) : null,
                account_id: billAccountId ? Number(billAccountId) : null,
                due_date: billDueDate
            });

            setBillName("");
            setBillAmount("");
            setBillCategoryId("");
            setBillAccountId("");
            setIsBillModalVisible(false);
        } catch (error: any) {
            Alert.alert("Operation Failed", error.message);
        }
    };

    const submitGoal = async () => {
        if (!goalName.trim()) {
            Alert.alert("Invalid Input", "Please enter a goal name.");
            return;
        }
        if (!goalTargetAmount || isNaN(Number(goalTargetAmount)) || Number(goalTargetAmount) <= 0) {
            Alert.alert("Invalid Input", "Please enter a valid target amount.");
            return;
        }

        try {
            await handleAddGoal({
                name: goalName.trim(),
                type: goalType,
                target_amount: Number(goalTargetAmount),
                linked_account_id: goalAccountId ? Number(goalAccountId) : null,
                target_date: goalTargetDate || null
            });

            setGoalName("");
            setGoalTargetAmount("");
            setGoalAccountId("");
            setGoalTargetDate("");
            setIsGoalModalVisible(false);
        } catch (error: any) {
            Alert.alert("Operation Failed", error.message);
        }
    };

    const submitDeposit = async () => {
        if (!depositAmount || isNaN(Number(depositAmount)) || Number(depositAmount) <= 0) {
            Alert.alert("Invalid Input", "Please enter a valid deposit amount.");
            return;
        }
        if (!depositAccountId) {
            Alert.alert("Invalid Input", "Please select a funding account.");
            return;
        }

        try {
            await handleDepositGoal(
                selectedGoal.id,
                Number(depositAccountId),
                Number(depositAmount),
                new Date().toISOString().split('T')[0]
            );

            setDepositAmount("");
            setDepositAccountId("");
            setIsDepositModalVisible(false);
        } catch (error: any) {
            Alert.alert("Operation Failed", error.message);
        }
    };

    const confirmPayBill = (bill: any) => {
        Alert.alert(
            "Pay Bill",
            `Are you sure you want to mark ${bill.name} ($${bill.amount.toFixed(2)}) as paid?`,
            accounts.map(acct => ({
                text: `Pay with ${acct.acct_name}`,
                onPress: async () => {
                    try {
                        await handlePayBill(bill.id, acct.id!, new Date().toISOString().split('T')[0]);
                    } catch (err: any) {
                        Alert.alert("Error", err.message);
                    }
                }
            })).concat([{ text: "Cancel", style: "cancel" }] as any)
        );
    };

    const confirmResetDb = () => {
        Alert.alert(
            "Reset Database",
            "This will permanently delete all your accounts, transactions, budgets, bills, and goals, and restore default categories. Are you absolutely sure?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Reset Everything", style: "destructive", onPress: handleResetAllData }
            ]
        );
    };

    // Filter transactions for ledger display
    const getFilteredTransactions = () => {
        return transactions.filter(txn => {
            const matchesSearch = searchQuery === "" || 
                (txn.note && txn.note.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (txn.category_name && txn.category_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (txn.account_name && txn.account_name.toLowerCase().includes(searchQuery.toLowerCase()));
            
            const matchesType = selectedTypeFilter === 'all' || txn.type === selectedTypeFilter;
            
            return matchesSearch && matchesType;
        });
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00F3FF" />
                <Text style={styles.loadingText}>Initializing QuickSpends Database...</Text>
            </View>
        );
    }

    return (
        <View style={styles.mainContainer}>
            {/* 1. Header (Static layout) */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.greetingText}>Welcome Back</Text>
                        <Text style={styles.appNameText}>QuickSpends</Text>
                    </View>
                    <TouchableOpacity onPress={confirmResetDb} style={styles.resetButton}>
                        <Ionicons name="refresh-circle-outline" size={24} color="#EF4444" />
                        <Text style={styles.resetText}>Purge DB</Text>
                    </TouchableOpacity>
                </View>

                {/* Glassmorphic Net Worth Card */}
                <View style={styles.netWorthCard}>
                    <Text style={styles.netWorthLabel}>TOTAL NET WORTH</Text>
                    <Text style={styles.netWorthValue}>
                        ${(dashboard?.netWorth ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                    <View style={styles.assetsDebtsContainer}>
                        <View style={styles.metricItem}>
                            <Feather name="arrow-up-right" size={14} color="#10B981" />
                            <Text style={styles.metricLabel}>Assets: </Text>
                            <Text style={[styles.metricValue, { color: "#10B981" }]}>
                                ${dashboard?.totalAssets.toFixed(0)}
                            </Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.metricItem}>
                            <Feather name="arrow-down-left" size={14} color="#EF4444" />
                            <Text style={styles.metricLabel}>Debts: </Text>
                            <Text style={[styles.metricValue, { color: "#EF4444" }]}>
                                ${dashboard?.totalDebts.toFixed(0)}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* 2. Main Content Swapper */}
            <View style={styles.contentContainer}>
                {activeTab === 'dashboard' && (
                    <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
                        {/* Quick Flow Widgets */}
                        <View style={styles.row}>
                            <View style={[styles.flowCard, { borderLeftColor: "#10B981" }]}>
                                <Text style={styles.flowLabel}>INCOME (THIS MONTH)</Text>
                                <Text style={[styles.flowValue, { color: "#10B981" }]}>
                                    +${dashboard?.monthlyIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </Text>
                            </View>
                            <View style={[styles.flowCard, { borderLeftColor: "#EF4444" }]}>
                                <Text style={styles.flowLabel}>EXPENSES (THIS MONTH)</Text>
                                <Text style={[styles.flowValue, { color: "#EF4444" }]}>
                                    -${dashboard?.monthlyExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </Text>
                            </View>
                        </View>

                        {/* Custom Circular Cashflow Chart Concept */}
                        <View style={styles.glassCard}>
                            <Text style={styles.sectionTitle}>Budget & Spend Insights</Text>
                            <View style={styles.budgetProgressRow}>
                                <View style={styles.budgetPercentCircle}>
                                    <Text style={styles.budgetPercentText}>{dashboard?.budgetSummary.percentUsed}%</Text>
                                    <Text style={styles.budgetPercentSub}>Spent</Text>
                                </View>
                                <View style={styles.budgetProgressDetails}>
                                    <Text style={styles.budgetProgressLabel}>Monthly Budgets</Text>
                                    <Text style={styles.budgetProgressVals}>
                                        Spent: <Text style={{ color: "#8B5CF6", fontWeight: "bold" }}>${dashboard?.budgetSummary.totalSpent.toFixed(0)}</Text> of ${dashboard?.budgetSummary.totalBudgeted.toFixed(0)}
                                    </Text>
                                    <View style={styles.progressBarBg}>
                                        <View 
                                            style={[
                                                styles.progressBarFill, 
                                                { 
                                                    width: `${Math.min(100, dashboard?.budgetSummary.percentUsed ?? 0)}%`,
                                                    backgroundColor: (dashboard?.budgetSummary.percentUsed ?? 0) > 100 ? "#EF4444" : "#8B5CF6"
                                                }
                                            ]} 
                                        />
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Recent Transactions List */}
                        <View style={styles.glassCard}>
                            <View style={styles.cardHeaderRow}>
                                <Text style={styles.sectionTitle}>Recent Transactions</Text>
                                <TouchableOpacity onPress={() => setActiveTab('ledger')}>
                                    <Text style={styles.viewAllText}>View All</Text>
                                </TouchableOpacity>
                            </View>

                            {dashboard?.recentTransactions.length === 0 ? (
                                <Text style={styles.emptyText}>No recent transactions. Add one below!</Text>
                            ) : (
                                dashboard?.recentTransactions.map((item, index) => (
                                    <View key={item.id || index} style={styles.txnItem}>
                                        <View style={styles.txnItemLeft}>
                                            <View style={[
                                                styles.txnIconContainer,
                                                { backgroundColor: item.type === 'income' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' }
                                            ]}>
                                                <Ionicons 
                                                    name={item.type === 'income' ? 'arrow-down-outline' : 'arrow-up-outline'} 
                                                    size={16} 
                                                    color={item.type === 'income' ? '#10B981' : '#EF4444'} 
                                                />
                                            </View>
                                            <View>
                                                <Text style={styles.txnNote}>{item.note || item.category_name || "General Spends"}</Text>
                                                <Text style={styles.txnMeta}>
                                                    {item.account_name} • {item.transaction_date}
                                                </Text>
                                            </View>
                                        </View>
                                        <Text style={[
                                            styles.txnAmount, 
                                            { color: item.type === 'income' ? '#10B981' : '#EF4444' }
                                        ]}>
                                            {item.type === 'income' ? '+' : '-'}${item.amount.toFixed(2)}
                                        </Text>
                                    </View>
                                ))
                            )}
                        </View>

                        {/* Quick Action Banner */}
                        <View style={styles.actionsPanel}>
                            <TouchableOpacity onPress={() => setIsTxnModalVisible(true)} style={styles.actionBtn}>
                                <Ionicons name="add-circle-outline" size={22} color="#00F3FF" />
                                <Text style={styles.actionBtnText}>Add Spend</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setIsAcctModalVisible(true)} style={styles.actionBtn}>
                                <MaterialCommunityIcons name="bank-plus" size={20} color="#00F3FF" />
                                <Text style={styles.actionBtnText}>Add Account</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setIsBudgetModalVisible(true)} style={styles.actionBtn}>
                                <Ionicons name="pie-chart-outline" size={20} color="#00F3FF" />
                                <Text style={styles.actionBtnText}>Set Budget</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{ height: 100 }} />
                    </ScrollView>
                )}

                {activeTab === 'ledger' && (
                    <View style={styles.tabContentContainer}>
                        {/* Filters and search */}
                        <View style={styles.filterSection}>
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search note, category, account..."
                                placeholderTextColor="#94A3B8"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                            <View style={styles.badgeRow}>
                                {['all', 'income', 'expense', 'transfer'].map((fType) => (
                                    <TouchableOpacity
                                        key={fType}
                                        style={[
                                            styles.badgeBtn,
                                            selectedTypeFilter === fType && styles.badgeBtnActive
                                        ]}
                                        onPress={() => setSelectedTypeFilter(fType as any)}
                                    >
                                        <Text style={[
                                            styles.badgeText,
                                            selectedTypeFilter === fType && styles.badgeTextActive
                                        ]}>
                                            {fType.toUpperCase()}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Transactions List */}
                        <FlatList
                            data={getFilteredTransactions()}
                            keyExtractor={(item) => String(item.id)}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item }) => (
                                <View style={styles.glassCardNoMargin}>
                                    <View style={styles.txnItem}>
                                        <View style={styles.txnItemLeft}>
                                            <View style={[
                                                styles.txnIconContainer,
                                                { backgroundColor: item.type === 'income' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' }
                                            ]}>
                                                <Ionicons 
                                                    name={item.type === 'income' ? 'arrow-down-outline' : 'arrow-up-outline'} 
                                                    size={18} 
                                                    color={item.type === 'income' ? '#10B981' : '#EF4444'} 
                                                />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.txnNote}>{item.note || item.category_name || "General Spends"}</Text>
                                                <Text style={styles.txnMeta}>
                                                    {item.account_name} • {item.transaction_date}
                                                </Text>
                                                {item.link_type && (
                                                    <View style={styles.linkTag}>
                                                        <AntDesign name="link" size={10} color="#00F3FF" />
                                                        <Text style={styles.linkTagText}>{item.link_type.toUpperCase()}</Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                        <View style={{ alignItems: "flex-end" }}>
                                            <Text style={[
                                                styles.txnAmount, 
                                                { color: item.type === 'income' ? '#10B981' : '#EF4444' }
                                            ]}>
                                                {item.type === 'income' ? '+' : '-'}${item.amount.toFixed(2)}
                                            </Text>
                                            <TouchableOpacity 
                                                onPress={() => handleDeleteTransaction(item.id!)} 
                                                style={styles.deleteTxnBtn}
                                            >
                                                <Feather name="trash-2" size={14} color="#EF4444" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            )}
                            ListEmptyComponent={() => (
                                <Text style={styles.emptyText}>No matching transactions found.</Text>
                            )}
                            ListFooterComponent={() => <View style={{ height: 100 }} />}
                            contentContainerStyle={{ paddingBottom: 40 }}
                        />

                        {/* Floating Action Button */}
                        <TouchableOpacity style={styles.fab} onPress={() => setIsTxnModalVisible(true)}>
                            <AntDesign name="plus" size={24} color="#0F172A" />
                        </TouchableOpacity>
                    </View>
                )}

                {activeTab === 'budgets' && (
                    <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
                        {/* Accounts grid */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionMainTitle}>My Accounts</Text>
                            <TouchableOpacity onPress={() => setIsAcctModalVisible(true)} style={styles.addBtnSmall}>
                                <AntDesign name="plus" size={14} color="#00F3FF" />
                                <Text style={styles.addBtnSmallText}>Add</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.accountsGrid}>
                            {accounts.map((acct) => (
                                <View key={acct.id} style={styles.accountCard}>
                                    <View style={styles.acctHeaderRow}>
                                        <Text style={styles.acctTypeTag}>{acct.type.toUpperCase()}</Text>
                                        <TouchableOpacity onPress={() => handleDeleteAccount(acct.id!)}>
                                            <Feather name="trash-2" size={12} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                    <Text style={styles.acctName}>{acct.acct_name}</Text>
                                    <Text style={styles.acctBank}>{acct.bank_name || "Self Held"}</Text>
                                    <Text style={[
                                        styles.acctBalance,
                                        { color: acct.balance < 0 ? '#EF4444' : '#FFF' }
                                    ]}>
                                        ${acct.balance.toFixed(2)}
                                    </Text>
                                    {acct.type === 'credit' && (
                                        <Text style={styles.creditLimitText}>Limit: ${acct.credit_limit}</Text>
                                    )}
                                </View>
                            ))}
                        </View>

                        {/* Budgets list */}
                        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                            <Text style={styles.sectionMainTitle}>Monthly Budgets</Text>
                            <TouchableOpacity onPress={() => setIsBudgetModalVisible(true)} style={styles.addBtnSmall}>
                                <AntDesign name="plus" size={14} color="#00F3FF" />
                                <Text style={styles.addBtnSmallText}>Set</Text>
                            </TouchableOpacity>
                        </View>

                        {budgets.length === 0 ? (
                            <View style={styles.glassCard}>
                                <Text style={styles.emptyText}>No budgets set. Create budgets to control spending!</Text>
                            </View>
                        ) : (
                            budgets.map((b) => {
                                const ratio = b.amount > 0 ? b.used_amount / b.amount : 0;
                                const percent = Math.round(ratio * 100);
                                const isOver = b.used_amount > b.amount;
                                
                                return (
                                    <View key={b.id} style={styles.glassCard}>
                                        <View style={styles.budgetHeader}>
                                            <View>
                                                <Text style={styles.budgetCatName}>{b.category_name}</Text>
                                                <Text style={styles.budgetCatType}>{b.category_type.toUpperCase()}</Text>
                                            </View>
                                            <View style={{ alignItems: "flex-end" }}>
                                                <Text style={[styles.budgetAmountVal, isOver && { color: "#EF4444" }]}>
                                                    ${b.used_amount.toFixed(0)} / ${b.amount.toFixed(0)}
                                                </Text>
                                                <TouchableOpacity onPress={() => handleDeleteBudget(b.id!)} style={{ marginTop: 4 }}>
                                                    <Feather name="trash-2" size={14} color="#EF4444" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        <View style={styles.progressBarBgLarge}>
                                            <View style={[
                                                styles.progressBarFill,
                                                { 
                                                    width: `${Math.min(100, percent)}%`, 
                                                    backgroundColor: isOver ? '#EF4444' : percent > 85 ? '#EAB308' : '#10B981'
                                                }
                                            ]} />
                                        </View>
                                        <Text style={[styles.budgetStatusText, { color: isOver ? '#EF4444' : '#94A3B8' }]}>
                                            {isOver ? `Over budget by $${(b.used_amount - b.amount).toFixed(0)}!` : `${percent}% used`}
                                        </Text>
                                    </View>
                                );
                            })
                        )}
                        <View style={{ height: 100 }} />
                    </ScrollView>
                )}

                {activeTab === 'bills' && (
                    <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionMainTitle}>Upcoming & Paid Bills</Text>
                            <TouchableOpacity onPress={() => setIsBillModalVisible(true)} style={styles.addBtnSmall}>
                                <AntDesign name="plus" size={14} color="#00F3FF" />
                                <Text style={styles.addBtnSmallText}>New Bill</Text>
                            </TouchableOpacity>
                        </View>

                        {bills.length === 0 ? (
                            <View style={styles.glassCard}>
                                <Text style={styles.emptyText}>No bills found. Add your subscription or utility cycles!</Text>
                            </View>
                        ) : (
                            bills.map((bill) => (
                                <View key={bill.id} style={[styles.glassCard, bill.is_paid === 1 && { opacity: 0.6 }]}>
                                    <View style={styles.billItemRow}>
                                        <View style={styles.billLeft}>
                                            <View style={[
                                                styles.billIconBg,
                                                { backgroundColor: bill.is_paid === 1 ? 'rgba(148, 163, 184, 0.15)' : 'rgba(0, 243, 255, 0.15)' }
                                            ]}>
                                                <Ionicons 
                                                    name={bill.is_paid === 1 ? "checkmark-done" : "calendar-outline"} 
                                                    size={18} 
                                                    color={bill.is_paid === 1 ? "#94A3B8" : "#00F3FF"} 
                                                />
                                            </View>
                                            <View>
                                                <Text style={styles.billName}>{bill.name}</Text>
                                                <Text style={styles.billDueDate}>Due: {bill.due_date}</Text>
                                                {bill.category_name && <Text style={styles.billCatTag}>{bill.category_name}</Text>}
                                            </View>
                                        </View>
                                        <View style={{ alignItems: "flex-end" }}>
                                            <Text style={styles.billAmount}>${bill.amount.toFixed(2)}</Text>
                                            <View style={styles.billActionRow}>
                                                {bill.is_paid === 0 ? (
                                                    <TouchableOpacity 
                                                        onPress={() => confirmPayBill(bill)} 
                                                        style={styles.payBtn}
                                                    >
                                                        <Text style={styles.payBtnText}>Pay Now</Text>
                                                    </TouchableOpacity>
                                                ) : (
                                                    <Text style={styles.paidStatusText}>PAID</Text>
                                                )}
                                                <TouchableOpacity 
                                                    onPress={() => handleDeleteBill(bill.id!)} 
                                                    style={styles.deleteBillBtn}
                                                >
                                                    <Feather name="trash-2" size={14} color="#EF4444" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            ))
                        )}
                        <View style={{ height: 100 }} />
                    </ScrollView>
                )}

                {activeTab === 'goals' && (
                    <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionMainTitle}>Savings Goals</Text>
                            <TouchableOpacity onPress={() => setIsGoalModalVisible(true)} style={styles.addBtnSmall}>
                                <AntDesign name="plus" size={14} color="#00F3FF" />
                                <Text style={styles.addBtnSmallText}>Create Goal</Text>
                            </TouchableOpacity>
                        </View>

                        {goals.length === 0 ? (
                            <View style={styles.glassCard}>
                                <Text style={styles.emptyText}>No goals established. Start a plan to save for travel or assets!</Text>
                            </View>
                        ) : (
                            goals.map((g) => {
                                const target = g.target_amount ?? 1;
                                const ratio = g.current_amount / target;
                                const percent = Math.min(100, Math.round(ratio * 100));
                                
                                return (
                                    <View key={g.id} style={styles.glassCard}>
                                        <View style={styles.budgetHeader}>
                                            <View>
                                                <Text style={styles.goalTitle}>{g.name}</Text>
                                                <Text style={styles.goalTypeTag}>{g.type.toUpperCase()}</Text>
                                            </View>
                                            <View style={{ alignItems: "flex-end" }}>
                                                <Text style={styles.goalAmountVal}>
                                                    ${g.current_amount.toFixed(0)} / ${target.toFixed(0)}
                                                </Text>
                                                <TouchableOpacity onPress={() => handleDeleteGoal(g.id!)} style={{ marginTop: 4 }}>
                                                    <Feather name="trash-2" size={14} color="#EF4444" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        <View style={styles.progressBarBgLarge}>
                                            <View style={[
                                                styles.progressBarFill,
                                                { width: `${percent}%`, backgroundColor: '#00F3FF' }
                                            ]} />
                                        </View>
                                        
                                        <View style={styles.goalFooterRow}>
                                            <Text style={styles.goalPercentText}>{percent}% saved</Text>
                                            <TouchableOpacity 
                                                style={styles.depositBtn}
                                                onPress={() => {
                                                    setSelectedGoal(g);
                                                    setIsDepositModalVisible(true);
                                                }}
                                            >
                                                <AntDesign name="plus" size={10} color="#0F172A" />
                                                <Text style={styles.depositBtnText}>Deposit</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                );
                            })
                        )}
                        
                        {/* Investment tracking bonus visual */}
                        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                            <Text style={styles.sectionMainTitle}>Assets & Investments</Text>
                        </View>
                        <View style={styles.glassCard}>
                            <Text style={styles.investLabel}>Tracked Investments</Text>
                            {investments.length === 0 ? (
                                <Text style={styles.emptyText}>Investments are synced from transaction ledger links.</Text>
                            ) : (
                                investments.map(inv => (
                                    <View key={inv.id} style={styles.investRow}>
                                        <View>
                                            <Text style={styles.investName}>{inv.name}</Text>
                                            <Text style={styles.investType}>{inv.type.toUpperCase()}</Text>
                                        </View>
                                        <View style={{ alignItems: "flex-end" }}>
                                            <Text style={styles.investCurrent}>${inv.current_value.toFixed(2)}</Text>
                                            <Text style={styles.investCost}>Cost: ${inv.invested_amount.toFixed(0)}</Text>
                                        </View>
                                    </View>
                                ))
                            )}
                        </View>
                        <View style={{ height: 100 }} />
                    </ScrollView>
                )}
            </View>

            {/* 3. Bottom Tab Navigator Menu */}
            <View style={styles.tabBar}>
                {[
                    { id: 'dashboard', icon: 'grid', label: 'Dash' },
                    { id: 'ledger', icon: 'receipt', label: 'Ledger' },
                    { id: 'budgets', icon: 'pie-chart', label: 'Budgets' },
                    { id: 'bills', icon: 'calendar', label: 'Bills' },
                    { id: 'goals', icon: 'flag', label: 'Goals' }
                ].map((tab) => (
                    <TouchableOpacity
                        key={tab.id}
                        style={[
                            styles.tabItem,
                            activeTab === tab.id && styles.tabItemActive
                        ]}
                        onPress={() => setActiveTab(tab.id as any)}
                    >
                        <Feather 
                            name={tab.icon as any} 
                            size={20} 
                            color={activeTab === tab.id ? '#00F3FF' : '#94A3B8'} 
                        />
                        <Text style={[
                            styles.tabLabel,
                            activeTab === tab.id && styles.tabLabelActive
                        ]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* ========================================================
                MODAL SCREENS / FORMS FOR USER DATA ENTRY
                ======================================================== */}

            {/* 1. Transaction Form Modal */}
            <Modal visible={isTxnModalVisible} animationType="slide" transparent>
                <View style={styles.modalBg}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add Transaction</Text>
                            <TouchableOpacity onPress={() => setIsTxnModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#FFF" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalForm}>
                            <Text style={styles.inputLabel}>TRANSACTION TYPE</Text>
                            <View style={styles.btnSelectRow}>
                                {['expense', 'income', 'transfer'].map((type) => (
                                    <TouchableOpacity
                                        key={type}
                                        style={[
                                            styles.btnSelect,
                                            txnType === type && { backgroundColor: type === 'income' ? '#10B981' : '#EF4444' }
                                        ]}
                                        onPress={() => setTxnType(type as any)}
                                    >
                                        <Text style={styles.btnSelectText}>{type.toUpperCase()}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.inputLabel}>AMOUNT ($)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="0.00"
                                placeholderTextColor="#94A3B8"
                                keyboardType="decimal-pad"
                                value={txnAmount}
                                onChangeText={setTxnAmount}
                            />

                            <Text style={styles.inputLabel}>ACCOUNT</Text>
                            <View style={styles.pickerContainer}>
                                {accounts.map(acct => (
                                    <TouchableOpacity
                                        key={acct.id}
                                        style={[
                                            styles.pickerOption,
                                            txnAccountId === String(acct.id) && styles.pickerOptionSelected
                                        ]}
                                        onPress={() => setTxnAccountId(String(acct.id))}
                                    >
                                        <Text style={styles.pickerOptionText}>{acct.acct_name} (${acct.balance.toFixed(0)})</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.inputLabel}>CATEGORY</Text>
                            <View style={styles.pickerContainer}>
                                {categories.filter(c => c.type === txnType || txnType === 'transfer').map(cat => (
                                    <TouchableOpacity
                                        key={cat.id}
                                        style={[
                                            styles.pickerOption,
                                            txnCategoryId === String(cat.id) && styles.pickerOptionSelected
                                        ]}
                                        onPress={() => setTxnCategoryId(String(cat.id))}
                                    >
                                        <Text style={styles.pickerOptionText}>{cat.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {txnType === 'expense' && (
                                <>
                                    <Text style={styles.inputLabel}>LABEL (50/30/20 RULE)</Text>
                                    <View style={styles.btnSelectRow}>
                                        {['need', 'want', 'saving'].map((lbl) => (
                                            <TouchableOpacity
                                                key={lbl}
                                                style={[
                                                    styles.btnSelect,
                                                    txnLabel === lbl && { backgroundColor: '#8B5CF6' }
                                                ]}
                                                onPress={() => setTxnLabel(lbl as any)}
                                            >
                                                <Text style={styles.btnSelectText}>{lbl.toUpperCase()}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </>
                            )}

                            <Text style={styles.inputLabel}>NOTE / DETAILS</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Grocery, coffee, utility bill..."
                                placeholderTextColor="#94A3B8"
                                value={txnNote}
                                onChangeText={setTxnNote}
                            />

                            <Text style={styles.inputLabel}>TRANSACTION DATE</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor="#94A3B8"
                                value={txnDate}
                                onChangeText={setTxnDate}
                            />

                            <TouchableOpacity style={styles.submitBtn} onPress={submitTransaction}>
                                <Text style={styles.submitBtnText}>Save Transaction</Text>
                            </TouchableOpacity>
                            <View style={{ height: 40 }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* 2. Account Form Modal */}
            <Modal visible={isAcctModalVisible} animationType="slide" transparent>
                <View style={styles.modalBg}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add Account</Text>
                            <TouchableOpacity onPress={() => setIsAcctModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#FFF" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalForm}>
                            <Text style={styles.inputLabel}>ACCOUNT NAME</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Checking Account, Credit Card, Wallet..."
                                placeholderTextColor="#94A3B8"
                                value={acctName}
                                onChangeText={setAcctName}
                            />

                            <Text style={styles.inputLabel}>BANK OR PROVIDER NAME</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Chase, Wells Fargo, Cash, etc."
                                placeholderTextColor="#94A3B8"
                                value={acctBank}
                                onChangeText={setAcctBank}
                            />

                            <Text style={styles.inputLabel}>ACCOUNT TYPE</Text>
                            <View style={styles.btnSelectRow}>
                                {['debit', 'credit', 'cash', 'wallet'].map((type) => (
                                    <TouchableOpacity
                                        key={type}
                                        style={[
                                            styles.btnSelect,
                                            acctType === type && { backgroundColor: '#00F3FF' }
                                        ]}
                                        onPress={() => setAcctType(type as any)}
                                    >
                                        <Text style={[styles.btnSelectText, acctType === type && { color: '#0F172A' }]}>
                                            {type.toUpperCase()}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.inputLabel}>INITIAL BALANCE ($)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="0.00"
                                placeholderTextColor="#94A3B8"
                                keyboardType="decimal-pad"
                                value={acctBalance}
                                onChangeText={setAcctBalance}
                            />

                            {acctType === 'credit' && (
                                <>
                                    <Text style={styles.inputLabel}>CREDIT LIMIT ($)</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="5000"
                                        placeholderTextColor="#94A3B8"
                                        keyboardType="decimal-pad"
                                        value={acctCreditLimit}
                                        onChangeText={setAcctCreditLimit}
                                    />
                                </>
                            )}

                            <TouchableOpacity style={styles.submitBtn} onPress={submitAccount}>
                                <Text style={styles.submitBtnText}>Create Account</Text>
                            </TouchableOpacity>
                            <View style={{ height: 40 }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* 3. Budget Form Modal */}
            <Modal visible={isBudgetModalVisible} animationType="slide" transparent>
                <View style={styles.modalBg}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Set Category Budget</Text>
                            <TouchableOpacity onPress={() => setIsBudgetModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#FFF" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalForm}>
                            <Text style={styles.inputLabel}>MONTHLY BUDGET LIMIT ($)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="500"
                                placeholderTextColor="#94A3B8"
                                keyboardType="decimal-pad"
                                value={budgetAmount}
                                onChangeText={setBudgetAmount}
                            />

                            <Text style={styles.inputLabel}>EXPENSE CATEGORY</Text>
                            <View style={styles.pickerContainer}>
                                {categories.filter(c => c.type === 'expense').map(cat => (
                                    <TouchableOpacity
                                        key={cat.id}
                                        style={[
                                            styles.pickerOption,
                                            budgetCategoryId === String(cat.id) && styles.pickerOptionSelected
                                        ]}
                                        onPress={() => setBudgetCategoryId(String(cat.id))}
                                    >
                                        <Text style={styles.pickerOptionText}>{cat.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TouchableOpacity style={styles.submitBtn} onPress={submitBudget}>
                                <Text style={styles.submitBtnText}>Enforce Budget</Text>
                            </TouchableOpacity>
                            <View style={{ height: 40 }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* 4. Bill Form Modal */}
            <Modal visible={isBillModalVisible} animationType="slide" transparent>
                <View style={styles.modalBg}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add Subscription/Bill</Text>
                            <TouchableOpacity onPress={() => setIsBillModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#FFF" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalForm}>
                            <Text style={styles.inputLabel}>BILL / VENDOR NAME</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Netflix, Electric Bill, Gym..."
                                placeholderTextColor="#94A3B8"
                                value={billName}
                                onChangeText={setBillName}
                            />

                            <Text style={styles.inputLabel}>BILL DUE AMOUNT ($)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="15.99"
                                placeholderTextColor="#94A3B8"
                                keyboardType="decimal-pad"
                                value={billAmount}
                                onChangeText={setBillAmount}
                            />

                            <Text style={styles.inputLabel}>DUE DATE</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor="#94A3B8"
                                value={billDueDate}
                                onChangeText={setBillDueDate}
                            />

                            <Text style={styles.inputLabel}>CATEGORY LINK</Text>
                            <View style={styles.pickerContainer}>
                                {categories.filter(c => c.type === 'expense').map(cat => (
                                    <TouchableOpacity
                                        key={cat.id}
                                        style={[
                                            styles.pickerOption,
                                            billCategoryId === String(cat.id) && styles.pickerOptionSelected
                                        ]}
                                        onPress={() => setBillCategoryId(String(cat.id))}
                                    >
                                        <Text style={styles.pickerOptionText}>{cat.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TouchableOpacity style={styles.submitBtn} onPress={submitBill}>
                                <Text style={styles.submitBtnText}>Enlist Bill</Text>
                            </TouchableOpacity>
                            <View style={{ height: 40 }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* 5. Savings Goal Modal */}
            <Modal visible={isGoalModalVisible} animationType="slide" transparent>
                <View style={styles.modalBg}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Create Goal</Text>
                            <TouchableOpacity onPress={() => setIsGoalModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#FFF" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalForm}>
                            <Text style={styles.inputLabel}>GOAL TARGET NAME</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Hawaii Trip, New Laptop, Rainy Day..."
                                placeholderTextColor="#94A3B8"
                                value={goalName}
                                onChangeText={setGoalName}
                            />

                            <Text style={styles.inputLabel}>GOAL TYPE</Text>
                            <View style={styles.btnSelectRow}>
                                {['saving', 'goal'].map((type) => (
                                    <TouchableOpacity
                                        key={type}
                                        style={[
                                            styles.btnSelect,
                                            goalType === type && { backgroundColor: '#00F3FF' }
                                        ]}
                                        onPress={() => setGoalType(type as any)}
                                    >
                                        <Text style={[styles.btnSelectText, goalType === type && { color: '#0F172A' }]}>
                                            {type.toUpperCase()}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.inputLabel}>TARGET AMOUNT ($)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="1000"
                                placeholderTextColor="#94A3B8"
                                keyboardType="decimal-pad"
                                value={goalTargetAmount}
                                onChangeText={setGoalTargetAmount}
                            />

                            <Text style={styles.inputLabel}>TARGET DATE (OPTIONAL)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor="#94A3B8"
                                value={goalTargetDate}
                                onChangeText={setGoalTargetDate}
                            />

                            <TouchableOpacity style={styles.submitBtn} onPress={submitGoal}>
                                <Text style={styles.submitBtnText}>Establish Goal</Text>
                            </TouchableOpacity>
                            <View style={{ height: 40 }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* 6. Deposit Modal */}
            <Modal visible={isDepositModalVisible} animationType="slide" transparent>
                <View style={styles.modalBg}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Deposit: {selectedGoal?.name}</Text>
                            <TouchableOpacity onPress={() => setIsDepositModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#FFF" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalForm}>
                            <Text style={styles.inputLabel}>DEPOSIT AMOUNT ($)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="150"
                                placeholderTextColor="#94A3B8"
                                keyboardType="decimal-pad"
                                value={depositAmount}
                                onChangeText={setDepositAmount}
                            />

                            <Text style={styles.inputLabel}>FUNDING ACCOUNT</Text>
                            <View style={styles.pickerContainer}>
                                {accounts.filter(a => a.type !== 'credit').map(acct => (
                                    <TouchableOpacity
                                        key={acct.id}
                                        style={[
                                            styles.pickerOption,
                                            depositAccountId === String(acct.id) && styles.pickerOptionSelected
                                        ]}
                                        onPress={() => setDepositAccountId(String(acct.id))}
                                    >
                                        <Text style={styles.pickerOptionText}>{acct.acct_name} (${acct.balance.toFixed(0)})</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TouchableOpacity style={styles.submitBtn} onPress={submitDeposit}>
                                <Text style={styles.submitBtnText}>Confirm Deposit</Text>
                            </TouchableOpacity>
                            <View style={{ height: 40 }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        backgroundColor: "#0F172A",
        alignItems: "center",
        justifyContent: "center",
    },
    loadingText: {
        color: "#94A3B8",
        marginTop: 16,
        fontSize: 14,
        fontWeight: "600"
    },
    mainContainer: {
        flex: 1,
        backgroundColor: "#0B0F19",
        paddingTop: Platform.OS === 'ios' ? 50 : 20
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 15,
        backgroundColor: "#0B0F19",
    },
    headerTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 15,
        marginTop: 10
    },
    greetingText: {
        color: "#64748B",
        fontSize: 11,
        fontWeight: "bold",
        letterSpacing: 1
    },
    appNameText: {
        color: "#FFF",
        fontSize: 22,
        fontWeight: "900",
        letterSpacing: 0.5
    },
    resetButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(239, 68, 68, 0.08)",
        borderColor: "rgba(239, 68, 68, 0.2)",
        borderWidth: 1,
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 20
    },
    resetText: {
        color: "#EF4444",
        fontSize: 11,
        fontWeight: "bold",
        marginLeft: 4
    },
    netWorthCard: {
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        borderRadius: 20,
        padding: 16,
        borderColor: "rgba(255, 255, 255, 0.08)",
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5
    },
    netWorthLabel: {
        color: "#94A3B8",
        fontSize: 9,
        fontWeight: "bold",
        letterSpacing: 1.5,
        marginBottom: 4
    },
    netWorthValue: {
        color: "#FFF",
        fontSize: 26,
        fontWeight: "900",
    },
    assetsDebtsContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 10,
        borderTopWidth: 1,
        borderTopColor: "rgba(255, 255, 255, 0.05)",
        paddingTop: 8
    },
    metricItem: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1
    },
    metricLabel: {
        color: "#64748B",
        fontSize: 10,
        marginLeft: 2
    },
    metricValue: {
        fontSize: 11,
        fontWeight: "bold"
    },
    divider: {
        width: 1,
        height: 12,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        marginHorizontal: 10
    },
    contentContainer: {
        flex: 1,
        backgroundColor: "#0B0F19"
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 20
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 16
    },
    flowCard: {
        width: "48%",
        backgroundColor: "rgba(15, 23, 42, 0.5)",
        borderRadius: 14,
        padding: 12,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.05)",
        borderLeftWidth: 4
    },
    flowLabel: {
        color: "#64748B",
        fontSize: 8,
        fontWeight: "bold",
        letterSpacing: 0.8,
        marginBottom: 4
    },
    flowValue: {
        fontSize: 14,
        fontWeight: "bold"
    },
    glassCard: {
        backgroundColor: "rgba(15, 23, 42, 0.5)",
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.06)",
        marginBottom: 16
    },
    glassCardNoMargin: {
        backgroundColor: "rgba(15, 23, 42, 0.5)",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.06)",
        marginBottom: 8,
        marginHorizontal: 20
    },
    sectionTitle: {
        color: "#FFF",
        fontSize: 13,
        fontWeight: "bold",
        marginBottom: 12
    },
    cardHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
    },
    viewAllText: {
        color: "#00F3FF",
        fontSize: 11,
        fontWeight: "bold"
    },
    emptyText: {
        color: "#64748B",
        fontSize: 11,
        textAlign: "center",
        paddingVertical: 15
    },
    txnItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255, 255, 255, 0.03)"
    },
    txnItemLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1
    },
    txnIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10
    },
    txnNote: {
        color: "#FFF",
        fontSize: 13,
        fontWeight: "bold"
    },
    txnMeta: {
        color: "#64748B",
        fontSize: 10,
        marginTop: 2
    },
    txnAmount: {
        fontSize: 13,
        fontWeight: "bold"
    },
    actionsPanel: {
        flexDirection: "row",
        justifyContent: "space-around",
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        borderRadius: 16,
        paddingVertical: 14,
        borderColor: "rgba(255, 255, 255, 0.05)",
        borderWidth: 1
    },
    actionBtn: {
        alignItems: "center"
    },
    actionBtnText: {
        color: "#FFF",
        fontSize: 10,
        fontWeight: "bold",
        marginTop: 6
    },
    tabBar: {
        flexDirection: "row",
        justifyContent: "space-around",
        backgroundColor: "#0F172A",
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: "rgba(255, 255, 255, 0.08)",
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0
    },
    tabItem: {
        alignItems: "center",
        flex: 1
    },
    tabItemActive: {
        transform: [{ scale: 1.05 }]
    },
    tabLabel: {
        color: "#94A3B8",
        fontSize: 9,
        fontWeight: "600",
        marginTop: 4
    },
    tabLabelActive: {
        color: "#00F3FF",
        fontWeight: "bold"
    },
    tabContentContainer: {
        flex: 1,
        backgroundColor: "#0B0F19"
    },
    filterSection: {
        paddingHorizontal: 20,
        paddingBottom: 15,
        backgroundColor: "#0B0F19"
    },
    searchInput: {
        backgroundColor: "rgba(15, 23, 42, 0.7)",
        borderColor: "rgba(255, 255, 255, 0.08)",
        borderWidth: 1,
        color: "#FFF",
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 12,
        fontSize: 12,
        marginBottom: 10
    },
    badgeRow: {
        flexDirection: "row",
        justifyContent: "space-between"
    },
    badgeBtn: {
        backgroundColor: "rgba(15, 23, 42, 0.4)",
        borderColor: "rgba(255, 255, 255, 0.05)",
        borderWidth: 1,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        flex: 1,
        marginHorizontal: 3,
        alignItems: "center"
    },
    badgeBtnActive: {
        backgroundColor: "#00F3FF",
        borderColor: "#00F3FF"
    },
    badgeText: {
        color: "#94A3B8",
        fontSize: 8,
        fontWeight: "bold"
    },
    badgeTextActive: {
        color: "#0F172A"
    },
    deleteTxnBtn: {
        padding: 4,
        marginTop: 4
    },
    fab: {
        position: "absolute",
        bottom: 85,
        right: 20,
        backgroundColor: "#00F3FF",
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#00F3FF",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 15,
        paddingHorizontal: 20
    },
    sectionMainTitle: {
        color: "#FFF",
        fontSize: 15,
        fontWeight: "bold"
    },
    addBtnSmall: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(0, 243, 255, 0.08)",
        borderColor: "rgba(0, 243, 255, 0.2)",
        borderWidth: 1,
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 12
    },
    addBtnSmallText: {
        color: "#00F3FF",
        fontSize: 10,
        fontWeight: "bold",
        marginLeft: 3
    },
    accountsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        paddingHorizontal: 20
    },
    accountCard: {
        width: "48%",
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        borderColor: "rgba(255, 255, 255, 0.08)",
        borderWidth: 1,
        borderRadius: 16,
        padding: 12,
        marginBottom: 12
    },
    acctHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8
    },
    acctTypeTag: {
        color: "#00F3FF",
        fontSize: 8,
        fontWeight: "bold",
        backgroundColor: "rgba(0, 243, 255, 0.08)",
        paddingVertical: 1,
        paddingHorizontal: 5,
        borderRadius: 4
    },
    acctName: {
        color: "#FFF",
        fontSize: 12,
        fontWeight: "bold"
    },
    acctBank: {
        color: "#64748B",
        fontSize: 9,
        marginTop: 2,
        marginBottom: 8
    },
    acctBalance: {
        fontSize: 15,
        fontWeight: "900"
    },
    creditLimitText: {
        color: "#64748B",
        fontSize: 8,
        marginTop: 2
    },
    budgetHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8
    },
    budgetCatName: {
        color: "#FFF",
        fontSize: 13,
        fontWeight: "bold"
    },
    budgetCatType: {
        color: "#8B5CF6",
        fontSize: 8,
        fontWeight: "bold"
    },
    budgetAmountVal: {
        color: "#FFF",
        fontSize: 12,
        fontWeight: "bold"
    },
    progressBarBg: {
        height: 6,
        backgroundColor: "rgba(255, 255, 255, 0.08)",
        borderRadius: 3,
        marginTop: 8
    },
    progressBarBgLarge: {
        height: 10,
        backgroundColor: "rgba(255, 255, 255, 0.08)",
        borderRadius: 5,
        marginTop: 6,
        marginBottom: 6
    },
    progressBarFill: {
        height: "100%",
        borderRadius: 5
    },
    budgetStatusText: {
        fontSize: 10,
        fontWeight: "bold",
        marginTop: 2
    },
    billItemRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
    },
    billLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1
    },
    billIconBg: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10
    },
    billName: {
        color: "#FFF",
        fontSize: 13,
        fontWeight: "bold"
    },
    billDueDate: {
        color: "#EF4444",
        fontSize: 10,
        marginTop: 2
    },
    billCatTag: {
        color: "#94A3B8",
        fontSize: 8,
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        paddingVertical: 1,
        paddingHorizontal: 4,
        borderRadius: 4,
        marginTop: 4,
        alignSelf: "flex-start"
    },
    billAmount: {
        color: "#FFF",
        fontSize: 14,
        fontWeight: "bold"
    },
    billActionRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 6
    },
    payBtn: {
        backgroundColor: "#00F3FF",
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 12,
        marginRight: 8
    },
    payBtnText: {
        color: "#0F172A",
        fontSize: 9,
        fontWeight: "bold"
    },
    paidStatusText: {
        color: "#10B981",
        fontSize: 10,
        fontWeight: "bold",
        marginRight: 8
    },
    deleteBillBtn: {
        padding: 4
    },
    goalTitle: {
        color: "#FFF",
        fontSize: 13,
        fontWeight: "bold"
    },
    goalTypeTag: {
        color: "#00F3FF",
        fontSize: 8,
        fontWeight: "bold"
    },
    goalAmountVal: {
        color: "#FFF",
        fontSize: 12,
        fontWeight: "bold"
    },
    goalFooterRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 6
    },
    goalPercentText: {
        color: "#94A3B8",
        fontSize: 9,
        fontWeight: "bold"
    },
    depositBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#00F3FF",
        paddingVertical: 3,
        paddingHorizontal: 10,
        borderRadius: 10
    },
    depositBtnText: {
        color: "#0F172A",
        fontSize: 8,
        fontWeight: "bold",
        marginLeft: 3
    },
    investLabel: {
        color: "#64748B",
        fontSize: 9,
        fontWeight: "bold",
        letterSpacing: 0.5,
        marginBottom: 8
    },
    investRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255, 255, 255, 0.02)"
    },
    investName: {
        color: "#FFF",
        fontSize: 12,
        fontWeight: "bold"
    },
    investType: {
        color: "#8B5CF6",
        fontSize: 8,
        fontWeight: "bold"
    },
    investCurrent: {
        color: "#10B981",
        fontSize: 12,
        fontWeight: "bold"
    },
    investCost: {
        color: "#64748B",
        fontSize: 9
    },
    budgetProgressRow: {
        flexDirection: "row",
        alignItems: "center"
    },
    budgetPercentCircle: {
        width: 54,
        height: 54,
        borderRadius: 27,
        borderWidth: 3,
        borderColor: "#8B5CF6",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 15
    },
    budgetPercentText: {
        color: "#FFF",
        fontSize: 11,
        fontWeight: "900"
    },
    budgetPercentSub: {
        color: "#64748B",
        fontSize: 7,
        fontWeight: "bold"
    },
    budgetProgressDetails: {
        flex: 1
    },
    budgetProgressLabel: {
        color: "#FFF",
        fontSize: 12,
        fontWeight: "bold"
    },
    budgetProgressVals: {
        color: "#64748B",
        fontSize: 9,
        marginTop: 2
    },
    linkTag: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(0, 243, 255, 0.08)",
        alignSelf: "flex-start",
        paddingVertical: 1,
        paddingHorizontal: 4,
        borderRadius: 4,
        marginTop: 4
    },
    linkTagText: {
        color: "#00F3FF",
        fontSize: 7,
        fontWeight: "bold",
        marginLeft: 3
    },

    // Modal forms layout styles
    modalBg: {
        flex: 1,
        backgroundColor: "rgba(11, 15, 25, 0.8)",
        justifyContent: "flex-end"
    },
    modalContent: {
        backgroundColor: "#0B0F19",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 16,
        paddingHorizontal: 20,
        maxHeight: "85%",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        borderBottomWidth: 0
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255, 255, 255, 0.05)"
    },
    modalTitle: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "bold"
    },
    modalForm: {
        paddingTop: 15
    },
    inputLabel: {
        color: "#94A3B8",
        fontSize: 9,
        fontWeight: "bold",
        letterSpacing: 1,
        marginBottom: 6,
        marginTop: 12
    },
    input: {
        backgroundColor: "rgba(15, 23, 42, 0.7)",
        borderColor: "rgba(255, 255, 255, 0.08)",
        borderWidth: 1,
        color: "#FFF",
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 12,
        fontSize: 13
    },
    btnSelectRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginVertical: 4
    },
    btnSelect: {
        backgroundColor: "rgba(15, 23, 42, 0.5)",
        borderColor: "rgba(255, 255, 255, 0.08)",
        borderWidth: 1,
        paddingVertical: 8,
        borderRadius: 10,
        flex: 1,
        marginHorizontal: 3,
        alignItems: "center"
    },
    btnSelectText: {
        color: "#FFF",
        fontSize: 10,
        fontWeight: "bold"
    },
    pickerContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginVertical: 4
    },
    pickerOption: {
        backgroundColor: "rgba(15, 23, 42, 0.4)",
        borderColor: "rgba(255, 255, 255, 0.05)",
        borderWidth: 1,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 10,
        marginRight: 6,
        marginBottom: 6
    },
    pickerOptionSelected: {
        backgroundColor: "#00F3FF",
        borderColor: "#00F3FF"
    },
    pickerOptionText: {
        color: "#FFF",
        fontSize: 10,
        fontWeight: "600"
    },
    submitBtn: {
        backgroundColor: "#00F3FF",
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: "center",
        marginTop: 20,
        marginBottom: 20
    },
    submitBtnText: {
        color: "#0F172A",
        fontSize: 13,
        fontWeight: "bold"
    }
});
