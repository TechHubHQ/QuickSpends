import { useEffect } from 'react';
import { Linking } from 'react-native';
import { useRouter } from 'expo-router';

export const useWidgetDeepLink = () => {
  const router = useRouter();

  useEffect(() => {
    const handleDeepLink = (url: string) => {
      if (url.includes('screen=add-transaction')) {
        router.push('/add-transaction');
      } else if (url.includes('screen=analytics')) {
        const chartType = url.match(/chart_type=([^&]+)/)?.[1];
        router.push({
          pathname: '/(tabs)/analytics',
          params: chartType ? { chartType } : undefined
        });
      }
    };

    // Handle initial URL if app was opened from widget
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    // Handle URL changes while app is running
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => subscription?.remove();
  }, [router]);
};