/**
 * Authentication Types
 *
 * This file contains all TypeScript interfaces and types related to authentication,
 * JWT tokens, and authorization. These types are used across authentication services
 * and middleware for consistent authentication handling.
 */

/**
 * SILAS user information stored in session
 */
export interface SilasUserInfo {
  email: string;
  name?: string;
  oid?: string;
  roles?: string[];
  providerId?: number;
}

/**
 * SILAS token data stored in session
 */
export interface SilasSessionAuth {
  accessToken: string;
  idToken?: string;
  expiresAt: number;
  oboAccessToken?: string;
  oboExpiresAt?: number;
  refreshToken?: string;
  scopes: string[];
}

/**
 * SILAS token exchange result
 */
export interface SilasTokenExchangeResult {
  accessToken: string;
  idToken?: string;
  expiresAt: number;
  email: string;
  name?: string;
  oid?: string;
}

/**
 * SILAS access token claims
 */
export interface AccessTokenClaims {
  iss?: string;
  aud?: string;
  scp?: string;
  preferred_username?: string;
  oid?: string;
  [key: string]: unknown;
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
