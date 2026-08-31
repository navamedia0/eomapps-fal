import type { ImageSourcePropType } from 'react-native';

// Karakter/avatar görsel katmanları — henüz gerçek PNG yok, bu yüzden harita
// boş. "Avatar Atölyesi" prompt kütüphanesindeki adımlarla üretilen (ve
// arka planı silinmiş, şeffaf PNG'ye çevrilmiş) her görsel buraya, aşağıdaki
// anahtarlardan biriyle eklenince AvatarRenderer otomatik olarak katmanlı
// gerçek görsele geçer — başka hiçbir kod değişikliği gerekmez.
//
// Anahtarlar:
//   'base_female' / 'base_male'   — temel karakter gövdesi (yüz dahil, gözler açık)
//   'blink_female' / 'blink_male' — göz kırpma anındaki yüz/göz katmanı (base'in üstüne biner)
//   '<shop_items.id>'             — kıyafet parçaları, örn. 'avatar_hat_star',
//                                    'avatar_cape_starry', 'avatar_outfit_mystic',
//                                    'avatar_pants_night' (bkz. schema.sql seed satırları)
//
// Örnek: base_female: require('./base_female.png'),
export const AVATAR_ASSETS: Record<string, ImageSourcePropType> = {};
