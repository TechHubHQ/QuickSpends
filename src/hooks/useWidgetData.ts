import { useEffect } from 'react';
import { useAnalytics } from './useAnalytics';
import { useAccounts } from './useAccounts';
import WidgetManager from '../services/WidgetManager';

export const useWidgetData = () => {
  const { netWorthData, cashFlowData, monthlyExpenses, monthlyIncome } = useAnalytics();
  const { accounts } = useAccounts();

  useEffect(() => {
    const updateWidgets = async () => {
      if (!netWorthData?.length || !accounts?.length) return;

      const latestNetWorth = netWorthData[netWorthData.length - 1]?.value || 0;
      const latestCashFlow = cashFlowData?.[cashFlowData.length - 1]?.value || 0;

      await WidgetManager.getInstance().updateWidgetData({
        netWorth: latestNetWorth,
        cashFlow: latestCashFlow,
        monthlyExpenses,
        monthlyIncome,
      });
    };

    updateWidgets();
  }, [netWorthData, cashFlowData, monthlyExpenses, monthlyIncome, accounts]);

  return {
    updateWidgetData: (data: any) => WidgetManager.getInstance().updateWidgetData(data),
    configureWidget: (config: any) => WidgetManager.getInstance().configureAnalyticsWidget(config),
  };
};