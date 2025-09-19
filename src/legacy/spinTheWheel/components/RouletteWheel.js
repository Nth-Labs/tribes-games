import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Path, Text as SvgText } from 'react-native-svg';
import { height, width } from 'react-native-dimension';
import { responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import { scale } from 'react-native-size-matters';
import { DEFAULT_SPIN_THE_WHEEL_CONFIG } from '../config/defaultWheelConfig';

const WHEEL_SIZE = 300;
const RADIUS = WHEEL_SIZE / 2;
const LABEL_RADIUS = RADIUS * 0.65;

const pickWeightedIndex = (segments) => {
  if (!segments.length) {
    return 0;
  }

  const weights = segments.map((segment) => (typeof segment.weight === 'number' ? segment.weight : 1));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let random = Math.random() * totalWeight;

  for (let index = 0; index < weights.length; index += 1) {
    if (random < weights[index]) {
      return index;
    }

    random -= weights[index];
  }

  return weights.length - 1;
};

const RouletteWheel = ({
  segments,
  onSpinEnd,
  pointerImage,
  spinDuration = DEFAULT_SPIN_THE_WHEEL_CONFIG.spinDuration,
  rotationCount = DEFAULT_SPIN_THE_WHEEL_CONFIG.rotationCount,
  ctaLabel = DEFAULT_SPIN_THE_WHEEL_CONFIG.ctaLabel,
  disabled = false,
}) => {
  const fallbackSegments = useMemo(() => DEFAULT_SPIN_THE_WHEEL_CONFIG.segments, []);
  const [currentSegments, setCurrentSegments] = useState(fallbackSegments);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    if (Array.isArray(segments) && segments.length >= 2) {
      setCurrentSegments(segments);
    } else {
      setCurrentSegments(fallbackSegments);
    }
  }, [fallbackSegments, segments]);

  const anglePerSlice = useMemo(() => 360 / currentSegments.length, [currentSegments.length]);
  const wheelRotation = useSharedValue(0);

  const finishSpin = useCallback(
    (targetIndex) => {
      const segment = currentSegments[targetIndex];
      setSelectedSegment(segment);
      setIsSpinning(false);

      if (onSpinEnd) {
        onSpinEnd(segment, targetIndex);
      }
    },
    [currentSegments, onSpinEnd],
  );

  const spinWheel = useCallback(() => {
    if (disabled || isSpinning) {
      return;
    }

    const targetIndex = pickWeightedIndex(currentSegments);
    const segmentRotation = anglePerSlice * targetIndex;
    const totalRotation = 360 * rotationCount + segmentRotation;

    setIsSpinning(true);
    wheelRotation.value = 0;
    wheelRotation.value = withTiming(totalRotation, { duration: spinDuration }, () => {
      runOnJS(finishSpin)(targetIndex);
    });
  }, [anglePerSlice, currentSegments, disabled, finishSpin, isSpinning, rotationCount, spinDuration, wheelRotation]);

  const wheelStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${wheelRotation.value + anglePerSlice / 2 - 90}deg`,
      },
    ],
  }), [anglePerSlice]);

  return (
    <View style={styles.container}>
      <View style={styles.wheelContainer}>
        <Animated.View style={[styles.wheel, wheelStyle]}>
          <Svg width={WHEEL_SIZE} height={WHEEL_SIZE}>
            {currentSegments.map((segment, index) => {
              const startAngle = (index * anglePerSlice * Math.PI) / 180;
              const endAngle = ((index + 1) * anglePerSlice * Math.PI) / 180;
              const largeArcFlag = anglePerSlice > 180 ? 1 : 0;

              const startX = RADIUS + Math.cos(startAngle) * RADIUS;
              const startY = RADIUS + Math.sin(startAngle) * RADIUS;
              const endX = RADIUS + Math.cos(endAngle) * RADIUS;
              const endY = RADIUS + Math.sin(endAngle) * RADIUS;

              const pathData = `M${RADIUS},${RADIUS} L${startX},${startY} A${RADIUS},${RADIUS} 0 ${largeArcFlag},1 ${endX},${endY} Z`;

              return <Path key={`slice-${segment.id ?? index}`} d={pathData} fill={segment.color} stroke="#FFFFFF" strokeWidth={2} />;
            })}

            {currentSegments.map((segment, index) => {
              const angle = ((index + 0.5) * anglePerSlice * Math.PI) / 180;
              const textX = RADIUS + Math.cos(angle) * LABEL_RADIUS;
              const textY = RADIUS + Math.sin(angle) * LABEL_RADIUS;

              return (
                <SvgText
                  key={`label-${segment.id ?? index}`}
                  x={textX}
                  y={textY}
                  fill={segment.textColor ?? '#1A1A1A'}
                  fontSize={13}
                  fontWeight="600"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                >
                  {segment.label}
                </SvgText>
              );
            })}
          </Svg>
        </Animated.View>

        <Image
          source={pointerImage ?? DEFAULT_SPIN_THE_WHEEL_CONFIG.pointerImage}
          style={styles.pointer}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, (disabled || isSpinning) && styles.buttonDisabled]}
        onPress={spinWheel}
        activeOpacity={0.8}
        disabled={disabled || isSpinning}
      >
        <Text style={styles.buttonText}>{ctaLabel}</Text>
      </TouchableOpacity>

      {selectedSegment && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultHeading}>You won</Text>
          <Text style={styles.resultTitle}>{selectedSegment.reward?.title ?? selectedSegment.label}</Text>
          {selectedSegment.reward?.description ? (
            <Text style={styles.resultDescription}>{selectedSegment.reward.description}</Text>
          ) : null}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  wheelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheel: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    borderRadius: RADIUS,
    overflow: 'hidden',
  },
  pointer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? -height(0.5) : -height(0.3),
    width: Platform.OS === 'ios' ? width(50) : width(55),
    height: height(2),
    resizeMode: 'contain',
  },
  button: {
    backgroundColor: '#F45050',
    padding: 17,
    borderRadius: scale(30),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: responsiveHeight(3),
    paddingHorizontal: responsiveWidth(12),
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultContainer: {
    marginTop: responsiveHeight(3),
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(10),
  },
  resultHeading: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3C486B',
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F45050',
    marginTop: responsiveHeight(1),
    textAlign: 'center',
  },
  resultDescription: {
    fontSize: 14,
    color: '#3C486B',
    marginTop: responsiveHeight(1),
    textAlign: 'center',
  },
});

export default RouletteWheel;
