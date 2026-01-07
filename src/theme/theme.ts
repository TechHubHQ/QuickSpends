import { Platform } from 'react-native';

export type ColorScheme = 'light' | 'dark' | 'auto';

export interface ThemeColors {
  // Background colors
  background: string;
  backgroundSecondary: string;
  surface: string;
  card: string;
  modal: string;

  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;

  // Primary colors
  primary: string;
  primaryLight: string;
  primaryDark: string;
  onPrimary: string;

  // Secondary / Accent
  secondary: string;
  secondaryLight: string;

  // UI elements
  border: string;
  divider: string;
  icon: string;
  iconSecondary: string;

  // Status colors
  success: string;
  error: string;
  warning: string;
  info: string;

  // Gradients (as arrays of strings for expo-linear-gradient)
  gradients: {
    primary: [string, string];
    card: [string, string];
    surface: [string, string];
  };

  // Overlays
  overlay: string;
}

export interface ThemeSpacing {
  xs: number;
  s: number;
  m: number;
  l: number;
  xl: number;
  xxl: number;
}

export interface ThemeBorderRadius {
  s: number;
  m: number;
  l: number;
  xl: number;
  round: number;
}

export interface ThemeTypography {
  h1: { fontSize: number; fontWeight: '700' | 'bold' };
  h2: { fontSize: number; fontWeight: '600' | 'bold' };
  h3: { fontSize: number; fontWeight: '600' | 'bold' };
  body: { fontSize: number; fontWeight: '400' | 'normal' };
  bodySmall: { fontSize: number; fontWeight: '400' | 'normal' };
  caption: { fontSize: number; fontWeight: '400' | 'normal' };
  button: { fontSize: number; fontWeight: '600' | 'bold' };
}

export interface ThemeShadows {
  small: object;
  medium: object;
  large: object;
}

export interface Theme {
  colors: ThemeColors;
  spacing: ThemeSpacing;
  borderRadius: ThemeBorderRadius;
  typography: ThemeTypography;
  shadows: ThemeShadows;
  isDark: boolean;
}

const commonTokens = {
  spacing: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 40,
  },
  borderRadius: {
    s: 8,
    m: 12,
    l: 16,
    xl: 24,
    round: 9999,
  },
  typography: {
    h1: { fontSize: 32, fontWeight: '700' as const },
    h2: { fontSize: 24, fontWeight: '600' as const },
    h3: { fontSize: 18, fontWeight: '600' as const },
    body: { fontSize: 16, fontWeight: '400' as const },
    bodySmall: { fontSize: 14, fontWeight: '400' as const },
    caption: { fontSize: 12, fontWeight: '400' as const },
    button: { fontSize: 16, fontWeight: '600' as const },
  },
  shadows: {
    small: {
      ...Platform.select({
        web: {
          boxShadow: '0px 2px 3px rgba(0,0,0,0.05)', // Approx for small
        },
        default: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
          elevation: 2,
        },
      }),
    },
    medium: {
      ...Platform.select({
        web: {
          boxShadow: '0px 4px 6px rgba(0,0,0,0.1)', // Approx for medium
        },
        default: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
          elevation: 4,
        },
      }),
    },
    large: {
      ...Platform.select({
        web: {
          boxShadow: '0px 10px 20px rgba(0,0,0,0.15)', // Approx for large
        },
        default: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
          elevation: 10,
        },
      }),
    },
  },
};

export type ThemeBase = 'light' | 'dark';

export interface ThemePreset {
  id: string;
  name: string;
  type: 'light' | 'dark'; // Base type
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary?: string;
  secondaryLight?: string;
  background?: string; // Optional override
  backgroundSecondary?: string; // Optional override
  surface?: string;
  card?: string;
  modal?: string;
  onPrimary?: string;
}

