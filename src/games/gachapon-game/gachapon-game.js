import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { attemptGachapon, fetchAvailablePrizes } from './gachapon-api';
import './gachapon-game.css';

const SHAKE_DURATION = 1200;
const EXPLOSION_DURATION = 650;

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

const GachaponGame = () => {
  const navigate = useNavigate();
  const [prizes, setPrizes] = useState([]);
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
    let cancelled = false;
    setLoadingPrizes(true);
    setPrizeError(null);

    fetchAvailablePrizes()
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
        setPrizeError('We could not load the prize list. Please refresh to try again.');
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
  }, []);

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
    setAnimationPhase('shaking');

    const attemptPromise = attemptGachapon();
    attemptPromise.catch(() => {
      // prevent unhandled rejection warnings; actual handling occurs below
    });

    queueTimeout(() => {
      if (!isMountedRef.current) {
        return;
      }
      setAnimationPhase('explosion');

      queueTimeout(() => {
        attemptPromise
          .then((outcome) => {
            if (!isMountedRef.current) {
              return;
            }
            setResult(outcome);
            setShowResultModal(true);
            setAnimationPhase('result');
          })
          .catch(() => {
            if (!isMountedRef.current) {
              return;
            }
            setAttemptError('Something interrupted the gachapon attempt. Please try again.');
            setAnimationPhase('idle');
          })
          .finally(() => {
            if (!isMountedRef.current) {
              return;
            }
            setIsAttempting(false);
          });
      }, EXPLOSION_DURATION);
    }, SHAKE_DURATION);
  };

  const closeModal = () => {
    setShowResultModal(false);
    setAnimationPhase('idle');
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 py-12 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-16 left-16 h-60 w-60 rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="absolute top-1/3 right-12 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-fuchsia-500/15 blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center px-4">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-indigo-300">Arcade Feature</p>
          <h1 className="mt-2 text-4xl font-semibold text-white sm:text-5xl">Celestial Capsule Gachapon</h1>
          <p className="mt-4 max-w-2xl text-sm text-slate-300 sm:text-base">
            Pull the lever to see what treasure is sealed within the capsule. Every attempt draws from the same prize
            pool, and your luck determines the rarity of your reward.
          </p>
        </div>

        <div className="mt-10 w-full max-w-3xl overflow-hidden rounded-[2.5rem] border border-indigo-400/30 bg-slate-900/80 p-10 text-center shadow-2xl shadow-indigo-900/40 backdrop-blur">
          <div className="flex flex-col items-center gap-8">
            <p className="text-xs uppercase tracking-[0.35em] text-indigo-300">Capsule Machine</p>
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
                    style={{ background: result?.prize?.capsuleColor ?? '#38bdf8' }}
                  />
                  <div className="absolute inset-x-8 bottom-6 rounded-full bg-slate-800/80 py-3 text-xs uppercase tracking-[0.3em] text-slate-400">
                    {animationPhase === 'shaking'
                      ? 'Shaking…'
                      : animationPhase === 'explosion'
                      ? 'Opening…'
                      : animationPhase === 'result'
                      ? 'Capsule opened!'
                      : 'Ready'}
                  </div>
                </div>
                {animationPhase === 'explosion' && (
                  <div key={animationKey} className="gachapon-explosion" />
                )}
              </div>
            </div>
            <p className="max-w-lg text-sm text-indigo-100/80">
              Every shake builds anticipation before the capsule bursts open to reveal your prize. Hold tight and watch
              the glow change as the machine prepares your reward.
            </p>
            {attemptError && (
              <p className="w-full rounded-2xl border border-rose-500/40 bg-rose-500/10 px-5 py-3 text-sm text-rose-200" role="status">
                {attemptError}
              </p>
            )}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={handleAttempt}
            disabled={isAttempting || loadingPrizes}
            className="gachapon-start-button"
          >
            <span>{isAttempting ? 'Dispensing…' : 'Start Gachapon'}</span>
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
                <h2 className="text-lg font-semibold text-white sm:text-xl">Prize Showcase</h2>
                <p className="mt-1 text-sm text-slate-400">Browse every prize currently loaded into the capsule.</p>
              </div>
              <span className="rounded-full border border-slate-700/60 bg-slate-950/60 px-4 py-1 text-xs uppercase tracking-[0.3em] text-slate-300">
                {prizes.length} Rewards
              </span>
            </div>
            {loadingPrizes ? (
              <p className="text-sm text-slate-400">Loading prize lineup…</p>
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

      {showResultModal && result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-10 backdrop-blur">
          <div className="w-full max-w-lg rounded-3xl border border-indigo-400/40 bg-slate-900/90 p-8 shadow-2xl shadow-indigo-900/50">
            <p className="text-sm uppercase tracking-[0.25em] text-indigo-300">Gachapon Result</p>
            <h3 className="mt-2 text-3xl font-semibold text-white">{result.prize.name}</h3>
            <p className="mt-1 text-sm text-slate-400">{result.prize.rarityLabel}</p>
            <div className="mt-5 flex items-center justify-center">
              <div
                className="gachapon-capsule-display"
                style={{ background: result.prize.capsuleColor }}
              />
            </div>
            <p className="mt-6 text-sm text-slate-300">{result.prize.description}</p>
            <p className="mt-4 text-sm text-indigo-200">{result.flairText}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="rounded-full border border-slate-600 px-5 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-400 hover:text-white"
                onClick={closeModal}
              >
                Try Again
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
      )}
    </div>
  );
};

export default GachaponGame;

