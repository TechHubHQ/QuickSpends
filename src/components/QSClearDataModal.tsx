import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Theme } from '../theme/theme';

interface QSClearDataModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: (selections: any) => Promise<void>;
    theme: Theme;
    loading?: boolean;
}

export const QSClearDataModal: React.FC<QSClearDataModalProps> = ({
    visible,
    onClose,
    onConfirm,
    theme,
    loading = false
}) => {
    const [selections, setSelections] = useState({
        transactions: false,
        accounts: false,
        budgets: false,
        savings: false,
        loans: false,
        trips: false,
        groups: false,
        preferences: false,
    });

    const [showConfirmation, setShowConfirmation] = useState(false);

    const options = [
        { id: 'transactions', label: 'Transactions', icon: 'swap-horizontal' },
        { id: 'accounts', label: 'Accounts', icon: 'wallet' },
        { id: 'budgets', label: 'Budgets', icon: 'chart-arc' },
        { id: 'savings', label: 'Savings Goals', icon: 'piggy-bank' },
        { id: 'loans', label: 'Loans & Debt', icon: 'handshake' },
        { id: 'trips', label: 'Trips', icon: 'airplane' },
        { id: 'groups', label: 'Groups', icon: 'account-group' },
        { id: 'preferences', label: 'User Preferences', icon: 'cog' },
    ];

    const toggleSelection = (id: string) => {
        setSelections(prev => ({
            ...prev,
            [id]: !prev[id as keyof typeof prev]
        }));
    };

    const selectAll = () => {
        const newSelections = { ...selections };
        Object.keys(newSelections).forEach(key => {
            newSelections[key as keyof typeof selections] = true;
        });
        setSelections(newSelections);
    };

    const resetSelections = () => {
        const newSelections = { ...selections };
        Object.keys(newSelections).forEach(key => {
            newSelections[key as keyof typeof selections] = false;
        });
        setSelections(newSelections);
    };

    const handleClearRequest = () => {
        const hasSelection = Object.values(selections).some(v => v);
        if (!hasSelection) return;
        setShowConfirmation(true);
    };

    const handleConfirm = async () => {
        await onConfirm(selections);
        setShowConfirmation(false);
        onClose();
        // Reset selections
        setSelections({
            transactions: false,
            accounts: false,
            budgets: false,
            savings: false,
            loans: false,
            trips: false,
            groups: false,
            preferences: false,
        });
    };

    const isDark = theme.isDark;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: theme.colors.modal }]}>
                    {!showConfirmation ? (
                        <>
                            <View style={styles.header}>
                                <Text style={[styles.title, { color: theme.colors.text }]}>Clear Data</Text>
                                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                    <MaterialCommunityIcons name="close" size={24} color={theme.colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                                Select the data you want to permanently delete.
                            </Text>

                            <View style={styles.bulkActions}>
                                <TouchableOpacity onPress={selectAll} style={styles.bulkActionButton}>
                                    <Text style={[styles.bulkActionText, { color: theme.colors.primary }]}>Select All</Text>
                                </TouchableOpacity>
                                <View style={[styles.bulkSeparator, { backgroundColor: theme.colors.border }]} />
                                <TouchableOpacity onPress={resetSelections} style={styles.bulkActionButton}>
                                    <Text style={[styles.bulkActionText, { color: theme.colors.textSecondary }]}>Reset</Text>
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
                                {options.map((opt) => (
                                    <TouchableOpacity
                                        key={opt.id}
                                        style={[
                                            styles.optionItem,
                                            { borderBottomColor: theme.colors.border }
                                        ]}
                                        onPress={() => toggleSelection(opt.id)}
                                    >
                                        <View style={styles.optionLeft}>
                                            <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                                                <MaterialCommunityIcons name={opt.icon as any} size={20} color={theme.colors.primary} />
                                            </View>
                                            <Text style={[styles.optionLabel, { color: theme.colors.text }]}>{opt.label}</Text>
                                        </View>
                                        <MaterialCommunityIcons
                                            name={selections[opt.id as keyof typeof selections] ? "checkbox-marked" : "checkbox-blank-outline"}
                                            size={24}
                                            color={selections[opt.id as keyof typeof selections] ? theme.colors.primary : theme.colors.textTertiary}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <View style={styles.footer}>
                                <TouchableOpacity
                                    style={[styles.button, styles.cancelButton, { backgroundColor: theme.colors.backgroundSecondary }]}
                                    onPress={onClose}
                                >
                                    <Text style={[styles.buttonText, { color: theme.colors.text }]}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.button,
                                        styles.clearButton,
                                        {
                                            backgroundColor: Object.values(selections).some(v => v) ? theme.colors.error : theme.colors.border,
                                            opacity: Object.values(selections).some(v => v) ? 1 : 0.5
                                        }
                                    ]}
                                    onPress={handleClearRequest}
                                    disabled={!Object.values(selections).some(v => v)}
                                >
                                    <Text style={[styles.buttonText, { color: '#FFF' }]}>Clear Selected</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    ) : (
                        <View style={styles.confirmContainer}>
                            <View style={[styles.warningIcon, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                                <MaterialCommunityIcons name="alert" size={40} color="#EF4444" />
                            </View>
                            <Text style={[styles.title, { color: theme.colors.text, textAlign: 'center' }]}>Are you absolutely sure?</Text>
                            <Text style={[styles.subtitle, { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 12 }]}>
                                This action is permanent and cannot be undone. All selected data will be deleted from your account.
                            </Text>

                            <View style={[styles.footer, { marginTop: 24 }]}>
                                <TouchableOpacity
                                    style={[styles.button, styles.cancelButton, { backgroundColor: theme.colors.backgroundSecondary }]}
                                    onPress={() => setShowConfirmation(false)}
                                    disabled={loading}
                                >
                                    <Text style={[styles.buttonText, { color: theme.colors.text }]}>No, Go Back</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.button, styles.deleteButton, { backgroundColor: '#EF4444' }]}
                                    onPress={handleConfirm}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#FFF" size="small" />
                                    ) : (
                                        <Text style={[styles.buttonText, { color: '#FFF' }]}>Yes, Delete Data</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    container: {
        width: '100%',
        maxHeight: '80%',
        borderRadius: 24,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    closeButton: {
        padding: 4,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
    },
    subtitle: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 20,
    },
    optionsList: {
        marginBottom: 24,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    optionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionLabel: {
        fontSize: 15,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 14,
        fontWeight: '700',
    },
    cancelButton: {},
    clearButton: {},
    confirmContainer: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    warningIcon: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    deleteButton: {},
    bulkActions: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    bulkActionButton: {
        paddingVertical: 4,
    },
    bulkActionText: {
        fontSize: 13,
        fontWeight: '700',
    },
    bulkSeparator: {
        width: 1,
        height: 12,
    },
});
