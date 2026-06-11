import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { logger } from './logger';

const ALGORITHM = 'aes-256-gcm';
const ENCRYPTED_PREFIX = 'enc_';

function getKey(): Buffer | null {
  const raw = process.env.PAYMENT_TOKEN_KEY;
  if (!raw || raw.length !== 64) return null;
  return Buffer.from(raw, 'hex');
}

export function encryptToken(plaintext: string): string {
  const key = getKey();
  if (!key) {
    // Key not configured — store unencrypted (development mode)
    logger.warn('PAYMENT_TOKEN_KEY not set; token stored unencrypted', 'TOKEN_ENCRYPT');
    return plaintext;
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ENCRYPTED_PREFIX + Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decryptToken(stored: string): string {
  if (!stored.startsWith(ENCRYPTED_PREFIX)) {
    // Legacy plaintext token — return as-is
    return stored;
  }
  const key = getKey();
  if (!key) {
    logger.error('PAYMENT_TOKEN_KEY not set; cannot decrypt token', 'TOKEN_ENCRYPT');
    throw new Error('PAYMENT_TOKEN_KEY not configured');
  }
  const buf = Buffer.from(stored.slice(ENCRYPTED_PREFIX.length), 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ciphertext = buf.subarray(28);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(ciphertext) + decipher.final('utf8');
}
