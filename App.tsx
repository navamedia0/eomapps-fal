import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackParamList } from '@/navigation/types';
import CoinBadge from '@/components/CoinBadge';
import MainTabs from '@/navigation/MainTabs';
import TarotSpreadScreen from '@/screens/TarotSpreadScreen';
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
import bilgiMakaleleri from '@/data/bilgi_makaleleri.json';
import { GOLD, NIGHT_DEEP, NIGHT_MID, TEXT_PRIMARY } from '@/theme/colors';

const MAX_APP_WIDTH = 480;

const Stack = createNativeStackNavigator<RootStackParamList>();

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
  return (
    <View style={styles.root}>
      <View style={styles.appShell}>
        <NavigationContainer theme={navigationTheme}>
          <StatusBar style="light" />
          <Stack.Navigator
            screenOptions={({ navigation }) => ({
              headerStyle: { backgroundColor: NIGHT_MID },
              headerTintColor: GOLD,
              headerTitleStyle: { color: TEXT_PRIMARY, fontWeight: '600' },
              headerShadowVisible: false,
              headerBackButtonDisplayMode: 'minimal',
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
              headerRight: () => <CoinBadge navigation={navigation} />,
            })}
          >
            <Stack.Screen name="Home" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen name="TarotSpread" component={TarotSpreadScreen} options={{ title: 'Tarot Falı' }} />
            <Stack.Screen name="Tarot" component={TarotScreen} options={{ title: 'Tarot Falı' }} />
            <Stack.Screen name="TarotResult" component={TarotResultScreen} options={{ title: 'Fal Yorumu' }} />
            <Stack.Screen name="DreamChat" component={DreamChatScreen} options={{ title: 'Rüya Yorumlama' }} />
            <Stack.Screen name="ProfileChat" component={ProfileChatScreen} options={{ title: 'Kendinden Bahset' }} />
            <Stack.Screen
              name="ImageReading"
              component={ImageReadingScreen}
              options={({ route }) => ({ title: route.params.kind === 'coffee' ? 'Kahve Falı' : 'El Falı' })}
            />
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
          </Stack.Navigator>
        </NavigationContainer>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: NIGHT_DEEP },
  appShell: { flex: 1, width: '100%', maxWidth: MAX_APP_WIDTH, alignSelf: 'center' },
});
