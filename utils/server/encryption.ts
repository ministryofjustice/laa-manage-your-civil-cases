/**
 * Encryption Utility for Session Data
 * Provides AES-256-GCM encryption/decryption for sensitive session data.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import config from '#config.js';
import { devError } from '#src/scripts/helpers/index.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const EXPECTED_PARTS_COUNT = 3;

/**
 * Get the encryption key from environment variables
 * @returns {Buffer} Encryption key as Buffer (32 bytes for AES-256)
 * @throws {Error} If SESSION_ENCRYPTION_KEY is missing or invalid format
 */
function getEncryptionKey(): Buffer {
  const { session } = config;
  const { encryptionKey: key } = session;
  
  if (typeof key !== 'string' || key === '' || !/^[0-9a-fA-F]{64}$/.test(key)) {
    throw new Error('SESSION_ENCRYPTION_KEY must be a 64-character hexadecimal string');
  }
  
  return Buffer.from(key, 'hex');
}

/**
 * Encrypt a string value using AES-256-GCM
 * @param {string} plaintext - The string to encrypt
 * @returns {string} Encrypted data in format "iv:authTag:ciphertext" (base64 encoded)
 * @throws {Error} If encryption fails
 */
export function encrypt(plaintext: string): string {
  try {
    const key = getEncryptionKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
  } catch (error) {
    devError(`Encryption failed: ${error instanceof Error ? error.message : String(error)}`);
    throw new Error('Failed to encrypt sensitive data', { cause: error });
  }
}

/**
 * Decrypt a string value using AES-256-GCM
 * @param {string} encryptedData - Encrypted data in format "iv:authTag:ciphertext"
 * @returns {string} Decrypted plaintext string
 * @throws {Error} If decryption fails or data has been tampered with
 */
export function decrypt(encryptedData: string): string {
  try {
    const key = getEncryptionKey();
    const parts = encryptedData.split(':');
    
    if (parts.length !== EXPECTED_PARTS_COUNT) {
      throw new Error('Invalid encrypted data format');
    }
    
    const [ivBase64, authTagBase64, ciphertext] = parts;
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    
    if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) {
      throw new Error('Invalid IV or auth tag length');
    }
    
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    devError(`Decryption failed: ${error instanceof Error ? error.message : String(error)}`);
    throw new Error('Failed to decrypt sensitive data', { cause: error });
  }
}

/**
 * Check if encryption key is properly configured
 * @returns {boolean} True if encryption key is valid, false otherwise
 */
export function isEncryptionConfigured(): boolean {
  try {
    getEncryptionKey();
    return true;
  } catch {
    return false;
  }
}


