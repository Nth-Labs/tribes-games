import React, { useMemo } from 'react';
import { ImageBackground, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import RouletteWheel from '../components/RouletteWheel';
import VoucherSummary from '../components/VoucherSummary';
import { DEFAULT_SPIN_THE_WHEEL_CONFIG } from '../config/defaultWheelConfig';

const PrizeWheelScreen = ({ navigation, route }) => {
  const routeParams = route?.params ?? {};
  const routeConfig = routeParams.wheelConfig ?? {};

  const mergedConfig = useMemo(() => {
    const segments = Array.isArray(routeConfig.segments) && routeConfig.segments.length >= 2
      ? routeConfig.segments
      : DEFAULT_SPIN_THE_WHEEL_CONFIG.segments;

    return {
      ...DEFAULT_SPIN_THE_WHEEL_CONFIG,
      ...routeConfig,
      title: routeParams.name ?? routeConfig.title ?? DEFAULT_SPIN_THE_WHEEL_CONFIG.title,
      description: routeConfig.description ?? DEFAULT_SPIN_THE_WHEEL_CONFIG.description,
      ctaLabel: routeConfig.ctaLabel ?? DEFAULT_SPIN_THE_WHEEL_CONFIG.ctaLabel,
      segments,
      summary: routeConfig.summary ?? DEFAULT_SPIN_THE_WHEEL_CONFIG.summary,
    };
  }, [routeConfig, routeParams.name]);

  const handleSpinEnd = (segment) => {
    const reward = segment.reward ?? { type: 'voucher', title: segment.label };

    navigation.navigate('VoucherWon', {
      reward: {
        type: reward.type ?? 'voucher',
        title: reward.title ?? segment.label,
        description: reward.description,
        icon: reward.icon,
      },
      wheelTitle: mergedConfig.title,
    });
  };

  const ContentWrapper = mergedConfig.backgroundImage ? ImageBackground : View;
  const contentWrapperProps = mergedConfig.backgroundImage
    ? { source: mergedConfig.backgroundImage, style: styles.background, imageStyle: styles.backgroundImage }
    : { style: styles.background };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ContentWrapper {...contentWrapperProps}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>

          <View style={styles.headerContainer}>
            <Text style={styles.title}>{mergedConfig.title}</Text>
            {mergedConfig.description ? (
              <Text style={styles.description}>{mergedConfig.description}</Text>
            ) : null}
          </View>

          <VoucherSummary summary={mergedConfig.summary} />

          <View style={styles.wheelWrapper}>
            <RouletteWheel
              segments={mergedConfig.segments}
              onSpinEnd={handleSpinEnd}
              pointerImage={mergedConfig.pointerImage}
              ctaLabel={mergedConfig.ctaLabel}
              spinDuration={mergedConfig.spinDuration}
              rotationCount={mergedConfig.rotationCount}
            />
          </View>
        </ScrollView>
      </ContentWrapper>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  background: {
    flex: 1,
  },
  backgroundImage: {
    resizeMode: 'cover',
    opacity: 0.08,
  },
  scrollContent: {
    paddingBottom: responsiveHeight(8),
  },
  backButton: {
    marginLeft: responsiveWidth(4),
    marginTop: responsiveHeight(2),
    width: responsiveWidth(10),
    height: responsiveWidth(10),
    borderRadius: responsiveWidth(5),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    elevation: 2,
  },
  headerContainer: {
    paddingHorizontal: responsiveWidth(6),
    marginTop: responsiveHeight(2),
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  description: {
    fontSize: 16,
    color: '#4B5563',
    marginTop: responsiveHeight(1),
  },
  wheelWrapper: {
    marginTop: responsiveHeight(4),
    alignItems: 'center',
  },
});

export default PrizeWheelScreen;
