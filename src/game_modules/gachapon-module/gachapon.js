import React, { useEffect, useMemo, useRef, useState } from 'react';
import { buildConfig, mergeDisplayPrizes, normaliseResult } from './config';
import { retrieveLuckdrawPrizes } from '../luckdraw-prizes';
import './gachapon.css';

const defaultCardStyle = {
  card: 'border-slate-200/80 bg-gradient-to-br from-white via-slate-50 to-white/70 text-slate-600 shadow-[0_20px_45px_rgba(148,163,184,0.2)]',
  accentBlob: 'from-slate-200/60 via-white/50 to-transparent',
  rarityBadge: 'bg-slate-200 text-slate-700',
  dropBadge: 'bg-slate-100 text-slate-700',
  title: 'text-slate-900',
  body: 'text-slate-600',
  accent: 'text-slate-500',
};

const rarityStyles = {
  common: {
    ...defaultCardStyle,
  },
  uncommon: {
    ...defaultCardStyle,
    card: 'border-emerald-200/70 bg-gradient-to-br from-white via-emerald-50 to-teal-50/70 text-emerald-700 shadow-[0_22px_45px_rgba(45,212,191,0.16)]',
    accentBlob: 'from-emerald-200/60 via-teal-100/40 to-transparent',
    rarityBadge: 'bg-emerald-200 text-emerald-800',
    dropBadge: 'bg-emerald-100 text-emerald-700',
    title: 'text-emerald-900',
    body: 'text-emerald-600',
    accent: 'text-emerald-500',
  },
  rare: {
    ...defaultCardStyle,
    card: 'border-sky-200/70 bg-gradient-to-br from-white via-sky-50 to-cyan-50/70 text-sky-700 shadow-[0_22px_45px_rgba(56,189,248,0.18)]',
    accentBlob: 'from-sky-200/60 via-cyan-100/40 to-transparent',
    rarityBadge: 'bg-sky-200 text-sky-800',
    dropBadge: 'bg-sky-100 text-sky-700',
    title: 'text-sky-900',
    body: 'text-sky-600',
    accent: 'text-sky-500',
  },
  epic: {
    ...defaultCardStyle,
    card: 'border-violet-200/70 bg-gradient-to-br from-white via-violet-50 to-fuchsia-50/70 text-violet-700 shadow-[0_22px_48px_rgba(167,139,250,0.22)]',
    accentBlob: 'from-violet-200/60 via-fuchsia-100/40 to-transparent',
    rarityBadge: 'bg-violet-200 text-violet-800',
    dropBadge: 'bg-violet-100 text-violet-700',
    title: 'text-violet-900',
    body: 'text-violet-600',
    accent: 'text-violet-500',
  },
  legendary: {
    ...defaultCardStyle,
    card: 'border-amber-200/70 bg-gradient-to-br from-white via-amber-50 to-orange-50/70 text-amber-700 shadow-[0_22px_48px_rgba(251,191,36,0.22)]',
    accentBlob: 'from-amber-200/60 via-orange-100/40 to-transparent',
    rarityBadge: 'bg-amber-200 text-amber-800',
    dropBadge: 'bg-amber-100 text-amber-700',
    title: 'text-amber-900',
    body: 'text-amber-600',
    accent: 'text-amber-500',
  },
};

const mockPlay = (config) =>
  new Promise((resolve) => {
    setTimeout(() => {
      const randomPrize = config.prizes[Math.floor(Math.random() * config.prizes.length)];
      resolve(
        normaliseResult(
          {
            resultId: `mock-${Date.now()}`,
            outcome: randomPrize ? `You won ${randomPrize.name}` : 'Better luck next time',
            message: 'This is a mocked result. Connect to the backend to receive live data.',
            prize: randomPrize,
          },
          config,
        ),
      );
    }, 450);
  });

