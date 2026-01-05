import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance, ColorSchemeName, StatusBar } from 'react-native';
import { generateTheme, lightTheme, PREMIUM_THEMES, Theme } from './theme';

type ThemeContextType = {
  theme: Theme;
  themeId: string;
  setThemeId: (id: string) => void;
  colorScheme: ColorSchemeName;
  toggleTheme: () => void; // Keeps simple light/dark toggle if needed, or we just switch themes
};

const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  themeId: PREMIUM_THEMES[0].id,
  setThemeId: () => { },
  colorScheme: 'light',
  toggleTheme: () => { },
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeIdState] = useState<string>(PREMIUM_THEMES[0].id);
  const [colorScheme, setColorScheme] = useState<ColorSchemeName>(Appearance.getColorScheme());

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const storedThemeId = await AsyncStorage.getItem('user_theme_id');
      if (storedThemeId) {
        setThemeIdState(storedThemeId);
      } else {
        // Default based on system mode
        const systemScheme = Appearance.getColorScheme();
        setThemeIdState(systemScheme === 'dark' ? 'classic-dark' : 'classic-light');
      }
    } catch (error) {
      console.error('Failed to load theme', error);
    }
  };

  const setThemeId = async (id: string) => {
    setThemeIdState(id);
    await AsyncStorage.setItem('user_theme_id', id);
  };

  const toggleTheme = async () => {
    // Simple toggle logic: if current is light, switch to classic-dark, else classic-light
    // Or if currently a premium dark theme, switch to a premium light equivalent if exists?
    // For simplicity, we'll swap between Classic Light and Classic Dark if using defaults,
    // otherwise we might just toggle the type.

    const currentPreset = PREMIUM_THEMES.find(p => p.id === themeId) || PREMIUM_THEMES[0];
    const newType = currentPreset.type === 'light' ? 'dark' : 'light';

    // Find a matching theme of the opposite type?
    // Start with strictly switching to the defaults for robustness
    const newId = newType === 'dark' ? 'classic-dark' : 'classic-light';
    setThemeId(newId);
  };

  const theme = generateTheme(themeId);

  return (
    <ThemeContext.Provider value={{ theme, themeId, setThemeId, colorScheme, toggleTheme }}>
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

