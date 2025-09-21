import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gachaponConfig from './config';
import { attemptGachapon, fetchAvailablePrizes } from './gachapon-api';
import './gachapon-game.css';

const rarityAccentClasses = {
  common: 'border-gray-300 text-gray-200',
  uncommon: 'border-emerald-300 text-emerald-200',
  rare: 'border-sky-300 text-sky-200',
  epic: 'border-violet-300 text-violet-200',
  legendary: 'border-amber-200 text-amber-100',
};

const rarityBackground = {
  common: 'bg-slate-800/40',
  uncommon: 'bg-emerald-500/10',
  rare: 'bg-sky-500/10',
  epic: 'bg-violet-500/10',
  legendary: 'bg-amber-500/10',
};

const defaultRarityLabels = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

const defaultRarityCapsuleColors = {
  common: '#E5E7EB',
  uncommon: '#86EFAC',
  rare: '#93C5FD',
  epic: '#C4B5FD',
  legendary: '#FDE68A',
};

const toNonNegativeInteger = (value, fallback) => {
  const parsed = Math.floor(Number(value));
  if (Number.isFinite(parsed) && parsed >= 0) {
    return parsed;
  }
  return fallback;
};

const normalisePrizes = (rawPrizes, fallbackPrizes, fallbackFlairText, defaultCapsuleColor) => {
  const basePrizes = Array.isArray(rawPrizes) ? rawPrizes.filter((prize) => prize && typeof prize === 'object') : [];
  const templatePrizes = Array.isArray(fallbackPrizes)
    ? fallbackPrizes.filter((prize) => prize && typeof prize === 'object')
    : [];

  let effectivePrizes = basePrizes.length ? basePrizes : templatePrizes;

  if (!effectivePrizes.length) {
    effectivePrizes = [
      {
        id: 'gachapon-placeholder-1',
        name: 'Mystery Capsule',
        description: 'Configure gachapon prizes to replace this placeholder reward.',
        rarity: 'common',
        rarityLabel: 'Mystery',
        weight: 1,
        capsuleColor: defaultCapsuleColor,
        flairText: fallbackFlairText,
      },
    ];
  }

  return effectivePrizes.map((prize, index) => {
    const rarityValue =
      typeof prize.rarity === 'string' && prize.rarity.trim()
        ? prize.rarity.trim().toLowerCase()
        : 'common';
    const rarityLabel =
      typeof prize.rarityLabel === 'string' && prize.rarityLabel.trim()
        ? prize.rarityLabel
        : defaultRarityLabels[rarityValue] ?? rarityValue.charAt(0).toUpperCase() + rarityValue.slice(1);
    const weight = Number.isFinite(prize.weight) && prize.weight > 0 ? prize.weight : 1;
    const capsuleColor =
      typeof prize.capsuleColor === 'string' && prize.capsuleColor.trim()
        ? prize.capsuleColor
        : defaultRarityCapsuleColors[rarityValue] ?? defaultCapsuleColor;
    const flairText =
      typeof prize.flairText === 'string' && prize.flairText.trim() ? prize.flairText : fallbackFlairText;

    return {
      ...prize,
      id: prize.id ?? `gachapon-prize-${index}`,
      name: prize.name ?? `Prize ${index + 1}`,
      description: prize.description ?? 'Configure prize details in the template options.',
      rarity: rarityValue,
      rarityLabel,
      weight,
      capsuleColor,
      flairText,
    };
  });
};

const formatDropRate = (weight, totalWeight) => {
  if (!totalWeight) {
    return '—';
  }

  const percentage = (weight / totalWeight) * 100;
  if (percentage < 0.1) {
    return '<0.1%';
  }

  return `${percentage.toFixed(1)}%`;
};

const PrizeCard = ({ prize, dropRate }) => {
  const accentClass = rarityAccentClasses[prize.rarity] ?? 'border-slate-500 text-slate-200';
  const backgroundClass = rarityBackground[prize.rarity] ?? 'bg-slate-800/40';

  return (
    <div
      className={`flex h-full flex-col justify-between rounded-xl border ${accentClass} ${backgroundClass} p-4 shadow-lg shadow-slate-900/30`}
    >
      <div>
        <p className="text-sm uppercase tracking-wide text-slate-400">{prize.rarityLabel}</p>
        <h3 className="mt-1 text-xl font-semibold text-white">{prize.name}</h3>
        <p className="mt-2 text-sm text-slate-300">{prize.description}</p>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
        <span>Drop Rate</span>
        <span className="font-semibold text-slate-100">{dropRate}</span>
      </div>
    </div>
  );
};

