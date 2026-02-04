import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { LayoutAnimation, Platform, StyleSheet, Text, TouchableOpacity, UIManager, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

type CategoryItemProps = {
    category: {
        icon: string;
        name: string;
        amount: number;
        total: number;
        color: string;
        transactions: number;
    };
    isExpanded: boolean;
    onPress: () => void;
};

const CategoryItem = ({ category, isExpanded, onPress }: CategoryItemProps) => {
    const { theme } = useTheme();
    const progress = category.amount / category.total;

    return (
        <View style={[styles.itemContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.itemHeader}>
                <View style={[styles.iconContainer, { backgroundColor: category.color + '20' }]}>
                    <Ionicons name={category.icon as any} size={20} color={category.color} />
                </View>

                <View style={styles.itemContent}>
                    <View style={styles.row}>
                        <Text style={[styles.categoryName, { color: theme.colors.text }]}>{category.name}</Text>
                        <Text style={[styles.amount, { color: theme.colors.text }]}>${category.amount.toLocaleString()}</Text>
                    </View>

                    <View style={styles.progressContainer}>
                        <View style={[styles.progressBarBackground, { backgroundColor: theme.colors.border }]}>
                            <View
                                style={[
                                    styles.progressBarFill,
                                    { backgroundColor: category.color, width: `${progress * 100}%` }
                                ]}
                            />
                        </View>
                        <Text style={[styles.percentage, { color: theme.colors.textSecondary }]}>
                            {Math.round(progress * 100)}%
                        </Text>
                    </View>
                </View>

                <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={theme.colors.textSecondary}
                />
            </TouchableOpacity>

            {isExpanded && (
                <View style={styles.detailsContainer}>
                    <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                    <Text style={[styles.detailsTitle, { color: theme.colors.textSecondary }]}>
                        {category.transactions} Transactions
                    </Text>

                    {/* Mock Transactions */}
                    <View style={styles.mockTransaction}>
                        <Text style={[styles.mockDate, { color: theme.colors.textSecondary }]}>Today</Text>
                        <Text style={[styles.mockDesc, { color: theme.colors.text }]}>Starbucks</Text>
                        <Text style={[styles.mockAmount, { color: theme.colors.text }]}>-$5.50</Text>
                    </View>
                    <View style={styles.mockTransaction}>
                        <Text style={[styles.mockDate, { color: theme.colors.textSecondary }]}>Yesterday</Text>
                        <Text style={[styles.mockDesc, { color: theme.colors.text }]}>Uber Eats</Text>
                        <Text style={[styles.mockAmount, { color: theme.colors.text }]}>-$24.00</Text>
                    </View>
                </View>
            )}
        </View>
    );
};

const CategoryBreakdown = () => {
    const { theme } = useTheme();
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const categories = [
        { id: '1', name: 'Food & Dining', icon: 'fast-food', amount: 1250, total: 4560, color: '#FF9F1C', transactions: 12 },
        { id: '2', name: 'Shopping', icon: 'cart', amount: 850, total: 4560, color: '#2EC4B6', transactions: 5 },
        { id: '3', name: 'Transport', icon: 'car', amount: 450, total: 4560, color: '#E71D36', transactions: 8 },
        { id: '4', name: 'Entertainment', icon: 'game-controller', amount: 320, total: 4560, color: '#A06CD5', transactions: 3 },
    ];

    const handlePress = (id: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <View style={styles.container}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Top Categories</Text>
            {categories.map((cat) => (
                <CategoryItem
                    key={cat.id}
                    category={cat}
                    isExpanded={expandedId === cat.id}
                    onPress={() => handlePress(cat.id)}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 10,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    itemContainer: {
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        overflow: 'hidden',
    },
    itemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    itemContent: {
        flex: 1,
        marginRight: 12,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    categoryName: {
        fontSize: 16,
        fontWeight: '600',
    },
    amount: {
        fontSize: 16,
        fontWeight: '700',
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    progressBarBackground: {
        flex: 1,
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    percentage: {
        fontSize: 12,
        fontWeight: '500',
        width: 30,
        textAlign: 'right'
    },
    detailsContainer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    divider: {
        height: 1,
        width: '100%',
        marginBottom: 12,
    },
    detailsTitle: {
        fontSize: 12,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    mockTransaction: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    mockDate: {
        fontSize: 12,
        width: 60,
    },
    mockDesc: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
    },
    mockAmount: {
        fontSize: 14,
        fontWeight: '600',
    },
});

export default CategoryBreakdown;
