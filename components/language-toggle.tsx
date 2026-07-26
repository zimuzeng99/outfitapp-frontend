import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts, FontWeights, Radii, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLocale } from '@/lib/i18n/locale-context';
import type { AppLocale } from '@/lib/i18n/types';

const OPTIONS: { value: AppLocale; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'zh', label: '中文' },
];

export function LanguageToggle() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { locale, setLocale } = useLocale();

  return (
    <View style={[styles.track, { backgroundColor: colors.accentSoft }]}>
      {OPTIONS.map((option) => {
        const selected = locale === option.value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => setLocale(option.value)}
            style={[
              styles.option,
              selected && [
                Shadows.soft,
                { backgroundColor: colors.background },
              ],
            ]}
          >
            <ThemedText
              style={[
                styles.label,
                { color: selected ? colors.text : colors.muted },
              ]}
            >
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: Radii.md,
    padding: 3,
    gap: 2,
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 13,
    minWidth: 42,
    alignItems: 'center',
  },
  label: {
    fontFamily: Fonts.uiMedium,
    fontWeight: FontWeights.medium,
    fontSize: 12,
    lineHeight: 16,
  },
});
