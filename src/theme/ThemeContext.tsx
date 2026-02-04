import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance, ColorSchemeName, StatusBar } from 'react-native';
import { generateTheme, lightTheme, PREMIUM_THEMES, Theme, ThemeOverrides } from './theme';

type ThemeContextType = {
  theme: Theme;
  themeId: string;
  setThemeId: (id: string) => void;
  colorScheme: ColorSchemeName;
  toggleTheme: () => void;
  customOverrides: ThemeOverrides;
  updateCustomOverrides: (overrides: ThemeOverrides) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  themeId: PREMIUM_THEMES[0].id,
  setThemeId: () => { },
  colorScheme: 'light',
  toggleTheme: () => { },
  customOverrides: {},
  updateCustomOverrides: () => { },
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeIdState] = useState<string>(PREMIUM_THEMES[0].id);
  const [colorScheme, setColorScheme] = useState<ColorSchemeName>(Appearance.getColorScheme());
  const [customOverrides, setCustomOverrides] = useState<ThemeOverrides>({});

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const storedThemeId = await AsyncStorage.getItem('user_theme_id');
      const storedOverrides = await AsyncStorage.getItem('user_theme_overrides');

      if (storedThemeId) {
        setThemeIdState(storedThemeId);
      } else {
        const systemScheme = Appearance.getColorScheme();
        setThemeIdState(systemScheme === 'dark' ? 'classic-dark' : 'classic-light');
      }

      if (storedOverrides) {
        setCustomOverrides(JSON.parse(storedOverrides));
      }
    } catch (error) {
      console.error('Failed to load theme', error);
    }
  };

  const setThemeId = async (id: string) => {
    setThemeIdState(id);
    await AsyncStorage.setItem('user_theme_id', id);
  };

  const updateCustomOverrides = async (overrides: ThemeOverrides) => {
    const newOverrides = { ...customOverrides, ...overrides };
    setCustomOverrides(newOverrides);
    await AsyncStorage.setItem('user_theme_overrides', JSON.stringify(newOverrides));
  };

  const toggleTheme = async () => {
    const currentPreset = PREMIUM_THEMES.find(p => p.id === themeId) || PREMIUM_THEMES[0];
    const newType = currentPreset.type === 'light' ? 'dark' : 'light';
    const newId = newType === 'dark' ? 'classic-dark' : 'classic-light';
    setThemeId(newId);
  };

  const theme = generateTheme(themeId, customOverrides);

  return (
    <ThemeContext.Provider value={{
      theme,
      themeId,
      setThemeId,
      colorScheme,
      toggleTheme,
      customOverrides,
      updateCustomOverrides
    }}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}



export { Theme };
