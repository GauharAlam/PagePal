import crypto from 'crypto';
import { env } from './env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getKey() {
  const secret = env.ENCRYPTION_SECRET || process.env.ENCRYPTION_SECRET;
  if (!secret || secret.includes('your_') || secret.length < 32) {
    // In demo/dev, return a deterministic key (NOT for production)
    if (env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_SECRET not configured — required in production');
    }
    return crypto.createHash('sha256').update('dev-fallback-key').digest();
  }
  // Accept hex string (64 chars = 32 bytes)
  if (secret.length === 64 && /^[0-9a-f]+$/i.test(secret)) {
    return Buffer.from(secret, 'hex');
  }
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns a base64 string containing iv + authTag + ciphertext.
 */
export function encrypt(plaintext) {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Pack: iv (16) + authTag (16) + ciphertext
  const packed = Buffer.concat([iv, authTag, encrypted]);
  return packed.toString('base64');
}

/**
 * Decrypt a base64-encoded string produced by encrypt().
 * Returns the original plaintext.
 */
export function decrypt(encoded) {
  const key = getKey();
  const packed = Buffer.from(encoded, 'base64');
  const iv = packed.subarray(0, IV_LENGTH);
  const authTag = packed.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = packed.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
}

/**
 * Check if a string looks like it's already encrypted (base64 with correct structure).
 */
export function isEncrypted(value) {
  if (!value || typeof value !== 'string') return false;
  try {
    const buf = Buffer.from(value, 'base64');
    // Minimum: 16 (iv) + 16 (tag) + 1 (at least 1 byte ciphertext)
    return buf.length >= 33 && value !== Buffer.from(value).toString('base64') === false;
  } catch {
    return false;
  }
}
