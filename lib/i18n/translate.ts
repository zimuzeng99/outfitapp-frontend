import { en } from '@/lib/i18n/locales/en';
import { zh } from '@/lib/i18n/locales/zh';
import type { AppLocale, TranslationDict, TranslationKey } from '@/lib/i18n/types';

const dictionaries: Record<AppLocale, TranslationDict> = {
  en,
  zh,
};

export type TranslateParams = Record<string, string | number>;

export function translate(
  locale: AppLocale,
  key: TranslationKey,
  params?: TranslateParams,
): string {
  const template = dictionaries[locale][key] ?? dictionaries.en[key] ?? key;
  if (!params) {
    return template;
  }

  return Object.entries(params).reduce(
    (result, [name, value]) => result.replaceAll(`{{${name}}}`, String(value)),
    template,
  );
}
