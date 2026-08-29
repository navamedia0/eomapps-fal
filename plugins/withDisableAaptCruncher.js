// Expo Config Plugin: AAPT2 PNG cruncher'ı devre dışı bırakır.
// hero_knight.png, hero_mage.png, hero_novice.png gibi büyük/özel PNG dosyaları
// AAPT2'nin PNG optimizasyon aşamasında hata veriyordu.
// cruncherEnabled = false → AAPT2 bu dosyaları doğrudan geçirir, compile etmez.

const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withDisableAaptCruncher(config) {
  return withAppBuildGradle(config, (gradleConfig) => {
    const contents = gradleConfig.modResults.contents;

    // Zaten eklenmiş mi kontrol et
    if (contents.includes('cruncherEnabled')) {
      return gradleConfig;
    }

    // android { bloğunun hemen içine aaptOptions ekle
    gradleConfig.modResults.contents = contents.replace(
      /android\s*\{/,
      `android {
    aaptOptions {
        cruncherEnabled = false
    }
`
    );

    return gradleConfig;
  });
};
