import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import spinTheWheelConfig from './config';
import './stw-game.css';

const DEFAULT_SPIN_DURATION = 4500;
const DEFAULT_ROTATION_COUNT = 6;
const WHEEL_SIZE = 360;
const LABEL_RADIUS = (WHEEL_SIZE / 2) * 0.65;

const FALLBACK_SEGMENT_COLORS = [
  '#f97316',
  '#38bdf8',
  '#f472b6',
  '#34d399',
  '#facc15',
  '#a855f7',
  '#fb7185',
  '#14b8a6',
  '#60a5fa',
  '#fbbf24',
];

const PLACEHOLDER_SEGMENTS = [
  {
    id: 'placeholder-1',
    label: 'Prize A',
    description: 'Configure prize segments to replace this placeholder reward.',
    color: FALLBACK_SEGMENT_COLORS[0],
    textColor: '#0f172a',
    weight: 1,
  },
  {
    id: 'placeholder-2',
    label: 'Prize B',
    description: 'Add at least two segments to enable the wheel.',
    color: FALLBACK_SEGMENT_COLORS[1],
    textColor: '#0f172a',
    weight: 1,
  },
];

const toPositiveNumber = (value, fallback) => {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return fallback;
};

const toPositiveInteger = (value, fallback) => {
  const parsed = Math.floor(Number(value));
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return fallback;
};

const getReadableTextColor = (hexColor) => {
  if (typeof hexColor !== 'string') {
    return '#0f172a';
  }

  const normalized = hexColor.replace('#', '');
  const expanded = normalized.length === 3
    ? normalized
        .split('')
        .map((char) => char + char)
        .join('')
    : normalized;

  if (expanded.length !== 6) {
    return '#0f172a';
  }

  const r = parseInt(expanded.slice(0, 2), 16);
  const g = parseInt(expanded.slice(2, 4), 16);
  const b = parseInt(expanded.slice(4, 6), 16);

  if ([r, g, b].some((channel) => Number.isNaN(channel))) {
    return '#0f172a';
  }

  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 160 ? '#0f172a' : '#f8fafc';
};

const normaliseSegments = (rawSegments, fallbackSegments) => {
  let baseSegments = Array.isArray(rawSegments) ? rawSegments.filter(Boolean) : [];

  if (baseSegments.length < 2) {
    baseSegments = Array.isArray(fallbackSegments) ? fallbackSegments.filter(Boolean) : [];
  }

  if (baseSegments.length < 2) {
    return PLACEHOLDER_SEGMENTS.map((segment, index) => ({
      ...segment,
      id: segment.id ?? `placeholder-${index}`,
      label: segment.label ?? `Prize ${index + 1}`,
    }));
  }

  return baseSegments.map((segment, index) => {
    const paletteColor = FALLBACK_SEGMENT_COLORS[index % FALLBACK_SEGMENT_COLORS.length];
    const color = segment.color ?? paletteColor;
    const textColor = segment.textColor ?? getReadableTextColor(color);
    const probability =
      Number.isFinite(segment.probability) && segment.probability >= 0 ? segment.probability : undefined;
    const explicitWeight =
      Number.isFinite(segment.weight) && segment.weight >= 0 ? segment.weight : undefined;
    const weight = probability ?? explicitWeight ?? 1;

    return {
      ...segment,
      id: segment.id ?? `segment-${index}`,
      label: segment.label ?? `Prize ${index + 1}`,
      color,
      textColor,
      weight: weight > 0 ? weight : 0,
    };
  });
};

const pickWeightedIndex = (segments) => {
  if (!segments.length) {
    return 0;
  }

  const weights = segments.map((segment) =>
    Number.isFinite(segment.weight) && segment.weight > 0 ? segment.weight : 0,
  );

  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

  if (totalWeight <= 0) {
    return 0;
  }

  let random = Math.random() * totalWeight;

  for (let index = 0; index < weights.length; index += 1) {
    random -= weights[index];
    if (random <= 0) {
      return index;
    }
  }

  return weights.length - 1;
};