export const PREMIUM_THEMES: ThemePreset[] = [
  // --- LIGHT THEMES ---
  {
    id: 'classic-light',
    name: 'Classic Indigo',
    type: 'light',
    primary: '#6366F1',
    primaryLight: '#818CF8',
    primaryDark: '#4338CA'
  },
  {
    id: 'ocean-light',
    name: 'Ocean Breeze',
    type: 'light',
    primary: '#06B6D4', // Cyan
    primaryLight: '#22D3EE',
    primaryDark: '#0E7490',
    background: '#F0FDFA', // Azure 50
    backgroundSecondary: '#CCFBF1' // Azure 100
  },
  {
    id: 'rose-light',
    name: 'Rose Garden',
    type: 'light',
    primary: '#F43F5E', // Rose
    primaryLight: '#FB7185',
    primaryDark: '#E11D48',
    background: '#FFF1F2', // Rose 50
    backgroundSecondary: '#FFE4E6' // Rose 100
  },
  {
    id: 'emerald-light',
    name: 'Emerald City',
    type: 'light',
    primary: '#10B981',
    primaryLight: '#34D399',
    primaryDark: '#059669',
    background: '#ECFDF5',
    backgroundSecondary: '#D1FAE5'
  },
  {
    id: 'amber-light',
    name: 'Golden Hour',
    type: 'light',
    primary: '#F59E0B',
    primaryLight: '#FBBF24',
    primaryDark: '#D97706',
    onPrimary: '#000000',
    background: '#FFFBEB',
    backgroundSecondary: '#FEF3C7'
  },
  {
    id: 'lavender-light',
    name: 'Lavender Mist',
    type: 'light',
    primary: '#8B5CF6',
    primaryLight: '#A78BFA',
    primaryDark: '#6D28D9',
    onPrimary: '#FFFFFF',
    background: '#F5F3FF',
    backgroundSecondary: '#EDE9FE',
  },
  {
    id: 'mint-light',
    name: 'Fresh Mint',
    type: 'light',
    primary: '#10B981',
    primaryLight: '#34D399',
    primaryDark: '#059669',
    onPrimary: '#FFFFFF',
    background: '#F0FDF4',
    backgroundSecondary: '#DCFCE7',
  },
  {
    id: 'peach-light',
    name: 'Peach Sorbet',
    type: 'light',
    primary: '#F97316',
    primaryLight: '#FB923C',
    primaryDark: '#EA580C',
    onPrimary: '#FFFFFF',
    background: '#FFF7ED',
    backgroundSecondary: '#FFEDD5',
  },
  {
    id: 'slate-pro',
    name: 'Slate Pro',
    type: 'light',
    primary: '#334155',
    primaryLight: '#475569',
    primaryDark: '#1E293B',
    background: '#F8FAFC',
    backgroundSecondary: '#F1F5F9',
  },

  // --- DARK THEMES ---
  {
    id: 'classic-dark',
    name: 'Deep Space',
    type: 'dark',
    primary: '#6366F1',
    primaryLight: '#818CF8',
    primaryDark: '#4338CA'
    // Uses default dark backgrounds
  },
  {
    id: 'midnight-pro',
    name: 'Midnight Pro',
    type: 'dark',
    primary: '#D8B4FE', // Light Purple
    primaryLight: '#E9D5FF',
    primaryDark: '#A855F7',
    background: '#0F0720', // Very dark purple/black
    backgroundSecondary: '#241445',
    surface: '#1E1035',
    card: '#1E1035',
    modal: '#1E1035',
  },
  {
    id: 'sea-dark',
    name: 'Abyss',
    type: 'dark',
    primary: '#5EEAD4', // Teal 300
    primaryLight: '#99F6E4',
    primaryDark: '#2DD4BF',
    background: '#041C25', // Deep Teal
    backgroundSecondary: '#0E3945',
    surface: '#092E38',
    card: '#092E38',
    modal: '#092E38',
  },
  {
    id: 'forest-dark',
    name: 'Deep Forest',
    type: 'dark',
    primary: '#4ADE80', // Green 400
    primaryLight: '#86EFAC',
    primaryDark: '#22C55E',
    background: '#022C22', // Teal/Green 950
    backgroundSecondary: '#064E3B',
    surface: '#065F46',
    card: '#064E3B',
    modal: '#064E3B',
  },
  {
    id: 'sunset-dark',
    name: 'Sunset Glow',
    type: 'dark',
    primary: '#FDBA74', // Orange 300
    primaryLight: '#FED7AA',
    primaryDark: '#F97316',
    background: '#2A1208', // Dark Orange/Brown
    backgroundSecondary: '#431407',
    surface: '#431407',
    card: '#431407',
    modal: '#431407',
  },
  {
    id: 'nordic-dark',
    name: 'Nordic Night',
    type: 'dark',
    primary: '#88C0D0',
    primaryLight: '#8FBCBB',
    primaryDark: '#5E81AC',
    background: '#2E3440',
    backgroundSecondary: '#3B4252',
    surface: '#3B4252',
    card: '#3B4252',
    modal: '#3B4252'
  },
  {
    id: 'oled-black',
    name: 'OLED Black',
    type: 'dark',
    primary: '#FFFFFF',
    primaryLight: '#E2E8F0',
    primaryDark: '#94A3B8',
    onPrimary: '#000000',
    background: '#000000',
    backgroundSecondary: '#111111',
    surface: '#0A0A0A',
    card: '#0A0A0A',
    modal: '#0A0A0A',
  },
  {
    id: 'matrix-dark',
    name: 'The Matrix',
    type: 'dark',
    primary: '#00FF41',
    primaryLight: '#008F11',
    primaryDark: '#003B00',
    onPrimary: '#000000',
    background: '#000800',
    backgroundSecondary: '#001A00',
    surface: '#001A00',
    card: '#000D00',
    modal: '#0A0A0A',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    type: 'dark',
    primary: '#FCEE09', // Cyberpunk Yellow
    primaryLight: '#00FF9F', // Neon Green
    primaryDark: '#FF003C', // Neon Red
    onPrimary: '#000000',
    background: '#0D0221',
    backgroundSecondary: '#190E4F',
    surface: '#261447',
    card: '#261447',
    modal: '#190E4F',
  },
  {
    id: 'royal-dark',
    name: 'Royal Purple',
    type: 'dark',
    primary: '#FBBF24', // Gold
    primaryLight: '#FDE68A',
    primaryDark: '#D97706',
    onPrimary: '#000000',
    background: '#1E1B4B', // Deep Indigo
    backgroundSecondary: '#312E81',
    surface: '#312E81',
    card: '#3730A3',
    modal: '#312E81',
  }
];

