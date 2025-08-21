/* c8 ignore next 3 */
/**
 * Provides a centralized way to load and access localized strings across the application
 */

import i18next from 'i18next';
import fs from 'node:fs';
import path from 'node:path';
import { devError, devLog } from './devLogger.js';
import { isRecord } from './dataTransformers.js';
import type { LocaleStructure } from './localeTypes.js';
import { generateTypesForWorkspace } from './localeTypeGenerator.js';

// ========================================
// TYPES
// ========================================

export interface LocaleData extends Record<string, unknown> { }

export interface ExpressLocaleLoader {
  t: LocaleStructure;
  getText: (key: string, replacements?: Record<string, string>) => string;
  hasText: (key: string) => boolean;
}

export interface LocaleLoader {
  t: LocaleStructure;
  get: (key: string, replacements?: Record<string, string>) => string;
  exists: (key: string) => boolean;
}

// ========================================
// CONSTANTS & STATE
// ========================================

const DEFAULT_LOCALE = 'en';

// Cache for loaded locale data with file watching
const localeCache = new Map<string, { data: Record<string, unknown>; mtime: number }>();
const fileWatchers = new Map<string, fs.FSWatcher>();

// ========================================
// CORE FUNCTIONS
// ========================================

/**
 * Load locale data from file system with caching and hot-reloading
 * @param {string} locale - The locale code to load
 * @returns {Record<string, unknown>} The loaded locale data
 */
export const loadLocaleData = (locale: string): Record<string, unknown> => {
  try {
    const localeFile = path.join(process.cwd(), 'locales', `${locale}.json`);

    if (!fs.existsSync(localeFile)) {
      devError(`Locale file not found: ${localeFile}`);
      return {};
    }

    // Check file modification time
    const stats = fs.statSync(localeFile);
    const mtime = stats.mtime.getTime();

    // Return cached data if file hasn't changed
    const cached = localeCache.get(locale);
    if (cached !== undefined && cached.mtime === mtime) {
      return cached.data;
    }

    // Read and parse the file
    const content = fs.readFileSync(localeFile, 'utf-8');
    const parsed: unknown = JSON.parse(content);

    if (!isRecord(parsed)) {
      devError(`Invalid locale data format in: ${localeFile}`);
      return {};
    }

    // Cache the data
    localeCache.set(locale, { data: parsed, mtime });

    // Set up file watcher for hot-reloading in development
    if (process.env.NODE_ENV === 'development' && !fileWatchers.has(locale)) {
      const watcher = fs.watch(localeFile, (eventType) => {
        if (eventType === 'change') {
          devLog(`🔄 Locale file changed: ${localeFile} - regenerating types and clearing cache`);

          // Regenerate TypeScript types
          generateTypesForWorkspace();

          // Clear cache
          localeCache.delete(locale);

          // Force i18next to reload resources
          if (i18next.isInitialized) {
            void i18next.reloadResources(locale);
          }
        }
      });

      fileWatchers.set(locale, watcher);
      devLog(`👀 Watching locale file: ${localeFile}`);
    }

    devLog(`📄 Loaded locale data: ${locale}`);
    return parsed;

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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Runtime data matches LocaleStructure from en.json
    t: createProxy(localeData) as unknown as LocaleStructure,

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
  try {
    if (i18next.isInitialized) {
      const store: unknown = i18next.getResourceBundle('en', 'translation');
      const EMPTY_OBJECT_LENGTH = 0;
      if (isRecord(store) && Object.keys(store).length > EMPTY_OBJECT_LENGTH) {
        return store;
      }
    }
    return loadLocaleData('en');
  } catch (error) {
    devError(`Failed to get locale data, falling back to empty object: ${String(error)}`);
    return {};
  }
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
      
      try {
        const localeData = getLocaleData();
        
        // If locale data is empty (e.g., in CI where files can't be loaded), return undefined for missing properties
        const EMPTY_OBJECT_LENGTH = 0;
        if (Object.keys(localeData).length === EMPTY_OBJECT_LENGTH) {
          return undefined;
        }
        
        const { [prop]: value } = localeData;

        if (isRecord(value)) {
          return createProxy(value);
        }

        return value;
      } catch (error) {
        devError(`Error accessing locale property: ${String(error)}`);
        return undefined;
      }
    }
  });
};

// Runtime data matches LocaleStructure from en.json
// Lazy initialization to avoid issues during module import
let _t: LocaleStructure | undefined = undefined;

/**
 * Get the locale proxy instance (lazy initialization)
 * @returns {LocaleStructure} The locale data proxy
 */
const getLocaleProxy = (): LocaleStructure => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Runtime proxy matches locale structure
    _t ??= createSyncProxy() as unknown as LocaleStructure;
    return _t;
  } catch (error) {
    devError(`Failed to initialize locale proxy: ${String(error)}`);
    // Return a safe fallback proxy that doesn't break the app
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Fallback proxy for error cases
    return new Proxy({}, {
      /**
       * Fallback getter that returns empty string for any property
       * @returns {string} Empty string fallback
       */
      get() {
        return '';
      }
    }) as LocaleStructure;
  }
};

/**
 * Locale data proxy with lazy initialization
 * This prevents immediate execution during module import
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Proxy provides LocaleStructure interface at runtime
export const t = new Proxy({}, {
  /**
   * Proxy getter for lazy locale access
   * @param {Record<string, unknown>} _ - The target object (unused)
   * @param {string | symbol} prop - The property being accessed
   * @returns {unknown} The property value from the locale proxy
   */
  get(_, prop: string | symbol) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Safe access to locale proxy
      return getLocaleProxy()[prop as keyof LocaleStructure];
    } catch (error) {
      // In case of any error during locale loading, return empty string to prevent crashes
      return '';
    }
  }
}) as LocaleStructure;

/**
 * Clear locale cache and stop file watchers
 */
export function clearLocaleCache(): void {
  localeCache.clear();

  // Clear lazy initialization cache
  _t = undefined;

  // Stop all file watchers
  for (const [locale, watcher] of fileWatchers) {
    watcher.close();
    devLog(`⏹️ Stopped watching locale: ${locale}`);
  }
  fileWatchers.clear();

  if (i18next.isInitialized) {
    devLog('Locale cache cleared (using preloaded resources)');
  }
}
