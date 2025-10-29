import { describe, it, expect } from 'vitest';
import {
  customBase64Encode,
  deriveEncryptionKey,
  encryptMessage,
  generateIV,
} from '../src/crypto.js';
import { createHash } from 'crypto';

describe('crypto', () => {
  describe('customBase64Encode', () => {
    it('should encode bytes using custom Base64 format', () => {
      const testData = Buffer.from('Hello, World!', 'utf8');
      const encoded = customBase64Encode(testData);

      // Standard Base64 would be: SGVsbG8sIFdvcmxkIQ==
      // Custom encoding should replace:
      // + → -, / → ., = → _
      expect(encoded).toBe('SGVsbG8sIFdvcmxkIQ__');
    });

    it('should handle empty buffer', () => {
      const empty = Buffer.from('', 'utf8');
      const encoded = customBase64Encode(empty);
      expect(encoded).toBe('');
    });

    it('should replace + with -', () => {
      // Find data that produces + in standard Base64
      const data = Buffer.from([0xfb, 0xff]);
      const encoded = customBase64Encode(data);
      expect(encoded).not.toContain('+');
      expect(encoded).toContain('-');
    });

    it('should replace / with .', () => {
      // Find data that produces / in standard Base64
      const data = Buffer.from([0xff, 0xfe]);
      const encoded = customBase64Encode(data);
      expect(encoded).not.toContain('/');
      expect(encoded).toContain('.');
    });

    it('should replace = with _', () => {
      // Single byte produces padding
      const data = Buffer.from([0x01]);
      const encoded = customBase64Encode(data);
      expect(encoded).not.toContain('=');
      expect(encoded).toContain('_');
    });
  });

  describe('deriveEncryptionKey', () => {
    it('should derive 16-byte key from password using SHA1', () => {
      const password = 'test_password_123';
      const key = deriveEncryptionKey(password);

      // Should be 16 bytes for AES-128
      expect(key.length).toBe(16);
      expect(Buffer.isBuffer(key)).toBe(true);
    });

    it('should produce consistent keys for same password', () => {
      const password = 'my_secret_password';
      const key1 = deriveEncryptionKey(password);
      const key2 = deriveEncryptionKey(password);

      expect(key1.equals(key2)).toBe(true);
    });

    it('should produce different keys for different passwords', () => {
      const key1 = deriveEncryptionKey('password1');
      const key2 = deriveEncryptionKey('password2');

      expect(key1.equals(key2)).toBe(false);
    });

    it('should match Python implementation logic', () => {
      // Python: sha1_hash = hashlib.sha1(password.encode("utf-8")).hexdigest()
      // Python: key_hex = sha1_hash.lower()[:32]
      // Python: return bytes.fromhex(key_hex)

      const password = 'test123';
      const key = deriveEncryptionKey(password);

      // Manually compute what Python would produce
      const sha1Hash = createHash('sha1').update(password, 'utf8').digest('hex');
      const keyHex = sha1Hash.toLowerCase().substring(0, 32);
      const expectedKey = Buffer.from(keyHex, 'hex');

      expect(key.equals(expectedKey)).toBe(true);
    });

    it('should handle empty password', () => {
      const key = deriveEncryptionKey('');
      expect(key.length).toBe(16);
    });

    it('should handle unicode characters', () => {
      const password = 'пароль密码';
      const key = deriveEncryptionKey(password);
      expect(key.length).toBe(16);
    });
  });

  describe('encryptMessage', () => {
    it('should encrypt plaintext using AES-128-CBC', () => {
      const plaintext = 'Secret message';
      const password = 'test_password';
      const iv = Buffer.alloc(16, 0); // Zero IV for deterministic test

      const encrypted = encryptMessage(plaintext, password, iv);

      // Should be a non-empty string
      expect(typeof encrypted).toBe('string');
      expect(encrypted.length).toBeGreaterThan(0);

      // Should use custom Base64 encoding (no +, /, =)
      expect(encrypted).not.toMatch(/[+/=]/);
    });

    it('should produce different ciphertexts with different IVs', () => {
      const plaintext = 'Same message';
      const password = 'same_password';
      const iv1 = Buffer.alloc(16, 0);
      const iv2 = Buffer.alloc(16, 1);

      const encrypted1 = encryptMessage(plaintext, password, iv1);
      const encrypted2 = encryptMessage(plaintext, password, iv2);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should produce same ciphertext with same password and IV', () => {
      const plaintext = 'Consistent message';
      const password = 'password123';
      const iv = Buffer.from('1234567890abcdef', 'utf8');

      const encrypted1 = encryptMessage(plaintext, password, iv);
      const encrypted2 = encryptMessage(plaintext, password, iv);

      expect(encrypted1).toBe(encrypted2);
    });

    it('should handle empty plaintext', () => {
      const password = 'test';
      const iv = Buffer.alloc(16, 0);

      const encrypted = encryptMessage('', password, iv);

      // Should still produce output due to PKCS7 padding
      expect(encrypted.length).toBeGreaterThan(0);
    });

    it('should handle long messages', () => {
      const plaintext = 'A'.repeat(10000);
      const password = 'test_password';
      const iv = Buffer.alloc(16, 0);

      const encrypted = encryptMessage(plaintext, password, iv);

      expect(encrypted.length).toBeGreaterThan(0);
    });

    it('should handle unicode characters in plaintext', () => {
      const plaintext = 'Hello 世界 🌍';
      const password = 'test_password';
      const iv = Buffer.alloc(16, 0);

      const encrypted = encryptMessage(plaintext, password, iv);

      expect(encrypted.length).toBeGreaterThan(0);
    });

    it('should apply PKCS7 padding correctly', () => {
      // Test various message lengths to verify padding
      const password = 'test';
      const iv = Buffer.alloc(16, 0);

      // 15 bytes - needs 1 byte padding
      const msg15 = 'A'.repeat(15);
      const enc15 = encryptMessage(msg15, password, iv);

      // 16 bytes - needs full block padding (16 bytes)
      const msg16 = 'A'.repeat(16);
      const enc16 = encryptMessage(msg16, password, iv);

      // 17 bytes - needs 15 bytes padding
      const msg17 = 'A'.repeat(17);
      const enc17 = encryptMessage(msg17, password, iv);

      // All should produce valid output
      expect(enc15.length).toBeGreaterThan(0);
      expect(enc16.length).toBeGreaterThan(0);
      expect(enc17.length).toBeGreaterThan(0);

      // 16-byte message should produce longer output due to full block padding
      expect(enc16.length).toBeGreaterThan(enc15.length);
    });
  });

  describe('generateIV', () => {
    it('should generate 16-byte IV', () => {
      const [ivBytes, ivHex] = generateIV();

      expect(Buffer.isBuffer(ivBytes)).toBe(true);
      expect(ivBytes.length).toBe(16);
    });

    it('should generate hex string representation', () => {
      const [ivBytes, ivHex] = generateIV();

      // Hex string should be 32 characters (16 bytes * 2)
      expect(typeof ivHex).toBe('string');
      expect(ivHex.length).toBe(32);
      expect(ivHex).toMatch(/^[0-9a-f]{32}$/);
    });

    it('should produce random IVs', () => {
      const [iv1Bytes, iv1Hex] = generateIV();
      const [iv2Bytes, iv2Hex] = generateIV();
      const [iv3Bytes, iv3Hex] = generateIV();

      // Should be extremely unlikely to generate same IV twice
      expect(iv1Hex).not.toBe(iv2Hex);
      expect(iv2Hex).not.toBe(iv3Hex);
      expect(iv1Hex).not.toBe(iv3Hex);
    });

    it('should generate valid hex representation matching bytes', () => {
      const [ivBytes, ivHex] = generateIV();

      // Convert hex back to bytes and verify match
      const reconstructed = Buffer.from(ivHex, 'hex');
      expect(ivBytes.equals(reconstructed)).toBe(true);
    });
  });

  describe('Integration: Full encryption flow', () => {
    it('should encrypt message matching Python implementation pattern', () => {
      // This test verifies the encryption follows the same steps as Python:
      // 1. Derive key from password using SHA1
      // 2. Apply PKCS7 padding
      // 3. Encrypt with AES-128-CBC
      // 4. Encode with custom Base64

      const plaintext = 'Integration test message';
      const password = 'secure_password_123';
      const [ivBytes, ivHex] = generateIV();

      const encrypted = encryptMessage(plaintext, password, ivBytes);

      // Verify output characteristics
      expect(typeof encrypted).toBe('string');
      expect(encrypted.length).toBeGreaterThan(0);

      // Should not contain standard Base64 special chars
      expect(encrypted).not.toMatch(/[+/=]/);

      // Should be able to use same IV hex representation
      expect(ivHex.length).toBe(32);
      expect(ivHex).toMatch(/^[0-9a-f]+$/);
    });

    it('should handle realistic notification message encryption', () => {
      // Simulate real-world notification message
      const plaintext = 'Server alert: CPU usage exceeded 80% threshold. Current usage: 85.3%';
      const password = process.env.ENCRYPTION_PASSWORD || 'fallback_test_password';
      const [ivBytes, ivHex] = generateIV();

      const encrypted = encryptMessage(plaintext, password, ivBytes);

      // Verify encrypted output is valid
      expect(encrypted).toBeTruthy();
      expect(encrypted.length).toBeGreaterThan(plaintext.length);

      // IV should be transmittable as hex
      expect(ivHex).toMatch(/^[0-9a-f]{32}$/);
    });
  });
});
