import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Dimensions, LayoutChangeEvent, Platform, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useTheme } from '../../theme/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CashFlowTrendChartProps {
    data: any[]; // History array from useAnalytics
    loading?: boolean;
}

const CashFlowTrendChart = ({ data, loading }: CashFlowTrendChartProps) => {
    const { theme } = useTheme();
    const [containerWidth, setContainerWidth] = useState(SCREEN_WIDTH - 64);

    const onLayout = (event: LayoutChangeEvent) => {
        const { width } = event.nativeEvent.layout;
        setContainerWidth(width);
    };

    if (!data || data.length === 0) return null;

    // Prepare datasets
    const incomeData = data.map(item => ({
        value: item.income,
        label: item.label,
        dataPointText: '', // Hide default text
        // Custom styling for income points?
    }));

    const expenseData = data.map(item => ({
        value: item.expense,
        label: item.label,
        dataPointText: '',
    }));

    // Check if we have valid data to show
    const allValues = [...incomeData.map(d => d.value), ...expenseData.map(d => d.value)];
    const maxValue = Math.max(...allValues, 100); // Minimum 100 to avoid flatline on 0

    // Spacing
    // Same manual spacing logic as NetWorthCard to match 'premium' feel and avoid clipping
    const spacing = (containerWidth - 100) / Math.max(1, data.length - 1);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <LinearGradient
            colors={theme.isDark ? [theme.colors.card, theme.colors.backgroundSecondary] : ['#ffffff', '#f8fafc']}
            style={[styles.card, { borderColor: theme.colors.border }]}
            onLayout={onLayout}
        >
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.colors.textSecondary }]}>Cash Flow Trend</Text>

                <View style={styles.legend}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: theme.colors.success }]} />
                        <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>Income</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: theme.colors.error }]} />
                        <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>Expenses</Text>
                    </View>
                </View>
            </View>

            <View style={styles.chartWrapper}>
                <LineChart
                    data={incomeData}
                    data2={expenseData}
                    height={160}
                    width={containerWidth - 40}

                    // Style adjustments
                    color1={theme.colors.success}
                    color2={theme.colors.error}
                    thickness1={3}
                    thickness2={3}

                    // Points
                    dataPointsColor1={theme.colors.success}
                    dataPointsColor2={theme.colors.error}
                    dataPointsRadius1={4}
                    dataPointsRadius2={4}
                    hideDataPoints={false}

                    // Areas
                    areaChart
                    startFillColor1={theme.colors.success}
                    startOpacity1={0.2}
                    endFillColor1={theme.colors.success}
                    endOpacity1={0.01}

                    startFillColor2={theme.colors.error}
                    startOpacity2={0.2}
                    endFillColor2={theme.colors.error}
                    endOpacity2={0.01}

                    // Axes
                    hideRules
                    hideYAxisText
                    xAxisThickness={0}
                    yAxisThickness={0}
                    xAxisLabelTextStyle={{
                        color: theme.colors.textSecondary,
                        fontSize: 10,
                        fontWeight: '600',
                    }}
                    xAxisLabelsVerticalShift={4}

                    // Curve
                    curved
                    curveType={1}

                    // Spacing
                    spacing={spacing}
                    initialSpacing={20}
                    endSpacing={60}

                    // Animation
                    isAnimated
                    animationDuration={1200}

                    // Pointers
                    pointerConfig={{
                        pointerStripColor: theme.colors.primary,
                        pointerStripWidth: 2,
                        pointerColor: theme.colors.primary, // Neutral pointer color? Or adaptive? using primary is safe
                        radius: 6,
                        pointerLabelWidth: 100,
                        pointerLabelHeight: 90, // Taller for 2 values
                        activatePointersOnLongPress: false,
                        autoAdjustPointerLabelPosition: true,
                        pointerLabelComponent: (items: any) => {
                            if (!items || items.length === 0) return null;

                            // Robust way: match by label
                            const currentItem = items[0];
                            const label = currentItem.label;

                            const incomeItem = incomeData.find(d => d.label === label);
                            const expenseItem = expenseData.find(d => d.label === label);

                            const incomeValue = incomeItem?.value ?? 0;
                            const expenseValue = expenseItem?.value ?? 0;

                            return (
                                <View style={[
                                    styles.pointerLabel,
                                    {
                                        backgroundColor: theme.colors.card,
                                        borderColor: theme.colors.border,
                                    }
                                ]}>
                                    <Text style={[styles.dateLabel, { color: theme.colors.textSecondary }]}>
                                        {label}
                                    </Text>
                                    <View style={styles.pointerRow}>
                                        <Text style={{ color: theme.colors.success, fontSize: 12, fontWeight: '700' }}>Income:</Text>
                                        <Text style={{ color: theme.colors.text, fontSize: 12 }}>{formatCurrency(incomeValue)}</Text>
                                    </View>
                                    <View style={styles.pointerRow}>
                                        <Text style={{ color: theme.colors.error, fontSize: 12, fontWeight: '700' }}>Expense:</Text>
                                        <Text style={{ color: theme.colors.text, fontSize: 12 }}>{formatCurrency(expenseValue)}</Text>
                                    </View>
                                </View>
                            );
                        },
                    }}
                    yAxisOffset={-(maxValue * 0.2)} // Add padding at the bottom so 0 is not cut off
                />
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 24,
        padding: 24,
        marginHorizontal: 16,
        marginVertical: 8,
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    legend: {
        flexDirection: 'row',
        gap: 12,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendText: {
        fontSize: 12,
        fontWeight: '500',
    },
    chartWrapper: {
        height: 160,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10,
        marginLeft: -20,
        paddingRight: 20,
    },
    pointerLabel: {
        padding: 10,
        borderRadius: 12,
        borderWidth: 1,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
            web: {
                boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
            }
        }),
        gap: 4,
        minWidth: 120,
    },
    dateLabel: {
        fontSize: 10,
        fontWeight: '600',
        marginBottom: 4,
        textAlign: 'center',
        textTransform: 'uppercase'
    },
    pointerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
    }
});

export default CashFlowTrendChart;