// Keep for compatibility if needed, but we essentially rely on PREMIUM_THEMES now
export const THEME_PRESETS = PREMIUM_THEMES;

export interface ThemeOverrides {
  primary?: string;
  secondary?: string;
  background?: string;
  card?: string;
  text?: string;
  borderRadius?: 'sharp' | 'medium' | 'rounded';
  shadowIntensity?: 'none' | 'low' | 'medium' | 'high';
}

export const generateTheme = (themeId: string, overrides: ThemeOverrides = {}): Theme => {
  const preset = PREMIUM_THEMES.find(p => p.id === themeId) || PREMIUM_THEMES[0];
  const isDark = preset.type === 'dark';
  const baseColors = isDark ? darkTheme.colors : lightTheme.colors;

  // Resolve primary colors
  const primary = overrides.primary || preset.primary;
  // If primary is overridden, we might want to derive light/dark, but for now we'll just use the preset's or a fallback
  const primaryLight = overrides.primary ? `${overrides.primary}CC` : preset.primaryLight;
  const primaryDark = overrides.primary ? `${overrides.primary}EE` : preset.primaryDark;

  const resolvedColors = {
    ...baseColors,

    // Override Base Colors if present in preset
    background: overrides.background || preset.background || baseColors.background,
    backgroundSecondary: preset.backgroundSecondary || baseColors.backgroundSecondary,
    surface: preset.surface || baseColors.surface,
    card: overrides.card || preset.card || baseColors.card,
    modal: preset.modal || baseColors.modal,

    // Primary Overrides
    primary: primary,
    primaryLight: primaryLight,
    primaryDark: primaryDark,
    onPrimary: preset.onPrimary || baseColors.onPrimary,

    // Secondary Overrides
    secondary: overrides.secondary || preset.secondary || baseColors.secondary,
    secondaryLight: preset.secondaryLight || baseColors.secondaryLight,

    // Text Overrides
    text: overrides.text || baseColors.text,
  };

  // Handle Border Radius Overrides
  const radiusMap = {
    sharp: { s: 0, m: 2, l: 4, xl: 8, round: 9999 },
    medium: commonTokens.borderRadius,
    rounded: { s: 12, m: 18, l: 24, xl: 32, round: 9999 },
  };
  const resolvedBorderRadius = overrides.borderRadius ? radiusMap[overrides.borderRadius] : commonTokens.borderRadius;

  // Handle Shadow Overrides
  const shadowIntensity = overrides.shadowIntensity || 'medium';
  const shadowOpacityMap = {
    none: { small: 0, medium: 0, large: 0 },
    low: { small: 0.02, medium: 0.05, large: 0.08 },
    medium: { small: 0.05, medium: 0.1, large: 0.15 },
    high: { small: 0.1, medium: 0.2, large: 0.3 },
  };
  const opacities = shadowOpacityMap[shadowIntensity];

  const resolvedShadows = {
    small: {
      ...commonTokens.shadows.small,
      ...Platform.select({
        default: {
          shadowOpacity: opacities.small,
          elevation: shadowIntensity === 'none' ? 0 : 2
        }
      })
    },
    medium: {
      ...commonTokens.shadows.medium,
      ...Platform.select({
        default: {
          shadowOpacity: opacities.medium,
          elevation: shadowIntensity === 'none' ? 0 : 4
        }
      })
    },
    large: {
      ...commonTokens.shadows.large,
      ...Platform.select({
        default: {
          shadowOpacity: opacities.large,
          elevation: shadowIntensity === 'none' ? 0 : 10
        }
      })
    },
  };

  return {
    ...commonTokens,
    borderRadius: resolvedBorderRadius,
    shadows: resolvedShadows,
    isDark,
    colors: {
      ...resolvedColors,
      gradients: {
        ...baseColors.gradients,
        primary: [resolvedColors.primary, resolvedColors.primaryLight],
        card: isDark
          ? [resolvedColors.card, resolvedColors.backgroundSecondary]
          : [resolvedColors.card, resolvedColors.background],
        surface: [resolvedColors.background, resolvedColors.surface],
      }
    },
  };
};