const createSegmentPath = (index, anglePerSlice) => {
  const radius = WHEEL_SIZE / 2;
  const startAngle = (index * anglePerSlice * Math.PI) / 180;
  const endAngle = ((index + 1) * anglePerSlice * Math.PI) / 180;
  const largeArcFlag = anglePerSlice > 180 ? 1 : 0;

  const startX = radius + Math.cos(startAngle) * radius;
  const startY = radius + Math.sin(startAngle) * radius;
  const endX = radius + Math.cos(endAngle) * radius;
  const endY = radius + Math.sin(endAngle) * radius;

  return `M${radius},${radius} L${startX},${startY} A${radius},${radius} 0 ${largeArcFlag},1 ${endX},${endY} Z`;
};

const createLabelPosition = (index, anglePerSlice) => {
  const radius = WHEEL_SIZE / 2;
  const angle = ((index + 0.5) * anglePerSlice * Math.PI) / 180;

  return {
    x: radius + Math.cos(angle) * LABEL_RADIUS,
    y: radius + Math.sin(angle) * LABEL_RADIUS,
  };
};

const formatDropRate = (weight, totalWeight) => {
  if (!totalWeight || totalWeight <= 0) {
    return '—';
  }

  const percentage = (weight / totalWeight) * 100;

  if (percentage < 0.1) {
    return '<0.1%';
  }

  return `${percentage.toFixed(1)}%`;
};

const formatCooldown = (seconds) => {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }

  if (seconds % 3600 === 0) {
    const hours = Math.round(seconds / 3600);
    return `${hours} hour${hours === 1 ? '' : 's'}`;
  }

  if (seconds % 60 === 0) {
    const minutes = Math.round(seconds / 60);
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  }

  const roundedSeconds = Math.round(seconds);
  return `${roundedSeconds} second${roundedSeconds === 1 ? '' : 's'}`;
};

