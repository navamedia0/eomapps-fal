import type { ImageSourcePropType } from 'react-native';

// Karakter/avatar görsel katmanları (Klasik Mistik Stil)
export const AVATAR_ASSETS: Record<string, ImageSourcePropType> = {
  // Taban Karakterler
  base_female: require('./base_female.png'),
  blink_female: require('./blink_female.png'),
  base_male: require('./base_male.png'),
  blink_male: require('./blink_male.png'),

  // Şapkalar (3 Adet - Tamamı Hazır)
  avatar_hat_star: require('./avatar_hat_star.png'),
  avatar_hat_crescent: require('./avatar_hat_crescent.png'),
  avatar_hat_flowercrown: require('./avatar_hat_flowercrown.png'),

  // Pelerinler (3 Adet - Tamamı Hazır)
  avatar_cape_starry: require('./avatar_cape_starry.png'),
  avatar_cape_shadow: require('./avatar_cape_shadow.png'),
  avatar_cape_royal: require('./avatar_cape_royal.png'),

  // Kıyafetler (2 Adet Hazır)
  avatar_outfit_mystic: require('./avatar_outfit_mystic.png'),
  avatar_outfit_scholar: require('./avatar_outfit_scholar.png'),

  // Özel Kostüm / Karakter Skinleri (Stumble Guys Modeli)
  skin_leonidas: require('./skin_leonidas.png'),
};
