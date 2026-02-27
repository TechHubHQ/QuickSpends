import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    FlatList,
    Modal,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Toast from 'react-native-toast-message';
import { QSHeader } from '../components/QSHeader';
import { useAlert } from '../context/AlertContext';
import { useAuth } from '../context/AuthContext';
import { useCategories } from '../hooks/useCategories';
import { RecurringConfig, useRecurringConfigs } from '../hooks/useRecurringConfigs';
import { useTransactions } from '../hooks/useTransactions';
import { Theme } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { getNextDueDate } from '../utils/dateUtils';

const QSRecurringTransactionsScreen = () => {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const router = useRouter();
    const { user } = useAuth();
    const { getRecurringConfigs, deleteRecurringConfig, updateRecurringConfig, loading } = useRecurringConfigs();
    const { addTransaction } = useTransactions();
    const { getCategories } = useCategories();
    const { showAlert } = useAlert();

    const [configs, setConfigs] = useState<RecurringConfig[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Edit Modal State
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [selectedConfig, setSelectedConfig] = useState<RecurringConfig | null>(null);
    const [editAmount, setEditAmount] = useState('');
    const [editName, setEditName] = useState('');
    const [editFrequency, setEditFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
    const [editInterval, setEditInterval] = useState('1');
    const [isActive, setIsActive] = useState(true); // For pausing/resuming if we support it, otherwise just delete.

    useEffect(() => {
        if (user) {
            fetchConfigs();
        }
    }, [user]);

    const fetchConfigs = async () => {
        if (!user) return;
        setRefreshing(true);
        const data = await getRecurringConfigs(user.id);
        setConfigs(data);
        setRefreshing(false);
    };

    const handleEdit = (config: RecurringConfig) => {
        setSelectedConfig(config);
        setEditName(config.name);
        setEditAmount(config.amount.toString());
        setEditFrequency(config.frequency);
        setEditInterval(config.interval?.toString() || '1');
        setEditModalVisible(true);
    };

    const handleDelete = (id: string) => {
        showAlert(
            "Stop Recurring Transaction?",
            "This will stop future transactions from being created. Past transactions will remain.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Stop & Delete",
                    style: "destructive",
                    onPress: async () => {
                        const success = await deleteRecurringConfig(id);
                        if (success) {
                            Toast.show({
                                type: 'success',
                                text1: 'Stopped',
                                text2: 'Recurring transaction has been stopped.'
                            });
                            fetchConfigs();
                        } else {
                            Toast.show({
                                type: 'error',
                                text1: 'Error',
                                text2: 'Failed to stop recurring transaction.'
                            });
                        }
                    }
                }
            ]
        );
    };

    const handleSaveEdit = async () => {
        if (!selectedConfig) return;

        setActionLoading(true);
        const success = await updateRecurringConfig(selectedConfig.id, {
            name: editName,
            amount: parseFloat(editAmount),
            frequency: editFrequency,
            interval: parseInt(editInterval) || 1
        });
        setActionLoading(false);

        if (success) {
            Toast.show({
                type: 'success',
                text1: 'Updated',
                text2: 'Recurring transaction updated successfully.'
            });
            setEditModalVisible(false);
            fetchConfigs();
        } else {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to update.'
            });
        }
    };

    const handlePayEarly = async () => {
        if (!selectedConfig || !user) return;

        setActionLoading(true);
        try {
            const lastExecuted = new Date(selectedConfig.last_executed || selectedConfig.start_date);
            const nextDueDate = getNextDueDate(lastExecuted, selectedConfig.frequency, selectedConfig.interval || 1);

            // Create the transaction
            const transactionId = await addTransaction({
                user_id: user.id,
                account_id: selectedConfig.account_id,
                category_id: selectedConfig.category_id || undefined,
                name: selectedConfig.name,
                description: "Manually processed recurring transaction early",
                amount: selectedConfig.amount,
                type: selectedConfig.type === 'income' ? 'income' : 'expense',
                date: new Date().toISOString(),
                recurring_id: selectedConfig.id,
            });

            if (transactionId) {
                // Update the config's last_executed and execution_count
                const currentCount = selectedConfig.execution_count || 0;
                await updateRecurringConfig(selectedConfig.id, {
                    last_executed: nextDueDate.toISOString(),
                    execution_count: currentCount + 1
                });

                Toast.show({
                    type: 'success',
                    text1: 'Processed Early',
                    text2: 'Transaction created and next due date advanced.'
                });
                setEditModalVisible(false);
                fetchConfigs();
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Failed to create transaction.'
                });
            }
        } catch (error) {
            console.error('Error paying early:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'An unexpected error occurred.'
            });
        } finally {
            setActionLoading(false);
        }
    };

    const renderItem = ({ item }: { item: RecurringConfig }) => {
        const nextDate = new Date(item.last_executed || item.start_date);
        const isIncome = item.type === 'income';
        const amountSign = isIncome ? '+' : '-';
        const amountColor = isIncome ? theme.colors.success : theme.colors.error;

        // Note: The hook logic updates last_executed to the recently created txn date.
        // So next due date is calculated from last_executed.
        const displayNextDate = getNextDueDate(new Date(item.last_executed || item.start_date), item.frequency, item.interval);

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => handleEdit(item)}
            >
                <View style={[styles.iconContainer, { backgroundColor: item.category?.color ? item.category.color + '20' : theme.colors.backgroundSecondary }]}>
                    <MaterialCommunityIcons
                        name={(item.category?.icon as any) || "repeat"}
                        size={24}
                        color={item.category?.color || theme.colors.text}
                    />
                </View>
                <View style={styles.cardContent}>
                    <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
                    <Text style={styles.cardSubtitle} numberOfLines={1} ellipsizeMode="tail">
                        {item.category?.name || 'Uncategorized'} • {item.account?.name}
                    </Text>
                    <View style={styles.frequencyBadge}>
                        <MaterialCommunityIcons name="update" size={12} color={theme.colors.textSecondary} />
                        <Text style={styles.frequencyText}>
                            Every {item.interval && item.interval > 1 ? `${item.interval} ` : ''}
                            {item.frequency}{item.interval && item.interval > 1 ? 's' : ''}
                        </Text>
                    </View>
                </View>
                <View style={styles.cardRight}>
                    <Text style={[styles.amount, { color: amountColor }]}>
                        {amountSign}₹{item.amount.toFixed(2)}
                    </Text>
                    <Text style={styles.nextDate}>
                        Next: {displayNextDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <QSHeader title="Recurring Transactions" showBack onBackPress={() => router.back()} />

            <FlatList
                data={configs}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={fetchConfigs} tintColor={theme.colors.primary} />
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="calendar-refresh" size={64} color={theme.colors.border} />
                            <Text style={styles.emptyText}>No recurring transactions active</Text>
                            <Text style={styles.emptySubText}>Set one up when adding a new transaction!</Text>
                        </View>
                    ) : null
                }
            />

            {/* Edit Modal */}
            <Modal
                transparent
                visible={editModalVisible}
                animationType="slide"
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Recurring</Text>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                <MaterialCommunityIcons name="close" size={24} color={theme.colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>Name</Text>
                        <TextInput
                            style={styles.input}
                            value={editName}
                            onChangeText={setEditName}
                        />

                        <Text style={styles.inputLabel}>Amount</Text>
                        <TextInput
                            style={styles.input}
                            value={editAmount}
                            onChangeText={setEditAmount}
                            keyboardType="decimal-pad"
                        />

                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                                <Text style={styles.inputLabel}>Frequency</Text>
                                <View style={styles.pickerContainer}>
                                    {(['daily', 'weekly', 'monthly', 'yearly'] as const).map(f => (
                                        <TouchableOpacity
                                            key={f}
                                            style={[
                                                styles.freqOption,
                                                editFrequency === f && styles.freqOptionSelected
                                            ]}
                                            onPress={() => setEditFrequency(f)}
                                        >
                                            <Text style={[
                                                styles.freqText,
                                                editFrequency === f && styles.freqTextSelected
                                            ]}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.inputLabel}>Interval (e.g. every 2 months)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editInterval}
                                    onChangeText={setEditInterval}
                                    keyboardType="number-pad"
                                />
                            </View>
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.earlyPayButton]}
                                onPress={handlePayEarly}
                                disabled={actionLoading}
                            >
                                <MaterialCommunityIcons name="calendar-check" size={20} color={theme.colors.onPrimary} style={{ marginRight: 4 }} />
                                <Text style={styles.saveText}>Process Now</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.deleteButton]}
                                onPress={() => {
                                    setEditModalVisible(false);
                                    if (selectedConfig) handleDelete(selectedConfig.id);
                                }}
                                disabled={actionLoading}
                            >
                                <Text style={styles.deleteButtonText}>Stop Recurring</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={handleSaveEdit}
                                disabled={actionLoading}
                            >
                                <Text style={styles.saveText}>Save Changes</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    listContent: {
        padding: theme.spacing.m,
        paddingBottom: 100,
    },
    card: {
        flexDirection: 'row',
        padding: theme.spacing.m,
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.m,
        marginBottom: theme.spacing.m,
        alignItems: 'center',
        ...theme.shadows.small,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.m,
    },
    cardContent: {
        flex: 1,
        marginRight: 8, // Add spacing before the right side amount
    },
    cardTitle: {
        ...theme.typography.body,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 4,
    },
    cardSubtitle: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
        marginBottom: 4,
    },
    frequencyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    frequencyText: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
    },
    cardRight: {
        alignItems: 'flex-end',
    },
    amount: {
        ...theme.typography.body,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    nextDate: {
        ...theme.typography.caption,
        color: theme.colors.textTertiary,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
    },
    emptyText: {
        ...theme.typography.h3,
        color: theme.colors.text,
        marginTop: theme.spacing.m,
    },
    emptySubText: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.s,
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: theme.colors.overlay,
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: theme.colors.card,
        borderTopLeftRadius: theme.borderRadius.l,
        borderTopRightRadius: theme.borderRadius.l,
        padding: theme.spacing.l,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.l,
    },
    modalTitle: {
        ...theme.typography.h3,
        color: theme.colors.text,
    },
    inputLabel: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.s,
        marginTop: theme.spacing.m,
    },
    input: {
        backgroundColor: theme.colors.background,
        padding: theme.spacing.m,
        borderRadius: theme.borderRadius.m,
        color: theme.colors.text,
        fontSize: 16,
    },
    row: {
        flexDirection: 'row',
    },
    pickerContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    freqOption: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: theme.borderRadius.s,
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    freqOptionSelected: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    freqText: {
        ...theme.typography.caption,
        color: theme.colors.text,
    },
    freqTextSelected: {
        color: theme.colors.onPrimary,
    },
    modalActions: {
        flexDirection: 'row',
        marginTop: theme.spacing.xl,
        gap: theme.spacing.m,
    },
    modalButton: {
        flex: 1,
        padding: theme.spacing.m,
        borderRadius: theme.borderRadius.m,
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteButton: {
        backgroundColor: theme.colors.backgroundSecondary,
        borderWidth: 1,
        borderColor: theme.colors.error,
    },
    deleteButtonText: {
        ...theme.typography.button,
        color: theme.colors.error,
    },
    earlyPayButton: {
        backgroundColor: theme.colors.success,
        flexDirection: 'row',
    },
    saveButton: {
        backgroundColor: theme.colors.primary,
    },
    saveText: {
        ...theme.typography.button,
        color: theme.colors.onPrimary,
    },
});

export default QSRecurringTransactionsScreen;