const GachaponGame = ({ config = gachaponConfig }) => {
  const navigate = useNavigate();

  const baseDefaultFlair =
    typeof gachaponConfig.defaultFlairText === 'string' && gachaponConfig.defaultFlairText.trim()
      ? gachaponConfig.defaultFlairText
      : 'The capsule cracks open in a burst of light! 🎉';

  const baseCapsuleColor =
    typeof gachaponConfig.defaultCapsuleColor === 'string' && gachaponConfig.defaultCapsuleColor.trim()
      ? gachaponConfig.defaultCapsuleColor
      : '#38bdf8';

  const normalisedConfig = useMemo(() => {
    const providedDefaultFlair =
      typeof config?.defaultFlairText === 'string' && config.defaultFlairText.trim()
        ? config.defaultFlairText
        : baseDefaultFlair;

    const providedDefaultCapsuleColor =
      typeof config?.defaultCapsuleColor === 'string' && config.defaultCapsuleColor.trim()
        ? config.defaultCapsuleColor
        : baseCapsuleColor;

    const prizes = normalisePrizes(
      config?.prizes,
      gachaponConfig.prizes,
      providedDefaultFlair,
      providedDefaultCapsuleColor,
    );

    const baseShake = toNonNegativeInteger(gachaponConfig.shakeDurationMs, 1200);
    const baseExplosion = toNonNegativeInteger(gachaponConfig.explosionDurationMs, 650);

    return {
      ...gachaponConfig,
      ...config,
      prizes,
      title: config?.title ?? gachaponConfig.title,
      tagline: config?.tagline ?? gachaponConfig.tagline,
      description: config?.description ?? gachaponConfig.description,
      ctaLabel: config?.ctaLabel ?? gachaponConfig.ctaLabel ?? 'Start Gachapon',
      preparingLabel: config?.preparingLabel ?? gachaponConfig.preparingLabel ?? 'Dispensing…',
      resultModalTitle: config?.resultModalTitle ?? gachaponConfig.resultModalTitle ?? 'Gachapon Result',
      capsuleMachineLabel:
        config?.capsuleMachineLabel ?? gachaponConfig.capsuleMachineLabel ?? 'Capsule Machine',
      capsuleStatusIdleLabel:
        config?.capsuleStatusIdleLabel ?? gachaponConfig.capsuleStatusIdleLabel ?? 'Ready',
      capsuleStatusPreparingLabel:
        config?.capsuleStatusPreparingLabel ?? gachaponConfig.capsuleStatusPreparingLabel ?? 'Preparing…',
      capsuleStatusShakingLabel:
        config?.capsuleStatusShakingLabel ?? gachaponConfig.capsuleStatusShakingLabel ?? 'Shaking…',
      capsuleStatusOpeningLabel:
        config?.capsuleStatusOpeningLabel ?? gachaponConfig.capsuleStatusOpeningLabel ?? 'Opening…',
      capsuleStatusResultLabel:
        config?.capsuleStatusResultLabel ?? gachaponConfig.capsuleStatusResultLabel ?? 'Capsule opened!',
      capsuleDescription:
        config?.capsuleDescription ??
        gachaponConfig.capsuleDescription ??
        'Every shake builds anticipation before the capsule bursts open to reveal your prize.',
      prizeShowcaseTitle:
        config?.prizeShowcaseTitle ?? gachaponConfig.prizeShowcaseTitle ?? 'Prize Showcase',
      prizeShowcaseDescription:
        config?.prizeShowcaseDescription ??
        gachaponConfig.prizeShowcaseDescription ??
        'Browse every prize currently loaded into the capsule.',
      prizeListLoadingText:
        config?.prizeListLoadingText ??
        gachaponConfig.prizeListLoadingText ??
        'Loading prize lineup…',
      prizeListErrorText:
        config?.prizeListErrorText ??
        gachaponConfig.prizeListErrorText ??
        'We could not load the prize list. Please refresh to try again.',
      attemptErrorText:
        config?.attemptErrorText ??
        gachaponConfig.attemptErrorText ??
        'Something interrupted the gachapon attempt. Please try again.',
      defaultFlairText: providedDefaultFlair,
      defaultCapsuleColor: providedDefaultCapsuleColor,
      submissionEndpoint: config?.submissionEndpoint ?? gachaponConfig.submissionEndpoint,
      shakeDurationMs: toNonNegativeInteger(config?.shakeDurationMs, baseShake),
      explosionDurationMs: toNonNegativeInteger(config?.explosionDurationMs, baseExplosion),
    };
  }, [baseCapsuleColor, baseDefaultFlair, config]);

  const [prizes, setPrizes] = useState(normalisedConfig.prizes ?? []);
  const [loadingPrizes, setLoadingPrizes] = useState(true);
  const [prizeError, setPrizeError] = useState(null);
  const [isAttempting, setIsAttempting] = useState(false);
  const [animationPhase, setAnimationPhase] = useState('idle');
  const [result, setResult] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [attemptError, setAttemptError] = useState(null);
  const [animationKey, setAnimationKey] = useState(0);

  const timeoutsRef = useRef([]);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, []);

  useEffect(() => {
    setPrizes(normalisedConfig.prizes ?? []);
    setAnimationPhase('idle');
    setResult(null);
    setShowResultModal(false);
    setAttemptError(null);
  }, [normalisedConfig]);

  useEffect(() => {
    let cancelled = false;
    setLoadingPrizes(true);
    setPrizeError(null);

    fetchAvailablePrizes(normalisedConfig)
      .then((availablePrizes) => {
        if (cancelled || !isMountedRef.current) {
          return;
        }
        setPrizes(availablePrizes);
      })
      .catch(() => {
        if (cancelled || !isMountedRef.current) {
          return;
        }
        setPrizeError(normalisedConfig.prizeListErrorText);
      })
      .finally(() => {
        if (cancelled || !isMountedRef.current) {
          return;
        }
        setLoadingPrizes(false);
      });

    return () => {
      cancelled = true;
    };
  }, [normalisedConfig]);

  const totalWeight = useMemo(() => prizes.reduce((sum, prize) => sum + (prize.weight ?? 0), 0), [prizes]);

  const queueTimeout = (callback, delay) => {
    const timeoutId = setTimeout(callback, delay);
    timeoutsRef.current.push(timeoutId);
    return timeoutId;
  };

  const handleAttempt = () => {
    if (isAttempting || loadingPrizes) {
      return;
    }

    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    setIsAttempting(true);
    setAttemptError(null);
    setResult(null);
    setShowResultModal(false);
    setAnimationKey((prev) => prev + 1);
    setAnimationPhase('preparing');

    attemptGachapon(normalisedConfig)
      .then((outcome) => {
        if (!isMountedRef.current) {
          return;
        }

        setResult(outcome);
        setAnimationPhase('shaking');

        queueTimeout(() => {
          if (!isMountedRef.current) {
            return;
          }

          setAnimationPhase('explosion');

          queueTimeout(() => {
            if (!isMountedRef.current) {
              return;
            }

            setAnimationPhase('result');
            setShowResultModal(true);
            setIsAttempting(false);
          }, normalisedConfig.explosionDurationMs);
        }, normalisedConfig.shakeDurationMs);
      })
      .catch(() => {
        if (!isMountedRef.current) {
          return;
        }
        setAttemptError(normalisedConfig.attemptErrorText);
        setAnimationPhase('idle');
        setIsAttempting(false);
      });
  };

  const closeModal = () => {
    setShowResultModal(false);
    setAnimationPhase('idle');
  };

  const capsuleStatusLabel = (() => {
    switch (animationPhase) {
      case 'preparing':
        return normalisedConfig.capsuleStatusPreparingLabel ?? 'Preparing…';
      case 'shaking':
        return normalisedConfig.capsuleStatusShakingLabel ?? 'Shaking…';
      case 'explosion':
        return normalisedConfig.capsuleStatusOpeningLabel ?? 'Opening…';
      case 'result':
        return normalisedConfig.capsuleStatusResultLabel ?? 'Capsule opened!';
      default:
        return normalisedConfig.capsuleStatusIdleLabel ?? 'Ready';
    }
  })();

  const buttonLabel = isAttempting
    ? normalisedConfig.preparingLabel ?? 'Dispensing…'
    : normalisedConfig.ctaLabel ?? 'Start Gachapon';

  const capsuleColor = result?.prize?.capsuleColor ?? normalisedConfig.defaultCapsuleColor ?? '#38bdf8';

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 py-12 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-16 left-16 h-60 w-60 rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="absolute top-1/3 right-12 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-fuchsia-500/15 blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center px-4">
        <div className="text-center">
          {normalisedConfig.tagline ? (
            <p className="text-sm uppercase tracking-[0.35em] text-indigo-300">{normalisedConfig.tagline}</p>
          ) : null}
          <h1 className="mt-2 text-4xl font-semibold text-white sm:text-5xl">
            {normalisedConfig.title ?? 'Gachapon Game'}
          </h1>
          {normalisedConfig.description ? (
            <p className="mt-4 max-w-2xl text-sm text-slate-300 sm:text-base">
              {normalisedConfig.description}
            </p>
          ) : null}
        </div>

        <div className="mt-10 w-full max-w-3xl overflow-hidden rounded-[2.5rem] border border-indigo-400/30 bg-slate-900/80 p-10 text-center shadow-2xl shadow-indigo-900/40 backdrop-blur">
          <div className="flex flex-col items-center gap-8">
            {normalisedConfig.capsuleMachineLabel ? (
              <p className="text-xs uppercase tracking-[0.35em] text-indigo-300">
                {normalisedConfig.capsuleMachineLabel}
              </p>
            ) : null}
            <div className="gachapon-stage relative flex h-80 w-full max-w-md items-center justify-center rounded-[2rem] border border-indigo-400/30 bg-slate-950/70 p-8 shadow-[0_24px_45px_rgba(15,23,42,0.55)]">
              <div className="relative flex h-full w-full flex-col items-center justify-center">
                <div
                  className={`gachapon-box ${
                    animationPhase === 'shaking' ? 'gachapon-box--shake' : ''
                  } ${animationPhase === 'explosion' ? 'gachapon-box--hidden' : ''}`}
                >
                  <div
                    className={`gachapon-capsule ${
                      animationPhase === 'explosion' || animationPhase === 'result' ? 'gachapon-capsule--hidden' : ''
                    }`}
                    style={{ background: capsuleColor }}
                  />
                  <div className="absolute inset-x-8 bottom-6 rounded-full bg-slate-800/80 py-3 text-xs uppercase tracking-[0.3em] text-slate-400">
                    {capsuleStatusLabel}
                  </div>
                </div>
                {animationPhase === 'explosion' ? <div key={animationKey} className="gachapon-explosion" /> : null}
              </div>
            </div>
            {normalisedConfig.capsuleDescription ? (
              <p className="max-w-lg text-sm text-indigo-100/80">{normalisedConfig.capsuleDescription}</p>
            ) : null}
            {attemptError ? (
              <p className="w-full rounded-2xl border border-rose-500/40 bg-rose-500/10 px-5 py-3 text-sm text-rose-200" role="status">
                {attemptError}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={handleAttempt}
            disabled={isAttempting || loadingPrizes}
            className="gachapon-start-button"
          >
            <span>{buttonLabel}</span>
          </button>
          <button
            type="button"
            className="rounded-full border border-slate-700/70 px-6 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:text-white"
            onClick={() => navigate('/')}
          >
            Back to Store
          </button>
        </div>

        <div className="mt-12 w-full overflow-hidden rounded-[2.5rem] border border-slate-800/70 bg-slate-900/80 p-8 shadow-2xl shadow-indigo-900/30 backdrop-blur">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
              <div>
                <h2 className="text-lg font-semibold text-white sm:text-xl">{normalisedConfig.prizeShowcaseTitle}</h2>
                {normalisedConfig.prizeShowcaseDescription ? (
                  <p className="mt-1 text-sm text-slate-400">{normalisedConfig.prizeShowcaseDescription}</p>
                ) : null}
              </div>
              <span className="rounded-full border border-slate-700/60 bg-slate-950/60 px-4 py-1 text-xs uppercase tracking-[0.3em] text-slate-300">
                {prizes.length} Rewards
              </span>
            </div>
            {loadingPrizes ? (
              <p className="text-sm text-slate-400">{normalisedConfig.prizeListLoadingText}</p>
            ) : prizeError ? (
              <p className="text-sm text-rose-300">{prizeError}</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {prizes.map((prize) => (
                  <PrizeCard
                    key={prize.id}
                    prize={prize}
                    dropRate={formatDropRate(prize.weight ?? 0, totalWeight)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showResultModal && result ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-10 backdrop-blur">
          <div className="w-full max-w-lg rounded-3xl border border-indigo-400/40 bg-slate-900/90 p-8 shadow-2xl shadow-indigo-900/50">
            <p className="text-sm uppercase tracking-[0.25em] text-indigo-300">{normalisedConfig.resultModalTitle}</p>
            <h3 className="mt-2 text-3xl font-semibold text-white">{result.prize.name}</h3>
            <p className="mt-1 text-sm text-slate-400">{result.prize.rarityLabel}</p>
            <div className="mt-5 flex items-center justify-center">
              <div className="gachapon-capsule-display" style={{ background: result.prize.capsuleColor }} />
            </div>
            <p className="mt-6 text-sm text-slate-300">{result.prize.description}</p>
            <p className="mt-4 text-sm text-indigo-200">{result.flairText ?? normalisedConfig.defaultFlairText}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="rounded-full border border-slate-600 px-5 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-400 hover:text-white"
                onClick={closeModal}
              >
                {normalisedConfig.ctaLabel ?? 'Start Gachapon'}
              </button>
              <button
                type="button"
                className="rounded-full bg-indigo-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
                onClick={() => navigate('/')}
              >
                Back to Store
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default GachaponGame;
