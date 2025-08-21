/**
 * Provides a centralized way to load and access localized strings across the application
 */

import i18next from 'i18next';
import fs from 'node:fs';
import path from 'node:path';
import { devError, devLog, isRecord } from '#src/scripts/helpers/index.js';

// ========================================
// TYPES
// ========================================

export interface LocaleData extends Record<string, unknown> { }

export interface ExpressLocaleLoader {
  t: LocaleData;
  getText: (key: string, replacements?: Record<string, string>) => string;
  hasText: (key: string) => boolean;
}

export interface LocaleLoader {
  t: LocaleData;
  get: (key: string, replacements?: Record<string, string>) => string;
  exists: (key: string) => boolean;
}

// ========================================
// CONSTANTS
// ========================================

const DEFAULT_LOCALE = 'en';

// ========================================
// CORE FUNCTIONS
// ========================================

/**
 * Load locale data from file system
 * @param {string} locale - The locale code to load
 * @returns {Record<string, unknown>} The loaded locale data
 */
export const loadLocaleData = (locale: string): Record<string, unknown> => {
  try {
    const localeFile = path.join(process.cwd(), 'locales', `${locale}.json`);

    if (fs.existsSync(localeFile)) {
      const content = fs.readFileSync(localeFile, 'utf-8');
      const parsed: unknown = JSON.parse(content);
      if (isRecord(parsed)) {
        return parsed;
      }
    }

    devError(`Failed to load locale file: ${localeFile}`);
    return {};
  } catch (error) {
    devError(`Failed to load locale data for ${locale}: ${String(error)}`);
    return {};
  }
};

/**
 * Initialize i18next with preloaded resources
 */
const initializeI18next = async (): Promise<void> => {
  if (!i18next.isInitialized) {
    const enData = loadLocaleData('en');

    await i18next.init({
      lng: DEFAULT_LOCALE,
      fallbackLng: DEFAULT_LOCALE,
      debug: process.env.NODE_ENV === 'development',
      resources: {
        en: { translation: enData }
      },
      interpolation: {
        escapeValue: false,
        prefix: '{',
        suffix: '}',
        prefixEscaped: '{{',
        suffixEscaped: '}}'
      },
      nsSeparator: false,
      keySeparator: '.',
      initImmediate: false,
      load: 'languageOnly',
      preload: ['en'],
      partialBundledLanguages: false
    });

    devLog('i18next initialized');
  }
};

/**
 * Create a simple proxy for dot notation access
 * @param {Record<string, unknown>} data - The data object to wrap
 * @returns {LocaleData} Proxy object with dot notation access
 */
const createProxy = (data: Record<string, unknown>): LocaleData => {
  const proxy: LocaleData = new Proxy(data, {
    /**
     * Proxy getter for property access
     * @param {Record<string, unknown>} target - The target object
     * @param {string | symbol} prop - The property being accessed
     * @returns {unknown} The property value or nested proxy
     */
    get(target, prop: string | symbol) {
      if (typeof prop === 'symbol') return undefined;

      const { [prop]: value } = target;

      if (isRecord(value)) {
        return createProxy(value);
      }

      return value;
    }
  });

  return proxy;
};

/**
 * Create locale loader instance
 * @param {string} locale - The locale code (defaults to 'en')
 * @returns {Promise<LocaleLoader>} The locale loader instance
 */
export async function createLocaleLoader(locale: string = DEFAULT_LOCALE): Promise<LocaleLoader> {
  await initializeI18next();

  const resourceData: unknown = i18next.getResourceBundle(locale, 'translation');
  const localeData = isRecord(resourceData) ? resourceData : {};

  return {
    t: createProxy(localeData),

    /**
     * Gets a localized string by key path
     * @param {string} key - Dot-separated path to the locale string
     * @param {Record<string, string>} [replacements] - Optional replacements for placeholders
     * @returns {string} The localized string, or the key if not found
     */
    get(key: string, replacements?: Record<string, string>): string {
      try {
        return i18next.t(key, replacements ?? {});
      } catch (error) {
        devError(`Locale key not found: ${key}`);
        return key;
      }
    },

    /**
     * Checks if a locale key exists
     * @param {string} key - Dot-separated path to check
     * @returns {boolean} True if the key exists, false otherwise
     */
    exists(key: string): boolean {
      return i18next.exists(key);
    }
  };
}

// ========================================
// SINGLETON & UTILITIES
// ========================================

let defaultLoader: LocaleLoader | null = null;

/**
 * Get the default locale loader instance (singleton)
 * @returns {Promise<LocaleLoader>} Promise resolving to the locale loader instance
 */
export const getLocaleLoader = async (): Promise<LocaleLoader> => {
  defaultLoader ??= await createLocaleLoader();
  return defaultLoader;
};

/**
 * Get the default locale loader instance
 * @returns {Promise<LocaleLoader>} Promise resolving to the locale loader instance
 */
export const getDefaultLocaleLoader = getLocaleLoader;

/**
 * Get localized text by key
 * @param {string} key - The locale key to retrieve
 * @param {Record<string, string>} [replacements] - Optional replacements for placeholders
 * @returns {string} The localized string
 */
export const getText = (key: string, replacements?: Record<string, string>): string => {
  try {
    return i18next.t(key, replacements ?? {});
  } catch (error) {
    devError(`Locale key not found or i18next not initialized: ${key}`);
    return key;
  }
};

/**
 * Check if a locale key exists
 * @param {string} key - The locale key to check
 * @returns {boolean} True if the key exists
 */
export const hasText = (key: string): boolean => {
  try {
    return i18next.exists(key);
  } catch (error) {
    devError(`Error checking locale key existence: ${key}`);
    return false;
  }
};

/**
 * Synchronous proxy for direct property access (t.common.back)
 * @returns {LocaleData} Proxy object with dot notation access
 */
const createSyncProxy = (): LocaleData => {
  /**
   * Get locale data from i18next or fallback to direct file loading
   * @returns {Record<string, unknown>} The locale data
   */
  const getLocaleData = (): Record<string, unknown> => {
    if (i18next.isInitialized) {
      const store: unknown = i18next.getResourceBundle('en', 'translation');
      const EMPTY_OBJECT_LENGTH = 0;
      if (isRecord(store) && Object.keys(store).length > EMPTY_OBJECT_LENGTH) {
        return store;
      }
    }
    return loadLocaleData('en');
  };

  const proxyTarget: LocaleData = {};
  return new Proxy(proxyTarget, {
    /**
     * Proxy getter for property access
     * @param {LocaleData} _ - The target object (unused)
     * @param {string | symbol} prop - The property being accessed
     * @returns {unknown} The property value or nested proxy
     */
    get(_, prop: string | symbol) {
      if (typeof prop === 'symbol') return undefined;
      const localeData = getLocaleData();
      const { [prop]: value } = localeData;

      if (isRecord(value)) {
        return createProxy(value);
      }

      return value;
    }
  });
};

export const t: LocaleData = createSyncProxy();

/**
 * Clear locale cache (for development)
 */
export function clearLocaleCache(): void {
  if (i18next.isInitialized) {
    devLog('Locale cache cleared (using preloaded resources)');
  }
}
