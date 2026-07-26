/**
 * Minimal lifestyle design tokens — bright, airy, SF Pro system type.
 */

import { Platform, type TextStyle, type ViewStyle } from 'react-native';

export const Colors = {
  light: {
    text: '#1C1C1E',
    background: '#FFFFFF',
    surface: '#F7F5F2',
    muted: '#8E8E93',
    tint: '#3A3A3C',
    accentSoft: '#EFECE8',
    placeholder: '#E5E2DE',
    icon: '#8E8E93',
    tabIconDefault: '#8E8E93',
    tabIconSelected: '#3A3A3C',
  },
  dark: {
    text: '#F5F5F7',
    background: '#1C1C1E',
    surface: '#2C2C2E',
    muted: '#8E8E93',
    tint: '#F5F5F7',
    accentSoft: '#3A3A3C',
    placeholder: '#48484A',
    icon: '#8E8E93',
    tabIconDefault: '#8E8E93',
    tabIconSelected: '#F5F5F7',
  },
};

export const Radii = {
  md: 16,
  lg: 18,
  xl: 20,
} as const;

export const Shadows = {
  soft: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
    },
    android: {
      elevation: 2,
    },
    default: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
    },
  })!,
};

/** System SF Pro on iOS; platform UI font elsewhere. */
const systemSans = Platform.select({
  ios: undefined,
  android: 'sans-serif',
  web: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  default: undefined,
});

export const FontWeights = {
  light: '300' as TextStyle['fontWeight'],
  medium: '500' as TextStyle['fontWeight'],
};

export const FontFamilies = {
  display: systemSans,
  displaySemiBold: systemSans,
  ui: systemSans,
  uiMedium: systemSans,
  uiSemiBold: systemSans,
};

const platformFonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
})!;

export const Fonts = {
  ...FontFamilies,
  ...platformFonts,
};
