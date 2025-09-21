import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import spinTheWheelConfig from './config';
import './stw-game.css';

const DEFAULT_SPIN_DURATION = 4500;
const DEFAULT_ROTATION_COUNT = 6;
const WHEEL_SIZE = 360;
const LABEL_RADIUS = (WHEEL_SIZE / 2) * 0.65;
const POINTER_TARGET_ANGLE = 90;

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

const normalizeAngle = (angle) => {
  const normalized = angle % 360;
  return normalized < 0 ? normalized + 360 : normalized;
};

const calculateAlignmentRotation = (segmentIndex, anglePerSlice) =>
  POINTER_TARGET_ANGLE - (segmentIndex + 0.5) * anglePerSlice;

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
  onSpinInitiated,
  onSpinStart,
  onSpinEnd,
  onSpinError,
  resolveSpinTarget,
  disabled,
  disabledReason,
}) => {
  const sanitizedDuration = Math.max(600, Math.floor(spinDuration ?? DEFAULT_SPIN_DURATION));
  const sanitizedRotationCount = Math.max(1, Math.floor(rotationCount ?? DEFAULT_ROTATION_COUNT));

  const timeoutRef = useRef(null);
  const anglePerSlice = useMemo(() => (segments.length ? 360 / segments.length : 360), [segments.length]);
  const initialRotation = useMemo(
    () => calculateAlignmentRotation(0, anglePerSlice),
    [anglePerSlice],
  );
  const rotationRef = useRef(initialRotation);
  const [rotation, setRotation] = useState(initialRotation);
  const [spinPhase, setSpinPhase] = useState('idle');

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    },
    [],
  );

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    rotationRef.current = initialRotation;
    setRotation(initialRotation);
    setSpinPhase('idle');
  }, [initialRotation]);

  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  const handleSpin = useCallback(async () => {
    if (spinPhase !== 'idle' || disabled || segments.length < 2) {
      return;
    }

    onSpinInitiated?.();

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setSpinPhase('resolving');

    let resolution;

    try {
      if (resolveSpinTarget) {
        resolution = await resolveSpinTarget();
      } else {
        resolution = { index: pickWeightedIndex(segments) };
      }
    } catch (error) {
      setSpinPhase('idle');
      onSpinError?.(error);
      return;
    }

    const effectiveSegments = segments.length ? segments : [];
    let targetIndex = Number.isFinite(resolution?.index) ? Math.floor(resolution.index) : NaN;

    if (!Number.isFinite(targetIndex)) {
      const candidateId =
        resolution?.segmentId ??
        resolution?.segment_id ??
        resolution?.result?.segmentId ??
        resolution?.result?.segment_id ??
        resolution?.segment?.id;

      if (candidateId) {
        const foundIndex = effectiveSegments.findIndex((segment) => segment.id === candidateId);
        if (foundIndex !== -1) {
          targetIndex = foundIndex;
        }
      }
    }

    if (!Number.isFinite(targetIndex) || targetIndex < 0 || targetIndex >= effectiveSegments.length) {
      targetIndex = pickWeightedIndex(effectiveSegments);
    }

    const boundedIndex = Math.max(0, Math.min(targetIndex, effectiveSegments.length - 1));
    const alignmentRotation = calculateAlignmentRotation(boundedIndex, anglePerSlice);
    const baseRotation = rotationRef.current + sanitizedRotationCount * 360;
    const normalizedBase = normalizeAngle(baseRotation);
    const normalizedTarget = normalizeAngle(alignmentRotation);
    const additionalRotation = (normalizedTarget - normalizedBase + 360) % 360;
    const totalRotation = baseRotation + additionalRotation;
    const landedSegment = resolution?.segment ?? effectiveSegments[boundedIndex];

    rotationRef.current = totalRotation;
    setRotation(totalRotation);
    setSpinPhase('animating');
    onSpinStart?.();

    timeoutRef.current = setTimeout(() => {
      setSpinPhase('idle');
      onSpinEnd?.(landedSegment, boundedIndex, resolution);
    }, sanitizedDuration);
  }, [anglePerSlice, disabled, onSpinEnd, onSpinError, onSpinInitiated, onSpinStart, resolveSpinTarget, sanitizedDuration, sanitizedRotationCount, segments, spinPhase]);

  const pointerElement = pointerImage ? (
    <img src={pointerImage} alt="Wheel pointer" className="stw-wheel__pointer-image" />
  ) : (
    <div className="stw-wheel__pointer" aria-hidden="true" />
  );

  const buttonLabel =
    spinPhase === 'resolving'
      ? 'Preparing spin…'
      : spinPhase === 'animating'
      ? 'Spinning…'
      : ctaLabel ?? 'Spin';
  const isButtonDisabled = disabled || spinPhase !== 'idle' || segments.length < 2;
  const buttonTitle =
    (disabled || segments.length < 2) && spinPhase === 'idle' ? disabledReason ?? 'Spin unavailable' : undefined;
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
            transform: `rotate(${rotation}deg)`,
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
  const [isSpinPending, setIsSpinPending] = useState(false);
  const [spinError, setSpinError] = useState(null);
  const pendingResultRef = useRef(null);

  useEffect(() => {
    setSpinsUsed(0);
    setCurrentResult(null);
    pendingResultRef.current = null;
    setIsSpinning(false);
    setIsSpinPending(false);
    setSpinError(null);
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

  const handleSpinInitiated = useCallback(() => {
    setSpinError(null);
    setIsSpinPending(true);
    setCurrentResult(null);
  }, []);

  const handleSpinStart = useCallback(() => {
    setIsSpinning(true);
    setIsSpinPending(false);
  }, []);

  const handleSpinEnd = useCallback(
    (segment, index, resolution) => {
      setIsSpinning(false);
      setIsSpinPending(false);
      setSpinError(null);
      setSpinsUsed((previous) => {
        const next = maxSpins !== null ? Math.min(maxSpins, previous + 1) : previous + 1;
        pendingResultRef.current = {
          segment,
          index,
          spinNumber: next,
          response: resolution?.response ?? resolution ?? null,
        };
        return next;
      });
    },
    [maxSpins],
  );

  const handleSpinError = useCallback((error) => {
    // eslint-disable-next-line no-console
    console.error('Spin request failed', error);
    setIsSpinPending(false);
    setIsSpinning(false);
    setSpinError('We could not complete your spin. Please try again.');
  }, []);

  const resolveSpinTarget = useCallback(async () => {
    const segments = normalisedConfig.segments;

    if (!Array.isArray(segments) || segments.length === 0) {
      throw new Error('No prize segments configured');
    }

    const payload = {
      gameId: normalisedConfig.gameId,
      gameType: normalisedConfig.gameType,
      spinNumber: spinsUsed + 1,
    };

    const response = await submitSpinResult(
      normalisedConfig.submissionEndpoint,
      payload,
      segments,
    );

    let targetIndex = extractSegmentIndex(response, segments);

    if (!Number.isInteger(targetIndex) || targetIndex < 0 || targetIndex >= segments.length) {
      targetIndex = pickWeightedIndex(segments);
    }

    const boundedIndex = Math.max(0, Math.min(targetIndex, segments.length - 1));
    const segmentFromResponse = response?.segment;
    const targetSegment =
      segmentFromResponse && segmentFromResponse.id === segments[boundedIndex]?.id
        ? segmentFromResponse
        : segments[boundedIndex];

    return {
      index: boundedIndex,
      segment: targetSegment,
      response,
    };
  }, [normalisedConfig.gameId, normalisedConfig.gameType, normalisedConfig.segments, normalisedConfig.submissionEndpoint, spinsUsed]);

  const cooldownText = formatCooldown(normalisedConfig.spinCooldownSeconds);

  let statusMessage = '';

  if (spinError) {
    statusMessage = spinError;
  } else if (!hasViableSegments) {
    statusMessage = 'Add at least two prize segments with a positive probability to enable the wheel.';
  } else if (isSpinning) {
    statusMessage = 'The wheel is spinning… good luck!';
  } else if (isSpinPending) {
    statusMessage = 'Preparing your spin result…';
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
              onSpinInitiated={handleSpinInitiated}
              disabled={!hasViableSegments || isSpinLimitReached}
              disabledReason={spinDisabledReason}
              resolveSpinTarget={resolveSpinTarget}
              onSpinStart={handleSpinStart}
              onSpinEnd={handleSpinEnd}
              onSpinError={handleSpinError}
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
              {isSpinPending ? (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Preparing</p>
                  <p className="text-base text-slate-300">Securing your prize result…</p>
                </div>
              ) : isSpinning ? (
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
                  {currentResult.spinNumber ? (
                    <p className="text-xs text-slate-500">Spin {currentResult.spinNumber}{maxSpins ? ` of ${maxSpins}` : ''}</p>
                  ) : null}
                </div>
              ) : spinError ? (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.3em] text-amber-300">Unable to spin</p>
                  <p className="text-sm text-slate-300">{spinError}</p>
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
                Each wedge is configurable from the campaign dashboard. Update the rewards or creative to refresh the
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

const parseIndexCandidate = (candidate, segmentsLength) => {
  if (typeof candidate === 'string' && candidate.trim() !== '') {
    const numeric = Number(candidate);
    if (Number.isFinite(numeric)) {
      const index = Math.floor(numeric);
      if (index >= 0 && index < segmentsLength) {
        return index;
      }
    }
  } else if (Number.isFinite(candidate)) {
    const index = Math.floor(candidate);
    if (index >= 0 && index < segmentsLength) {
      return index;
    }
  }

  return undefined;
};

const extractSegmentIndex = (response, segments) => {
  if (!response || !Array.isArray(segments) || segments.length === 0) {
    return undefined;
  }

  const indexCandidates = [
    response.index,
    response.segmentIndex,
    response.segment_index,
    response.result?.index,
    response.result?.segmentIndex,
    response.result?.segment_index,
  ];

  for (const candidate of indexCandidates) {
    const parsed = parseIndexCandidate(candidate, segments.length);
    if (typeof parsed === 'number') {
      return parsed;
    }
  }

  const idCandidates = [
    response.segmentId,
    response.segment_id,
    response.result?.segmentId,
    response.result?.segment_id,
    response.segment?.id,
  ];

  for (const id of idCandidates) {
    if (typeof id === 'string' && id.trim()) {
      const foundIndex = segments.findIndex((segment) => segment.id === id.trim());
      if (foundIndex !== -1) {
        return foundIndex;
      }
    }
  }

  return undefined;
};

const parseJsonSafely = async (response) => {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
};

const submitSpinResult = async (endpoint, payload, segments) => {
  const hasEndpoint = typeof endpoint === 'string' && endpoint.trim() !== '';

  if (hasEndpoint && typeof fetch === 'function') {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = await parseJsonSafely(response);

      if (data && typeof data === 'object') {
        return data;
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Falling back to mock spin response', error);
    }
  }

  return mockSubmitSpinResult(endpoint, payload, segments);
};

const mockSubmitSpinResult = (endpoint, payload, segments) =>
  new Promise((resolve) => {
    const safeSegments = Array.isArray(segments) ? segments : [];
    const hasSegments = safeSegments.length > 0;
    const index = hasSegments ? pickWeightedIndex(safeSegments) : 0;
    const boundedIndex = hasSegments ? Math.max(0, Math.min(index, safeSegments.length - 1)) : 0;
    const segment = hasSegments ? safeSegments[boundedIndex] : null;

    setTimeout(() => {
      resolve({
        endpoint,
        requestBody: payload,
        result: {
          segmentIndex: boundedIndex,
          segmentId: segment?.id ?? null,
          segmentLabel: segment?.label ?? null,
          simulated: true,
        },
        segment,
      });
    }, 900);
  });

export default StwGame;
