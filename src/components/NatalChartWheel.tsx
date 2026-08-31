import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Text as SvgText, G, Path } from 'react-native-svg';
import type { PlanetPosition, AspectData, HouseData } from '@/services/astrology';
import { GOLD, GOLD_SOFT, NIGHT_CARD, NIGHT_MID, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

const VIEW_SIZE = 420;
const CENTER = VIEW_SIZE / 2;

// 12 Burç Vektör Yolları (Koç'tan Balık'a) - 24x24 kutu içinde saf altın vektörler (Emojilerden kaynaklanan mor kareleri engeller)
const ZODIAC_PATHS: string[] = [
  // 0: Koç (Aries)
  'M 12,21 L 12,9 C 12,5.5 9,3.5 6.5,3.5 C 3.5,3.5 2,5.5 2,8 C 2,10.5 3.5,12 5.5,12 M 12,9 C 12,5.5 15,3.5 17.5,3.5 C 20.5,3.5 22,5.5 22,8 C 22,10.5 20.5,12 18.5,12',
  // 1: Boğa (Taurus)
  'M 5,3 C 5,7.5 8,10 12,10 C 16,10 19,7.5 19,3 M 12,10 A 6.5,6.5 0 1,1 11.9,10',
  // 2: İkizler (Gemini)
  'M 4,4 C 8,6.5 16,6.5 20,4 M 4,20 C 8,17.5 16,17.5 20,20 M 8,5 L 8,19 M 16,5 L 16,19',
  // 3: Yengeç (Cancer)
  'M 8,7.5 A 3.5,3.5 0 1,1 11.5,11 C 9.5,12.5 5,11 3,7.5 C 2,5 4.5,3 8,7.5 Z M 16,16.5 A 3.5,3.5 0 1,1 12.5,13 C 14.5,11.5 19,13 21,16.5 C 22,19 19.5,21 16,16.5 Z',
  // 4: Aslan (Leo)
  'M 5,15.5 A 2.8,2.8 0 1,1 7.8,12.7 C 8,9.5 11,5.5 15,5.5 C 18.5,5.5 20.5,8 20.5,11.5 C 20.5,15.5 16.5,17 16.5,19.5 C 16.5,21.5 18,22 19,21 C 20,20 20.5,18.5 20.5,18.5',
  // 5: Başak (Virgo)
  'M 4,6 L 4,18 M 4,8 C 5,6 8,6 8,9 L 8,18 M 8,8 C 9,6 12,6 12,9 L 12,18 C 12,21 15,22 17,19 L 13.5,14 L 18,22',
  // 6: Terazi (Libra)
  'M 3,19 L 21,19 M 3,15 L 8,15 C 8,11 11,7.5 12,7.5 C 13,7.5 16,11 16,15 L 21,15',
  // 7: Akrep (Scorpio)
  'M 4,6 L 4,18 M 4,8 C 5,6 8,6 8,9 L 8,18 M 8,8 C 9,6 12,6 12,9 L 12,18 C 12,20 14,21 16,19 L 18,21 M 15,21 L 18,21 L 18,18',
  // 8: Yay (Sagittarius)
  'M 5,19 L 19,5 M 10,5 L 19,5 L 19,14 M 8,16 L 14,10',
  // 9: Oğlak (Capricorn)
  'M 4,7 L 7,15 C 8,17.5 10,17.5 11,15 L 13,8.5 C 14,6.5 16,6.5 17,8.5 C 18,10.5 17,13.5 15,15.5 C 13,17.5 13,19.5 14,20.5 C 15.5,21.5 17,20.5 17.5,18.5',
  // 10: Kova (Aquarius)
  'M 3,9.5 L 6,6.5 L 9,9.5 L 12,6.5 L 15,9.5 L 18,6.5 L 21,9.5 M 3,15.5 L 6,12.5 L 9,15.5 L 12,12.5 L 15,15.5 L 18,12.5 L 21,15.5',
  // 11: Balık (Pisces)
  'M 6,4 C 9,8.5 9,15.5 6,20 M 18,4 C 15,8.5 15,15.5 18,20 M 4,12 L 20,12',
];

// 4 Element Dilim Renkleri (Halka Zeminine Zarafet Katar)
const ELEMENT_COLORS: string[] = [
  'rgba(239, 68, 68, 0.16)', // Koç: Ateş
  'rgba(16, 185, 129, 0.16)', // Boğa: Toprak
  'rgba(56, 189, 248, 0.16)', // İkizler: Hava
  'rgba(129, 140, 248, 0.16)', // Yengeç: Su
  'rgba(239, 68, 68, 0.16)', // Aslan: Ateş
  'rgba(16, 185, 129, 0.16)', // Başak: Toprak
  'rgba(56, 189, 248, 0.16)', // Terazi: Hava
  'rgba(129, 140, 248, 0.16)', // Akrep: Su
  'rgba(239, 68, 68, 0.16)', // Yay: Ateş
  'rgba(16, 185, 129, 0.16)', // Oğlak: Toprak
  'rgba(56, 189, 248, 0.16)', // Kova: Hava
  'rgba(129, 140, 248, 0.16)', // Balık: Su
];

const PLANET_COLORS: Record<string, string> = {
  Sun: '#F59E0B',
  Moon: '#E2E8F0',
  Mercury: '#38BDF8',
  Venus: '#F472B6',
  Mars: '#EF4444',
  Jupiter: '#C084FC',
  Saturn: '#FBBF24',
  Uranus: '#22D3EE',
  Neptune: '#818CF8',
  Pluto: '#A1A1AA',
};

function pointAt(longitudeDeg: number, radius: number) {
  const rad = (longitudeDeg * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.sin(rad),
    y: CENTER - radius * Math.cos(rad),
  };
}

// Birbirine çok yakın (14 dereceden az) gezegenlerin üst üste binmesini önleyen radyal kademe algoritması
function computePlanetRadii(planets: PlanetPosition[], baseR: number, deltaR: number): Map<string, number> {
  const sorted = [...planets].sort((a, b) => a.longitude - b.longitude);
  const result = new Map<string, number>();

  for (let i = 0; i < sorted.length; i++) {
    const curr = sorted[i];
    const prev = sorted[(i - 1 + sorted.length) % sorted.length];
    const next = sorted[(i + 1) % sorted.length];

    let diffPrev = Math.abs(curr.longitude - prev.longitude);
    if (diffPrev > 180) diffPrev = 360 - diffPrev;

    let diffNext = Math.abs(curr.longitude - next.longitude);
    if (diffNext > 180) diffNext = 360 - diffNext;

    if (diffPrev < 14 || diffNext < 14) {
      // Çakışma önleyici kademe
      const offset = i % 2 === 0 ? deltaR : -deltaR;
      result.set(curr.key, baseR + offset);
    } else {
      result.set(curr.key, baseR);
    }
  }

  return result;
}

type Props = {
  sunLongitude: number;
  moonLongitude: number;
  risingLongitude: number;
  planets?: PlanetPosition[];
  aspects?: AspectData[];
  houses?: HouseData[];
  size?: number;
};

export default function NatalChartWheel({
  sunLongitude,
  moonLongitude,
  risingLongitude,
  planets,
  aspects,
  houses,
  size = 350,
}: Props) {
  const [selectedKey, setSelectedKey] = useState<string>('Sun');

  const outerR = 198;
  const signRingR = 164;
  const houseRingR = 136;
  const basePlanetR = 104;
  const innerAspectR = 66;

  // 12 Burç dilimleri (30'ar derece)
  const segments = Array.from({ length: 12 }, (_, i) => i * 30);

  // Akslar (ASC, DSC, MC, IC)
  const ascPoint = pointAt(risingLongitude, outerR);
  const dscPoint = pointAt((risingLongitude + 180) % 360, outerR);

  // Gezegen çakışma önleyici yarıçap hesaplama
  const planetRadii = planets ? computePlanetRadii(planets, basePlanetR, 17) : new Map<string, number>();

  const selectedPlanet = planets?.find((p) => p.key === selectedKey) || planets?.[0];

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}>
        {/* Dış Astrolabe ve Zodyak Halkaları */}
        <Circle cx={CENTER} cy={CENTER} r={outerR} stroke="rgba(255, 201, 60, 0.45)" strokeWidth={2} fill={NIGHT_CARD} fillOpacity={0.8} />
        <Circle cx={CENTER} cy={CENTER} r={signRingR} stroke="rgba(255, 201, 60, 0.3)" strokeWidth={1.2} fill="rgba(8, 7, 8, 0.6)" />
        <Circle cx={CENTER} cy={CENTER} r={houseRingR} stroke="rgba(255, 201, 60, 0.35)" strokeWidth={1} fill="none" />
        <Circle cx={CENTER} cy={CENTER} r={innerAspectR} stroke="rgba(255, 201, 60, 0.25)" strokeWidth={1.5} fill="#05030e" />

        {/* 360 Derecelik Astronomik Kadran Çentikleri (Her 5 ve 10 derecede bir) */}
        {Array.from({ length: 72 }, (_, i) => i * 5).map((deg) => {
          const isDecan = deg % 10 === 0;
          const isSignBorder = deg % 30 === 0;
          const r1 = outerR;
          const r2 = isSignBorder ? signRingR : isDecan ? outerR - 6 : outerR - 3;
          const p1 = pointAt(deg, r1);
          const p2 = pointAt(deg, r2);

          return (
            <Line
              key={`tick-${deg}`}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={isSignBorder ? 'rgba(255, 201, 60, 0.5)' : 'rgba(255, 201, 60, 0.22)'}
              strokeWidth={isSignBorder ? 1.5 : 0.8}
            />
          );
        })}

        {/* 12 Burç Bölüntüleri ve Element Renkleri */}
        {segments.map((deg, i) => {
          const outer = pointAt(deg, outerR);
          const inner = pointAt(deg, signRingR);
          const centerDeg = deg + 15;
          const glyphPos = pointAt(centerDeg, (outerR + signRingR) / 2);

          return (
            <G key={`sign-${i}`}>
              {/* Burç Sınır Çizgisi */}
              <Line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="rgba(255, 201, 60, 0.4)" strokeWidth={1.2} />

              {/* Burç Vektör Glifi (Mor kare içermeyen, pürüzsüz altın vektör) */}
              <G transform={`translate(${glyphPos.x - 10}, ${glyphPos.y - 10}) scale(0.85)`}>
                <Path
                  d={ZODIAC_PATHS[i]}
                  fill="none"
                  stroke={GOLD}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </G>
            </G>
          );
        })}

        {/* 12 Ev Çizgileri ve Numaraları */}
        {houses &&
          houses.map((h) => {
            const cusp = pointAt(h.cuspLongitude, signRingR);
            const inner = pointAt(h.cuspLongitude, innerAspectR);
            const labelPos = pointAt(h.cuspLongitude + 15, (signRingR + houseRingR) / 2);

            return (
              <G key={`house-${h.house}`}>
                <Line
                  x1={inner.x}
                  y1={inner.y}
                  x2={cusp.x}
                  y2={cusp.y}
                  stroke="rgba(255, 201, 60, 0.25)"
                  strokeWidth={0.8}
                  strokeDasharray="2,2"
                />
                <SvgText
                  x={labelPos.x}
                  y={labelPos.y + 3}
                  fontSize={10.5}
                  fill="rgba(255, 201, 60, 0.85)"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  fontWeight="700"
                >
                  {h.house}
                </SvgText>
              </G>
            );
          })}

        {/* Merkezdeki Canlı Astrolojik Açı Ağı (Aspect Web) */}
        {aspects &&
          aspects.slice(0, 16).map((aspect, idx) => {
            const p1 = planets?.find((p) => p.key === aspect.body1);
            const p2 = planets?.find((p) => p.key === aspect.body2);
            if (!p1 || !p2) return null;

            const pt1 = pointAt(p1.longitude, innerAspectR);
            const pt2 = pointAt(p2.longitude, innerAspectR);

            return (
              <Line
                key={`aspect-${idx}`}
                x1={pt1.x}
                y1={pt1.y}
                x2={pt2.x}
                y2={pt2.y}
                stroke={aspect.color}
                strokeWidth={aspect.type === 'harmonious' ? 1.4 : 1.1}
                strokeOpacity={0.7}
              />
            );
          })}

        {/* ASC - DSC Ufuk Ekseni Çizgisi */}
        <Line
          x1={ascPoint.x}
          y1={ascPoint.y}
          x2={dscPoint.x}
          y2={dscPoint.y}
          stroke={GOLD}
          strokeWidth={1.8}
          strokeDasharray="5,4"
        />

        {/* 10 Gezegenin Çark Üzerine Hassas ve Çakışmasız Yerleşimi */}
        {planets && planets.length > 0 ? (
          planets.map((p) => {
            const radius = planetRadii.get(p.key) ?? basePlanetR;
            const pt = pointAt(p.longitude, radius);
            const ringPoint = pointAt(p.longitude, signRingR);
            const color = PLANET_COLORS[p.key] || GOLD;
            const isSelected = p.key === selectedKey;

            return (
              <G key={p.key} onPress={() => setSelectedKey(p.key)}>
                {/* Gezegenin Tam Gökyüzü Derecesine İşaret Eden İnce Çizgi */}
                <Line
                  x1={pt.x}
                  y1={pt.y}
                  x2={ringPoint.x}
                  y2={ringPoint.y}
                  stroke={color}
                  strokeWidth={0.8}
                  strokeOpacity={0.4}
                />

                {/* Seçili İse Altın Parlama Halkası */}
                {isSelected && (
                  <Circle cx={pt.x} cy={pt.y} r={17} stroke={GOLD} strokeWidth={1.5} fill="none" opacity={0.8} />
                )}

                {/* Gezegen Glif Rozeti */}
                <Circle cx={pt.x} cy={pt.y} r={13.5} fill="#0d0922" stroke={color} strokeWidth={1.8} />

                {/* Gezegen Sembolü */}
                <SvgText
                  x={pt.x}
                  y={pt.y + 4}
                  fontSize={14}
                  fill={color}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  fontWeight="bold"
                >
                  {p.symbol}
                </SvgText>

                {/* Derece Etiketi (örn: 14°) */}
                <SvgText
                  x={pt.x}
                  y={pt.y - 16}
                  fontSize={8}
                  fill="rgba(255, 255, 255, 0.85)"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  fontWeight="700"
                >
                  {p.degree}°
                </SvgText>
              </G>
            );
          })
        ) : (
          /* Geriye Dönük Basit Mod */
          <G>
            {(() => {
              const sun = pointAt(sunLongitude, basePlanetR);
              const moon = pointAt(moonLongitude, basePlanetR);
              const rising = pointAt(risingLongitude, basePlanetR);

              return (
                <>
                  <Line x1={CENTER} y1={CENTER} x2={sun.x} y2={sun.y} stroke="#F59E0B" strokeWidth={1.5} />
                  <Circle cx={sun.x} cy={sun.y} r={13} fill={NIGHT_MID} stroke="#F59E0B" strokeWidth={1.8} />
                  <SvgText x={sun.x} y={sun.y + 4} fontSize={14} fill="#F59E0B" textAnchor="middle" alignmentBaseline="middle">
                    ☉
                  </SvgText>

                  <Line x1={CENTER} y1={CENTER} x2={moon.x} y2={moon.y} stroke="#CBD5E1" strokeWidth={1.5} />
                  <Circle cx={moon.x} cy={moon.y} r={13} fill={NIGHT_MID} stroke="#CBD5E1" strokeWidth={1.8} />
                  <SvgText x={moon.x} y={moon.y + 4} fontSize={14} fill="#CBD5E1" textAnchor="middle" alignmentBaseline="middle">
                    ☽
                  </SvgText>

                  <Line x1={CENTER} y1={CENTER} x2={rising.x} y2={rising.y} stroke={GOLD} strokeWidth={1.5} />
                  <Circle cx={rising.x} cy={rising.y} r={14} fill={NIGHT_MID} stroke={GOLD} strokeWidth={1.8} />
                  <SvgText x={rising.x} y={rising.y + 3} fontSize={9} fill={GOLD} textAnchor="middle" alignmentBaseline="middle" fontWeight="bold">
                    ASC
                  </SvgText>
                </>
              );
            })()}
          </G>
        )}

        {/* ASC Ufuk Rozeti */}
        <Circle cx={ascPoint.x} cy={ascPoint.y} r={13} fill="#1a0f30" stroke={GOLD} strokeWidth={1.5} />
        <SvgText x={ascPoint.x} y={ascPoint.y + 3.5} fontSize={8.5} fill={GOLD} textAnchor="middle" alignmentBaseline="middle" fontWeight="bold">
          ASC
        </SvgText>
      </Svg>

      {/* Seçili Gezegen Hızlı Bilgi Kartı (Kullanıcı çarkta gezegene dokunduğunda anında güncellenir) */}
      {selectedPlanet && (
        <View style={styles.selectedPlanetCard}>
          <View style={styles.selectedLeft}>
            <View style={[styles.selectedSymbolBadge, { borderColor: PLANET_COLORS[selectedPlanet.key] || GOLD }]}>
              <Text style={[styles.selectedSymbolText, { color: PLANET_COLORS[selectedPlanet.key] || GOLD }]}>
                {selectedPlanet.symbol}
              </Text>
            </View>
            <View>
              <Text style={styles.selectedPlanetName}>
                {selectedPlanet.name} · {selectedPlanet.signName} ({selectedPlanet.formattedDegree})
              </Text>
              <Text style={styles.selectedPlanetMeta}>
                {selectedPlanet.house}. Evde {selectedPlanet.isRetrograde ? '· [RETRO GERİLEME]' : ''}
              </Text>
            </View>
          </View>
          <Text style={styles.selectedPlanetTheme}>{selectedPlanet.theme}</Text>
        </View>
      )}

      {/* Gezegen Hızlı Seçici Butonları */}
      {planets && (
        <View style={styles.planetPillRow}>
          {planets.map((p) => {
            const isSel = p.key === selectedKey;
            const color = PLANET_COLORS[p.key] || GOLD;
            return (
              <Pressable
                key={p.key}
                onPress={() => setSelectedKey(p.key)}
                style={[
                  styles.planetPill,
                  isSel && { backgroundColor: 'rgba(255, 201, 60, 0.25)', borderColor: color },
                ]}
              >
                <Text style={[styles.planetPillSymbol, { color }]}>{p.symbol}</Text>
                <Text style={[styles.planetPillText, isSel && { color: '#FFFFFF', fontWeight: '800' }]}>
                  {p.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  selectedPlanetCard: {
    width: '94%',
    backgroundColor: 'rgba(30, 30, 32, 0.95)',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 201, 60, 0.35)',
    padding: 12,
    marginTop: 14,
    gap: 6,
  },
  selectedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectedSymbolBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedSymbolText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  selectedPlanetName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  selectedPlanetMeta: {
    fontSize: 11.5,
    color: GOLD,
    fontWeight: '600',
  },
  selectedPlanetTheme: {
    fontSize: 11.5,
    lineHeight: 16,
    color: TEXT_MUTED,
  },
  planetPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 10,
  },
  planetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(8, 7, 8, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 201, 60, 0.2)',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  planetPillSymbol: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  planetPillText: {
    fontSize: 11,
    color: TEXT_MUTED,
    fontWeight: '600',
  },
});
