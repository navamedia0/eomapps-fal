import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { GOLD_SOFT } from '@/theme/colors';

type Props = {
  source?: ImageSourcePropType;
  fallback: React.ReactNode;
  size?: number;
};

export default function FeatureIcon({ fallback, size = 44 }: Props) {
  const borderRadius = Math.round(size * 0.32);

  return (
    <View
      style={[
        styles.iconWrap,
        {
          width: size,
          height: size,
          borderRadius,
        },
      ]}
    >
      {fallback}
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

