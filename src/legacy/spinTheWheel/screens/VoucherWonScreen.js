import React, { useMemo } from 'react';
import { Image, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import { scale } from 'react-native-size-matters';

const VoucherWonScreen = ({ navigation, route }) => {
  const rewardParam = route?.params?.reward ?? {};
  const wheelTitle = route?.params?.wheelTitle;

  const reward = useMemo(
    () => ({
      title: rewardParam.title ?? 'Voucher unlocked',
      description: rewardParam.description,
      type: rewardParam.type ?? 'voucher',
      icon: rewardParam.icon,
    }),
    [rewardParam],
  );

  const rewardIcon = useMemo(() => {
    if (!reward.icon) {
      return require('../../../assets/vouchersIcon3.png');
    }

    if (typeof reward.icon === 'string') {
      return { uri: reward.icon };
    }

    return reward.icon;
  }, [reward.icon]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Image
        source={require('../../../assets/Ribbons.png')}
        style={styles.ribbon}
      />

      <ImageBackground
        source={require('../../../assets/Receipt.png')}
        style={styles.receipt}
        imageStyle={styles.receiptImage}
      >
        <Image source={require('../../../assets/successimg.png')} style={styles.successIcon} />

        <View style={styles.headingContainer}>
          <Text style={styles.congratsLabel}>Congratulations!</Text>
          {wheelTitle ? <Text style={styles.wheelTitle}>{wheelTitle}</Text> : null}
          <Text style={styles.rewardTitle}>{reward.title}</Text>
          {reward.description ? (
            <Text style={styles.rewardDescription}>{reward.description}</Text>
          ) : null}
        </View>

        <View style={styles.cardWrapper}>
          <ImageBackground
            source={require('../../../assets/yellowcard.png')}
            style={styles.cardBackground}
            imageStyle={styles.cardImage}
          >
            <Image source={rewardIcon} style={styles.cardIcon} />
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>{reward.title}</Text>
              {reward.description ? <Text style={styles.cardSubtitle}>{reward.description}</Text> : null}
            </View>
          </ImageBackground>
        </View>

        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <Text style={styles.buttonText}>Back to Wheel</Text>
        </TouchableOpacity>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F9D949',
  },
  ribbon: {
    height: responsiveHeight(15),
    width: responsiveWidth(100),
    resizeMode: 'contain',
    marginTop: responsiveHeight(1),
  },
  receipt: {
    height: responsiveHeight(65),
    width: responsiveWidth(90),
    alignItems: 'center',
    paddingBottom: responsiveHeight(4),
  },
  receiptImage: {
    resizeMode: 'contain',
  },
  successIcon: {
    marginTop: responsiveHeight(4),
    height: responsiveHeight(10),
    width: responsiveWidth(20),
    resizeMode: 'contain',
  },
  headingContainer: {
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(8),
    marginTop: responsiveHeight(2),
  },
  congratsLabel: {
    fontSize: responsiveFontSize(3),
    fontWeight: '700',
    color: '#3C486B',
  },
  wheelTitle: {
    marginTop: responsiveHeight(0.5),
    fontSize: responsiveFontSize(2),
    color: '#6B7280',
  },
  rewardTitle: {
    marginTop: responsiveHeight(1),
    fontSize: responsiveFontSize(2.4),
    fontWeight: '700',
    color: '#F45050',
    textAlign: 'center',
  },
  rewardDescription: {
    marginTop: responsiveHeight(1),
    fontSize: responsiveFontSize(1.8),
    color: '#3C486B',
    textAlign: 'center',
  },
  cardWrapper: {
    width: responsiveWidth(80),
    marginTop: responsiveHeight(4),
  },
  cardBackground: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(18),
    borderRadius: scale(24),
  },
  cardImage: {
    resizeMode: 'cover',
    borderRadius: scale(24),
  },
  cardIcon: {
    width: scale(52),
    height: scale(52),
    resizeMode: 'contain',
  },
  cardTextContainer: {
    flex: 1,
    marginLeft: responsiveWidth(4),
  },
  cardTitle: {
    fontSize: responsiveFontSize(2.1),
    fontWeight: '700',
    color: '#111827',
  },
  cardSubtitle: {
    marginTop: responsiveHeight(0.8),
    fontSize: responsiveFontSize(1.7),
    color: '#4B5563',
  },
  button: {
    marginTop: responsiveHeight(4),
    backgroundColor: '#3C486B',
    paddingVertical: responsiveHeight(1.8),
    paddingHorizontal: responsiveWidth(20),
    borderRadius: scale(30),
  },
  buttonText: {
    color: '#F9D949',
    fontSize: responsiveFontSize(2),
    fontWeight: '700',
  },
});

export default VoucherWonScreen;
