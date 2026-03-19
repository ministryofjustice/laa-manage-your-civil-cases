import { ConfidentialClientApplication } from '@azure/msal-node';
import config from '#config.js';

const LOGIN_RESPONSE_MODE = 'query';

/**
 * Returns a lazily initialized MSAL confidential client instance.
 *
 * @param {string} clientId - The client identifier for authentication.
 * @returns {ConfidentialClientApplication} Configured MSAL client.
 */
function getMsalClient(clientId: string): ConfidentialClientApplication {
  return new ConfidentialClientApplication({
      auth: {
        clientId: clientId,
        authority: config.silas.authority,
        clientSecret: config.silas.clientSecret,
      }
    });
}


/**
 * Returns a lazily initialized MSAL confidential client instance for the app.
 * @returns {ConfidentialClientApplication} Configured MSAL client for app.
 */
function getMsalAppClient(): ConfidentialClientApplication {
  return getMsalClient(config.silas.appId);
}

/**
 * Returns a lazily initialized MSAL confidential client instance for the web.
 * @returns {ConfidentialClientApplication} Configured MSAL client for web.
 */
function getMsalWebClient(): ConfidentialClientApplication {
  return getMsalClient(config.silas.clientId);
}

export interface SilasTokenExchangeResult {
  accessToken: string;
  idToken?: string;
  expiresAt: number;
  email: string;
  name?: string;
  oid?: string;
}

export interface SilasOboTokenResult {
  accessToken: string;
  expiresAt: number;
}

interface AccessTokenClaims {
  iss?: string;
  aud?: string;
  scp?: string;
  preferred_username?: string;
  oid?: string;
  [key: string]: unknown;
}

const OIDC_SCOPES = new Set(['openid', 'profile', 'offline_access']);
const PROVIDER_IDENTITY_CHECK_PATH = `${process.env.API_PREFIX ?? '/cla_provider/api/v1'}/case?only=new&page=1&page_size=1`;


/**
 * Raised when SILAS authentication succeeds but the identity is not authorized
 * to access MCC provider API resources.
 *
 * This supports an explicit "authenticated but not linked/authorized" path in
 * the login callback, so users get a clear message instead of a generic failure
 * later in the journey.
 */
export class SilasIdentityMappingError extends Error {}

/**
 * Decodes JWT payload claims from an access token.
 *
 * @param {string} token JWT access token.
 * @returns {AccessTokenClaims} Parsed token claims.
 */
