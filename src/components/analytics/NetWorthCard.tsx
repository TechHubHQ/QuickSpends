import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Dimensions, LayoutChangeEvent, Platform, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { NetWorthData } from '../../hooks/useAnalytics';
import { useTheme } from '../../theme/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface NetWorthCardProps {
    data: NetWorthData | null;
    loading?: boolean;
}

const NetWorthCard = ({ data, loading }: NetWorthCardProps) => {
    const { theme } = useTheme();
    const [containerWidth, setContainerWidth] = useState(SCREEN_WIDTH - 64); // Default fallback

    const onLayout = (event: LayoutChangeEvent) => {
        const { width } = event.nativeEvent.layout;
        setContainerWidth(width);
    };

    if (!data && !loading) return null;

    // Use history from data or fallback to empty array
    const chartData = data?.history?.map(point => ({
        value: point.value,
        label: point.label,
    })) || [];

    // Calculate Y-axis range to auto-adjust
    const values = chartData.map(d => d.value);
    const minValue = values.length > 0 ? Math.min(...values) : 0;
    const maxValue = values.length > 0 ? Math.max(...values) : 1000;
    // Increased padding even further (30% above and below) for maximum visibility
    const padding = (maxValue - minValue) * 0.3 || 1000;

    const currentNetWorth = data?.netWorth || 0;
    const assets = data?.totalAssets || 0;
    const liabilities = data?.totalLiabilities || 0;
    const trend = data?.trend || 'stable';
    const changePercentage = data?.changePercentage || 0;

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
                <View>
                    <Text style={[styles.title, { color: theme.colors.textSecondary }]}>Net Worth</Text>
                    <Text style={[styles.netWorthValue, { color: theme.colors.text }]}>
                        {formatCurrency(currentNetWorth)}
                    </Text>
                </View>
                {trend !== 'stable' && (
                    <View style={[styles.percentBadge, { backgroundColor: (trend === 'up' ? theme.colors.success : theme.colors.error) + '20' }]}>
                        <Ionicons
                            name={trend === 'up' ? "trending-up" : "trending-down"}
                            size={16}
                            color={trend === 'up' ? theme.colors.success : theme.colors.error}
                        />
                        <Text style={[styles.percentText, { color: trend === 'up' ? theme.colors.success : theme.colors.error }]}>
                            {trend === 'up' ? '+' : '-'}{changePercentage.toFixed(1)}%
                        </Text>
                    </View>
                )}
            </View>

            <View style={styles.chartWrapper}>
                <LineChart
                    data={chartData}
                    height={120}
                    width={containerWidth - 40}
                    color={theme.colors.primary}
                    thickness={4}
                    hideRules
                    hideDataPoints={false}
                    dataPointsColor={theme.colors.primary}
                    dataPointsRadius={5}
                    focusedDataPointRadius={6}
                    hideYAxisText
                    xAxisThickness={0}
                    yAxisThickness={0}
                    xAxisLabelTextStyle={{
                        color: theme.colors.textSecondary,
                        fontSize: 10,
                        fontWeight: '600',
                    }}
                    xAxisLabelsVerticalShift={4}
                    curved
                    curveType={1}
                    spacing={(containerWidth - 100) / Math.max(1, chartData.length - 1)}
                    initialSpacing={20}
                    endSpacing={60}
                    isAnimated
                    animationDuration={1200}
                    // Area under the graph
                    areaChart
                    startFillColor={theme.colors.primary}
                    startOpacity={0.3}
                    endFillColor={theme.colors.primary}
                    endOpacity={0.01}
                    // Pointer config for premium feel
                    pointerConfig={{
                        pointerStripColor: theme.colors.primary,
                        pointerStripWidth: 2,
                        pointerColor: theme.colors.primary,
                        radius: 6,
                        pointerLabelWidth: 100,
                        pointerLabelHeight: 50, // Slightly taller
                        activatePointersOnLongPress: false,
                        autoAdjustPointerLabelPosition: true,
                        pointerLabelComponent: (items: any) => {
                            return (
                                <View style={[
                                    styles.pointerLabel,
                                    {
                                        backgroundColor: theme.colors.card,
                                        borderColor: theme.colors.border,
                                        marginBottom: 15, // Lifted higher
                                        zIndex: 1000,
                                    }
                                ]}>
                                    <Text style={[styles.pointerLabelText, { color: theme.colors.text }]}>
                                        {formatCurrency(items[0].value)}
                                    </Text>
                                </View>
                            );
                        },
                    }}
                    yAxisOffset={minValue - padding}
                />

            </View>

            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Assets</Text>
                    <Text style={[styles.statValue, { color: theme.colors.success }]}>
                        +{formatCurrency(assets)}
                    </Text>
                </View>
                <View style={[styles.verticalDivider, { backgroundColor: theme.colors.border }]} />
                <View style={styles.statItem}>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Liabilities</Text>
                    <Text style={[styles.statValue, { color: theme.colors.error }]}>
                        -{formatCurrency(liabilities)}
                    </Text>
                </View>
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
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    netWorthValue: {
        fontSize: 32,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    percentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 4,
    },
    percentText: {
        fontSize: 12,
        fontWeight: '700',
    },
    chartWrapper: {
        height: 160, // Increased height to prevent vertical cutting of bottom labels
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10,
        marginLeft: -20,
        paddingRight: 20, // Add padding right to prevent horizontal cutting
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    verticalDivider: {
        width: 1,
        height: 30,
        opacity: 0.3,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'uppercase',
        opacity: 0.8,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '700',
    },
    pointerLabel: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
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
    },
    pointerLabelText: {
        fontSize: 13,
        fontWeight: '700',
    }
});

export default NetWorthCard;
