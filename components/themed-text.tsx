import { StyleSheet, Text, type TextProps } from 'react-native';

import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'muted';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const tint = useThemeColor({}, 'tint');
  const muted = useThemeColor({}, 'muted');

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? [styles.link, { color: tint }] : undefined,
        type === 'muted' ? [styles.muted, { color: muted }] : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontFamily: Fonts.ui,
    fontWeight: FontWeights.light,
    fontSize: 15,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontFamily: Fonts.uiMedium,
    fontWeight: FontWeights.medium,
    fontSize: 15,
    lineHeight: 22,
  },
  title: {
    fontFamily: Fonts.display,
    fontWeight: FontWeights.medium,
    fontSize: 34,
    lineHeight: 40,
    paddingTop: 2,
  },
  subtitle: {
    fontFamily: Fonts.display,
    fontWeight: FontWeights.medium,
    fontSize: 20,
    lineHeight: 26,
  },
  link: {
    fontFamily: Fonts.uiMedium,
    fontWeight: FontWeights.medium,
    lineHeight: 30,
    fontSize: 15,
    color: Colors.light.tint,
  },
  muted: {
    fontFamily: Fonts.ui,
    fontWeight: FontWeights.light,
    fontSize: 14,
    lineHeight: 22,
  },
});
