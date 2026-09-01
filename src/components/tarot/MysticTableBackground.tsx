import React, { type ReactNode } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';

type Props = {
  children: ReactNode;
  variant?: string;
  customBackground?: any;
  scrollY?: Animated.Value;
};

export default function MysticTableBackground({ children, customBackground }: Props) {
  return (
    <View style={styles.container}>
      {customBackground && (
        <Image
          source={customBackground}
          resizeMode="cover"
          style={styles.customBgImage}
        />
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  customBgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
});
