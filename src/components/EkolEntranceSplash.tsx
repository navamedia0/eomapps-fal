import { useEffect } from 'react';
import type { ImageSourcePropType } from 'react-native';

type Props = {
  visible: boolean;
  figureSource?: ImageSourcePropType;
  title?: string;
  subtitle?: string;
  accentColor?: string;
  onFinish: () => void;
};

export default function EkolEntranceSplash({ visible, onFinish }: Props) {
  useEffect(() => {
    if (visible) {
      onFinish();
    }
  }, [visible, onFinish]);

  return null;
}

