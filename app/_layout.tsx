import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts, FontWeights, Radii } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LocaleProvider, useLocale } from '@/lib/i18n/locale-context';
import { UserProvider, useUser } from '@/lib/user/user-context';

export const unstable_settings = {
  anchor: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

const LightNavTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.light.tint,
    background: Colors.light.background,
    card: Colors.light.surface,
    text: Colors.light.text,
    border: Colors.light.placeholder,
    notification: Colors.light.tint,
  },
};

const DarkNavTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.dark.tint,
    background: Colors.dark.background,
    card: Colors.dark.surface,
    text: Colors.dark.text,
    border: Colors.dark.placeholder,
    notification: Colors.dark.tint,
  },
};

function BootstrapError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { t } = useLocale();

  return (
    <View style={[styles.bootstrap, { backgroundColor: colors.background }]}>
      <ThemedText style={styles.bootstrapTitle}>{t('bootstrap.failed')}</ThemedText>
      <ThemedText style={[styles.bootstrapDetail, { color: colors.muted }]}>
        {message}
      </ThemedText>
      <Pressable
        accessibilityRole="button"
        onPress={onRetry}
        style={[styles.retryButton, { backgroundColor: colors.tint }]}
      >
        <ThemedText style={styles.retryLabel}>{t('common.retry')}</ThemedText>
      </Pressable>
    </View>
  );
}

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const { ready, error, retry } = useUser();

  useEffect(() => {
    if (ready || error) {
      void SplashScreen.hideAsync();
    }
  }, [ready, error]);

  if (error) {
    return <BootstrapError message={error} onRetry={retry} />;
  }

  if (!ready) {
    return (
      <View
        style={[
          styles.bootstrap,
          { backgroundColor: Colors[colorScheme ?? 'light'].background },
        ]}
      >
        <ActivityIndicator color={Colors[colorScheme ?? 'light'].tint} />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkNavTheme : LightNavTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <LocaleProvider>
      <UserProvider>
        <RootLayoutContent />
      </UserProvider>
    </LocaleProvider>
  );
}

const styles = StyleSheet.create({
  bootstrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  bootstrapTitle: {
    fontFamily: Fonts.display,
    fontWeight: FontWeights.medium,
    fontSize: 18,
    textAlign: 'center',
  },
  bootstrapDetail: {
    fontFamily: Fonts.ui,
    fontWeight: FontWeights.light,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Radii.lg,
  },
  retryLabel: {
    fontFamily: Fonts.uiMedium,
    fontWeight: FontWeights.medium,
    fontSize: 15,
    color: '#FFFFFF',
  },
});
