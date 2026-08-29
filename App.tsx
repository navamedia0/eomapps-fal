import 'react-native-reanimated';
import { registerGlobals } from '@livekit/react-native';
import { useEffect } from 'react';

// LiveKit'in WebRTC bağımlılıkları için gerekli global polyfilleri kurar —
// diğer her şeyden önce, en tepede çalışmalı.
registerGlobals();
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import { LogBox, Platform, StyleSheet, View, Pressable } from 'react-native';

// LiveKit'in sinyal soketi kapanırken (normal ayrılma dahil) kendi içinde
// bazen yakalanmamış bir ret (rejection) üretiyor — işlevsel bir soruna
// işaret etmiyor ama geliştirme ekranında kırmızı hata olarak görünüyor.
// Sadece bu bilinen, zararsız deseni gizliyoruz — başka hiçbir hatayı
// bastırmıyoruz ve bu sadece geliştirme modunda (LogBox) etkili, üretim
// build'inde zaten görünmez.
LogBox.ignoreLogs(['error reading from signal stream']);
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackParamList } from '@/navigation/types';
import WalletBadge from '@/components/WalletBadge';
import VoiceSessionBubble from '@/components/VoiceSessionBubble';
import ThemedAlertHost from '@/components/ThemedAlertHost';
import MainTabs from '@/navigation/MainTabs';
import TarotSpreadScreen from '@/screens/TarotSpreadScreen';
import TarotLayoutScreen from '@/screens/TarotLayoutScreen';
import TarotScreen from '@/screens/TarotScreen';
import TarotResultScreen from '@/screens/TarotResultScreen';
import DreamChatScreen from '@/screens/DreamChatScreen';
import ProfileChatScreen from '@/screens/ProfileChatScreen';
import ImageReadingScreen from '@/screens/ImageReadingScreen';
import ZodiacScreen from '@/screens/ZodiacScreen';
import NumerologyScreen from '@/screens/NumerologyScreen';
import CompatibilityScreen from '@/screens/CompatibilityScreen';
import AngelCardScreen from '@/screens/AngelCardScreen';
import MagicBallScreen from '@/screens/MagicBallScreen';
import DaisyScreen from '@/screens/DaisyScreen';
import BirthChartScreen from '@/screens/BirthChartScreen';
import BiorhythmScreen from '@/screens/BiorhythmScreen';
import MoonCalendarScreen from '@/screens/MoonCalendarScreen';
import TasksScreen from '@/screens/TasksScreen';
import MiniGamesScreen from '@/screens/MiniGamesScreen';
import FavoritesScreen from '@/screens/FavoritesScreen';
import HistoryScreen from '@/screens/HistoryScreen';
import KatinaScreen from '@/screens/KatinaScreen';
import MoodJournalScreen from '@/screens/MoodJournalScreen';
import BreathingExerciseScreen from '@/screens/BreathingExerciseScreen';
import AffirmationScreen from '@/screens/AffirmationScreen';
import NotificationSettingsScreen from '@/screens/NotificationSettingsScreen';
import PremiumScreen from '@/screens/PremiumScreen';
import VoiceReadingScreen from '@/screens/VoiceReadingScreen';
import RisingSignScreen from '@/screens/RisingSignScreen';
import DiceScreen from '@/screens/DiceScreen';
import CardDesignsScreen from '@/screens/CardDesignsScreen';
import CoinShopScreen from '@/screens/CoinShopScreen';
import ZodiacTraitsScreen from '@/screens/ZodiacTraitsScreen';
import SolitaireScreen from '@/screens/SolitaireScreen';
import SuFalScreen from '@/screens/SuFalScreen';
import RuyaKitapligiScreen from '@/screens/RuyaKitapligiScreen';
import KartAnlamlariScreen from '@/screens/KartAnlamlariScreen';
import BilgiMakaleScreen from '@/screens/BilgiMakaleScreen';
import MatrixOfDestinyScreen from '@/screens/MatrixOfDestinyScreen';
import RuneScreen from '@/screens/RuneScreen';
import IChingScreen from '@/screens/IChingScreen';
import TumFallarScreen from '@/screens/TumFallarScreen';
import BaklaScreen from '@/screens/BaklaScreen';
import WaxReadingScreen from '@/screens/WaxReadingScreen';
import CelticTreeScreen from '@/screens/CelticTreeScreen';
import AuraEnergyScreen from '@/screens/AuraEnergyScreen';
import ScryingScreen from '@/screens/ScryingScreen';
import BilgiKosesiScreen from '@/screens/BilgiKosesiScreen';
import UserProfileScreen from '@/screens/UserProfileScreen';
import BlockedUsersScreen from '@/screens/BlockedUsersScreen';
import DMThreadScreen from '@/screens/DMThreadScreen';
import RoomScreen from '@/screens/RoomScreen';
import ShopScreen from '@/screens/ShopScreen';
import VipTiersScreen from '@/screens/VipTiersScreen';
import AchievementsScreen from '@/screens/AchievementsScreen';
import PopularityScreen from '@/screens/PopularityScreen';
import GardenScreen from '@/screens/GardenScreen';
import KaderKasabasiScreen from '@/screens/KaderKasabasiScreen';
import KaderKasabasiOdaScreen from '@/screens/KaderKasabasiOdaScreen';
import KesifSalonuIntroScreen from '@/screens/KesifSalonuIntroScreen';
import KesifSalonuGameScreen from '@/screens/KesifSalonuGameScreen';
import bilgiMakaleleri from '@/data/bilgi_makaleleri.json';
import { GOLD, NIGHT_DEEP, NIGHT_MID, TEXT_PRIMARY } from '@/theme/colors';

