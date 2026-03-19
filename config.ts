import dotenv from 'dotenv';
import type { Config } from '#types/config-types.js';
dotenv.config();

const DEFAULT_RATE_LIMIT_MAX = 100;
const DEFAULT_RATE_WINDOW_MS_MINUTE = 15;
const MILLISECONDS_IN_A_MINUTE = 60000;
const DEFAULT_PORT = 3000;
const CHARACTER_THRESHOLD = 85;
const MAX_NOTE_LENGTH = 5000;
const MAX_OPERATOR_FEEDBACK_COMMENT_LENGTH = 2500;
const MAX_PROVIDER_NOTE_LENGTH = 2500;
const MAX_POSTCODE_LENGTH = 12;
const DEFAULT_PAGINATION_PAGE = 1;

// Validate required session env vars
if (process.env.SESSION_SECRET === undefined || process.env.SESSION_SECRET === '' ||
  process.env.SESSION_NAME === undefined || process.env.SESSION_NAME === '' ||
  process.env.SESSION_ENCRYPTION_KEY === undefined || process.env.SESSION_ENCRYPTION_KEY === '') {
  throw new Error('SESSION_SECRET, SESSION_NAME, and SESSION_ENCRYPTION_KEY must be defined in environment variables.');
}

// Get environment variables
const config: Config = {
  CONTACT_EMAIL: process.env.CONTACT_EMAIL,
  DEPARTMENT_NAME: process.env.DEPARTMENT_NAME,
  DEPARTMENT_URL: process.env.DEPARTMENT_URL,
  RATELIMIT_HEADERS_ENABLED: process.env.RATELIMIT_HEADERS_ENABLED,
  RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX ?? DEFAULT_RATE_LIMIT_MAX),
  // Default rate window: 15 minutes in milliseconds
  RATE_WINDOW_MS: Number(process.env.RATE_WINDOW_MS ?? String(DEFAULT_RATE_WINDOW_MS_MINUTE * MILLISECONDS_IN_A_MINUTE)),
  SERVICE_NAME: process.env.SERVICE_NAME,
  SERVICE_PHASE: process.env.SERVICE_PHASE,
  SERVICE_URL: process.env.SERVICE_URL,
  CHARACTER_THRESHOLD,
  MAX_NOTE_LENGTH,
  MAX_OPERATOR_FEEDBACK_COMMENT_LENGTH,
  MAX_PROVIDER_NOTE_LENGTH,
  MAX_POSTCODE_LENGTH,
  session: {
    secret: process.env.SESSION_SECRET,
    name: process.env.SESSION_NAME,
    encryptionKey: process.env.SESSION_ENCRYPTION_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',  // HTTPS only in production
      httpOnly: true,                                  // Prevent XSS attacks
      sameSite: 'lax' as const,                    // OAuth2: allow POST from SILAS but protect against CSRF in other contexts
      maxAge: 1000 * 60 * 60 * 24                     // 24 hours session duration
    }
  },
  app: {
    port: Number(process.env.PORT ?? DEFAULT_PORT),
    environment: process.env.NODE_ENV ?? 'development',
    appName: process.env.SERVICE_NAME ?? 'LAA Manage Your Civil Cases',
    useHttps: process.env.NODE_ENV === 'production' // Use HTTPS in production
  },
  csrf: {
    cookieName: '_csrf',
    secure: process.env.NODE_ENV === 'production',  // Only secure in production
    httpOnly: true,  // Restrict client-side access
  },
  paths: {
    static: 'public',  // Path for serving static files
    views: 'src/views',  // Path for Nunjucks views
  },
  // API Configuration for JWT authentication
  api: {
    baseUrl: process.env.API_URL ?? '',
    auth: {
      clientId: process.env.API_CLIENT_ID ?? '',
      clientSecret: process.env.API_CLIENT_SECRET ?? ''
    }
  },
  // SILAS / Microsoft Entra configuration
  silas: {
    authority: process.env.ENTRA_AUTHORITY ?? `https://login.microsoftonline.com/${process.env.ENTRA_TENANT_ID ?? ''}`,
    tenantId: process.env.ENTRA_TENANT_ID ?? '',
    appId: process.env.ENTRA_APP_ID ?? '',
    clientId: process.env.ENTRA_CLIENT_ID ?? '',
    clientSecret: process.env.ENTRA_CLIENT_SECRET ?? '',
    redirectUri: process.env.ENTRA_REDIRECT_URI ?? '',
    postLogoutRedirectUri: process.env.ENTRA_POST_LOGOUT_REDIRECT_URI ?? '',
    // Scopes used for the initial auth code exchange at user sign-in.
    scopes: (process.env.SILAS_SCOPES ?? '').split(' ').filter(Boolean),
    // Scopes used for downstream On-Behalf-Of (OBO) token exchange.
    oboScopes: (process.env.SILAS_OBO_SCOPES ?? '').split(' ').filter(Boolean),
    expectedAudience: process.env.SILAS_EXPECTED_AUDIENCE ?? ''
  },
  // Pagination configuration
  pagination: {
    defaultPage: DEFAULT_PAGINATION_PAGE,
    defaultLimit: Number(process.env.PAGINATION_LIMIT ?? '20')
  },
  // Redis configuration for session storage
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? '6379'),
    enabled: process.env.REDIS_ENABLED === 'true',
    auth_token: process.env.REDIS_AUTH_TOKEN,
    tls_enabled: process.env.REDIS_TLS_ENABLED === 'true'
  }
};

const REQUIRED_SILAS_CONFIG_FIELDS = [
  'tenantId',
  'clientId',
  'clientSecret',
  'redirectUri',
  'postLogoutRedirectUri',
  'expectedAudience'
] as const;

type SilasRequiredField = (typeof REQUIRED_SILAS_CONFIG_FIELDS)[number];

/**
 * Returns the list of required SILAS config fields that are currently empty.
 *
 * @returns {SilasRequiredField[]} Missing required SILAS field names.
 */
export function getMissingSilasConfigValues(): SilasRequiredField[] {
  return REQUIRED_SILAS_CONFIG_FIELDS.filter((field) => config.silas[field].trim() === '');
}

/**
 * Validates SILAS runtime configuration and throws if any required value is missing.
 *
 * @returns {void}
 */
export function validateSilasConfig(): void {
  const missingFields = getMissingSilasConfigValues();
  const oboScopes = config.silas.oboScopes;

  if (missingFields.length > 0 || config.silas.scopes.length === 0 || oboScopes.length === 0) {
    const missingScopes = config.silas.scopes.length === 0 ? 'scopes' : '';
    const missingOboScopes = oboScopes.length === 0 ? 'oboScopes' : '';
    const missing = [...missingFields, ...(missingScopes !== '' ? [missingScopes] : []), ...(missingOboScopes !== '' ? [missingOboScopes] : [])].join(', ');
    throw new Error(`SILAS configuration is missing required values: ${missing}`);
  }
}

const isTestExecution = process.env.NODE_ENV === 'test';

if (!isTestExecution) {
  validateSilasConfig();
}

export default config;