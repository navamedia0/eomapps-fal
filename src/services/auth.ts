import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { STORAGE_KEYS } from '@/constants/storage';
import { env } from '@/config/env';
import { postJson, ApiRequestError } from '@/services/http';

export type AuthUser = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
};

let configured = false;
function ensureConfigured() {
  if (configured) return;
  GoogleSignin.configure({ webClientId: env.googleWebClientId() });
  configured = true;
}

function authHeaders(): Record<string, string> {
  const appSecret = env.appSecret();
  return appSecret ? { 'X-App-Secret': appSecret } : {};
}

export async function getStoredSession(): Promise<{ token: string; user: AuthUser } | null> {
  const [token, rawUser] = await Promise.all([
    AsyncStorage.getItem(STORAGE_KEYS.authToken),
    AsyncStorage.getItem(STORAGE_KEYS.authUser),
  ]);
  if (!token || !rawUser) return null;
  return { token, user: JSON.parse(rawUser) as AuthUser };
}

async function saveSession(token: string, user: AuthUser): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem(STORAGE_KEYS.authToken, token),
    AsyncStorage.setItem(STORAGE_KEYS.authUser, JSON.stringify(user)),
  ]);
}

export async function signInWithGoogle(): Promise<AuthUser> {
  ensureConfigured();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const result = await GoogleSignin.signIn();
  const idToken = result.data?.idToken;
  if (!idToken) throw new Error('Google girişten kimlik jetonu alınamadı.');

  const { token, user } = await postJson<{ token: string; user: AuthUser }>(
    `${env.socialApiUrl()}/auth/google`,
    { idToken },
    authHeaders(),
  );
  await saveSession(token, user);
  return user;
}

export async function signOut(): Promise<void> {
  await Promise.allSettled([
    AsyncStorage.removeItem(STORAGE_KEYS.authToken),
    AsyncStorage.removeItem(STORAGE_KEYS.authUser),
    GoogleSignin.signOut(),
  ]);
}

// Oturumun sunucu tarafında hâlâ geçerli olup olmadığını doğrular — geçersizse
// (örn. 60 günlük süresi dolmuşsa) yerel oturumu da temizler.
export async function refreshSession(): Promise<AuthUser | null> {
  const session = await getStoredSession();
  if (!session) return null;
  try {
    const response = await fetch(`${env.socialApiUrl()}/me`, {
      headers: { Authorization: `Bearer ${session.token}`, ...authHeaders() },
    });
    if (!response.ok) {
      if (response.status === 401) await signOut();
      return null;
    }
    const { user } = (await response.json()) as { user: AuthUser };
    await AsyncStorage.setItem(STORAGE_KEYS.authUser, JSON.stringify(user));
    return user;
  } catch (err) {
    // Ağ hatasında oturumu silmiyoruz — cihazda bilinen son kullanıcıyla devam.
    if (err instanceof ApiRequestError) return null;
    return session.user;
  }
}
