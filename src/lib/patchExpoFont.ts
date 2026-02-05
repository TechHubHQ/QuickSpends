import { Platform } from 'react-native';
import * as Font from 'expo-font';

type FontModule = typeof Font & {
  __qsPatched?: boolean;
  loadAsync: (...args: unknown[]) => Promise<void>;
};

const TIMEOUT_RE = /timeout exceeded/i;

if (Platform.OS === 'web') {
  const fontModule = Font as FontModule;

  if (!fontModule.__qsPatched) {
    const originalLoadAsync = fontModule.loadAsync.bind(fontModule);

    fontModule.loadAsync = async (...args: unknown[]) => {
      try {
        await originalLoadAsync(...args);
      } catch (error) {
        const message = String((error as Error)?.message ?? error);
        if (__DEV__ && !TIMEOUT_RE.test(message)) {
          // Non-timeout errors can be useful during dev.
          // Timeout errors are common on web when font files are blocked.
          console.warn('[web] Font load failed; continuing without it.', error);
        }
      }
    };

    fontModule.__qsPatched = true;
  }
}
