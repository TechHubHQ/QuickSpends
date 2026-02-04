import { NativeModules, Platform } from 'react-native';

interface WidgetData {
  netWorth?: number;
  cashFlow?: number;
  monthlyExpenses?: number;
  monthlyIncome?: number;
  lastUpdated?: string;
}

interface WidgetConfig {
  widgetId: number;
  chartType: 'networth' | 'cashflow' | 'expenses' | 'income';
}

class WidgetManager {
  private static instance: WidgetManager;
  
  static getInstance(): WidgetManager {
    if (!WidgetManager.instance) {
      WidgetManager.instance = new WidgetManager();
    }
    return WidgetManager.instance;
  }

  async updateWidgetData(data: WidgetData): Promise<void> {
    if (Platform.OS !== 'android') return;
    
    try {
      // Store data in AsyncStorage for widgets to access
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('widget_data', JSON.stringify({
        ...data,
        lastUpdated: new Date().toISOString()
      }));
      
      // Trigger widget update if native module is available
      if (NativeModules.WidgetModule) {
        await NativeModules.WidgetModule.updateWidgets();
      }
    } catch (error) {
      console.error('Failed to update widget data:', error);
    }
  }

  async configureAnalyticsWidget(config: WidgetConfig): Promise<void> {
    if (Platform.OS !== 'android') return;
    
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem(`widget_config_${config.widgetId}`, JSON.stringify(config));
    } catch (error) {
      console.error('Failed to configure widget:', error);
    }
  }

  async getWidgetData(): Promise<WidgetData | null> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const data = await AsyncStorage.getItem('widget_data');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get widget data:', error);
      return null;
    }
  }
}

export default WidgetManager;
export type { WidgetData, WidgetConfig };