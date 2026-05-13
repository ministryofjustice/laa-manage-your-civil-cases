import type { Config } from '#types/config-types.js';

type AppConfig = Config;
type SilasConfig = AppConfig['silas'];


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
 * Returns the list of required SiLAS config fields that are currently empty.
 * @param {SilasConfig} silasConfig - The SiLAS configuration object to validate.
 * @returns {SilasRequiredField[]} Missing required SILAS field names.
 
 */
export function getMissingSilasConfigValues(silasConfig: SilasConfig): SilasRequiredField[] {
  return REQUIRED_SILAS_CONFIG_FIELDS.filter((field) => silasConfig[field].trim() === '');
}


/**
 * Validates SiLAS runtime configuration and throws if any required value is missing.
 * @param {SilasConfig} silasConfig - The SiLAS configuration object to validate.
 * @returns {void}
 */
export function validateSilasConfig(silasConfig: SilasConfig): void {
  const missingFields = getMissingSilasConfigValues(silasConfig);

  if (missingFields.length > 0 || silasConfig.scopes.length === 0) {
    const missingScopes = silasConfig.scopes.length === 0 ? 'scopes' : '';
    const missing = [...missingFields, ...(missingScopes !== '' ? [missingScopes] : [])].join(', ');
    throw new Error(`SILAS configuration is missing required values: ${missing}`);
  }
}