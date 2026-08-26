import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Starfield from '@/components/Starfield';

type Props = { children: ReactNode };

// Dedicated cosmic backdrop for chat-style screens, adapted from the
// Occult-Gold-Chat-Bubble reference (deep indigo nebula + starfield),
// distinct from MysticTableBackground's candlelit table photography.
export default function CosmicChatBackground({ children }: Props) {
  return (
    <View style={styles.flex}>
      <LinearGradient
        colors={['#1B1740', '#0F0C24', '#080611', '#05030A']}
        start={{ x: 0.3, y: 0.15 }}
        end={{ x: 0.75, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={['rgba(201, 168, 106, 0.16)', 'rgba(201, 168, 106, 0)']}
        style={styles.glow}
        pointerEvents="none"
      />
      <Starfield count={22} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  glow: {
    position: 'absolute',
    top: -80,
    left: '15%',
    width: 320,
    height: 320,
    borderRadius: 160,
  },
});
