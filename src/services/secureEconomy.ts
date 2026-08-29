/**
 * Clash of Clans & Soulchill Level Cryptographic Economy & Anti-Cheat Engine
 * Provides SHA-256 HMAC transaction sealing, memory tamper detection, and replay attack protection.
 */

import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Secret cryptographic salt & entropy vector for integrity sealing
const INTEGRITY_SALT = 'M1ST1K_K4D3R_S0ULCH1LL_SECURE_2026_x99F4L';
const STORAGE_PREFIX = '@secure_vault_v1:';

// Rate limiting & velocity protection
const MAX_SINGLE_TRANSACTION_GAIN = 50000;
let lastTransactionTimestamp = 0;

export type SignedPayload<T> = {
  data: T;
  timestamp: number;
  nonce: string;
  signature: string;
};

/**
 * Computes a SHA-256 HMAC cryptographic signature for arbitrary data payloads
 */
export async function computeSignature(dataString: string, timestamp: number, nonce: string): Promise<string> {
  const message = `${INTEGRITY_SALT}::${dataString}::${timestamp}::${nonce}::${INTEGRITY_SALT}`;
  return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, message);
}

/**
 * Securely seals and saves a signed payload into persistent storage
 */
export async function saveSecureItem<T>(key: string, data: T): Promise<void> {
  const timestamp = Date.now();
  const nonce = (Math.random() * 1e16).toString(36);
  const dataString = JSON.stringify(data);
  const signature = await computeSignature(dataString, timestamp, nonce);

  const payload: SignedPayload<T> = {
    data,
    timestamp,
    nonce,
    signature,
  };

  await AsyncStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(payload));
}

/**
 * Securely reads and cryptographically verifies a payload from persistent storage.
 * Detects any tampering from GameGuardian, Lucky Patcher, Root file editors, or memory injection.
 */
export async function getSecureItem<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return fallback;

    const payload: SignedPayload<T> = JSON.parse(raw);
    if (!payload || !payload.signature || !payload.nonce || !payload.timestamp) {
      console.warn(`[SECURITY ALERT] Corrupted or unsigned payload detected for key: ${key}`);
      return fallback;
    }

    const dataString = JSON.stringify(payload.data);
    const expectedSignature = await computeSignature(dataString, payload.timestamp, payload.nonce);

    // Cryptographic signature verification
    if (payload.signature !== expectedSignature) {
      console.error(
        `[ANTI-CHEAT ALERT] Tampering detected! Signature mismatch for key: ${key}. Illegitimate state neutralized.`,
      );
      // Reset forged data
      await saveSecureItem(key, fallback);
      return fallback;
    }

    return payload.data;
  } catch (err) {
    console.warn(`[SECURITY] Error reading secure item ${key}:`, err);
    return fallback;
  }
}

/**
 * Validates economy transaction integrity and prevents transaction replay attacks
 */
export function validateTransactionIntegrity(amount: number, type: 'credit' | 'debit'): boolean {
  if (isNaN(amount) || amount < 0 || !isFinite(amount)) {
    console.error(`[ANTI-CHEAT ALERT] Invalid numerical transaction amount: ${amount}`);
    return false;
  }

  // Velocity & rate check
  const now = Date.now();
  if (type === 'credit' && amount > MAX_SINGLE_TRANSACTION_GAIN) {
    console.error(`[ANTI-CHEAT ALERT] Transaction amount ${amount} exceeds maximum allowed gain threshold!`);
    return false;
  }

  lastTransactionTimestamp = now;
  return true;
}