const MAX_APP_WIDTH = 480;

const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: NIGHT_DEEP,
    card: NIGHT_MID,
    text: TEXT_PRIMARY,
    primary: GOLD,
    border: NIGHT_MID,
  },
};

export default function App() {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    // Oyunlardaki gibi tam ekran: alt gezinme çubuğu içeriğin üstüne bindirilip
    // gizlenir, yalnızca alt kenardan yukarı kaydırınca geçici olarak belirir.
    NavigationBar.setPositionAsync('absolute');
    NavigationBar.setBackgroundColorAsync('#00000000');
    NavigationBar.setBehaviorAsync('overlay-swipe');
    NavigationBar.setVisibilityAsync('hidden');
  }, []);

  return (
    <SafeAreaProvider>
    <View style={styles.root}>
      <View style={styles.appShell}>
        <NavigationContainer ref={navigationRef} theme={navigationTheme}>
          <StatusBar hidden style="light" />
          <Stack.Navigator
            screenOptions={({ navigation }) => ({
              headerStyle: { backgroundColor: NIGHT_MID },
              headerTintColor: GOLD,
              headerTitleStyle: { color: TEXT_PRIMARY, fontWeight: '600' },
              headerShadowVisible: false,
              headerBackButtonDisplayMode: 'minimal',
              // Durum çubuğu gizli olduğu için üstte doğal bir boşluk kalmıyor;
              // başlığı ekranın en tepesine yapışmasın diye kendimiz boşluk veriyoruz.
              headerStatusBarHeight: 22,
              // Guards against the back button vanishing when a screen ends up
              // as the sole stack entry (e.g. a hard refresh on web) — always
              // falls back to Home instead of relying on stack history alone.
              headerLeft: () => (
                <Pressable
                  onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home'))}
                  hitSlop={10}
                  style={{ paddingRight: 8 }}
                >
                  <Ionicons name="chevron-back" size={26} color={GOLD} />
                </Pressable>
              ),
              headerRight: () => <WalletBadge navigation={navigation} />,
            })}
          >
            <Stack.Screen name="Home" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen name="TumFallar" component={TumFallarScreen} options={{ title: 'Tüm Fal Çeşitleri' }} />
            <Stack.Screen name="TarotSpread" component={TarotSpreadScreen} options={{ title: 'Tarot Falı' }} />
            <Stack.Screen name="TarotLayout" component={TarotLayoutScreen} options={{ title: 'Tarot Falı' }} />
            <Stack.Screen name="Tarot" component={TarotScreen} options={{ title: 'Tarot Falı' }} />
            <Stack.Screen name="TarotResult" component={TarotResultScreen} options={{ title: 'Fal Yorumu' }} />
            <Stack.Screen name="DreamChat" component={DreamChatScreen} options={{ title: 'Rüya Yorumlama' }} />
            <Stack.Screen name="ProfileChat" component={ProfileChatScreen} options={{ title: 'Kendinden Bahset' }} />
            <Stack.Screen
              name="ImageReading"
              component={ImageReadingScreen}
              options={({ route }) => ({
                title:
                  route.params.kind === 'coffee'
                    ? 'Kahve Falı'
                    : route.params.kind === 'palm'
                    ? 'El Falı'
                    : route.params.kind === 'face'
                    ? 'Yüz Falı'
                    : 'Çay Yaprağı Falı',
              })}
            />
            <Stack.Screen name="MatrixOfDestiny" component={MatrixOfDestinyScreen} options={{ title: 'Kader Matrisi' }} />
            <Stack.Screen name="RuneReading" component={RuneScreen} options={{ title: 'Nordik Rün Falı' }} />
            <Stack.Screen name="IChingReading" component={IChingScreen} options={{ title: 'Çin I Ching Falı' }} />
            <Stack.Screen name="BaklaReading" component={BaklaScreen} options={{ title: '41 Bakla Falı' }} />
            <Stack.Screen name="WaxReading" component={WaxReadingScreen} options={{ title: 'Balmumu Falı' }} />
            <Stack.Screen name="CelticTreeReading" component={CelticTreeScreen} options={{ title: 'Kelt Ağaç Takvimi' }} />
            <Stack.Screen name="AuraEnergy" component={AuraEnergyScreen} options={{ title: 'Aura & Çakra Falı' }} />
            <Stack.Screen name="ScryingReading" component={ScryingScreen} options={{ title: 'Kara Ayna Durugörü' }} />
            <Stack.Screen name="Zodiac" component={ZodiacScreen} options={{ title: 'Günlük Burç' }} />
            <Stack.Screen name="Numerology" component={NumerologyScreen} options={{ title: 'Numeroloji' }} />
            <Stack.Screen name="Compatibility" component={CompatibilityScreen} options={{ title: 'Burç Uyumu' }} />
            <Stack.Screen name="AngelCard" component={AngelCardScreen} options={{ title: 'Günün İlham Kartı' }} />
            <Stack.Screen name="MagicBall" component={MagicBallScreen} options={{ title: 'Sihirli Küre' }} />
            <Stack.Screen name="Daisy" component={DaisyScreen} options={{ title: 'Papatya Falı' }} />
            <Stack.Screen name="BirthChart" component={BirthChartScreen} options={{ title: 'Doğum Haritası' }} />
            <Stack.Screen name="Biorhythm" component={BiorhythmScreen} options={{ title: 'Biyoritim' }} />
            <Stack.Screen name="MoonCalendar" component={MoonCalendarScreen} options={{ title: 'Ay Takvimi' }} />
            <Stack.Screen name="Tasks" component={TasksScreen} options={{ title: 'Ücretsiz Coin Kazan' }} />
            <Stack.Screen name="MiniGames" component={MiniGamesScreen} options={{ title: 'Mini Oyunlar' }} />
            <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'Favorilerim' }} />
            <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'Geçmiş' }} />
            <Stack.Screen name="Katina" component={KatinaScreen} options={{ title: 'Katina Falı' }} />
            <Stack.Screen name="MoodJournal" component={MoodJournalScreen} options={{ title: 'Duygu Günlüğü' }} />
            <Stack.Screen name="BreathingExercise" component={BreathingExerciseScreen} options={{ title: 'Nefes Egzersizi' }} />
            <Stack.Screen name="Affirmation" component={AffirmationScreen} options={{ title: 'Günlük Olumlama' }} />
            <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} options={{ title: 'Bildirim Ayarları' }} />
            <Stack.Screen name="Premium" component={PremiumScreen} options={{ title: 'Premium' }} />
            <Stack.Screen name="VoiceReading" component={VoiceReadingScreen} options={{ title: 'Sesli Fal' }} />
            <Stack.Screen name="RisingSign" component={RisingSignScreen} options={{ title: 'Yükselen Burcum' }} />
            <Stack.Screen name="Dice" component={DiceScreen} options={{ title: 'Zar Falı' }} />
            <Stack.Screen name="CardDesigns" component={CardDesignsScreen} options={{ title: 'Kart Tasarımları' }} />
            <Stack.Screen name="CoinShop" component={CoinShopScreen} options={{ title: 'Coin Mağazası' }} />
            <Stack.Screen name="ZodiacTraits" component={ZodiacTraitsScreen} options={{ title: 'Burç Özellikleri' }} />
            <Stack.Screen name="Solitaire" component={SolitaireScreen} options={{ title: 'Solitaire Falı' }} />
            <Stack.Screen name="SuFal" component={SuFalScreen} options={{ title: 'Su Falı' }} />
            <Stack.Screen name="RuyaKitapligi" component={RuyaKitapligiScreen} options={{ title: 'Rüya Kitaplığı' }} />
            <Stack.Screen
              name="KartAnlamlari"
              component={KartAnlamlariScreen}
              options={({ route }) => ({ title: route.params.deck === 'iskambil' ? 'İskambil Kartları' : 'Tarot Kartları' })}
            />
            <Stack.Screen
              name="BilgiMakale"
              component={BilgiMakaleScreen}
              options={({ route }) => ({ title: bilgiMakaleleri[route.params.topic].title })}
            />
            <Stack.Screen name="BilgiKosesi" component={BilgiKosesiScreen} options={{ title: 'Bilgi Köşesi' }} />
            <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: 'Profil' }} />
            <Stack.Screen name="BlockedUsers" component={BlockedUsersScreen} options={{ title: 'Engellenen Kullanıcılar' }} />
            <Stack.Screen
              name="DMThread"
              component={DMThreadScreen}
              options={({ route }) => ({ title: route.params.displayName || 'Sohbet' })}
            />
            <Stack.Screen
              name="Room"
              component={RoomScreen}
              options={({ route }) => ({ title: route.params.roomName || 'Oda' })}
            />
            <Stack.Screen name="Shop" component={ShopScreen} options={{ title: 'Sosyal Mağaza' }} />
            <Stack.Screen name="VipTiers" component={VipTiersScreen} options={{ title: 'VIP Kademeleri' }} />
            <Stack.Screen name="Achievements" component={AchievementsScreen} options={{ title: 'Başarımlar' }} />
            <Stack.Screen name="Popularity" component={PopularityScreen} options={{ title: 'Haftalık Popülerlik' }} />
            <Stack.Screen name="Garden" component={GardenScreen} options={{ title: 'Kader Bahçesi' }} />
            <Stack.Screen name="KaderKasabasi" component={KaderKasabasiScreen} options={{ headerShown: false }} />
            <Stack.Screen
              name="KaderKasabasiOda"
              component={KaderKasabasiOdaScreen}
              options={({ route }) => ({ title: route.params.title })}
            />
            <Stack.Screen name="KesifSalonu" component={KesifSalonuIntroScreen} options={{ title: 'Keşif Salonu' }} />
            <Stack.Screen name="KesifSalonuOyun" component={KesifSalonuGameScreen} options={{ headerShown: false }} />
          </Stack.Navigator>
        </NavigationContainer>
        <VoiceSessionBubble navigationRef={navigationRef} />
        <ThemedAlertHost />
      </View>
    </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: NIGHT_DEEP },
  appShell: { flex: 1, width: '100%', maxWidth: MAX_APP_WIDTH, alignSelf: 'center' },
});