function decodeJwtPayload(token: string): AccessTokenClaims {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('SILAS access token is not a valid JWT format');
  }

  try {
    const payloadBuffer = Buffer.from(parts[1], 'base64url');
    const payload = JSON.parse(payloadBuffer.toString('utf8')) as AccessTokenClaims;
    return payload;
  } catch (error) {
    throw new Error(`Failed to decode SILAS access token claims: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Builds the expected Entra token issuer URL from configured tenant.
 *
 * @returns {string} Expected issuer URL.
 */
function expectedIssuer(): string {
  return `https://login.microsoftonline.com/${config.silas.tenantId}/v2.0`;
}

/**
 * Normalizes scope values by reducing URI-style scopes to their final segment.
 *
 * @param {string} scope Scope string to normalize.
 * @returns {string} Normalized scope value.
 */
function normalizeScope(scope: string): string {
  if (!scope.includes('/')) {
    return scope;
  }
  const segments = scope.split('/').filter(Boolean);
  return segments[segments.length - 1] ?? scope;
}

/**
 * Validates core claims in the SILAS login access token.
 *
 * @param {AccessTokenClaims} claims Claims extracted from access token.
 * @returns {void}
 */
function validateAccessTokenClaims(claims: AccessTokenClaims): void {
  const expectedIss = expectedIssuer();
  if (claims.iss !== expectedIss) {
    throw new Error(`Unexpected SILAS token issuer. Expected '${expectedIss}', got '${claims.iss ?? 'undefined'}'`);
  }

  if (claims.aud !== config.silas.expectedAudience) {
    throw new Error(`Unexpected SILAS token audience. Expected '${config.silas.expectedAudience}', got '${claims.aud ?? 'undefined'}'`);
  }

  const configuredApiScopes = config.silas.scopes
    .filter((scope) => !OIDC_SCOPES.has(scope.toLowerCase()))
    .map(normalizeScope);

  if (configuredApiScopes.length === 0) {
    return;
  }

  const tokenScopeValues = typeof claims.scp === 'string'
    ? claims.scp.split(' ').map((scope) => scope.trim()).filter(Boolean)
    : [];

  const hasConfiguredScope = configuredApiScopes.some((scope) => tokenScopeValues.includes(scope));

  if (!hasConfiguredScope) {
    throw new Error(
      `SILAS token missing expected delegated scope. Expected one of: ${configuredApiScopes.join(', ')}`
    );
  }
}

/**
 * Generates SILAS/Entra authorization URL for interactive login.
 *
 * @param {string} state Request state value for callback validation.
 * @returns {Promise<string>} Login URL.
 */
export async function getSilasLoginUrl(state: string): Promise<string> {
  return await getMsalAppClient().getAuthCodeUrl({
    scopes: config.silas.scopes,
    redirectUri: config.silas.redirectUri,
    state,
    responseMode: LOGIN_RESPONSE_MODE,
  });
}

/**
 * Exchanges authorization code for SILAS tokens and mapped user identity.
 *
 * @param {string} code Authorization code received in callback.
 * @returns {Promise<SilasTokenExchangeResult>} Token exchange result.
 */
export async function exchangeSilasCodeForToken(code: string): Promise<SilasTokenExchangeResult> {
  const tokenResult = await getMsalAppClient().acquireTokenByCode(
    {
      code,
      scopes: config.silas.scopes,
      redirectUri: config.silas.redirectUri,
    },
    {
      code  
    }
);

  if (tokenResult?.accessToken === undefined || tokenResult.accessToken === '') {
    throw new Error('No access token returned from SILAS/Entra');
  }

  const claims = decodeJwtPayload(tokenResult.accessToken);
  validateAccessTokenClaims(claims);

  const email = typeof claims.preferred_username === 'string' && claims.preferred_username.trim() !== ''
    ? claims.preferred_username
    : (tokenResult.account?.username ?? '');

  if (email.trim() === '') {
    throw new Error('SILAS token does not contain a usable preferred_username/email claim');
  }

  return {
    accessToken: tokenResult.accessToken,
    idToken: tokenResult.idToken,
    expiresAt: tokenResult.expiresOn?.getTime() ?? Date.now() + (30 * 60 * 1000),
    email,
    name: tokenResult.account?.name,
    oid: typeof claims.oid === 'string' ? claims.oid : tokenResult.account?.localAccountId,
  };
}

/**
 * Builds SILAS logout URL with post-logout redirect URI.
 *
 * @returns {string} Fully qualified logout URL.
 */
export function getSilasLogoutUrl(): string {
  const authority = config.silas.authority.replace(/\/$/, '');
  const logoutEndpoint = `${authority}/oauth2/v2.0/logout`;
  const encodedReturnUri = encodeURIComponent(config.silas.postLogoutRedirectUri);
  return `${logoutEndpoint}?post_logout_redirect_uri=${encodedReturnUri}`;
}

/**
 * Guardrail check for provider identity mapping/authorization.
 *
 * Why this exists:
 * - A user can be successfully authenticated by Entra/SILAS but still not be
 *   linked/authorized as an MCC provider in backend data.
 * - We verify that access immediately after token exchange so login fails early
 *   with a specific, actionable error path.
 *
 * Why this endpoint:
 * - Uses an existing low-cost provider API request with minimal pagination.
 * - 401/403 is treated as a mapping/authorization failure.
 *
 * @param {string} accessToken Access token used for provider identity verification.
 * @returns {Promise<void>}
 */
export async function verifySilasProviderIdentity(accessToken: string): Promise<void> {
  const endpoint = `${config.api.baseUrl}${PROVIDER_IDENTITY_CHECK_PATH}`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 401 || response.status === 403) {
    throw new SilasIdentityMappingError('SILAS identity is not authorized for provider access');
  }

  if (!response.ok) {
    throw new Error(`Failed provider identity verification: ${response.status} ${response.statusText}`);
  }
}
