import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../theme/ThemeContext';
import { useAnalytics } from '../hooks/useAnalytics';
import { CategoryDonutChart } from '../components/analytics/AnalyticsCharts';
import CashFlowTrendChart from '../components/analytics/CashFlowTrendChart';
import NetWorthCard from '../components/analytics/NetWorthCard';
import { useAuth } from '../context/AuthContext';

export const WidgetPreview = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { getNetWorth, getCashFlow, getSpendingByCategory } = useAnalytics();
  const [showConfig, setShowConfig] = useState(false);
  const [selectedChart, setSelectedChart] = useState<'networth' | 'cashflow' | 'spending'>('networth');
  const [chartData, setChartData] = useState<any[]>([]);
  
  const styles = createStyles(theme);

  // Fetch data when chart type changes
  React.useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      try {
        if (selectedChart === 'networth') {
          const data = await getNetWorth(user.id, { days: 7 });
          setChartData(data?.history?.slice(-7).map(item => ({ value: item.value, label: item.label })) || []);
        } else if (selectedChart === 'cashflow') {
          const data = await getCashFlow(user.id, { days: 7 });
          setChartData(data?.slice(-7).map(item => ({ value: item.income - item.expense, label: item.date })) || []);
        } else if (selectedChart === 'spending') {
          const data = await getSpendingByCategory(user.id, { days: 7 });
          setChartData(data?.slice(0, 4).map(item => ({ 
            value: item.total, 
            text: item.category_name,
            color: item.category_color,
            category_id: item.category_id,
            category_name: item.category_name,
            category_icon: item.category_icon,
            total: item.total,
            percentage: 0
          })) || []);
        }
      } catch (error) {
        console.error('Error fetching chart data:', error);
        setChartData([]);
      }
    };
    
    fetchData();
  }, [selectedChart, user, getNetWorth, getCashFlow, getSpendingByCategory]);

  const getChartColor = () => {
    switch (selectedChart) {
      case 'networth': return theme.colors.primary;
      case 'cashflow': return theme.colors.success;
      case 'expenses': return theme.colors.error;
      case 'income': return theme.colors.info;
      default: return theme.colors.primary;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.widgetRow}>
        {/* Quick Add Widget */}
        <View style={styles.widget}>
          <Text style={styles.widgetTitle}>Quick Add Widget (4x2)</Text>
          <TouchableOpacity 
            style={styles.quickAddWidget}
            onPress={() => router.push('/add-transaction')}
          >
            <MaterialCommunityIcons name="plus" size={32} color="#FFFFFF" />
            <Text style={styles.quickAddText}>Quick Add</Text>
            <Text style={styles.quickAddSubtext}>Transaction</Text>
          </TouchableOpacity>
        </View>

        {/* Analytics Widget */}
        <View style={styles.widget}>
          <View style={styles.widgetHeader}>
            <Text style={styles.widgetTitle}>Analytics Widget (4x3)</Text>
            <TouchableOpacity 
              style={styles.configButton}
              onPress={() => setShowConfig(true)}
            >
              <MaterialCommunityIcons name="cog" size={16} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.analyticsWidget}
            onPress={() => setShowConfig(true)}
          >
          <View style={styles.analyticsHeader}>
            <MaterialCommunityIcons name="chart-line" size={24} color="#FFFFFF" />
            <Text style={styles.analyticsTitle}>
              {selectedChart === 'networth' ? 'Net Worth' : 
               selectedChart === 'cashflow' ? 'Cash Flow' : 'Spending'}
            </Text>
          </View>
          
          <View style={styles.chartContainer}>
            {chartData.length > 0 ? (
              selectedChart === 'spending' ? (
                <View style={styles.miniChart}>
                  <CategoryDonutChart 
                    data={chartData}
                    theme={{
                      ...theme,
                      colors: { ...theme.colors, card: '#0f1419' }
                    }}
                  />
                </View>
              ) : selectedChart === 'cashflow' ? (
                <View style={[styles.miniChart, styles.lineChart]}>
                  <CashFlowTrendChart 
                    data={chartData.map(item => ({
                      income: Math.max(0, item.value),
                      expense: Math.max(0, -item.value),
                      label: item.label
                    }))}
                  />
                </View>
              ) : (
                <View style={[styles.miniChart, styles.lineChart]}>
                  <NetWorthCard 
                    data={{
                      netWorth: chartData[chartData.length - 1]?.value || 0,
                      totalAssets: 0,
                      totalLiabilities: 0,
                      trend: 'stable' as const,
                      changePercentage: 0,
                      history: chartData.map(item => ({
                        date: item.label,
                        value: item.value,
                        label: item.label
                      }))
                    }}
                  />
                </View>
              )
            ) : (
              <View style={styles.chartPlaceholder}>
                <MaterialCommunityIcons name="chart-line" size={24} color="#66FFFFFF" />
                <Text style={styles.noDataText}>No data</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.tapText}>Tap to configure</Text>
        </TouchableOpacity>
        </View>
      </View>

      {/* Configuration Modal */}
      <Modal visible={showConfig} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Chart Type</Text>
            
            {[
              { id: 'networth', label: 'Net Worth', icon: 'trending-up' },
              { id: 'cashflow', label: 'Cash Flow', icon: 'swap-horizontal' },
              { id: 'spending', label: 'Spending', icon: 'chart-donut' }
            ].map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  selectedChart === option.id && styles.selectedOption
                ]}
                onPress={() => setSelectedChart(option.id as any)}
              >
                <MaterialCommunityIcons 
                  name={option.icon as any} 
                  size={20} 
                  color={selectedChart === option.id ? theme.colors.onPrimary : theme.colors.text} 
                />
                <Text style={[
                  styles.optionText,
                  selectedChart === option.id && styles.selectedOptionText
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity 
              style={styles.doneButton}
              onPress={() => setShowConfig(false)}
            >
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: { padding: 20, gap: 20 },
  widgetRow: { flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  widget: { flex: 1, gap: 8 },
  widgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  widgetTitle: { fontSize: 14, fontWeight: '600', color: theme.colors.textSecondary },
  configButton: { 
    padding: 4, 
    backgroundColor: theme.colors.backgroundSecondary, 
    borderRadius: theme.borderRadius.s 
  },
  
  quickAddWidget: {
    width: '100%', height: 110,
    backgroundColor: '#1a2332',
    borderRadius: theme.borderRadius.l,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    ...theme.shadows.medium,
  },
  quickAddText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  quickAddSubtext: { color: '#CCFFFFFF', fontSize: 12 },
  
  analyticsWidget: {
    width: '100%', height: 180,
    backgroundColor: '#1a2332',
    borderRadius: theme.borderRadius.l,
    padding: 16,
    ...theme.shadows.medium,
  },
  analyticsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  analyticsTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  chartContainer: {
    flex: 1,
    backgroundColor: '#0f1419',
    borderRadius: theme.borderRadius.m,
    marginBottom: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  miniChart: {
    position: 'absolute',
    top: -30,
    left: -80,
    right: -80,
    bottom: -30,
    transform: [{ scale: 0.35 }],
    transformOrigin: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lineChart: {
    left: -50,
    right: -50,
    top: -50,
    bottom: -50,
    transform: [{ scale: 0.5 }],
  },
  chartPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  noDataText: {
    color: '#99FFFFFF',
    fontSize: 12,
  },
  tapText: { color: '#CCFFFFFF', fontSize: 12, textAlign: 'center' },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: theme.colors.modal,
    borderRadius: theme.borderRadius.l,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.m,
    marginBottom: 8,
    gap: 12,
  },
  selectedOption: {
    backgroundColor: theme.colors.primary,
  },
  optionText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  selectedOptionText: {
    color: theme.colors.onPrimary,
  },
  doneButton: {
    backgroundColor: theme.colors.primary,
    padding: 12,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
    marginTop: 12,
  },
  doneText: {
    color: theme.colors.onPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});