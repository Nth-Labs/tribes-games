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
    <div className="min-h-screen bg-slate-950 py-10 text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">Celestial Capsule Gachapon</h1>
            <p className="mt-2 max-w-xl text-sm text-slate-300 sm:text-base">
              Pull the lever to see what treasure is sealed within the capsule. Every attempt draws from the same
              prize pool, and your luck determines the rarity of your reward.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              className="rounded-full border border-slate-700 px-5 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:text-white"
              onClick={() => navigate('/')}
            >
              Back to Store
            </button>
            <button
              type="button"
              onClick={handleAttempt}
              disabled={isAttempting || loadingPrizes}
              className="flex items-center justify-center rounded-full bg-indigo-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-600"
            >
              {isAttempting ? 'Dispensing…' : 'Start Gachapon'}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex flex-1 flex-col gap-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-indigo-900/30">
            <h2 className="text-lg font-semibold text-white">Prize Showcase</h2>
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

          <div className="gachapon-stage flex flex-1 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center shadow-2xl shadow-indigo-900/30">
            <div className="relative flex h-80 w-full flex-col items-center justify-center">
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
              {attemptError && (
                <p className="mt-6 rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-200">
                  {attemptError}
                </p>
              )}
            </div>
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

