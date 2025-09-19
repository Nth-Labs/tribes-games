import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import { DEFAULT_SPIN_THE_WHEEL_CONFIG } from '../config/defaultWheelConfig';

const VoucherSummary = ({ summary }) => {
  const summaryContent = useMemo(
    () => summary ?? DEFAULT_SPIN_THE_WHEEL_CONFIG.summary,
    [summary],
  );

  if (!summaryContent) {
    return null;
  }

  return (
    <View style={styles.container}>
      {summaryContent.heading ? <Text style={styles.heading}>{summaryContent.heading}</Text> : null}
      <FlatList
        data={summaryContent.items}
        keyExtractor={(item, index) => `${item.id ?? index}`}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <View style={styles.bullet} />
            <View style={styles.textContainer}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              {item.subtitle ? <Text style={styles.itemSubtitle}>{item.subtitle}</Text> : null}
            </View>
          </View>
        )}
        scrollEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: responsiveWidth(90),
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: responsiveHeight(2.5),
    paddingHorizontal: responsiveWidth(5),
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  heading: {
    fontSize: responsiveFontSize(2.1),
    fontWeight: '700',
    color: '#3C486B',
    marginBottom: responsiveHeight(1.5),
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bullet: {
    width: responsiveWidth(2.5),
    height: responsiveWidth(2.5),
    borderRadius: responsiveWidth(1.25),
    backgroundColor: '#F45050',
    marginTop: responsiveHeight(0.6),
    marginRight: responsiveWidth(3),
  },
  textContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: responsiveFontSize(1.9),
    fontWeight: '600',
    color: '#111827',
  },
  itemSubtitle: {
    fontSize: responsiveFontSize(1.6),
    color: '#6B7280',
    marginTop: responsiveHeight(0.3),
  },
  separator: {
    height: responsiveHeight(1.4),
  },
});

export default VoucherSummary;
