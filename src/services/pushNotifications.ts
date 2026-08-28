import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { env } from '@/config/env';
import { postJson, deleteRequest } from '@/services/http';
import { isNotificationsSupported, requestNotificationPermission } from '@/services/notifications';

const EAS_PROJECT_ID = 'dde15614-3cf8-411e-a730-eddec1601cde';

function appHeaders(): Record<string, string> {
  const appSecret = env.appSecret();
  return appSecret ? { 'X-App-Secret': appSecret } : {};
}

// Sunucuya son kaydedilen token — çıkış yapılırken silinebilmesi için
// bellekte tutuluyor (yeniden almak izin diyaloğunu tekrar tetikleyebilir).
let lastRegisteredToken: string | null = null;
// ProfilScreen her odaklandığında refreshSession çalıştığı için, aynı uygulama
// oturumunda tekrar tekrar izin/ağ isteği yapmamak adına bir kere denenir.
let attemptedThisSession = false;

async function getExpoPushToken(): Promise<string | null> {
  if (!isNotificationsSupported()) return null;
  const granted = await requestNotificationPermission();
  if (!granted) return null;
  const { data } = await Notifications.getExpoPushTokenAsync({ projectId: EAS_PROJECT_ID });
  return data;
}

// Takip, hediye gibi sosyal olaylar için push bildirimi alabilmesi için bu
// cihazın Expo token'ını hesaba bağlar — giriş yapıldığında/oturum
// doğrulandığında çağrılır. Bildirim izni yoksa veya token alınamazsa
// sessizce vazgeçer, oturum akışını hiçbir zaman bozmaz.
export async function registerPushToken(authToken: string): Promise<void> {
  try {
    const token = await getExpoPushToken();
    if (!token) return;
    await postJson(
      `${env.socialApiUrl()}/push-token`,
      { token, platform: Platform.OS },
      { Authorization: `Bearer ${authToken}`, ...appHeaders() },
    );
    lastRegisteredToken = token;
  } catch {
    // En iyi çaba — sessizce yut.
  }
}

// refreshSession gibi sık tetiklenen akışlardan çağrılır — aynı uygulama
// oturumunda tek seferlik dener.
export async function registerPushTokenOnce(authToken: string): Promise<void> {
  if (attemptedThisSession) return;
  attemptedThisSession = true;
  await registerPushToken(authToken);
}

export async function unregisterPushToken(authToken: string): Promise<void> {
  if (!lastRegisteredToken) return;
  try {
    await deleteRequest(
      `${env.socialApiUrl()}/push-token`,
      { Authorization: `Bearer ${authToken}`, ...appHeaders() },
      { token: lastRegisteredToken },
    );
  } catch {
    // En iyi çaba — sessizce yut.
  } finally {
    lastRegisteredToken = null;
  }
}