const playGachapon = async (config) => {
  const shouldMock = !config?.play_endpoint || process.env.NODE_ENV !== 'production';

  if (shouldMock) {
    return mockPlay(config);
  }

  const payload = {
    game_id: config.game_id,
    game_template_id: config.game_template_id,
  };

  const response = await fetch(config.play_endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Play request failed with status ${response.status}`);
  }

  const data = await response.json();
  return normaliseResult(data, config);
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

const PrizeCard = ({ prize, totalWeight }) => {
  const style = rarityStyles[prize.rarity] ?? defaultCardStyle;
  const dropRate = prize.probabilityLabel || formatDropRate(prize.weight ?? 0, totalWeight);

  return (
    <div
      className={`relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border p-6 transition-shadow duration-150 hover:shadow-[0_28px_48px_rgba(129,140,248,0.18)] ${style.card}`}
    >
      <div
        className={`pointer-events-none absolute -right-14 top-12 h-28 w-28 rounded-full bg-gradient-to-br blur-3xl ${style.accentBlob}`}
      />
      <div className="pointer-events-none absolute -left-12 top-16 h-20 w-20 rounded-full bg-white/60 blur-3xl" />
      <div className="flex flex-col gap-3">
        <span className={`inline-flex w-max items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${style.rarityBadge}`}>
          {prize.rarityLabel}
        </span>
        <h3 className={`text-2xl font-semibold ${style.title}`}>{prize.name}</h3>
        <p className={`text-sm leading-relaxed ${style.body}`}>{prize.description}</p>
      </div>
      <div className={`mt-6 flex items-center justify-between text-[0.7rem] font-semibold uppercase tracking-[0.2em] ${style.accent}`}>
        <span>Drop Rate</span>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold tracking-normal ${style.dropBadge}`}>{dropRate}</span>
      </div>
    </div>
  );
};

