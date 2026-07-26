import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
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
import { deleteGarment, fetchUserGarments, updateGarmentLabel } from '@/lib/api/garments';
import type { GarmentSummary } from '@/lib/api/types';
import { useLocale } from '@/lib/i18n/locale-context';
import { uploadPhotos, type UploadPhotosProgress } from '@/lib/upload-photos';
import { useUserId } from '@/lib/user/user-context';

const SCREEN_PADDING_HORIZONTAL = 20;
const COLUMN_GAP = 14;

function AddPhotosButton({
  label,
  onPress,
  disabled,
  tint,
}: {
  label: string;
  onPress: () => void;
  disabled: boolean;
  tint: string;
}) {
  const scale = useSharedValue(1);

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
          styles.addButton,
          { backgroundColor: tint },
          disabled && styles.addButtonDisabled,
          animatedStyle,
        ]}
      >
        <ThemedText style={styles.addButtonLabel}>{label}</ThemedText>
      </Animated.View>
    </Pressable>
  );
}

export default function WardrobeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const tint = colors.tint;
  const { locale, t } = useLocale();
  const userId = useUserId();
  const { width: windowWidth } = useWindowDimensions();
  const tileWidth =
    (windowWidth - SCREEN_PADDING_HORIZONTAL * 2 - COLUMN_GAP) / 2;

  const [garments, setGarments] = useState<GarmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadPhase, setUploadPhase] = useState<UploadPhotosProgress | null>(null);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [renamingGarment, setRenamingGarment] = useState<GarmentSummary | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);

  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(10);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 420 });
    headerTranslateY.value = withTiming(0, { duration: 420 });
  }, [headerOpacity, headerTranslateY]);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const loadGarments = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'refresh') {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await fetchUserGarments(userId, locale);
      setGarments(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('wardrobe.loadFailed');
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [locale, t, userId]);

  useEffect(() => {
    void loadGarments('initial');
  }, [loadGarments]);

  const closeRenameModal = useCallback(() => {
    if (renamingId) {
      return;
    }
    setRenamingGarment(null);
    setRenameDraft('');
  }, [renamingId]);

  const handleDeleteGarment = useCallback((garment: GarmentSummary) => {
    if (deletingId || renamingId) {
      return;
    }

    Alert.alert(
      t('wardrobe.deleteTitle'),
      t('wardrobe.deleteMessage', { label: garment.label }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setDeletingId(garment.garmentId);
              setUploadNotice(null);

              try {
                await deleteGarment(userId, garment.garmentId);
                setGarments((current) =>
                  current.filter((item) => item.garmentId !== garment.garmentId),
                );
              } catch (err) {
                const message =
                  err instanceof Error ? err.message : t('wardrobe.deleteFailed');
                setUploadNotice(message);
              } finally {
                setDeletingId(null);
              }
            })();
          },
        },
      ],
    );
  }, [deletingId, renamingId, t, userId]);

  const openRenameModal = useCallback((garment: GarmentSummary) => {
    setUploadNotice(null);
    setRenamingGarment(garment);
    setRenameDraft(garment.label);
  }, []);

  const handleSaveRename = useCallback(() => {
    if (!renamingGarment || renamingId) {
      return;
    }

    const trimmed = renameDraft.trim();
    if (!trimmed) {
      return;
    }

    if (trimmed === renamingGarment.label) {
      setRenamingGarment(null);
      setRenameDraft('');
      return;
    }

    void (async () => {
      setRenamingId(renamingGarment.garmentId);
      setUploadNotice(null);

      try {
        const updated = await updateGarmentLabel(
          userId,
          renamingGarment.garmentId,
          trimmed,
          locale,
        );
        setGarments((current) =>
          current.map((item) =>
            item.garmentId === updated.garmentId ? updated : item,
          ),
        );
        setRenamingGarment(null);
        setRenameDraft('');
      } catch (err) {
        const message =
          err instanceof Error ? err.message : t('wardrobe.renameFailed');
        setUploadNotice(message);
      } finally {
        setRenamingId(null);
      }
    })();
  }, [locale, renameDraft, renamingGarment, renamingId, t, userId]);

  const handleGarmentLongPress = useCallback((garment: GarmentSummary) => {
    if (deletingId || renamingId) {
      return;
    }

    Alert.alert(garment.label, undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('wardrobe.rename'),
        onPress: () => openRenameModal(garment),
      },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          // Defer so the action sheet can dismiss before the confirm alert.
          setTimeout(() => handleDeleteGarment(garment), 0);
        },
      },
    ]);
  }, [deletingId, handleDeleteGarment, openRenameModal, renamingId, t]);

  const canSaveRename = renameDraft.trim().length > 0 && !renamingId;

  const handleAddPhotos = useCallback(async () => {
    if (uploadPhase) {
      return;
    }

    setUploadNotice(null);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setUploadNotice(t('wardrobe.permissionRequired'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 30,
      quality: 0.85,
    });

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    const uris = result.assets.map((asset) => asset.uri);

    try {
      const summary = await uploadPhotos(userId, uris, setUploadPhase);

      if (summary.failed > 0 && summary.completed === 0) {
        setUploadNotice(t('wardrobe.extractFailed'));
      } else if (summary.failed > 0) {
        setUploadNotice(
          t('wardrobe.uploadPartial', {
            completed: summary.completed,
            failed: summary.failed,
          }),
        );
      } else {
        setUploadNotice(null);
      }

      await loadGarments('refresh');
    } catch (err) {
      const message = err instanceof Error ? err.message : t('wardrobe.uploadFailed');
      setUploadNotice(message);
    } finally {
      setUploadPhase(null);
    }
  }, [loadGarments, t, uploadPhase, userId]);

  const phaseLabel =
    uploadPhase === 'uploading'
      ? t('wardrobe.uploading')
      : uploadPhase === 'processing'
        ? t('wardrobe.processing')
        : null;

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={tint} />
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText style={[styles.errorText, { color: colors.muted }]}>{error}</ThemedText>
        <AddPhotosButton
          label={t('common.retry')}
          onPress={() => void loadGarments('initial')}
          disabled={false}
          tint={tint}
        />
      </ThemedView>
    );
  }

  const uploading = uploadPhase !== null;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <ThemedView style={styles.container}>
        <Animated.View style={[styles.header, headerAnimatedStyle]}>
          <View style={styles.headerText}>
            <ThemedText type="title" style={styles.title}>
              {t('wardrobe.title')}
            </ThemedText>
            <ThemedText type="muted">{t('wardrobe.subtitle')}</ThemedText>
          </View>
          <View style={styles.headerActions}>
            <LanguageToggle />
            <AddPhotosButton
              label={t('wardrobe.addPhotos')}
              onPress={() => void handleAddPhotos()}
              disabled={uploading}
              tint={tint}
            />
          </View>
        </Animated.View>

        {phaseLabel ? (
          <View style={styles.statusRow}>
            <ActivityIndicator size="small" color={tint} />
            <ThemedText type="muted" style={styles.statusText}>
              {phaseLabel}
            </ThemedText>
          </View>
        ) : null}

        {uploadNotice ? (
          <ThemedText style={[styles.noticeText, { color: tint }]}>{uploadNotice}</ThemedText>
        ) : null}

        <FlatList
          data={garments}
          keyExtractor={(item) => item.garmentId}
          numColumns={2}
          contentContainerStyle={garments.length === 0 ? styles.emptyList : styles.list}
          columnWrapperStyle={garments.length > 0 ? styles.row : undefined}
          refreshing={refreshing}
          onRefresh={() => void loadGarments('refresh')}
          ListEmptyComponent={
            <View style={styles.centeredEmpty}>
              <ThemedText type="muted" style={styles.emptyCopy}>
                {t('wardrobe.empty')}
              </ThemedText>
              <AddPhotosButton
                label={t('wardrobe.addFirstPhotos')}
                onPress={() => void handleAddPhotos()}
                disabled={uploading}
                tint={tint}
              />
            </View>
          }
          renderItem={({ item, index }) => (
            <View style={{ width: tileWidth }}>
              <GarmentTile
                garment={item}
                index={index}
                disabled={
                  deletingId === item.garmentId || renamingId === item.garmentId
                }
                accessibilityHint={t('wardrobe.longPressHint')}
                onLongPress={() => handleGarmentLongPress(item)}
              />
            </View>
          )}
        />

        <Modal
          visible={renamingGarment !== null}
          transparent
          animationType="fade"
          onRequestClose={closeRenameModal}
        >
          <Pressable style={styles.modalBackdrop} onPress={closeRenameModal}>
            <Pressable
              style={[
                styles.modalCard,
                Shadows.soft,
                { backgroundColor: colors.background },
              ]}
              onPress={(event) => event.stopPropagation()}
            >
              <ThemedText type="defaultSemiBold" style={styles.modalTitle}>
                {t('wardrobe.renameTitle')}
              </ThemedText>
              <TextInput
                value={renameDraft}
                onChangeText={setRenameDraft}
                maxLength={120}
                autoFocus
                editable={!renamingId}
                placeholderTextColor={colors.muted}
                style={[
                  styles.renameInput,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                  },
                ]}
              />
              <View style={styles.modalActions}>
                <Pressable
                  onPress={closeRenameModal}
                  disabled={!!renamingId}
                  style={styles.modalActionButton}
                >
                  <ThemedText type="muted">{t('common.cancel')}</ThemedText>
                </Pressable>
                <Pressable
                  onPress={handleSaveRename}
                  disabled={!canSaveRename}
                  style={[
                    styles.modalSaveButton,
                    { backgroundColor: tint },
                    !canSaveRename && styles.modalSaveButtonDisabled,
                  ]}
                >
                  {renamingId ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <ThemedText style={styles.modalSaveLabel}>
                      {t('wardrobe.renameSave')}
                    </ThemedText>
                  )}
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
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
    paddingHorizontal: SCREEN_PADDING_HORIZONTAL,
  },
  header: {
    marginTop: 28,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 16,
  },
  headerText: {
    flexShrink: 1,
    gap: 6,
  },
  headerActions: {
    alignItems: 'flex-end',
    gap: 12,
  },
  title: {
    flexShrink: 1,
  },
  addButton: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: Radii.lg,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonLabel: {
    fontFamily: Fonts.uiMedium,
    fontWeight: FontWeights.medium,
    color: '#fff',
    fontSize: 14,
    lineHeight: 18,
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
  noticeText: {
    fontFamily: Fonts.ui,
    fontWeight: FontWeights.light,
    marginBottom: 14,
    fontSize: 13,
    lineHeight: 20,
  },
  list: {
    paddingBottom: 40,
    paddingTop: 8,
  },
  emptyList: {
    flexGrow: 1,
  },
  row: {
    justifyContent: 'space-between',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 18,
  },
  centeredEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 18,
  },
  emptyCopy: {
    fontSize: 15,
  },
  errorText: {
    fontFamily: Fonts.ui,
    fontWeight: FontWeights.light,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 24,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(28, 28, 30, 0.28)',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  modalCard: {
    borderRadius: Radii.xl,
    padding: 24,
    gap: 16,
  },
  modalTitle: {
    fontSize: 17,
  },
  renameInput: {
    fontFamily: Fonts.ui,
    fontWeight: FontWeights.light,
    borderWidth: 0,
    borderRadius: Radii.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
  },
  modalActionButton: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  modalSaveButton: {
    minWidth: 88,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: Radii.lg,
  },
  modalSaveButtonDisabled: {
    opacity: 0.55,
  },
  modalSaveLabel: {
    fontFamily: Fonts.uiMedium,
    fontWeight: FontWeights.medium,
    color: '#fff',
    fontSize: 14,
    lineHeight: 18,
  },
});
