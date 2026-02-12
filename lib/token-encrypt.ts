/**
 * Encrypt/decrypt OAuth tokens for storage. Uses TOKEN_ENCRYPTION_KEY (32 bytes hex).
 * If unset, stores plain (dev only — set key in production).
 */
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALG = "aes-256-gcm";
const IV_LEN = 16;
const TAG_LEN = 16;

function getKey(): Buffer | null {
  const keyHex = process.env.TOKEN_ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) return null;
  try {
    return Buffer.from(keyHex, "hex");
  } catch {
    return null;
  }
}

export function encryptToken(plain: string): string {
  const key = getKey();
  if (!key) return plain; // dev fallback

  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALG, key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptToken(encrypted: string): string {
  const key = getKey();
  if (!key) return encrypted; // dev fallback

  try {
    const buf = Buffer.from(encrypted, "base64");
    if (buf.length < IV_LEN + TAG_LEN) return encrypted;
    const iv = buf.subarray(0, IV_LEN);
    const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
    const enc = buf.subarray(IV_LEN + TAG_LEN);
    const decipher = createDecipheriv(ALG, key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(enc) + decipher.final("utf8");
  } catch {
    return encrypted;
  }
}