const Wheel = ({
  segments,
  pointerImage,
  ctaLabel,
  spinDuration,
  rotationCount,
  spinButtonImage,
  onSpinStart,
  onSpinEnd,
  disabled,
  disabledReason,
}) => {
  const sanitizedDuration = Math.max(600, Math.floor(spinDuration ?? DEFAULT_SPIN_DURATION));
  const sanitizedRotationCount = Math.max(1, Math.floor(rotationCount ?? DEFAULT_ROTATION_COUNT));

  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const spinCountRef = useRef(0);
  const timeoutRef = useRef(null);

  const anglePerSlice = useMemo(() => (segments.length ? 360 / segments.length : 360), [segments.length]);

  useEffect(() => () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  useEffect(() => {
    spinCountRef.current = 0;
    setRotation(0);
  }, [segments]);

  const handleSpin = useCallback(() => {
    if (isSpinning || disabled || segments.length < 2) {
      return;
    }

    const targetIndex = pickWeightedIndex(segments);
    const boundedIndex = Math.max(0, Math.min(targetIndex, segments.length - 1));
    const nextSpinCount = spinCountRef.current + 1;
    const totalRotation = nextSpinCount * 360 * sanitizedRotationCount + anglePerSlice * boundedIndex;
    const landedSegment = segments[boundedIndex];

    onSpinStart?.();
    setIsSpinning(true);
    spinCountRef.current = nextSpinCount;
    setRotation(totalRotation);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setIsSpinning(false);
      onSpinEnd?.(landedSegment, boundedIndex);
    }, sanitizedDuration);
  }, [anglePerSlice, disabled, isSpinning, onSpinEnd, onSpinStart, sanitizedDuration, sanitizedRotationCount, segments]);

  const pointerElement = pointerImage ? (
    <img src={pointerImage} alt="Wheel pointer" className="stw-wheel__pointer-image" />
  ) : (
    <div className="stw-wheel__pointer" aria-hidden="true" />
  );

  const buttonLabel = isSpinning ? 'Spinning…' : ctaLabel ?? 'Spin';
  const isButtonDisabled = disabled || isSpinning || segments.length < 2;
  const buttonTitle = isButtonDisabled && !isSpinning ? disabledReason ?? 'Spin unavailable' : undefined;
  const buttonStyle = spinButtonImage
    ? {
        backgroundImage: `linear-gradient(rgba(2, 6, 23, 0.2), rgba(2, 6, 23, 0.2)), url(${spinButtonImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: '#f8fafc',
        textShadow: '0 1px 2px rgba(15, 23, 42, 0.65)',
      }
    : undefined;

  return (
    <div className="stw-wheel">
      <div className="stw-wheel__container">
        <div
          className="stw-wheel__spinner"
          style={{
            transform: `rotate(${rotation + anglePerSlice / 2 - 90}deg)`,
            transitionDuration: `${sanitizedDuration}ms`,
          }}
        >
          <svg viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`} role="img" aria-label="Prize wheel">
            <title>Spin the wheel segments</title>
            {segments.map((segment, index) => {
              const path = createSegmentPath(index, anglePerSlice);
              const { x, y } = createLabelPosition(index, anglePerSlice);

              return (
                <g key={segment.id ?? index}>
                  <path d={path} fill={segment.color} stroke="#0f172a" strokeWidth={1.2} />
                  <text
                    x={x}
                    y={y}
                    fill={segment.textColor ?? '#0f172a'}
                    fontSize={14}
                    fontWeight="600"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {segment.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        <div className="stw-wheel__center">Spin</div>
        {pointerElement}
      </div>
      <button
        type="button"
        className="stw-wheel__button"
        style={buttonStyle}
        onClick={handleSpin}
        disabled={isButtonDisabled}
        title={buttonTitle}
      >
        <span className="stw-wheel__button-label">{buttonLabel}</span>
      </button>
    </div>
  );
};

const StwGame = ({ config = spinTheWheelConfig }) => {
  const fallbackSegments = spinTheWheelConfig.prizeSegments ?? [];

  const normalisedConfig = useMemo(() => {
    const segments = normaliseSegments(config.prizeSegments, fallbackSegments);
    const baseSpinDuration = toPositiveNumber(spinTheWheelConfig.spinDuration, DEFAULT_SPIN_DURATION);
    const baseRotationCount = toPositiveInteger(spinTheWheelConfig.rotationCount, DEFAULT_ROTATION_COUNT);

    return {
      ...spinTheWheelConfig,
      ...config,
      segments,
      title: config.title ?? spinTheWheelConfig.title,
      description: config.description ?? spinTheWheelConfig.description,
      pointerImage: config.pointerImage ?? spinTheWheelConfig.pointerImage,
      spinButtonImage: config.spinButtonImage ?? spinTheWheelConfig.spinButtonImage,
      backgroundImage: config.backgroundImage ?? spinTheWheelConfig.backgroundImage,
      ctaLabel: config.ctaLabel ?? spinTheWheelConfig.ctaLabel ?? 'Spin the Wheel',
      spinDuration: toPositiveNumber(config.spinDuration, baseSpinDuration),
      rotationCount: toPositiveInteger(config.rotationCount, baseRotationCount),
      maxSpinsPerUser:
        Number.isFinite(config.maxSpinsPerUser) && config.maxSpinsPerUser >= 0
          ? config.maxSpinsPerUser
          : spinTheWheelConfig.maxSpinsPerUser,
      spinCooldownSeconds:
        Number.isFinite(config.spinCooldownSeconds) && config.spinCooldownSeconds >= 0
          ? config.spinCooldownSeconds
          : spinTheWheelConfig.spinCooldownSeconds,
    };
  }, [config, fallbackSegments]);

  const [spinsUsed, setSpinsUsed] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);
  const pendingResultRef = useRef(null);

  useEffect(() => {
    setSpinsUsed(0);
    setCurrentResult(null);
    pendingResultRef.current = null;
  }, [normalisedConfig.segments, normalisedConfig.maxSpinsPerUser]);

  const maxSpins = Number.isFinite(normalisedConfig.maxSpinsPerUser)
    ? Math.max(0, Math.floor(normalisedConfig.maxSpinsPerUser))
    : null;

  const totalWeight = useMemo(
    () => normalisedConfig.segments.reduce((sum, segment) => sum + (Number.isFinite(segment.weight) ? segment.weight : 0), 0),
    [normalisedConfig.segments],
  );

  const hasViableSegments = normalisedConfig.segments.length >= 2 && totalWeight > 0;

  const isSpinLimitReached = maxSpins !== null && spinsUsed >= maxSpins;

  useEffect(() => {
    if (pendingResultRef.current) {
      setCurrentResult(pendingResultRef.current);
      pendingResultRef.current = null;
    }
  }, [spinsUsed]);

  const handleSpinStart = useCallback(() => {
    setIsSpinning(true);
    setCurrentResult(null);
  }, []);

  const handleSpinEnd = useCallback(
    (segment, index) => {
      setIsSpinning(false);
      setSpinsUsed((previous) => {
        const next = maxSpins !== null ? Math.min(maxSpins, previous + 1) : previous + 1;
        pendingResultRef.current = {
          segment,
          index,
          spinNumber: next,
        };
        return next;
      });
    },
    [maxSpins],
  );

  const cooldownText = formatCooldown(normalisedConfig.spinCooldownSeconds);

  let statusMessage = '';

  if (!hasViableSegments) {
    statusMessage = 'Add at least two prize segments with a positive probability to enable the wheel.';
  } else if (isSpinning) {
    statusMessage = 'The wheel is spinning… good luck!';
  } else if (isSpinLimitReached) {
    statusMessage = 'You have used all available spins for now.';
  } else if (maxSpins !== null) {
    const remaining = Math.max(0, maxSpins - spinsUsed);
    statusMessage = `${remaining} spin${remaining === 1 ? '' : 's'} remaining in this session.`;
  } else {
    statusMessage = 'Unlimited spins are enabled for this demo configuration.';
  }

  const spinDisabledReason = !hasViableSegments
    ? 'The wheel requires at least two prize segments.'
    : isSpinLimitReached
    ? 'No spins remaining for this session.'
    : undefined;

  const backgroundStyle = normalisedConfig.backgroundImage
    ? {
        backgroundImage: `linear-gradient(rgba(2, 6, 23, 0.92), rgba(2, 6, 23, 0.9)), url(${normalisedConfig.backgroundImage})`,
      }
    : undefined;

  const activeSegmentId = currentResult?.segment?.id;

  return (
    <div className="stw-game-container" style={backgroundStyle}>
      <div className="relative z-10 w-full max-w-6xl rounded-3xl border border-white/10 bg-slate-900/80 px-6 py-10 shadow-2xl shadow-slate-950/60 backdrop-blur-xl sm:px-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-6">
            <header className="text-center text-white lg:text-left">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Spin the Wheel</p>
              <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">{normalisedConfig.title}</h2>
              {normalisedConfig.description ? (
                <p className="mt-4 text-sm leading-relaxed text-slate-300 sm:text-base">
                  {normalisedConfig.description}
                </p>
              ) : null}
            </header>

            <Wheel
              segments={normalisedConfig.segments}
              pointerImage={normalisedConfig.pointerImage}
              spinButtonImage={normalisedConfig.spinButtonImage}
              ctaLabel={normalisedConfig.ctaLabel}
              spinDuration={normalisedConfig.spinDuration}
              rotationCount={normalisedConfig.rotationCount}
              disabled={!hasViableSegments || isSpinLimitReached}
              disabledReason={spinDisabledReason}
              onSpinStart={handleSpinStart}
              onSpinEnd={handleSpinEnd}
            />

            <div
              className="rounded-2xl border border-white/10 bg-slate-800/60 p-4 text-sm text-slate-300 shadow-inner shadow-slate-950/60"
              role="status"
              aria-live="polite"
            >
              <p>{statusMessage}</p>
              {cooldownText && maxSpins !== null ? (
                <p className="mt-1 text-slate-400">Spins refresh every {cooldownText}.</p>
              ) : null}
              {normalisedConfig.maxSpinsPerUser && maxSpins === 0 ? (
                <p className="mt-1 text-amber-300">Spins are currently disabled for this configuration.</p>
              ) : null}
            </div>

            <div className="rounded-2xl border border-white/5 bg-slate-800/70 p-6 text-center shadow-inner shadow-slate-950/60" aria-live="polite">
              {isSpinning ? (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Good luck</p>
                  <p className="text-xl font-semibold text-white">The wheel is spinning…</p>
                </div>
              ) : currentResult ? (
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">You won</p>
                  <h3 className="text-2xl font-semibold text-white sm:text-3xl">{currentResult.segment.label}</h3>
                  {currentResult.segment.description ? (
                    <p className="text-sm text-slate-300">{currentResult.segment.description}</p>
                  ) : null}
                  {currentResult.segment.image ? (
                    <div className="mx-auto mt-2 h-24 w-24 rounded-xl bg-slate-900/80 p-2 shadow-inner shadow-black/40">
                      <img
                        src={currentResult.segment.image}
                        alt={`${currentResult.segment.label} artwork`}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ) : null}
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                    Drop rate: {formatDropRate(currentResult.segment.weight, totalWeight)}
                  </p>
                  {currentResult.spinNumber ? (
                    <p className="text-xs text-slate-500">Spin {currentResult.spinNumber}{maxSpins ? ` of ${maxSpins}` : ''}</p>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Awaiting spin</p>
                  <p className="text-base text-slate-300">Press the spin button to reveal today&apos;s reward.</p>
                </div>
              )}
            </div>
          </div>

          <aside className="flex flex-col gap-5 text-white">
            <div>
              <h3 className="text-2xl font-semibold sm:text-3xl">Available rewards</h3>
              <p className="mt-2 text-sm text-slate-300 sm:text-base">
                Each wedge is configurable from the campaign dashboard. Update the probability or creative to refresh the
                experience instantly.
              </p>
            </div>
            <ul className="grid grid-cols-1 gap-4" role="list">
              {normalisedConfig.segments.map((segment) => {
                const isActive = segment.id === activeSegmentId;
                const cardClasses = [
                  'relative overflow-hidden rounded-2xl border border-white/5 bg-slate-800/70 p-5 shadow-lg shadow-slate-950/40 transition-all',
                  isActive
                    ? 'ring-2 ring-amber-300/80 shadow-amber-500/40'
                    : 'hover:border-slate-500/60 hover:shadow-slate-900/40',
                ].join(' ');

                return (
                  <li key={segment.id} className={cardClasses}>
                    <div className="absolute inset-x-0 top-0 h-1.5" style={{ backgroundColor: segment.color }} />
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-lg font-semibold text-white">{segment.label}</h4>
                        <span className="rounded-full bg-slate-900/60 px-3 py-1 text-xs font-semibold text-slate-200">
                          {formatDropRate(segment.weight, totalWeight)}
                        </span>
                      </div>
                      {segment.description ? (
                        <p className="text-sm text-slate-300">{segment.description}</p>
                      ) : null}
                      {segment.image ? (
                        <div className="mt-2 flex h-20 w-full items-center justify-center rounded-xl bg-slate-900/70 p-3">
                          <img
                            src={segment.image}
                            alt={`${segment.label} artwork`}
                            className="h-full w-auto object-contain"
                          />
                        </div>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default StwGame;
