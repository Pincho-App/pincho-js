import { createHash, randomBytes, createCipheriv } from 'crypto';

/**
 * Custom Base64 encoding matching WirePusher app decryption.
 *
 * Converts standard Base64 characters:
 * - '+' → '-'
 * - '/' → '.'
 * - '=' → '_'
 *
 * @param data - Bytes to encode
 * @returns Custom Base64 encoded string
 */
export function customBase64Encode(data: Buffer): string {
  const standard = data.toString('base64');
  return standard.replace(/\+/g, '-').replace(/\//g, '.').replace(/=/g, '_');
}

/**
 * Derive AES encryption key from password using SHA1.
 *
 * Key derivation process:
 * 1. SHA1 hash of password
 * 2. Lowercase hexadecimal string
 * 3. Truncate to 32 characters
 * 4. Convert hex string to bytes
 *
 * @param password - Encryption password
 * @returns 16-byte AES-128 key as Buffer
 */
export function deriveEncryptionKey(password: string): Buffer {
  const sha1Hash = createHash('sha1').update(password, 'utf8').digest('hex');
  const keyHex = sha1Hash.toLowerCase().substring(0, 32); // 32 hex chars = 16 bytes
  return Buffer.from(keyHex, 'hex');
}

/**
 * Apply PKCS7 padding to data.
 *
 * @param data - Data to pad
 * @param blockSize - Block size (default: 16 for AES)
 * @returns Padded data
 */
function applyPKCS7Padding(data: Buffer, blockSize: number = 16): Buffer {
  const paddingLength = blockSize - (data.length % blockSize);
  const padding = Buffer.alloc(paddingLength, paddingLength);
  return Buffer.concat([data, padding]);
}

/**
 * Encrypt text using AES-128-CBC with custom Base64 encoding.
 *
 * Encryption process matching WirePusher app:
 * 1. Derive key from password using SHA1
 * 2. Apply PKCS7 padding to plaintext
 * 3. Encrypt using AES-128-CBC with provided IV
 * 4. Encode with custom Base64
 *
 * @param plaintext - Text to encrypt
 * @param password - Encryption password
 * @param iv - 16-byte initialization vector
 * @returns Encrypted and custom Base64 encoded string
 */
export function encryptMessage(plaintext: string, password: string, iv: Buffer): string {
  // Derive encryption key
  const key = deriveEncryptionKey(password);

  // Encode plaintext to bytes
  const plaintextBytes = Buffer.from(plaintext, 'utf8');

  // Apply PKCS7 padding
  const padded = applyPKCS7Padding(plaintextBytes);

  // Create AES cipher in CBC mode
  const cipher = createCipheriv('aes-128-cbc', key, iv);
  cipher.setAutoPadding(false); // Manual padding already applied

  // Encrypt
  const encrypted = Buffer.concat([cipher.update(padded), cipher.final()]);

  // Return custom Base64 encoded result
  return customBase64Encode(encrypted);
}

/**
 * Generate a random 16-byte initialization vector.
 *
 * @returns Tuple of [iv_bytes, iv_hex_string] where:
 *   - iv_bytes: 16 random bytes as Buffer
 *   - iv_hex_string: Hexadecimal string representation (32 characters)
 */
export function generateIV(): [Buffer, string] {
  const ivBytes = randomBytes(16);
  const ivHex = ivBytes.toString('hex');
  return [ivBytes, ivHex];
}
