/**
 * Motor de idiomas do Leve.
 *
 * O catálogo pt-BR é a fonte da verdade (e o fallback). Os demais idiomas
 * vivem em ./locales/<código>.ts com o MESMO formato (tipo Strings). O app
 * inteiro lê um Proxy: cada acesso a `strings.x` resolve no idioma ativo,
 * então trocar de idioma não exige tocar em nenhum import.
 */

export type LanguageCode =
  | 'pt-BR'
  | 'pt-PT'
  | 'en-US'
  | 'en-GB'
  | 'es'
  | 'fr'
  | 'de'
  | 'ja'
  | 'zh-CN'
  | 'ar'
  | 'he'
  | 'hi';

/** Rótulos no próprio idioma — padrão de seletor de idiomas. */
export const LANGUAGES: Array<{ code: LanguageCode; label: string }> = [
  { code: 'pt-BR', label: 'Português (Brasil)' },
  { code: 'pt-PT', label: 'Português (Portugal)' },
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'ja', label: '日本語' },
  { code: 'zh-CN', label: '中文（简体）' },
  { code: 'ar', label: 'العربية' },
  { code: 'he', label: 'עברית' },
  { code: 'hi', label: 'हिन्दी' },
];

/** Locale BCP-47 para formatação de números/datas por idioma. */
export function numberLocale(code: LanguageCode = activeCode): string {
  switch (code) {
    case 'pt-BR':
      return 'pt-BR';
    case 'pt-PT':
      return 'pt-PT';
    case 'en-US':
      return 'en-US';
    case 'en-GB':
      return 'en-GB';
    case 'es':
      return 'es-ES';
    case 'fr':
      return 'fr-FR';
    case 'de':
      return 'de-DE';
    case 'ja':
      return 'ja-JP';
    case 'zh-CN':
      return 'zh-CN';
    case 'ar':
      return 'ar';
    case 'he':
      return 'he-IL';
    case 'hi':
      return 'hi-IN';
  }
}

let defaultCatalog: Record<string, unknown> | null = null;
let activeCatalog: Record<string, unknown> | null = null;
let activeCode: LanguageCode = 'pt-BR';
const listeners = new Set<() => void>();

export function registerDefaultCatalog(catalog: object): void {
  defaultCatalog = catalog as Record<string, unknown>;
  if (!activeCatalog) activeCatalog = defaultCatalog;
}

/** Proxy vivo sobre o idioma ativo, com fallback por seção para o pt-BR. */
export function makeStringsProxy<T extends object>(fallback: T): T {
  return new Proxy(fallback, {
    get(target, prop) {
      const fromActive = activeCatalog ? (activeCatalog as Record<PropertyKey, unknown>)[prop] : undefined;
      return fromActive ?? (target as Record<PropertyKey, unknown>)[prop];
    },
  }) as T;
}

/** Carrega o catálogo do idioma; ausência (build antigo) cai no pt-BR. */
function catalogFor(code: LanguageCode): Record<string, unknown> | null {
  try {
    switch (code) {
      case 'pt-BR':
        return defaultCatalog;
      case 'pt-PT':
        return (require('./locales/pt-PT') as { strings: Record<string, unknown> }).strings;
      case 'en-US':
        return (require('./locales/en-US') as { strings: Record<string, unknown> }).strings;
      case 'en-GB':
        return (require('./locales/en-GB') as { strings: Record<string, unknown> }).strings;
      case 'es':
        return (require('./locales/es') as { strings: Record<string, unknown> }).strings;
      case 'fr':
        return (require('./locales/fr') as { strings: Record<string, unknown> }).strings;
      case 'de':
        return (require('./locales/de') as { strings: Record<string, unknown> }).strings;
      case 'ja':
        return (require('./locales/ja') as { strings: Record<string, unknown> }).strings;
      case 'zh-CN':
        return (require('./locales/zh-CN') as { strings: Record<string, unknown> }).strings;
      case 'ar':
        return (require('./locales/ar') as { strings: Record<string, unknown> }).strings;
      case 'he':
        return (require('./locales/he') as { strings: Record<string, unknown> }).strings;
      case 'hi':
        return (require('./locales/hi') as { strings: Record<string, unknown> }).strings;
    }
  } catch {
    return null;
  }
}

export function setActiveLanguage(code: LanguageCode): void {
  activeCatalog = catalogFor(code) ?? defaultCatalog;
  activeCode = code;
  applyRtl(code);
  listeners.forEach((l) => l());
}

export function getActiveLanguage(): LanguageCode {
  return activeCode;
}

export function subscribeLanguage(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function isRtlLanguage(code: LanguageCode = activeCode): boolean {
  return code === 'ar' || code === 'he';
}

/** Espelhamento RTL (árabe/hebraico) — o sistema aplica no próximo reinício. */
function applyRtl(code: LanguageCode): void {
  try {
    const { I18nManager } = require('react-native') as typeof import('react-native');
    I18nManager.allowRTL(true);
    const wantRtl = isRtlLanguage(code);
    if (I18nManager.isRTL !== wantRtl) I18nManager.forceRTL(wantRtl);
  } catch {
    // web/testes sem react-native completo — segue sem espelhar
  }
}

/** Idioma automático: melhor correspondência com o idioma do aparelho. */
export function resolveAutoLanguage(): LanguageCode {
  try {
    const { getLocales } = require('expo-localization') as typeof import('expo-localization');
    for (const l of getLocales()) {
      const tag = (l.languageTag ?? '').toLowerCase();
      const lang = (l.languageCode ?? '').toLowerCase();
      if (lang === 'pt') return tag.includes('pt-pt') ? 'pt-PT' : 'pt-BR';
      if (lang === 'en') return tag.includes('gb') ? 'en-GB' : 'en-US';
      if (lang === 'es') return 'es';
      if (lang === 'fr') return 'fr';
      if (lang === 'de') return 'de';
      if (lang === 'ja') return 'ja';
      if (lang === 'zh') return 'zh-CN';
      if (lang === 'ar') return 'ar';
      if (lang === 'he' || lang === 'iw') return 'he';
      if (lang === 'hi') return 'hi';
    }
  } catch {
    // módulo indisponível (testes) — padrão do produto
  }
  return 'pt-BR';
}

/** Sistema de medida da região do aparelho ('us' → imperial). */
export function resolveAutoMeasurement(): 'metric' | 'imperial' {
  try {
    const { getLocales } = require('expo-localization') as typeof import('expo-localization');
    return getLocales()[0]?.measurementSystem === 'us' ? 'imperial' : 'metric';
  } catch {
    return 'metric';
  }
}
