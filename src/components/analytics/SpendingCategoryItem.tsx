import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming
} from 'react-native-reanimated';
import { CategorySpending } from '../../hooks/useAnalytics';
import { Theme } from '../../theme/ThemeContext';

interface SpendingCategoryItemProps {
    item: CategorySpending;
    maxSpend: number;
    onPress: () => void;
    theme: Theme;
    formatCurrency: (amount: number) => string;
    index?: number;
}

const SpendingCategoryItem: React.FC<SpendingCategoryItemProps> = ({
    item,
    maxSpend,
    onPress,
    theme,
    formatCurrency,
    index = 0
}) => {
    // Calculate width percentage relative to maxSpend
    const widthPercentage = maxSpend > 0 ? (item.total / maxSpend) * 100 : 0;

    // Animation shared value
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = withDelay(
            index * 50, // Stagger effect
            withTiming(widthPercentage, {
                duration: 1000,
                easing: Easing.out(Easing.exp),
            })
        );
    }, [widthPercentage, index]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            width: `${progress.value}%`,
        };
    });

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.container,
                {
                    opacity: pressed ? 0.7 : 1,
                    backgroundColor: theme.colors.card, // Or backgroundSecondary?
                    // Let's keep it transparent or minimal as per list style
                }
            ]}
        >
            <View style={styles.header}>
                <View style={styles.leftContent}>
                    <View
                        style={[
                            styles.iconContainer,
                            { backgroundColor: item.category_color + '20' } // 20% opacity
                        ]}
                    >
                        <MaterialCommunityIcons
                            // @ts-ignore - icon name might need validation
                            name={item.category_icon || "shape"}
                            size={20}
                            color={item.category_color}
                        />
                    </View>
                    <View>
                        <Text style={[styles.categoryName, { color: theme.colors.text }]}>
                            {item.category_name}
                        </Text>
                        <View style={styles.percentageRow}>
                            {/* Show percentage of total budget/spend? Or just generic percentage?
                                 The original code showed item.percentage which was % of Total Spend.
                             */}
                            <Text style={[styles.percentageText, { color: theme.colors.textSecondary }]}>
                                {item.percentage.toFixed(1)}% of total
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.rightContent}>
                    <Text style={[styles.amountText, { color: theme.colors.text }]}>
                        {formatCurrency(item.total)}
                    </Text>
                </View>
            </View>

            {/* Progressive Bar */}
            <View style={[styles.progressBarContainer, { backgroundColor: theme.colors.border + '40' }]}>
                <Animated.View
                    style={[
                        styles.progressBarFill,
                        { backgroundColor: item.category_color },
                        animatedStyle
                    ]}
                />
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        paddingVertical: 4,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    leftContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12, // Squircle-ish
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryName: {
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.2, // Premium feel
    },
    percentageRow: {
        marginTop: 2,
    },
    percentageText: {
        fontSize: 12,
    },
    rightContent: {
        alignItems: 'flex-end',
    },
    amountText: {
        fontSize: 16,
        fontWeight: '700',
    },
    progressBarContainer: {
        height: 6,
        borderRadius: 3,
        width: '100%',
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
});

export default SpendingCategoryItem;
