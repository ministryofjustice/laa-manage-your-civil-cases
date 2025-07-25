/**
 * Authentication Types
 *
 * This file contains all TypeScript interfaces and types related to authentication,
 * JWT tokens, and authorization. These types are used across authentication services
 * and middleware for consistent authentication handling.
 */

/**
 * Authentication credentials for API access
 */
export interface AuthCredentials {
  username: string;
  password: string;
  client_id: string;
  client_secret: string;
}

/**
 * Token storage with expiration tracking
 */
export interface TokenStorage {
  accessToken: string;
  tokenType: string;
  expiresAt: number; // Unix timestamp
  refreshToken?: string;
}

/**
 * Validated token response from authentication API
 */
export interface ValidatedTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
}

/**
 * JWT token payload structure
 */
export interface JwtPayload {
  sub?: string; // Subject
  iat?: number; // Issued at
  exp?: number; // Expiration time
  scope?: string; // Token scope
  [key: string]: unknown; // Additional claims
}

/**
 * Authentication result interface
 */
export interface AuthResult {
  success: boolean;
  token?: string;
  error?: string;
  expiresAt?: number;
}

/**
 * Authentication status interface
 */
export interface AuthStatus {
  isAuthenticated: boolean;
  tokenExpiry?: number;
  hasValidToken: boolean;
}

/**
 * OAuth2 grant types
 */
export type GrantType = 'password' | 'client_credentials' | 'refresh_token' | 'authorization_code';

/**
 * Authentication configuration interface
 */
export interface AuthConfig {
  baseUrl: string;
  tokenEndpoint: string;
  credentials: AuthCredentials;
  tokenBufferSeconds?: number;
  defaultTokenExpiry?: number;
}