export const lightTheme: Theme = {
  isDark: false,
  ...commonTokens,
  colors: {
    // Backgrounds - Clean & bright
    background: '#F8FAFC', // Slate 50
    backgroundSecondary: '#F1F5F9', // Slate 100
    surface: '#FFFFFF',
    card: '#FFFFFF',
    modal: '#FFFFFF',

    // Text - Sharp Contrast
    text: '#0F172A', // Slate 900
    textSecondary: '#64748B', // Slate 500
    textTertiary: '#94A3B8', // Slate 400
    textInverse: '#FFFFFF',

    // Primary - Vibrant Violet/Indigo (Default)
    primary: '#6366F1', // Indigo 500
    primaryLight: '#818CF8', // Indigo 400
    primaryDark: '#4338CA', // Indigo 700
    onPrimary: '#FFFFFF',

    // Secondary - Cyan/Teal accent
    secondary: '#06B6D4', // Cyan 500
    secondaryLight: '#22D3EE', // Cyan 400

    // UI Elements
    border: '#E2E8F0', // Slate 200
    divider: '#F1F5F9', // Slate 100
    icon: '#475569', // Slate 600
    iconSecondary: '#94A3B8', // Slate 400

    // Status
    success: '#10B981', // Emerald 500
    error: '#EF4444', // Red 500
    warning: '#F59E0B', // Amber 500
    info: '#3B82F6', // Blue 500

    // Gradients
    gradients: {
      primary: ['#6366F1', '#818CF8'],
      card: ['#FFFFFF', '#F8FAFC'],
      surface: ['#FFFFFF', '#FFFFFF'],
    },

    overlay: 'rgba(0, 0, 0, 0.4)',
  },
};

export const darkTheme: Theme = {
  isDark: true,
  ...commonTokens,
  colors: {
    // Backgrounds - Deep & Rich (Night Sky)
    background: '#101922',
    backgroundSecondary: '#1c2936',
    surface: '#1c2936',
    card: '#1c2936',
    modal: '#1c2936',

    // Text
    text: '#FAFAFA', // Zinc 50
    textSecondary: '#A1A1AA', // Zinc 400
    textTertiary: '#71717A', // Zinc 500
    textInverse: '#09090b',

    // Primary
    primary: '#6366F1', // Indigo 500 (Consistent default)
    primaryLight: '#818CF8',
    primaryDark: '#4338CA',
    onPrimary: '#FFFFFF',

    // Secondary
    secondary: '#22D3EE', // Cyan 400
    secondaryLight: '#67E8F9', // Cyan 300

    // UI Elements
    border: '#27272a', // Zinc 800
    divider: '#27272a', // Zinc 800
    icon: '#D4D4D8', // Zinc 300
    iconSecondary: '#71717A', // Zinc 500

    // Status
    success: '#34D399', // Emerald 400
    error: '#F87171', // Red 400
    warning: '#FBBF24', // Amber 400
    info: '#60A5FA', // Blue 400

    // Gradients
    gradients: {
      primary: ['#6366F1', '#818CF8'], // Matched to Indigo
      card: ['#1c2936', '#2d4052'],
      surface: ['#101922', '#1c2936'],
    },

    overlay: 'rgba(0, 0, 0, 0.7)',
  },
};
