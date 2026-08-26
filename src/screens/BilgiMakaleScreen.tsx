import { View, Text, ScrollView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import articles from '@/data/bilgi_makaleleri.json';
import CornerTicks from '@/components/CornerTicks';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import { INFO_PURPLE, INFO_PURPLE_SOFT, INFO_CREAM, INFO_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'BilgiMakale'>;

export default function BilgiMakaleScreen({ route }: Props) {
  const article = articles[route.params.topic];

  return (
    <MysticTableBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <CornerTicks />
          {article.content.map((paragraph, index) => (
            <Text key={index} style={styles.paragraph}>
              {paragraph}
            </Text>
          ))}
        </View>
      </ScrollView>
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 48,
  },
  card: {
    position: 'relative',
    backgroundColor: INFO_PURPLE,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: INFO_PURPLE_SOFT,
    padding: 22,
    gap: 16,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 23,
    color: INFO_CREAM,
  },
});
