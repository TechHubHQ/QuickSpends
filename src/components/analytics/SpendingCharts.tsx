import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { useTheme } from '../../theme/ThemeContext';

const { width } = Dimensions.get('window');

const SpendingCharts = () => {
    const { theme } = useTheme();

    // Mock Data
    const pieData = [
        { value: 54, color: '#177AD5', text: '54%', focused: true },
        { value: 30, color: '#79D2DE', text: '30%' },
        { value: 26, color: '#ED6665', text: '26%' },
    ];

    const barData = [
        { value: 250, label: 'M' },
        { value: 500, label: 'T', frontColor: '#177AD5' },
        { value: 745, label: 'W', frontColor: '#177AD5' },
        { value: 320, label: 'T' },
        { value: 600, label: 'F', frontColor: '#177AD5' },
        { value: 256, label: 'S' },
        { value: 300, label: 'S' },
    ];

    const renderLegend = (color: string, label: string) => {
        return (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12, marginBottom: 12 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color, marginRight: 6 }} />
                <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>{label}</Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Donut Chart Section */}
            <View style={[styles.chartCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Text style={[styles.chartTitle, { color: theme.colors.text }]}>Category Breakdown</Text>
                <View style={styles.donutContainer}>
                    <PieChart
                        data={pieData}
                        donut
                        showGradient
                        sectionAutoFocus
                        isAnimated
                        animationDuration={900}
                        radius={70}
                        innerRadius={50}
                        innerCircleColor={theme.colors.surface}
                        centerLabelComponent={() => {
                            return (
                                <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                                    <Text style={{ fontSize: 22, color: theme.colors.text, fontWeight: 'bold' }}>
                                        $4,560
                                    </Text>
                                    <Text style={{ fontSize: 14, color: theme.colors.textSecondary }}>Total</Text>
                                </View>
                            );
                        }}
                    />
                    <View style={styles.legendContainer}>
                        {renderLegend('#177AD5', 'Shopping')}
                        {renderLegend('#79D2DE', 'Food')}
                        {renderLegend('#ED6665', 'Transport')}
                    </View>
                </View>
            </View>

            {/* Bar Chart Section */}
            <View style={[styles.chartCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Text style={[styles.chartTitle, { color: theme.colors.text }]}>Weekly Spending</Text>
                <View style={styles.barHelper}>
                    <BarChart
                        barWidth={22}
                        noOfSections={3}
                        barBorderRadius={4}
                        frontColor="lightgray"
                        data={barData}
                        yAxisThickness={0}
                        xAxisThickness={0}
                        hideRules
                        hideYAxisText
                        labelWidth={30} // Adjust based on label length
                        xAxisLabelTextStyle={{ color: theme.colors.textSecondary, fontSize: 12 }}
                        isAnimated
                        animationDuration={900}
                    />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        gap: 20,
        marginBottom: 20,
    },
    chartCard: {
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    donutContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        flexWrap: 'wrap',
    },
    legendContainer: {
        // justifyContent: 'center',
        marginTop: 20,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        width: '100%'
    },
    barHelper: {
        alignItems: 'center',
    }
});

export default SpendingCharts;
