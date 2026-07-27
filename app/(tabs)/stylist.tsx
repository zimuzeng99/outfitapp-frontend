import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GarmentTile } from '@/components/garment-tile';
import { LanguageToggle } from '@/components/language-toggle';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Fonts, FontWeights, Radii, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { recommendOutfits } from '@/lib/api/outfits';
import type {
  BuyAdviceResponse,
  RecommendedOutfit,
  WardrobeValue,
} from '@/lib/api/types';
import { useLocale } from '@/lib/i18n/locale-context';
import type { TranslationKey } from '@/lib/i18n/types';
import {
  requestBuyAdvice,
  type BuyAdviceProgress,
} from '@/lib/request-buy-advice';
import { useUserId } from '@/lib/user/user-context';

type StylistMode = 'outfits' | 'buy';

type OutfitCardGarment = {
  garmentId?: string | null;
  label: string;
  imageUrl: string;
};

type OutfitCardData = {
  title?: string;
  rationale?: string;
  garments?: OutfitCardGarment[];
};

const WARDROBE_VALUE_KEYS: Record<WardrobeValue, TranslationKey> = {
  HIGH: 'stylist.wardrobeValueHigh',
  MEDIUM: 'stylist.wardrobeValueMedium',
  LOW: 'stylist.wardrobeValueLow',
};

function buildExcludeOutfits(outfits: RecommendedOutfit[]): string[][] {
  return outfits
    .map((outfit) =>
      (outfit.garments ?? [])
        .map((garment) => garment.garmentId)
        .filter((id): id is string => Boolean(id)),
    )
    .filter((ids) => ids.length > 0);
}

function GetOutfitsButton({
  label,
  onPress,
  disabled,
  tint,
  variant = 'primary',
  surface,
}: {
  label: string;
  onPress: () => void;
  disabled: boolean;
  tint: string;
  variant?: 'primary' | 'secondary';
  surface?: string;
}) {
  const scale = useSharedValue(1);
  const isSecondary = variant === 'secondary';

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 18, stiffness: 320 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 18, stiffness: 320 });
      }}
    >
      <Animated.View
        style={[
          styles.ctaButton,
          isSecondary
            ? [styles.ctaButtonSecondary, { backgroundColor: surface, borderColor: tint }]
            : { backgroundColor: tint },
          disabled && styles.ctaButtonDisabled,
          animatedStyle,
        ]}
      >
        <ThemedText
          style={[styles.ctaButtonLabel, isSecondary && { color: tint }]}
        >
          {label}
        </ThemedText>
      </Animated.View>
    </Pressable>
  );
}

function OutfitCard({
  outfit,
  index,
  surface,
  muted,
  emptyGarmentsLabel,
}: {
  outfit: OutfitCardData;
  index: number;
  surface: string;
  muted: string;
  emptyGarmentsLabel: string;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);
  const garments = outfit.garments ?? [];

  useEffect(() => {
    const delay = Math.min(index * 60, 240);
    opacity.value = withDelay(delay, withTiming(1, { duration: 360 }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 360 }));
  }, [index, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.outfitCard,
        Shadows.soft,
        { backgroundColor: surface },
        animatedStyle,
      ]}
    >
      {outfit.title ? (
        <ThemedText style={styles.outfitTitle}>{outfit.title}</ThemedText>
      ) : null}
      {outfit.rationale ? (
        <ThemedText style={[styles.outfitRationale, { color: muted }]}>
          {outfit.rationale}
        </ThemedText>
      ) : null}
      {garments.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.garmentRow}
        >
          {garments.map((garment, garmentIndex) => (
            <View
              key={garment.garmentId ?? `candidate-${index}-${garmentIndex}`}
              style={styles.garmentTileWrap}
            >
              <GarmentTile garment={garment} index={garmentIndex} />
            </View>
          ))}
        </ScrollView>
      ) : (
        <ThemedText type="muted" style={styles.noGarments}>
          {emptyGarmentsLabel}
        </ThemedText>
      )}
    </Animated.View>
  );
}

