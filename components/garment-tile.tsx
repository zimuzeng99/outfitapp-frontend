import { Image } from 'expo-image';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts, FontWeights, Radii, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { GarmentSummary } from '@/lib/api/types';

type GarmentTileProps = {
  garment: GarmentSummary;
  index?: number;
  disabled?: boolean;
  onLongPress?: () => void;
  accessibilityHint?: string;
};

export function GarmentTile({
  garment,
  index = 0,
  disabled = false,
  onLongPress,
  accessibilityHint = 'Long press for options',
}: GarmentTileProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(8);

  useEffect(() => {
    const delay = Math.min(index * 40, 240);
    opacity.value = withDelay(delay, withTiming(1, { duration: 320 }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 320 }));
  }, [index, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.tile, animatedStyle, disabled && styles.tileDisabled]}>
      <Pressable
        style={styles.pressable}
        onLongPress={onLongPress}
        disabled={disabled || !onLongPress}
        delayLongPress={350}
        accessibilityRole="button"
        accessibilityHint={accessibilityHint}
      >
        <View style={[styles.imageShadow, Shadows.soft]}>
          <View
            style={[
              styles.imageWrap,
              { backgroundColor: colors.placeholder },
            ]}
          >
            <Image
              source={{ uri: garment.imageUrl }}
              style={styles.image}
              contentFit="cover"
              transition={200}
            />
          </View>
        </View>
        <ThemedText
          style={[styles.label, { color: colors.muted }]}
          numberOfLines={2}
        >
          {garment.label}
        </ThemedText>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: '100%',
    marginBottom: 22,
  },
  pressable: {
    gap: 10,
  },
  tileDisabled: {
    opacity: 0.55,
  },
  imageShadow: {
    borderRadius: Radii.lg,
    backgroundColor: '#FFFFFF',
  },
  imageWrap: {
    aspectRatio: 3 / 4,
    borderRadius: Radii.lg,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  label: {
    fontFamily: Fonts.ui,
    fontWeight: FontWeights.light,
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 2,
    textTransform: 'capitalize',
  },
});
