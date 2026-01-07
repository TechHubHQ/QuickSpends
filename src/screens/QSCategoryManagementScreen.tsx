import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { AlertButton, QSAlertModal } from '../components/QSAlertModal';
import { QSCreateCategorySheet } from '../components/QSCreateCategorySheet';
import { QSHeader } from '../components/QSHeader';
import { Category, useCategories } from '../hooks/useCategories';
import { useTheme } from '../theme/ThemeContext';
import { Theme } from '../theme/theme';

interface CategoryWithChildren extends Category {
    children?: Category[];
}

const QSCategoryManagementScreen = () => {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const router = useRouter();
    const { getCategories, deleteCategory, addCategory, loading } = useCategories();

    const [expenseCategories, setExpenseCategories] = useState<CategoryWithChildren[]>([]);
    const [incomeCategories, setIncomeCategories] = useState<CategoryWithChildren[]>([]);
    const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');

    // Add Category Sheet State
    const [isSheetVisible, setIsSheetVisible] = useState(false);

    // Sub-category state
    const [selectedParentId, setSelectedParentId] = useState<string | undefined>(undefined);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        title: string;
        message?: string;
        buttons?: AlertButton[];
    }>({
        visible: false,
        title: "",
    });

    const showAlert = (title: string, message?: string, buttons?: AlertButton[]) => {
        setAlertConfig({ visible: true, title, message, buttons });
    };

    const hideAlert = () => {
        setAlertConfig((prev) => ({ ...prev, visible: false }));
    };

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const allCats = await getCategories();

        const organize = (type: 'expense' | 'income') => {
            const typeCats = allCats.filter(c => c.type === type);
            const parents = typeCats.filter(c => !c.parent_id);
            const children = typeCats.filter(c => c.parent_id);

            return parents.map(p => ({
                ...p,
                children: children.filter(c => c.parent_id === p.id)
            })) as CategoryWithChildren[];
        };

        setExpenseCategories(organize('expense'));
        setIncomeCategories(organize('income'));
    };

    const toggleExpand = (id: string) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedCategories(newExpanded);
    };

    const handleDelete = async (category: Category) => {
        if (category.is_default) {
            showAlert('Cannot Delete', 'Default categories cannot be deleted.');
            return;
        }

        showAlert(
            'Delete Category',
            `Are you sure you want to delete "${category.name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteCategory(category.id);
                            loadData();
                        } catch (error: any) {
                            setTimeout(() => showAlert('Error', error.message), 400);
                        }
                    }
                }
            ]
        );
    };

    const openAddSheet = (parentId?: string) => {
        setSelectedParentId(parentId);
        setIsSheetVisible(true);
    };

    const handleAddCategory = async (name: string, icon: string, color: string) => {
        try {
            await addCategory(
                name.trim(),
                icon,
                color,
                activeTab,
                selectedParentId
            );

            // If adding a child, ensure parent is expanded
            if (selectedParentId) {
                const newExpanded = new Set(expandedCategories);
                newExpanded.add(selectedParentId);
                setExpandedCategories(newExpanded);
            }

            setIsSheetVisible(false);
            loadData();
        } catch (error: any) {
            showAlert('Error', error.message);
        }
    };

    const renderCategoryItem = (item: CategoryWithChildren, isChild = false) => {
        const hasChildren = item.children && item.children.length > 0;
        const isExpanded = expandedCategories.has(item.id);

        return (
            <View key={item.id}>
                <View style={[
                    styles.itemContainer,
                    isChild && styles.childItemContainer,
                    isChild && { borderLeftColor: item.color, borderLeftWidth: 4 }
                ]}>
                    <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                        <MaterialCommunityIcons name={item.icon as any} size={isChild ? 20 : 24} color={item.color} />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={[styles.itemName, isChild && styles.childItemName]}>{item.name}</Text>
                        {!!item.is_default && (
                            <View style={styles.defaultBadge}>
                                <Text style={styles.defaultText}>Default</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.actionsContainer}>
                        {!isChild && (
                            <TouchableOpacity onPress={() => openAddSheet(item.id)} style={styles.actionButton}>
                                <MaterialCommunityIcons name="plus-circle-outline" size={24} color={theme.colors.primary} />
                            </TouchableOpacity>
                        )}

                        {!item.is_default && (
                            <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionButton}>
                                <MaterialCommunityIcons name="delete-outline" size={24} color={theme.colors.error} />
                            </TouchableOpacity>
                        )}
                        {!!item.is_default && (
                            <MaterialCommunityIcons name="lock-outline" size={20} color={theme.colors.textTertiary} style={{ marginRight: 8 }} />
                        )}

                        {!isChild && hasChildren && (
                            <TouchableOpacity onPress={() => toggleExpand(item.id)} style={styles.actionButton}>
                                <MaterialCommunityIcons
                                    name={isExpanded ? "chevron-up" : "chevron-down"}
                                    size={24}
                                    color={theme.colors.textSecondary}
                                />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {isExpanded && !isChild && item.children && (
                    <View style={styles.childrenContainer}>
                        {item.children.map(child => renderCategoryItem(child, true))}
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {loading && expenseCategories.length === 0 ? (
                <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
                    <QSHeader title="Manage Categories" showBack onBackPress={() => router.back()} />
                    <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 20 }} />
                </View>
            ) : (
                <FlatList
                    data={activeTab === 'expense' ? expenseCategories : incomeCategories}
                    renderItem={({ item }) => renderCategoryItem(item)}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    ListHeaderComponent={
                        <View>
                            <QSHeader title="Manage Categories" showBack onBackPress={() => router.back()} />
                            <View style={styles.tabs}>
                                <TouchableOpacity
                                    style={[styles.tab, activeTab === 'expense' && styles.activeTab]}
                                    onPress={() => setActiveTab('expense')}
                                >
                                    <Text style={[styles.tabText, activeTab === 'expense' && styles.activeTabText]}>Expense</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.tab, activeTab === 'income' && styles.activeTab]}
                                    onPress={() => setActiveTab('income')}
                                >
                                    <Text style={[styles.tabText, activeTab === 'income' && styles.activeTabText]}>Income</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    }
                />
            )}

            <TouchableOpacity
                style={styles.fab}
                onPress={() => openAddSheet(undefined)}
            >
                <MaterialCommunityIcons name="plus" size={32} color="#FFF" />
            </TouchableOpacity>

            <QSCreateCategorySheet
                visible={isSheetVisible}
                onClose={() => setIsSheetVisible(false)}
                onSave={handleAddCategory}
                parentId={selectedParentId}
                type={activeTab}
            />

            <QSAlertModal
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                onClose={hideAlert}
                buttons={alertConfig.buttons}
            />
        </View>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    tabs: {
        flexDirection: 'row',
        padding: theme.spacing.m,
        gap: theme.spacing.m,
    },
    tab: {
        flex: 1,
        paddingVertical: theme.spacing.s,
        alignItems: 'center',
        borderRadius: theme.borderRadius.m,
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    activeTab: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    tabText: {
        ...theme.typography.body,
        fontWeight: '600',
        color: theme.colors.text,
    },
    activeTabText: {
        color: '#FFF',
    },
    list: {
        padding: theme.spacing.m,
        paddingBottom: 80,
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.m,
        backgroundColor: theme.colors.card,
        marginBottom: theme.spacing.s,
        borderRadius: theme.borderRadius.m,
        ...theme.shadows.small,
    },
    childItemContainer: {
        backgroundColor: theme.colors.backgroundSecondary,
        marginLeft: theme.spacing.l,
        marginBottom: 8,
    },
    childrenContainer: {
        marginBottom: 8,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.m,
    },
    textContainer: {
        flex: 1,
    },
    itemName: {
        ...theme.typography.body,
        fontWeight: '600',
        color: theme.colors.text,
    },
    childItemName: {
        fontSize: 14,
    },
    defaultBadge: {
        backgroundColor: theme.colors.border,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginTop: 4,
    },
    defaultText: {
        ...theme.typography.caption,
        fontSize: 10,
        color: theme.colors.textSecondary,
    },
    actionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButton: {
        padding: theme.spacing.s,
    },
    fab: {
        position: 'absolute',
        bottom: theme.spacing.xl,
        right: theme.spacing.xl,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.large,
    },
});

export default QSCategoryManagementScreen;
