/**
 * Unit tests for encryption utility
 * Tests AES-256-GCM encryption/decryption functionality
 */

import { strict as assert } from 'assert';
import sinon from 'sinon';
import { encrypt, decrypt, isEncryptionConfigured } from '#src/utils/encryption.js';
import config from '#config.js';

describe('encryption', () => {
  let originalEncryptionKey: string;
  
  // Test encryption key (64 hex characters = 32 bytes)
  const TEST_ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

  before(() => {
    // Save original encryption key
    originalEncryptionKey = config.session.encryptionKey;
    // Set test encryption key
    config.session.encryptionKey = TEST_ENCRYPTION_KEY;
  });

  after(() => {
    // Restore original encryption key
    config.session.encryptionKey = originalEncryptionKey;
  });

  describe('encrypt', () => {
    it('should encrypt a plaintext string', () => {
      const plaintext = 'mySecretPassword123';
      const encrypted = encrypt(plaintext);
      
      // Should return a string with format "iv:authTag:ciphertext"
      assert(typeof encrypted === 'string', 'Should return a string');
      const parts = encrypted.split(':');
      assert.equal(parts.length, 3, 'Should have 3 parts separated by colons');
    });

    it('should produce different outputs for same input (due to random IV)', () => {
      const plaintext = 'samePassword';
      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);
      
      // Different IVs should produce different ciphertexts
      assert.notEqual(encrypted1, encrypted2, 'Same input should produce different encrypted outputs');
    });

    it('should handle empty strings', () => {
      const encrypted = encrypt('');
      assert(typeof encrypted === 'string', 'Should return a string even for empty input');
      const parts = encrypted.split(':');
      assert.equal(parts.length, 3, 'Should have 3 parts');
    });

    it('should handle special characters', () => {
      const plaintext = 'p@ssw0rd!@#$%^&*()_+-=[]{}|;:,.<>?';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      assert.equal(decrypted, plaintext, 'Should handle special characters');
    });

    it('should handle unicode characters', () => {
      const plaintext = 'пароль密码🔐';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      assert.equal(decrypted, plaintext, 'Should handle unicode characters');
    });
  });

  describe('decrypt', () => {
    it('should decrypt an encrypted string back to original', () => {
      const plaintext = 'mySecretPassword123';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      
      assert.equal(decrypted, plaintext, 'Decrypted text should match original');
    });

    it('should handle empty string decryption', () => {
      const plaintext = '';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      
      assert.equal(decrypted, plaintext, 'Should decrypt empty string');
    });

    it('should handle long strings', () => {
      const plaintext = 'a'.repeat(1000);
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      
      assert.equal(decrypted, plaintext, 'Should handle long strings');
    });

    it('should throw error for tampered ciphertext', () => {
      const plaintext = 'mySecretPassword123';
      const encrypted = encrypt(plaintext);
      
      // Tamper with the ciphertext (flip bits by changing to invalid base64)
      const parts = encrypted.split(':');
      const tamperedCiphertext = parts[2].split('').reverse().join(''); // Reverse the string
      parts[2] = tamperedCiphertext;
      const tampered = parts.join(':');
      
      assert.throws(
        () => decrypt(tampered),
        /Failed to decrypt sensitive data/,
        'Should throw error for tampered data'
      );
    });

    it('should throw error for tampered auth tag', () => {
      const plaintext = 'mySecretPassword123';
      const encrypted = encrypt(plaintext);
      
      // Tamper with the auth tag (flip bits)
      const parts = encrypted.split(':');
      const originalTag = Buffer.from(parts[1], 'base64');
      // Flip all bits in the auth tag
      const tamperedTag = Buffer.from(originalTag.map(byte => ~byte & 0xFF));
      parts[1] = tamperedTag.toString('base64');
      const tampered = parts.join(':');
      
      assert.throws(
        () => decrypt(tampered),
        /Failed to decrypt sensitive data/,
        'Should throw error for tampered auth tag'
      );
    });

    it('should throw error for tampered IV', () => {
      const plaintext = 'mySecretPassword123';
      const encrypted = encrypt(plaintext);
      
      // Tamper with the IV
      const parts = encrypted.split(':');
      parts[0] = parts[0].slice(0, -1) + 'X';
      const tampered = parts.join(':');
      
      assert.throws(
        () => decrypt(tampered),
        /Failed to decrypt sensitive data/,
        'Should throw error for tampered IV'
      );
    });

    it('should throw error for invalid format (missing parts)', () => {
      assert.throws(
        () => decrypt('invalidformat'),
        /Failed to decrypt sensitive data/,
        'Should throw error for invalid format'
      );
    });

    it('should throw error for invalid format (too many parts)', () => {
      assert.throws(
        () => decrypt('part1:part2:part3:part4'),
        /Failed to decrypt sensitive data/,
        'Should throw error for too many parts'
      );
    });

    it('should throw error for invalid base64 encoding', () => {
      assert.throws(
        () => decrypt('!!!:!!!:!!!'),
        /Failed to decrypt sensitive data/,
        'Should throw error for invalid base64'
      );
    });
  });

  describe('isEncryptionConfigured', () => {
    it('should return true when encryption key is configured', () => {
      const result = isEncryptionConfigured();
      assert.equal(result, true, 'Should return true with valid encryption key');
    });

    it('should return false when encryption key is empty', () => {
      const originalKey = config.session.encryptionKey;
      config.session.encryptionKey = '';
      
      const result = isEncryptionConfigured();
      assert.equal(result, false, 'Should return false with empty key');
      
      config.session.encryptionKey = originalKey;
    });

    it('should return false when encryption key is invalid length', () => {
      const originalKey = config.session.encryptionKey;
      config.session.encryptionKey = 'tooshort';
      
      const result = isEncryptionConfigured();
      assert.equal(result, false, 'Should return false with invalid key length');
      
      config.session.encryptionKey = originalKey;
    });
  });

  describe('encryption/decryption round-trip', () => {
    const testCases = [
      { name: 'simple password', value: 'password123' },
      { name: 'OAuth client secret', value: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6' },
      { name: 'empty string', value: '' },
      { name: 'single character', value: 'a' },
      { name: 'long string', value: 'x'.repeat(500) },
      { name: 'special characters', value: '!@#$%^&*()_+-=[]{}|;:,.<>?' },
      { name: 'unicode', value: 'Hello 世界 🌍' },
      { name: 'whitespace', value: '  spaced  out  ' },
      { name: 'newlines', value: 'line1\nline2\nline3' },
      { name: 'tabs', value: 'col1\tcol2\tcol3' }
    ];

    testCases.forEach(({ name, value }) => {
      it(`should handle ${name}`, () => {
        const encrypted = encrypt(value);
        const decrypted = decrypt(encrypted);
        assert.equal(decrypted, value, `Should correctly encrypt/decrypt ${name}`);
      });
    });
  });

  describe('security properties', () => {
    it('should use authenticated encryption (GCM)', () => {
      const plaintext = 'secretData';
      const encrypted = encrypt(plaintext);
      
      // GCM produces auth tag - verify it's present and correct length
      const parts = encrypted.split(':');
      const authTag = Buffer.from(parts[1], 'base64');
      
      // GCM auth tag should be 16 bytes (128 bits)
      assert.equal(authTag.length, 16, 'Auth tag should be 16 bytes');
    });

    it('should use proper IV length for GCM', () => {
      const plaintext = 'secretData';
      const encrypted = encrypt(plaintext);
      
      const parts = encrypted.split(':');
      const iv = Buffer.from(parts[0], 'base64');
      
      // GCM IV should be 12 bytes (96 bits) for optimal security
      assert.equal(iv.length, 12, 'IV should be 12 bytes for GCM');
    });

    it('should produce different IVs for each encryption', () => {
      const plaintext = 'sameData';
      const ivs = new Set();
      
      // Encrypt multiple times and collect IVs
      for (let i = 0; i < 100; i++) {
        const encrypted = encrypt(plaintext);
        const iv = encrypted.split(':')[0];
        ivs.add(iv);
      }
      
      // All IVs should be unique
      assert.equal(ivs.size, 100, 'All IVs should be unique');
    });
  });
});
