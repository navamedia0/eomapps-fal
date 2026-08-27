import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  useWindowDimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { ReadingHistoryEntry } from '@/services/readingHistory';
import type { DetailedBirthChart } from '@/services/astrology';
import NatalChartWheel from '@/components/NatalChartWheel';
import CornerTicks from '@/components/CornerTicks';
import ShareButton from '@/components/ShareButton';
import { ZODIAC_INFO } from '@/constants/zodiacInfo';
import { GOLD, GOLD_SOFT, NIGHT_CARD, NIGHT_MID, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = {
  visible: boolean;
  onClose: () => void;
  entry: ReadingHistoryEntry | null;
};

type ResultTab = 'wheel' | 'planets' | 'aspects' | 'report';

export default function BirthChartDossierModal({ visible, onClose, entry }: Props) {
  const { width } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<ResultTab>('wheel');

  const detailedChart: DetailedBirthChart | undefined = entry?.metadata?.detailedChart;
  const wheelSize = Math.min(width - 48, 350);

  const parsedReportSections = useMemo(() => {
    if (!entry?.result) return null;
    const headers = [
      '1. BÜYÜK ÜÇLÜ VE RUHUN KİMLİĞİ:',
      '2. AŞK, İLİŞKİLER VE ÇEKİM HARİTASI:',
      '3. KARİYER, PARA VE BAŞARI POTANSİYELİ:',
      '4. KARMİK DERSLER VE HAYAT SINAVLARI:',
      '5. ELEMENT DENGESİ VE MİSTİK YAŞAM REHBERİ:',
    ];

    const sections: { title: string; body: string }[] = [];
    let remaining = entry.result;

    for (let i = 0; i < headers.length; i++) {
      const currentHeader = headers[i];
      const nextHeader = headers[i + 1];

      const startIdx = remaining.indexOf(currentHeader);
      if (startIdx !== -1) {
        const bodyStart = startIdx + currentHeader.length;
        const endIdx = nextHeader ? remaining.indexOf(nextHeader) : remaining.length;
        const content = remaining.slice(bodyStart, endIdx !== -1 ? endIdx : undefined).trim();
        sections.push({
          title: currentHeader.replace(':', ''),
          body: content,
        });
      }
    }

    return sections.length > 0 ? sections : [{ title: 'Doğum Haritası Raporu', body: entry.result }];
  }, [entry?.result]);

  if (!entry) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalContent}>
          {/* ÜST DOSYA BAŞLIĞI */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleWrap}>
              <View style={styles.folderBadge}>
                <MaterialCommunityIcons name="folder-star" size={16} color={GOLD} />
                <Text style={styles.folderBadgeText}>ARŞİV DOSYASI</Text>
              </View>
              <Text style={styles.modalTitle}>{entry.title}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={GOLD} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {detailedChart ? (
              <View style={styles.detailedWrap}>
                {/* 4 SEKME GEZİNTİSİ */}
                <View style={styles.tabsRow}>
                  <Pressable
                    style={[styles.tabButton, activeTab === 'wheel' && styles.tabButtonActive]}
                    onPress={() => setActiveTab('wheel')}
                  >
                    <Text style={[styles.tabButtonText, activeTab === 'wheel' && styles.tabButtonTextActive]}>
                      🌌 Harita Çarkı
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.tabButton, activeTab === 'planets' && styles.tabButtonActive]}
                    onPress={() => setActiveTab('planets')}
                  >
                    <Text style={[styles.tabButtonText, activeTab === 'planets' && styles.tabButtonTextActive]}>
                      🪐 Gezegenler & Evler
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.tabButton, activeTab === 'aspects' && styles.tabButtonActive]}
                    onPress={() => setActiveTab('aspects')}
                  >
                    <Text style={[styles.tabButtonText, activeTab === 'aspects' && styles.tabButtonTextActive]}>
                      📐 Açılar ({detailedChart.aspects.length})
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.tabButton, activeTab === 'report' && styles.tabButtonActive]}
                    onPress={() => setActiveTab('report')}
                  >
                    <Text style={[styles.tabButtonText, activeTab === 'report' && styles.tabButtonTextActive]}>
                      📜 Detaylı Analiz
                    </Text>
                  </Pressable>
                </View>

                {/* SEKME 1: ÇARK & ÖZET */}
                {activeTab === 'wheel' && (
                  <View style={styles.tabContentWrap}>
                    <View style={styles.wheelCard}>
                      <NatalChartWheel
                        sunLongitude={detailedChart.sunLongitude}
                        moonLongitude={detailedChart.moonLongitude}
                        risingLongitude={detailedChart.risingLongitude}
                        planets={detailedChart.planets}
                        aspects={detailedChart.aspects}
                        houses={detailedChart.houses}
                        size={wheelSize}
                      />
                    </View>

                    {/* Büyük Üçlü */}
                    <Text style={styles.sectionTitle}>BÜYÜK ÜÇLÜ</Text>
                    <View style={styles.signRow}>
                      <View style={styles.signCard}>
                        <MaterialCommunityIcons
                          name={ZODIAC_INFO[detailedChart.sunSign].icon as any}
                          size={26}
                          color="#F59E0B"
                        />
                        <Text style={styles.signCardLabel}>Güneş ☉</Text>
                        <Text style={styles.signCardValue}>{ZODIAC_INFO[detailedChart.sunSign].name}</Text>
                      </View>
                      <View style={styles.signCard}>
                        <MaterialCommunityIcons
                          name={ZODIAC_INFO[detailedChart.moonSign].icon as any}
                          size={26}
                          color="#CBD5E1"
                        />
                        <Text style={styles.signCardLabel}>Ay ☽</Text>
                        <Text style={styles.signCardValue}>{ZODIAC_INFO[detailedChart.moonSign].name}</Text>
                      </View>
                      <View style={styles.signCard}>
                        <MaterialCommunityIcons
                          name={ZODIAC_INFO[detailedChart.risingSign].icon as any}
                          size={26}
                          color={GOLD}
                        />
                        <Text style={styles.signCardLabel}>Yükselen ASC</Text>
                        <Text style={styles.signCardValue}>{ZODIAC_INFO[detailedChart.risingSign].name}</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* SEKME 2: 10 GEZEGEN & 12 EV */}
                {activeTab === 'planets' && (
                  <View style={styles.tabContentWrap}>
                    <Text style={styles.sectionTitle}>10 GEZEGENİN TAM DERECELERİ</Text>
                    <View style={styles.planetsList}>
                      {detailedChart.planets.map((p) => (
                        <View key={p.key} style={styles.planetCard}>
                          <CornerTicks />
                          <View style={styles.planetCardTop}>
                            <View style={styles.planetSymbolCircle}>
                              <Text style={styles.planetSymbolText}>{p.symbol}</Text>
                            </View>
                            <View style={styles.planetNameWrap}>
                              <Text style={styles.planetNameText}>{p.name}</Text>
                              <Text style={styles.planetSignText}>
                                {p.signName} Burcunda ({p.formattedDegree})
                              </Text>
                            </View>
                            <View style={styles.planetHouseBadge}>
                              <Text style={styles.planetHouseBadgeText}>{p.house}. Ev</Text>
                            </View>
                          </View>
                          {p.isRetrograde && (
                            <View style={styles.retroBadge}>
                              <Text style={styles.retroBadgeText}>[RETRO · GERİLEME]</Text>
                            </View>
                          )}
                          <Text style={styles.planetThemeText}>{p.theme}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* SEKME 3: AÇILAR */}
                {activeTab === 'aspects' && (
                  <View style={styles.tabContentWrap}>
                    <Text style={styles.sectionTitle}>ÖNEMLİ ASTROLOJİK AÇILAR</Text>
                    <View style={styles.aspectsList}>
                      {detailedChart.aspects.map((asp, idx) => (
                        <View key={idx} style={styles.aspectCard}>
                          <CornerTicks />
                          <View style={styles.aspectTopRow}>
                            <Text style={styles.aspectSymbolText}>{asp.symbol}</Text>
                            <Text style={styles.aspectNamesText}>
                              {asp.body1Name} {asp.aspectName} {asp.body2Name}
                            </Text>
                          </View>
                          <Text style={styles.aspectInterpretation}>{asp.interpretation}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* SEKME 4: RAPOR */}
                {activeTab === 'report' && (
                  <View style={styles.tabContentWrap}>
                    <Text style={styles.sectionTitle}>KAPSAMLI PROFESYONEL ASTROLOJİ RAPORU</Text>
                    <View style={styles.reportList}>
                      {parsedReportSections?.map((sec, idx) => (
                        <View key={idx} style={styles.reportCard}>
                          <CornerTicks />
                          <View style={styles.reportCardHeader}>
                            <MaterialCommunityIcons name="star-crescent" size={15} color={GOLD} />
                            <Text style={styles.reportCardTitle}>{sec.title}</Text>
                          </View>
                          <Text style={styles.reportCardBody}>{sec.body}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* 5 DERİN ANALİZ KARTLARI */}
                <View style={styles.advancedSectionContainer}>
                  <Text style={styles.advancedSectionHeader}>5 DERİN ASTROLOJİK ANALİZ</Text>

                  {/* 1. Aşk & Ruh Eşi */}
                  <View style={styles.advCard}>
                    <CornerTicks />
                    <View style={styles.advCardHeader}>
                      <MaterialCommunityIcons name="heart-multiple" size={20} color="#F472B6" />
                      <Text style={styles.advCardTitle}>1. Aşk, Evlilik & Ruh Eşi Uyumu</Text>
                    </View>
                    <Text style={styles.advCardSubtitle}>{detailedChart.advanced.love.dscMeaning}</Text>

                    <View style={styles.soulmatesList}>
                      {detailedChart.advanced.love.soulmateSigns.map((s, idx) => (
                        <View key={idx} style={styles.soulmateItem}>
                          <View style={styles.soulmateTop}>
                            <Text style={styles.soulmateSignName}>{s.signName}</Text>
                            <Text style={styles.soulmateScoreText}>%{s.score} Uyum</Text>
                          </View>
                          <Text style={styles.soulmateReasonText}>{s.reason}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* 2. Harita Yöneticisi */}
                  <View style={styles.advCard}>
                    <CornerTicks />
                    <View style={styles.advCardHeader}>
                      <MaterialCommunityIcons name="crown" size={20} color={GOLD} />
                      <Text style={styles.advCardTitle}>2. Harita Yöneticin & Baskın Gezegenin</Text>
                    </View>
                    <Text style={styles.advNormalText}>{detailedChart.advanced.chartRuler.message}</Text>
                    <Text style={[styles.advNormalText, { marginTop: 6 }]}>
                      {detailedChart.advanced.dominantPlanet.trait}
                    </Text>
                  </View>

                  {/* 3. Şans Noktası */}
                  <View style={styles.advCard}>
                    <CornerTicks />
                    <View style={styles.advCardHeader}>
                      <MaterialCommunityIcons name="clover" size={20} color="#10B981" />
                      <Text style={styles.advCardTitle}>3. Şans Noktan (Pars Fortunae)</Text>
                    </View>
                    <Text style={styles.advNormalText}>{detailedChart.advanced.fortunePoint.meaning}</Text>
                  </View>

                  {/* 4. Ay Düğümleri */}
                  <View style={styles.advCard}>
                    <CornerTicks />
                    <View style={styles.advCardHeader}>
                      <MaterialCommunityIcons name="compass-rose" size={20} color="#38BDF8" />
                      <Text style={styles.advCardTitle}>4. Ruhun Yaşam Amacı (Ay Düğümleri)</Text>
                    </View>
                    <Text style={styles.advNormalText}>{detailedChart.advanced.lunarNodes.northNode.lifePurpose}</Text>
                  </View>

                  {/* 5. Kariyer */}
                  <View style={styles.advCard}>
                    <CornerTicks />
                    <View style={styles.advCardHeader}>
                      <MaterialCommunityIcons name="briefcase-outline" size={20} color="#A855F7" />
                      <Text style={styles.advCardTitle}>
                        5. Kariyer Potansiyelin (MC: {detailedChart.advanced.career.mcSignName})
                      </Text>
                    </View>
                    <Text style={styles.advNormalText}>{detailedChart.advanced.career.leadershipStyle}</Text>
                    <Text style={[styles.advNormalText, { marginTop: 6 }]}>
                      💡 {detailedChart.advanced.career.successAdvice}
                    </Text>
                  </View>
                </View>

                {/* PAYLAŞ BUTONU */}
                <View style={styles.shareWrap}>
                  <ShareButton
                    text={`Mistik Rehber - Detaylı Doğum Haritam\n${entry.title}\n\n${entry.result}`}
                  />
                </View>
              </View>
            ) : (
              /* STANDART YORUM */
              <View style={styles.basicWrap}>
                <View style={styles.basicCard}>
                  <CornerTicks />
                  <Text style={styles.basicText}>{entry.result}</Text>
                </View>
                <View style={styles.shareWrap}>
                  <ShareButton text={`Mistik Rehber - Doğum Haritam\n\n${entry.result}`} />
                </View>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 3, 15, 0.96)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    flex: 1,
    width: '100%',
    maxWidth: 540,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(242, 200, 121, 0.2)',
  },
  headerTitleWrap: {
    flex: 1,
    gap: 4,
  },
  folderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  folderBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: GOLD,
    letterSpacing: 0.5,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  detailedWrap: {
    gap: 16,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
    backgroundColor: 'rgba(11, 10, 31, 0.7)',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.2)',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: GOLD,
  },
  tabButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: TEXT_MUTED,
    textAlign: 'center',
  },
  tabButtonTextActive: {
    color: '#1A0D33',
    fontWeight: '800',
  },
  tabContentWrap: {
    gap: 14,
  },
  wheelCard: {
    backgroundColor: 'rgba(26, 16, 52, 0.85)',
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: 'rgba(242, 200, 121, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: GOLD,
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: 4,
  },
  signRow: {
    flexDirection: 'row',
    gap: 8,
  },
  signCard: {
    flex: 1,
    backgroundColor: 'rgba(26, 16, 52, 0.88)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.3)',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    gap: 4,
  },
  signCardLabel: {
    fontSize: 11,
    color: TEXT_MUTED,
  },
  signCardValue: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  planetsList: {
    gap: 10,
  },
  planetCard: {
    position: 'relative',
    backgroundColor: 'rgba(26, 16, 52, 0.88)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.28)',
    padding: 14,
  },
  planetCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  planetSymbolCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(242, 200, 121, 0.12)',
    borderWidth: 1,
    borderColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planetSymbolText: {
    fontSize: 18,
    color: GOLD,
    fontWeight: 'bold',
  },
  planetNameWrap: {
    flex: 1,
  },
  planetNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  planetSignText: {
    fontSize: 12,
    color: GOLD,
  },
  planetHouseBadge: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.4)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  planetHouseBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D8B4FE',
  },
  retroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
    marginTop: 6,
  },
  retroBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F87171',
  },
  planetThemeText: {
    fontSize: 11.5,
    lineHeight: 16,
    color: TEXT_MUTED,
    marginTop: 6,
  },
  aspectsList: {
    gap: 10,
  },
  aspectCard: {
    position: 'relative',
    backgroundColor: 'rgba(26, 16, 52, 0.88)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.25)',
    padding: 12,
  },
  aspectTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  aspectSymbolText: {
    fontSize: 16,
    color: GOLD,
    fontWeight: 'bold',
  },
  aspectNamesText: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  aspectInterpretation: {
    fontSize: 12,
    color: TEXT_MUTED,
  },
  reportList: {
    gap: 12,
  },
  reportCard: {
    position: 'relative',
    backgroundColor: 'rgba(26, 16, 52, 0.92)',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(242, 200, 121, 0.35)',
    padding: 14,
  },
  reportCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  reportCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: GOLD,
  },
  reportCardBody: {
    fontSize: 13,
    lineHeight: 20,
    color: TEXT_PRIMARY,
  },
  advancedSectionContainer: {
    marginTop: 10,
    gap: 14,
  },
  advancedSectionHeader: {
    fontSize: 13,
    fontWeight: '900',
    color: GOLD,
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  advCard: {
    position: 'relative',
    backgroundColor: 'rgba(26, 16, 52, 0.92)',
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: 'rgba(242, 200, 121, 0.35)',
    padding: 14,
  },
  advCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  advCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: GOLD,
  },
  advCardSubtitle: {
    fontSize: 12,
    color: TEXT_PRIMARY,
    lineHeight: 16,
    marginBottom: 10,
  },
  soulmatesList: {
    gap: 6,
  },
  soulmateItem: {
    backgroundColor: 'rgba(11, 10, 31, 0.65)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.2)',
    padding: 8,
    gap: 2,
  },
  soulmateTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  soulmateSignName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  soulmateScoreText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F472B6',
  },
  soulmateReasonText: {
    fontSize: 11.5,
    lineHeight: 15,
    color: TEXT_MUTED,
  },
  advNormalText: {
    fontSize: 12,
    lineHeight: 17,
    color: TEXT_PRIMARY,
  },
  shareWrap: {
    marginTop: 10,
  },
  basicWrap: {
    gap: 14,
  },
  basicCard: {
    position: 'relative',
    backgroundColor: 'rgba(26, 16, 52, 0.92)',
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: 'rgba(242, 200, 121, 0.35)',
    padding: 16,
  },
  basicText: {
    fontSize: 13.5,
    lineHeight: 22,
    color: TEXT_PRIMARY,
  },
});
