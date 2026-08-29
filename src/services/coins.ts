import {
  saveSecureItem,
  getSecureItem,
  validateTransactionIntegrity,
} from './secureEconomy';

const COINS_KEY = 'user_coins_balance';

type Listener = (coins: number) => void;
const listeners = new Set<Listener>();

function notify(coins: number): void {
  listeners.forEach((listener) => listener(coins));
}

export function subscribeCoins(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Cryptographically verifies and retrieves user coin balance
 */
export async function getCoins(): Promise<number> {
  return await getSecureItem<number>(COINS_KEY, 0);
}

/**
 * Securely credits coins with transaction integrity validation and SHA-256 seal
 */
export async function addCoins(amount: number): Promise<number> {
  if (!validateTransactionIntegrity(amount, 'credit')) {
    return await getCoins();
  }

  const current = await getCoins();
  const next = current + Math.floor(amount);
  await saveSecureItem(COINS_KEY, next);
  notify(next);
  return next;
}

/**
 * Securely spends coins with validation and cryptographic signature update
 */
export async function spendCoins(amount: number): Promise<boolean> {
  if (!validateTransactionIntegrity(amount, 'debit')) {
    return false;
  }

  const current = await getCoins();
  if (current < amount) return false;

  const next = current - Math.floor(amount);
  await saveSecureItem(COINS_KEY, next);
  notify(next);
  return true;
}
