import type { Request, Response, NextFunction } from 'express';
import { safeString, isRecord, hasProperty, safeBodyString, getSessionValue, setSessionValue } from '#src/scripts/helpers/index.js';

/**
 * Session storage utilities and middleware factory
 */
export class SessionUtils {
  /**
   * Clear all session data (destroys the session)
   * @param {Request} req - Express request object
   */
  private static clearAll(req: Request): void {
    if (!isRecord(req.session) || typeof req.session.destroy !== 'function') {
      return;
    }
    req.session.destroy(() => {
      // Session destroyed callback - intentionally empty
    });
  }

  /**
   * Middleware to save specific fields from request body/query to session
   * @param {Record<string, string>} fieldMapping - Maps request field names to session keys
   * @param {Array<'body' | 'query' | 'params'>} sources - Where to look for data (default: ['body', 'query'])
   * @returns {Function} Express middleware function
   */
  static save(
    fieldMapping: Record<string, string>,
    sources: Array<'body' | 'query' | 'params'> = ['body', 'query']
  ) {
    return (req: Request, res: Response, next: NextFunction): void => {
      Object.entries(fieldMapping).forEach(([requestField, sessionKey]) => {
        for (const source of sources) {
          // Use safeBodyString helper to avoid destructuring issues
          const value = source === 'body'
            ? safeBodyString(req[source], requestField)
            : hasProperty(req[source], requestField)
              ? safeString(req[source][requestField])
              : '';

          if (value !== '') {
            setSessionValue(req, sessionKey, value);
            break; // Use first non-empty value found
          }
        }
      });
      next();
    };
  }

  /**
   * Middleware to restore session data to request object
   * @param {string[]} sessionKeys - Session keys to restore
   * @param {string} targetProperty - Property name on request to attach data
   * @returns {Function} Express middleware function
   */
  static restore(sessionKeys: string[], targetProperty = 'sessionData') {
    return (req: Request, res: Response, next: NextFunction): void => {
      const sessionData: Record<string, unknown> = {};
      sessionKeys.forEach(key => {
        sessionData[key] = getSessionValue(req, key);
      });

      // Safely extend request object
      Object.assign(req, { [targetProperty]: sessionData });
      next();
    };
  }

  /**
   * Middleware to conditionally save or restore session data
   * @param {object} options - Configuration options
   * @param {Function} [options.saveIf] - Condition function for saving
   * @param {Function} [options.restoreIf] - Condition function for restoring
   * @param {string[]} options.keys - Session keys to work with
   * @param {'body' | 'query' | 'params'} [options.saveSource] - Source for saving (default: 'body')
   * @param {string} [options.targetProperty] - Target property for restoring (default: 'sessionData')
   * @returns {Function} Express middleware function
   */
  static conditional(options: {
    saveIf?: (req: Request) => boolean;
    restoreIf?: (req: Request) => boolean;
    keys: string[];
    saveSource?: 'body' | 'query' | 'params';
    targetProperty?: string;
  }) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const {
        saveIf,
        restoreIf,
        keys,
        saveSource = 'body',
        targetProperty = 'sessionData'
      } = options;

      // Save to session if condition is met
      // eslint-disable-next-line @typescript-eslint/prefer-optional-chain -- clearer explicit check
      if (saveIf !== undefined && saveIf(req)) {
        if (isRecord(req[saveSource])) {
          Object.entries(req[saveSource]).forEach(([sourceKey, sourceValue]) => {
            if (keys.includes(sourceKey) && sourceValue !== undefined && sourceValue !== '') {
              setSessionValue(req, sourceKey, sourceValue);
            }
          });
        }
      }

      // Restore from session if condition is met
      // eslint-disable-next-line @typescript-eslint/prefer-optional-chain -- clearer explicit check
      if (restoreIf !== undefined && restoreIf(req)) {
        const sessionData: Record<string, unknown> = {};
        keys.forEach(key => {
          sessionData[key] = getSessionValue(req, key);
        });
        Object.assign(req, { [targetProperty]: sessionData });
      }

      next();
    };
  }

  /**
   * Middleware to clear session data
   * @param {boolean} clearAll - Whether to destroy entire session
   * @returns {Function} Express middleware function
   */
  static clear(clearAll = false) {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (clearAll) {
        SessionUtils.clearAll(req);
      }
      next();
    };
  }
}

// Type extension for better TypeScript support
declare global {
  namespace Express {
    interface Request {
      sessionData?: Record<string, unknown>;
    }
  }
}

export default SessionUtils;