function ModeSegment({
  mode,
  onChange,
  surface,
  tint,
  muted,
  outfitsLabel,
  buyLabel,
  disabled,
}: {
  mode: StylistMode;
  onChange: (mode: StylistMode) => void;
  surface: string;
  tint: string;
  muted: string;
  outfitsLabel: string;
  buyLabel: string;
  disabled: boolean;
}) {
  return (
    <View style={[styles.segmentTrack, { backgroundColor: surface }]}>
      {([
        { key: 'outfits' as const, label: outfitsLabel },
        { key: 'buy' as const, label: buyLabel },
      ]).map((option) => {
        const selected = mode === option.key;
        return (
          <Pressable
            key={option.key}
            disabled={disabled || selected}
            onPress={() => onChange(option.key)}
            style={[
              styles.segmentOption,
              selected && { backgroundColor: tint },
            ]}
          >
            <ThemedText
              style={[styles.segmentLabel, { color: selected ? '#fff' : muted }]}
            >
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function StylistScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const tint = colors.tint;
  const { locale, t } = useLocale();
  const userId = useUserId();

  const [mode, setMode] = useState<StylistMode>('outfits');

  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outfits, setOutfits] = useState<RecommendedOutfit[] | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [submittedContext, setSubmittedContext] = useState<string | null>(null);

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [buyPhase, setBuyPhase] = useState<BuyAdviceProgress | null>(null);
  const [buyError, setBuyError] = useState<string | null>(null);
  const [buyAdvice, setBuyAdvice] = useState<BuyAdviceResponse | null>(null);

  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(10);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 420 });
    headerTranslateY.value = withTiming(0, { duration: 420 });
  }, [headerOpacity, headerTranslateY]);

  useEffect(() => {
    setOutfits(null);
    setHasMore(false);
    setSubmittedContext(null);
    setError(null);
    setBuyAdvice(null);
    setBuyError(null);
  }, [locale]);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const buyBusy = buyPhase !== null;
  const trimmed = context.trim();
  const canSubmit = trimmed.length > 0 && !loading && !loadingMore;
  const canSubmitBuy = photoUri !== null && !buyBusy;

  const clearOutfitResults = useCallback(() => {
    setOutfits(null);
    setHasMore(false);
    setSubmittedContext(null);
    setError(null);
  }, []);

  const clearBuyResults = useCallback(() => {
    setBuyAdvice(null);
    setBuyError(null);
  }, []);

  const handleModeChange = useCallback(
    (next: StylistMode) => {
      if (next === mode || loading || loadingMore || buyBusy) {
        return;
      }
      setMode(next);
      if (next === 'outfits') {
        clearBuyResults();
      } else {
        clearOutfitResults();
      }
    },
    [buyBusy, clearBuyResults, clearOutfitResults, loading, loadingMore, mode],
  );

  const handleSubmit = useCallback(async () => {
    if (!trimmed || loading || loadingMore) {
      return;
    }

    setLoading(true);
    setError(null);
    setOutfits(null);
    setHasMore(false);
    setSubmittedContext(null);

    try {
      const response = await recommendOutfits(userId, trimmed, locale);
      setOutfits(response.outfits);
      setHasMore(response.hasMore);
      setSubmittedContext(response.context);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('stylist.requestFailed');
      setError(message);
      setOutfits(null);
      setHasMore(false);
      setSubmittedContext(null);
    } finally {
      setLoading(false);
    }
  }, [loading, loadingMore, locale, t, trimmed, userId]);

  const handleLoadMore = useCallback(async () => {
    if (!submittedContext || !outfits || !hasMore || loading || loadingMore) {
      return;
    }

    setLoadingMore(true);
    setError(null);

    try {
      const response = await recommendOutfits(
        userId,
        submittedContext,
        locale,
        buildExcludeOutfits(outfits),
      );
      setOutfits((prev) => [...(prev ?? []), ...response.outfits]);
      setHasMore(response.hasMore);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('stylist.requestFailed');
      setError(message);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loading, loadingMore, locale, outfits, submittedContext, t, userId]);

  const handlePickPhoto = useCallback(async () => {
    if (buyBusy) {
      return;
    }

    setBuyError(null);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setBuyError(t('stylist.buyPermissionRequired'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 0.85,
    });

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    setPhotoUri(result.assets[0].uri);
    setBuyAdvice(null);
  }, [buyBusy, t]);

  const handleBuySubmit = useCallback(async () => {
    if (!photoUri || buyBusy) {
      return;
    }

    setBuyError(null);
    setBuyAdvice(null);

    try {
      const advice = await requestBuyAdvice(userId, photoUri, {
        lang: locale,
        onProgress: setBuyPhase,
      });
      setBuyAdvice(advice);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('stylist.buyRequestFailed');
      setBuyError(message);
      setBuyAdvice(null);
    } finally {
      setBuyPhase(null);
    }
  }, [buyBusy, locale, photoUri, t, userId]);

  const screenHeader = (
    <Animated.View style={[styles.header, headerAnimatedStyle]}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <ThemedText type="title" style={styles.title}>
            {t('stylist.title')}
          </ThemedText>
          <ThemedText type="muted">
            {mode === 'outfits' ? t('stylist.subtitle') : t('stylist.buySubtitle')}
          </ThemedText>
        </View>
        <LanguageToggle />
      </View>

      <ModeSegment
        mode={mode}
        onChange={handleModeChange}
        surface={colors.surface}
        tint={tint}
        muted={colors.muted}
        outfitsLabel={t('stylist.modeOutfits')}
        buyLabel={t('stylist.modeBuy')}
        disabled={loading || loadingMore || buyBusy}
      />
    </Animated.View>
  );

  const outfitListHeader = (
    <View>
      {screenHeader}

      <View
        style={[
          styles.inputWrap,
          Shadows.soft,
          { backgroundColor: colors.surface },
        ]}
      >
        <TextInput
          value={context}
          onChangeText={setContext}
          placeholder={t('stylist.placeholder')}
          placeholderTextColor={colors.muted}
          multiline
          editable={!loading && !loadingMore}
          style={[styles.input, { color: colors.text }]}
        />
      </View>

      <GetOutfitsButton
        label={loading ? t('stylist.thinking') : t('stylist.getOutfits')}
        onPress={() => void handleSubmit()}
        disabled={!canSubmit}
        tint={tint}
      />

      {loading ? (
        <View style={styles.statusRow}>
          <ActivityIndicator size="small" color={tint} />
          <ThemedText type="muted" style={styles.statusText}>
            {t('stylist.finding')}
          </ThemedText>
        </View>
      ) : null}

      {error ? (
        <ThemedText style={[styles.errorText, { color: tint }]}>{error}</ThemedText>
      ) : null}

      {submittedContext ? (
        <ThemedText type="muted" style={styles.resultsLabel}>
          {t('stylist.resultsFor', { context: submittedContext })}
        </ThemedText>
      ) : null}
    </View>
  );

  const outfitListFooter =
    hasMore && outfits && outfits.length > 0 && !loading ? (
      <View style={styles.moreFooter}>
        {loadingMore ? (
          <View style={styles.statusRow}>
            <ActivityIndicator size="small" color={tint} />
            <ThemedText type="muted" style={styles.statusText}>
              {t('stylist.findingMore')}
            </ThemedText>
          </View>
        ) : null}
        <GetOutfitsButton
          label={loadingMore ? t('stylist.findingMore') : t('stylist.moreOutfits')}
          onPress={() => void handleLoadMore()}
          disabled={loadingMore}
          tint={tint}
          variant="secondary"
          surface={colors.surface}
        />
      </View>
    ) : null;

  const nearDuplicates = buyAdvice?.overlap?.nearDuplicates ?? [];
  const potentialOutfits = buyAdvice?.potentialOutfits ?? [];

  if (mode === 'buy') {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
        <ThemedView style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
          >
            {screenHeader}

            <Pressable
              onPress={() => void handlePickPhoto()}
              disabled={buyBusy}
              style={[
                styles.photoPicker,
                Shadows.soft,
                { backgroundColor: colors.surface },
                buyBusy && styles.ctaButtonDisabled,
              ]}
            >
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.photoPreview} contentFit="cover" />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <ThemedText type="muted">{t('stylist.pickPhoto')}</ThemedText>
                </View>
              )}
              <ThemedText style={[styles.photoPickerLabel, { color: tint }]}>
                {photoUri ? t('stylist.changePhoto') : t('stylist.pickPhoto')}
              </ThemedText>
            </Pressable>

            <GetOutfitsButton
              label={
                buyPhase === 'uploading'
                  ? t('stylist.buyUploading')
                  : buyPhase === 'analyzing'
                    ? t('stylist.buyAnalyzing')
                    : t('stylist.getAdvice')
              }
              onPress={() => void handleBuySubmit()}
              disabled={!canSubmitBuy}
              tint={tint}
            />

            {buyBusy ? (
              <View style={styles.statusRow}>
                <ActivityIndicator size="small" color={tint} />
                <ThemedText type="muted" style={styles.statusText}>
                  {buyPhase === 'uploading'
                    ? t('stylist.buyUploading')
                    : t('stylist.buyAnalyzing')}
                </ThemedText>
              </View>
            ) : null}

            {buyError ? (
              <ThemedText style={[styles.errorText, { color: tint }]}>{buyError}</ThemedText>
            ) : null}

            {!buyBusy && !buyError && !buyAdvice ? (
              <View style={styles.emptyState}>
                <ThemedText type="muted" style={styles.emptyCopy}>
                  {t('stylist.buyEmptyPrompt')}
                </ThemedText>
              </View>
            ) : null}

            {buyAdvice ? (
              <View style={styles.buyResults}>
                {buyAdvice.wardrobeValue || buyAdvice.rationale ? (
                  <View
                    style={[
                      styles.verdictBadge,
                      Shadows.soft,
                      { backgroundColor: colors.surface },
                    ]}
                  >
                    {buyAdvice.wardrobeValue ? (
                      <ThemedText style={styles.verdictLabel}>
                        {t(WARDROBE_VALUE_KEYS[buyAdvice.wardrobeValue])}
                      </ThemedText>
                    ) : null}
                    {buyAdvice.rationale ? (
                      <ThemedText style={[styles.rationale, { color: colors.muted }]}>
                        {buyAdvice.rationale}
                      </ThemedText>
                    ) : null}
                  </View>
                ) : null}

                {nearDuplicates.length > 0 ? (
                  <>
                    <ThemedText style={styles.sectionTitle}>
                      {t('stylist.nearDuplicates')}
                    </ThemedText>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.garmentRow}
                    >
                      {nearDuplicates.map((garment, index) => (
                        <View key={garment.garmentId} style={styles.garmentTileWrap}>
                          <GarmentTile garment={garment} index={index} />
                        </View>
                      ))}
                    </ScrollView>
                  </>
                ) : null}

                <ThemedText style={[styles.sectionTitle, styles.potentialTitle]}>
                  {t('stylist.potentialOutfits')}
                </ThemedText>
                {potentialOutfits.length > 0 ? (
                  potentialOutfits.map((outfit, index) => (
                    <OutfitCard
                      key={`buy-outfit-${index}`}
                      outfit={outfit}
                      index={index}
                      surface={colors.surface}
                      muted={colors.muted}
                      emptyGarmentsLabel={t('stylist.noGarments')}
                    />
                  ))
                ) : (
                  <ThemedText type="muted" style={styles.noGarments}>
                    {t('stylist.noPotentialOutfits')}
                  </ThemedText>
                )}
              </View>
            ) : null}
          </ScrollView>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <ThemedView style={styles.container}>
        <FlatList
          data={outfits ?? []}
          keyExtractor={(_, index) => `outfit-${index}`}
          contentContainerStyle={styles.list}
          ListHeaderComponent={outfitListHeader}
          ListFooterComponent={outfitListFooter}
          ListEmptyComponent={
            !loading && !error ? (
              <View style={styles.emptyState}>
                <ThemedText type="muted" style={styles.emptyCopy}>
                  {outfits === null
                    ? t('stylist.emptyPrompt')
                    : t('stylist.emptyResults')}
                </ThemedText>
              </View>
            ) : null
          }
          renderItem={({ item, index }) => (
            <OutfitCard
              outfit={item}
              index={index}
              surface={colors.surface}
              muted={colors.muted}
              emptyGarmentsLabel={t('stylist.noGarments')}
            />
          )}
          keyboardShouldPersistTaps="handled"
        />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    marginTop: 28,
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerText: {
    flexShrink: 1,
    gap: 6,
  },
  title: {
    flexShrink: 1,
  },
  segmentTrack: {
    flexDirection: 'row',
    borderRadius: Radii.lg,
    padding: 4,
    marginTop: 18,
    gap: 4,
  },
  segmentOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: Radii.md,
  },
  segmentLabel: {
    fontFamily: Fonts.uiMedium,
    fontWeight: FontWeights.medium,
    fontSize: 13,
    lineHeight: 16,
    textAlign: 'center',
  },
  inputWrap: {
    borderRadius: Radii.xl,
    marginBottom: 16,
  },
  input: {
    minHeight: 104,
    borderWidth: 0,
    borderRadius: Radii.xl,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: Fonts.ui,
    fontWeight: FontWeights.light,
    fontSize: 15,
    lineHeight: 24,
    textAlignVertical: 'top',
  },
  ctaButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: Radii.lg,
    marginBottom: 18,
  },
  ctaButtonSecondary: {
    borderWidth: 1,
  },
  ctaButtonDisabled: {
    opacity: 0.5,
  },
  ctaButtonLabel: {
    fontFamily: Fonts.uiMedium,
    fontWeight: FontWeights.medium,
    color: '#fff',
    fontSize: 14,
    lineHeight: 18,
  },
  moreFooter: {
    marginTop: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  statusText: {
    fontSize: 13,
  },
  errorText: {
    fontFamily: Fonts.ui,
    fontWeight: FontWeights.light,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 14,
  },
  resultsLabel: {
    fontSize: 13,
    marginBottom: 16,
  },
  list: {
    paddingBottom: 40,
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyCopy: {
    fontSize: 15,
    textAlign: 'center',
  },
  photoPicker: {
    borderRadius: Radii.xl,
    overflow: 'hidden',
    marginBottom: 16,
  },
  photoPreview: {
    width: '100%',
    height: 220,
  },
  photoPlaceholder: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPickerLabel: {
    fontFamily: Fonts.uiMedium,
    fontWeight: FontWeights.medium,
    fontSize: 14,
    lineHeight: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  buyResults: {
    marginTop: 8,
  },
  verdictBadge: {
    borderRadius: Radii.xl,
    padding: 18,
    marginBottom: 16,
  },
  verdictLabel: {
    fontFamily: Fonts.display,
    fontWeight: FontWeights.medium,
    fontSize: 28,
    lineHeight: 34,
    marginBottom: 8,
  },
  rationale: {
    fontFamily: Fonts.ui,
    fontWeight: FontWeights.light,
    fontSize: 15,
    lineHeight: 22,
  },
  sectionTitle: {
    fontFamily: Fonts.display,
    fontWeight: FontWeights.medium,
    fontSize: 17,
    lineHeight: 22,
    marginBottom: 8,
  },
  potentialTitle: {
    marginTop: 20,
    marginBottom: 14,
  },
  outfitCard: {
    borderRadius: Radii.xl,
    padding: 18,
    marginBottom: 16,
  },
  outfitTitle: {
    fontFamily: Fonts.display,
    fontWeight: FontWeights.medium,
    fontSize: 17,
    lineHeight: 22,
    marginBottom: 8,
  },
  outfitRationale: {
    fontFamily: Fonts.ui,
    fontWeight: FontWeights.light,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 14,
  },
  garmentRow: {
    paddingRight: 8,
    gap: 10,
    marginBottom: 8,
  },
  garmentTileWrap: {
    width: 120,
    marginBottom: -22,
  },
  noGarments: {
    fontSize: 13,
    marginBottom: 8,
  },
});
