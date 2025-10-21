/**
 * Authentication Service
 *
 * Handles JWT token acquisition, storage, and refresh for API authentication.
 * Provides methods to authenticate with the API and manage token lifecycle.
 */

import { devLog, devError } from '#src/scripts/helpers/index.js';
import type {
  AuthCredentials,
  TokenStorage,
  ValidatedTokenResponse,
  UserInfo
} from '#types/auth-types.js';
import config from '#config.js';

// Constants
const TOKEN_BUFFER_SECONDS = 300; // 5 minutes buffer before expiration
const MILLISECONDS_PER_SECOND = 1000;
const DEFAULT_TOKEN_EXPIRY = 1800; // Token expiry in seconds, expires in 30 minutes

/**
 * Type guard for token response
 * @param {unknown} data Response data to validate
 * @returns {data is ValidatedTokenResponse} True if valid token response
 */
function isValidTokenResponse(data: unknown): data is ValidatedTokenResponse {
  return data !== null &&
    typeof data === 'object' &&
    'access_token' in data &&
    'token_type' in data &&
    typeof (data as { access_token: unknown }).access_token === 'string' &&
    typeof (data as { token_type: unknown }).token_type === 'string';
}

/**
 * Validate credentials completeness
 * @param {AuthCredentials} credentials Credentials to validate
 * @returns {boolean} True if all credentials are non-empty
 */
function hasValidCredentials(credentials: AuthCredentials): boolean {
  return Object.values(credentials).every(value => value !== '');
}

/**
 * Authentication Service Class
 */
export class AuthService {
  private tokenStorage: TokenStorage | null = null;
  private authPromise: Promise<string> | null = null;
  private readonly credentials: AuthCredentials;
  private readonly tokenEndpoint: string;

  /**
   * Create AuthService instance
   * @param {AuthCredentials} credentials Authentication credentials
   * @param {string} baseUrl API base URL
   */
  constructor(credentials: AuthCredentials, baseUrl: string) {
    this.credentials = credentials;
    this.tokenEndpoint = `${baseUrl}/oauth2/access_token`;
  }

  /**
   * Get valid access token, refreshing if necessary
   * @returns {Promise<string>} Valid access token
   */
  async getAccessToken(): Promise<string> {
    // If we have a valid token, return it
    if (this.tokenStorage !== null && this.isTokenValid()) {
      return this.tokenStorage.accessToken;
    }

    // If we're already getting a token, wait for it
    if (this.authPromise !== null) {
      return await this.authPromise;
    }

    // Get new token
    this.authPromise = this.acquireToken();

    try {
      const token = await this.authPromise;
      devLog(`Access token acquired successfully: ${token}`);
      return token;
    } finally {
      this.authPromise = null;
    }
  }

  /**
   * Check if current token is valid (not expired)
   * @returns {boolean} True if token is valid
   */
  private isTokenValid(): boolean {
    return this.tokenStorage !== null &&
      this.tokenStorage.expiresAt > (Date.now() + TOKEN_BUFFER_SECONDS * MILLISECONDS_PER_SECOND);
  }

  /**
   * Acquire new token from the API
   * @returns {Promise<string>} New access token
   */
  private async acquireToken(): Promise<string> {
    try {
      devLog('Acquiring new JWT token from API');
      devLog(`Token endpoint: ${this.tokenEndpoint}`);

      const requestBody = new URLSearchParams({
        grant_type: 'password',
        ...this.credentials
      });

      const response = await fetch(this.tokenEndpoint, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: requestBody
      });

      devLog(`Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        devError(`Token acquisition failed: ${response.status} ${response.statusText}`);
        devError(`Response body: ${errorText}`);
        console.log("REMOVE ME: error text:", errorText);
        throw new Error(`Token acquisition failed: ${response.status} ${response.statusText}`);
      }

      const responseData: unknown = await response.json();

      if (!isValidTokenResponse(responseData)) {
        throw new Error('Invalid token response format');
      }

      // Store token with expiration
      const expiresIn = responseData.expires_in ?? DEFAULT_TOKEN_EXPIRY;
      this.tokenStorage = {
        accessToken: responseData.access_token,
        tokenType: responseData.token_type,
        expiresAt: Date.now() + (expiresIn * MILLISECONDS_PER_SECOND),
        refreshToken: responseData.refresh_token,
        user: responseData.user // Store user information from response
      };

      devLog(`JWT token acquired successfully. Expires in ${expiresIn} seconds`);
      if (responseData.user !== undefined) {
        devLog(`User authenticated: ${responseData.user.email} (${responseData.user.username})`);
      }
      return responseData.access_token;

    } catch (error) {
      devError(`Failed to acquire JWT token: ${error instanceof Error ? error.message : String(error)}`);
      this.tokenStorage = null;
      throw error;
    }
  }

  /**
   * Get authorization header value
   * @returns {Promise<string>} Bearer token header value
   */
  async getAuthHeader(): Promise<string> {
    const token = await this.getAccessToken();
    return `Bearer ${token}`;
  }

  /**
   * Get user information from stored token
   * @returns {UserInfo | null} User information or null if not available
   */
  getUserInfo(): UserInfo | null {
    return this.tokenStorage?.user ?? null;
  }

  /**
   * Clear stored tokens (for logout)
   */
  clearTokens(): void {
    this.tokenStorage = null;
    this.authPromise = null;
    devLog('JWT tokens cleared');
  }
}

/**
 * Create AuthService instance with provided credentials (for session-based auth)
 * @param {AuthCredentials} credentials Authentication credentials from login
 * @returns {AuthService | null} AuthService instance or null if credentials/baseUrl missing
 */
export function createAuthServiceWithCredentials(credentials: AuthCredentials): AuthService | null {
  if (!hasValidCredentials(credentials)) {
    devError('Invalid credentials provided for JWT authentication');
    return null;
  }

  const { api: { baseUrl } } = config;

  if (typeof baseUrl !== 'string' || baseUrl === '') {
    devError('Missing API base URL for JWT authentication');
    return null;
  }

  return new AuthService(credentials, baseUrl);
}

/**
 * Attempt authentication with provided credentials
 * @param {string} username Username to authenticate
 * @param {string} password Password to authenticate
 * @returns {Promise<{ success: boolean; error?: string; authService?: AuthService }>} Authentication result with authService if successful
 */
export async function authenticateUser(username: string, password: string): Promise<{ success: boolean; error?: string; authService?: AuthService }> {
  const credentials: AuthCredentials = {
    username,
    password,
    client_id: config.api.auth.clientId,
    client_secret: config.api.auth.clientSecret
  };

  const authService = createAuthServiceWithCredentials(credentials);

  if (authService === null) {
    devError('Failed to create auth service');
    return {
      success: false,
      error: 'Authentication service unavailable. Please try again later.'
    };
  }

  try {
    await authService.getAccessToken();
    devLog(`User ${username} authenticated successfully`);
    return { success: true, authService };
  } catch (error) {
    console.log("base URL:", process.env.API_URL);
    console.log("prefix:", process.env.API_PREFIX);
    devError(`Login failed for user ${username}: ${error instanceof Error ? error.message : String(error)}`);
    return {
      success: false,
      error: 'Email or password is incorrect'
    };
  }
}