const GachaponGame = ({ config: rawConfig = {}, onBack }) => {
  const config = useMemo(() => buildConfig(rawConfig), [rawConfig]);
  const [prizes, setPrizes] = useState(config.prizes);
  const [loadingPrizes, setLoadingPrizes] = useState(true);
  const [prizeError, setPrizeError] = useState(null);
  const [includeProbability, setIncludeProbability] = useState(false);
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
    setPrizes(config.prizes);
    setAnimationPhase('idle');
    setResult(null);
    setShowResultModal(false);
    setAttemptError(null);
    setIncludeProbability(false);
  }, [config]);

  useEffect(() => {
    let cancelled = false;
    setLoadingPrizes(true);
    setPrizeError(null);

    retrieveLuckdrawPrizes({
      config,
      endpoint: config.prizes_endpoint,
      fallbackPrizes: config.prizes,
    })
      .then((prizesResponse) => {
        if (cancelled || !isMountedRef.current) {
          return;
        }
        setPrizes(mergeDisplayPrizes(prizesResponse.prizes, config));
        setIncludeProbability(Boolean(prizesResponse.includeProbability));
      })
      .catch(() => {
        if (cancelled || !isMountedRef.current) {
          return;
        }
        setPrizeError(config.prizeListErrorText);
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
  }, [config]);

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

    playGachapon(config)
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
          }, config.explosionDurationMs);
        }, config.shakeDurationMs);
      })
      .catch(() => {
        if (!isMountedRef.current) {
          return;
        }
        setAttemptError(config.attemptErrorText);
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
        return config.capsuleStatusPreparingLabel;
      case 'shaking':
        return config.capsuleStatusShakingLabel;
      case 'explosion':
        return config.capsuleStatusOpeningLabel;
      case 'result':
        return config.capsuleStatusResultLabel;
      default:
        return config.capsuleStatusIdleLabel;
    }
  })();

  const buttonLabel = isAttempting ? config.preparingLabel : config.ctaLabel;
  const capsuleColor = result?.prize?.capsuleColor ?? config.defaultCapsuleColor;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#f6f5ff] via-[#fff5f8] to-[#f1fbff] py-10 text-slate-700 sm:py-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-8 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,_rgba(129,140,248,0.35),_rgba(129,140,248,0))] blur-3xl" />
        <div className="absolute top-1/3 right-0 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,_rgba(236,72,153,0.18),_rgba(236,72,153,0))] blur-3xl" />
        <div className="absolute bottom-[-6rem] left-1/4 h-96 w-96 rounded-full bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.18),_rgba(56,189,248,0))] blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center px-4">
        <div className="text-center">
          {config.tagline ? (
            <p className="text-xs uppercase tracking-[0.35em] text-sky-500 sm:text-sm">{config.tagline}</p>
          ) : null}
          <h1 className="mt-2 text-3xl font-semibold text-slate-900 sm:text-5xl">
            {config.title ?? 'Gachapon Game'}
          </h1>
          {config.description ? (
            <p className="mt-4 max-w-2xl text-sm text-slate-600 sm:text-base">{config.description}</p>
          ) : null}
        </div>

        <div className="mt-10 w-full max-w-3xl overflow-hidden rounded-[2.75rem] border border-white/70 bg-white/80 p-6 text-center shadow-[0_30px_70px_rgba(99,102,241,0.12)] backdrop-blur sm:p-10">
          <div className="flex flex-col items-center gap-6 sm:gap-8">
            {config.capsuleMachineLabel ? (
              <p className="text-xs uppercase tracking-[0.35em] text-sky-500 sm:text-sm">{config.capsuleMachineLabel}</p>
            ) : null}
            <div className="gachapon-stage relative flex h-[19rem] w-full max-w-md items-center justify-center rounded-[2.25rem] border border-transparent bg-white/80 p-6 shadow-[0_35px_60px_rgba(129,140,248,0.18)] sm:h-80 sm:p-8">
              <div className="relative flex h-full w-full flex-col items-center justify-center">
                <div
                  className={`gachapon-box ${animationPhase === 'shaking' ? 'gachapon-box--shake' : ''} ${animationPhase === 'explosion' ? 'gachapon-box--hidden' : ''}`}
                >
                  <div
                    className={`gachapon-capsule ${
                      animationPhase === 'explosion' || animationPhase === 'result' ? 'gachapon-capsule--hidden' : ''
                    }`}
                    style={{ background: capsuleColor }}
                  />
                  <div className="absolute inset-x-5 bottom-5 rounded-full bg-white/80 py-2.5 text-[0.65rem] uppercase tracking-[0.25em] text-slate-500 sm:inset-x-8 sm:bottom-6 sm:py-3 sm:text-xs sm:tracking-[0.3em]">
                    {capsuleStatusLabel}
                  </div>
                </div>
                {animationPhase === 'explosion' ? <div key={animationKey} className="gachapon-explosion" /> : null}
              </div>
            </div>
            {config.capsuleDescription ? (
              <p className="max-w-lg text-sm text-slate-500">{config.capsuleDescription}</p>
            ) : null}
            {attemptError ? (
              <p className="w-full rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm text-rose-700" role="status">
                {attemptError}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-10 flex w-full flex-col items-center gap-4 sm:w-auto">
          <button
            type="button"
            onClick={handleAttempt}
            disabled={isAttempting || loadingPrizes}
            className="gachapon-start-button w-full sm:w-auto"
          >
            <span>{buttonLabel}</span>
          </button>
          {onBack ? (
            <button
              type="button"
              className="w-full rounded-full border border-slate-300/80 px-6 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-800 sm:w-auto"
              onClick={onBack}
            >
              Back
            </button>
          ) : null}
        </div>

        <div className="mt-12 w-full overflow-hidden rounded-[2.75rem] border border-white/70 bg-white/80 p-6 shadow-[0_30px_70px_rgba(148,163,184,0.18)] backdrop-blur sm:p-8">
          <div className="flex flex-col gap-5 sm:gap-6">
            <div className="flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">{config.prizeShowcaseTitle}</h2>
                {config.prizeShowcaseDescription ? (
                  <p className="mt-1 text-sm text-slate-500">{config.prizeShowcaseDescription}</p>
                ) : null}
              </div>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-500 sm:px-4">
                {prizes.length} Rewards
              </span>
            </div>
            {loadingPrizes ? (
              <p className="text-sm text-slate-500">{config.prizeListLoadingText}</p>
            ) : prizeError ? (
              <p className="text-sm text-rose-500">{prizeError}</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {prizes.map((prize) => (
                  <PrizeCard key={prize.id} prize={prize} totalWeight={totalWeight} />
                ))}
              </div>
            )}
            {includeProbability && !loadingPrizes && !prizeError ? (
              <p className="text-xs text-slate-400">Probabilities shown are provided by the backend.</p>
            ) : null}
          </div>
        </div>
      </div>

      {showResultModal && result ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 px-4 py-10 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-white/70 bg-white/90 p-6 text-center shadow-[0_35px_70px_rgba(129,140,248,0.25)] sm:p-8">
            <p className="text-xs uppercase tracking-[0.25em] text-sky-500 sm:text-sm">{config.resultModalTitle}</p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">{result.prize.name}</h3>
            <p className="mt-1 text-sm text-slate-500">{result.prize.rarityLabel}</p>
            <div className="mt-5 flex items-center justify-center">
              <div className="gachapon-capsule-display" style={{ background: result.prize.capsuleColor }} />
            </div>
            <p className="mt-6 text-sm text-slate-600">{result.prize.description}</p>
            <p className="mt-4 text-sm text-sky-600">{result.flairText ?? config.defaultFlairText}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="w-full rounded-full border border-slate-300 px-5 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-800 sm:w-auto"
                onClick={closeModal}
              >
                {config.ctaLabel}
              </button>
              {onBack ? (
                <button
                  type="button"
                  className="w-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-6 py-2 text-sm font-semibold text-white transition hover:brightness-110 sm:w-auto"
                  onClick={onBack}
                >
                  Back
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default GachaponGame;
