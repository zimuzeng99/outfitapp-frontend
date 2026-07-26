import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { translate, type TranslateParams } from '@/lib/i18n/translate';
import type { AppLocale, TranslationKey } from '@/lib/i18n/types';

const STORAGE_KEY = 'outfitapp.locale';

type LocaleContextValue = {
  locale: AppLocale;
  ready: boolean;
  setLocale: (locale: AppLocale) => void;
  t: (key: TranslationKey, params?: TranslateParams) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function detectDeviceLocale(): AppLocale {
  const languageCode = getLocales()[0]?.languageCode?.toLowerCase() ?? 'en';
  return languageCode.startsWith('zh') ? 'zh' : 'en';
}

function isAppLocale(value: string | null): value is AppLocale {
  return value === 'en' || value === 'zh';
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>('en');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled) {
          setLocaleState(isAppLocale(saved) ? saved : detectDeviceLocale());
        }
      } catch {
        if (!cancelled) {
          setLocaleState(detectDeviceLocale());
        }
      } finally {
        if (!cancelled) {
          setReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const setLocale = useCallback((next: AppLocale) => {
    setLocaleState(next);
    void AsyncStorage.setItem(STORAGE_KEY, next);
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: TranslateParams) => translate(locale, key, params),
    [locale],
  );

  const value = useMemo(
    () => ({
      locale,
      ready,
      setLocale,
      t,
    }),
    [locale, ready, setLocale, t],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return context;
}
