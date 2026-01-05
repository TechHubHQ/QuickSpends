import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts';
import { CashFlowData, CategorySpending } from '../../hooks/useAnalytics';
import { Theme } from '../../theme/theme';

const { width } = Dimensions.get('window');

interface CategoryDonutChartProps {
    data: CategorySpending[];
    theme: Theme;
}

export const CategoryDonutChart = ({ data, theme }: CategoryDonutChartProps) => {
    if (!data || data.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No spending data available</Text>
            </View>
        );
    }

    const pieData = data.map(item => ({
        value: item.total,
        color: item.category_color,
        text: item.category_name,
    }));

    return (
        <View style={styles.chartWrapper}>
            <PieChart
                donut
                sectionAutoFocus
                radius={90}
                innerRadius={60}
                innerCircleColor={theme.colors.card}
                data={pieData}
                centerLabelComponent={() => {
                    const total = data.reduce((sum, item) => sum + item.total, 0);
                    return (
                        <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ fontSize: 20, color: theme.colors.text, fontWeight: 'bold' }}>
                                ₹{total.toLocaleString()}
                            </Text>
                            <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>Total</Text>
                        </View>
                    );
                }}
            />
        </View>
    );
};

interface CashFlowChartProps {
    data: CashFlowData[];
    theme: Theme;
}

export const CashFlowChart = ({ data, theme }: CashFlowChartProps) => {
    if (!data || data.length === 0) return null;

    const allValues = data.flatMap(item => [item.income, item.expense]);
    const maxVal = Math.max(...allValues);

    const lineDataIncome = data.map(item => ({
        value: item.income,
        label: item.date,
        dataPointColor: theme.colors.success,
    }));

    const lineDataExpense = data.map(item => ({
        value: item.expense,
        label: item.date,
        dataPointColor: theme.colors.error,
    }));

    return (
        <View style={styles.chartWrapper}>
            <LineChart
                data={lineDataIncome}
                data2={lineDataExpense}
                height={220}
                width={width - 50}
                initialSpacing={20}
                spacing={50}
                thickness={3}
                hideRules
                hideYAxisText
                yAxisColor="transparent"
                xAxisColor={theme.colors.border}
                color1={theme.colors.success}
                color2={theme.colors.error}
                dataPointsColor1={theme.colors.success}
                dataPointsColor2={theme.colors.error}
                curved
                animateOnDataChange
                animationDuration={1000}
                onDataChangeAnimationDuration={300}
                xAxisLabelTextStyle={{ color: theme.colors.textSecondary, fontSize: 11 }}
                scrollToEnd
                scrollAnimation
                maxValue={maxVal * 1.2}
            />
            <View style={styles.legendContainer}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: theme.colors.success }]} />
                    <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>Income</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: theme.colors.error }]} />
                    <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>Expense</Text>
                </View>
            </View>
        </View>
    );
};

interface BudgetBarChartProps {
    data: any[];
    theme: Theme;
}

export const BudgetBarChart = ({ data, theme }: BudgetBarChartProps) => {
    if (!data || data.length === 0) return null;

    const maxVal = Math.max(...data.map(item => Math.max(item.spent_amount, item.budget_amount)));

    const barData = data.map(item => ({
        value: item.spent_amount,
        label: item.category_name,
        frontColor: item.spent_amount > item.budget_amount ? theme.colors.error : theme.colors.primary,
        topLabelComponent: () => (
            <Text style={{ color: theme.colors.text, fontSize: 10, marginBottom: 4 }}>
                {Math.round(item.percentage)}%
            </Text>
        ),
    }));

    return (
        <View style={styles.chartWrapper}>
            <BarChart
                data={barData}
                barWidth={30}
                noOfSections={4}
                maxValue={maxVal * 1.2}
                barBorderRadius={4}
                height={200}
                width={width - 80}
                initialSpacing={10}
                spacing={30}
                yAxisThickness={0}
                xAxisThickness={1}
                xAxisColor={theme.colors.border}
                hideRules
                isAnimated
            />
        </View>
    );
};

interface SpendingBarChartProps {
    data: CategorySpending[];
    theme: Theme;
}

export const SpendingBarChart = ({ data, theme }: SpendingBarChartProps) => {
    if (!data || data.length === 0) return null;

    const maxVal = Math.max(...data.map(item => item.total));

    const barData = data.slice(0, 5).map(item => ({ // Show top 5
        value: item.total,
        label: item.category_name.length > 8 ? item.category_name.substring(0, 6) + '..' : item.category_name,
        frontColor: item.category_color,
        topLabelComponent: () => (
            <Text style={{ color: theme.colors.text, fontSize: 10, marginBottom: 4 }}>
                {new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                    maximumFractionDigits: 0,
                    notation: "compact"
                }).format(item.total)}
            </Text>
        ),
    }));

    return (
        <View style={styles.chartWrapper}>
            <BarChart
                data={barData}
                barWidth={32}
                noOfSections={4}
                maxValue={maxVal * 1.2}
                barBorderRadius={4}
                height={220}
                width={width - 60}
                initialSpacing={20}
                spacing={24}
                yAxisThickness={0}
                xAxisThickness={1}
                xAxisColor={theme.colors.border}
                xAxisLabelTextStyle={{ color: theme.colors.textSecondary, fontSize: 10, width: 40 }}
                hideRules
                isAnimated
                yAxisLabelTexts={['']}
                yAxisLabelWidth={0}
                hideYAxisText
            />
        </View>
    );
};

const styles = StyleSheet.create({
    chartWrapper: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    emptyContainer: {
        height: 180,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
    },
    legendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 15,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 10,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 6,
    },
    legendText: {
        fontSize: 12,
    },
});
