
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { attemptScratchCard, fetchScratchPrizes } from './scratch-card-api';
import './scratch-card-game.css';

const SCRATCH_CELL_SIZE = 32;
const SCRATCH_RADIUS = 28;
const REVEAL_THRESHOLD = 0.6;

const rarityAccentClasses = {
  common: 'border-slate-500/70 text-slate-100',
  uncommon: 'border-emerald-400/70 text-emerald-100',
  rare: 'border-sky-400/70 text-sky-100',
  epic: 'border-violet-400/70 text-violet-100',
  legendary: 'border-amber-300/80 text-amber-100',
};

const rarityBackground = {
  common: 'bg-slate-900/60',
  uncommon: 'bg-emerald-500/15',
  rare: 'bg-sky-500/15',
  epic: 'bg-violet-500/15',
  legendary: 'bg-amber-500/20',
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
  const accentClass = rarityAccentClasses[prize.rarity] ?? 'border-slate-500/60 text-slate-200';
  const backgroundClass = rarityBackground[prize.rarity] ?? 'bg-slate-900/60';

  return (
    <div
      className={`flex h-full flex-col justify-between rounded-2xl border ${accentClass} ${backgroundClass} p-5 shadow-lg shadow-slate-950/40 backdrop-blur`}
    >
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{prize.rarityLabel}</p>
        <h3 className="mt-2 text-lg font-semibold text-white">{prize.name}</h3>
        <p className="mt-3 text-sm text-slate-300">{prize.description}</p>
      </div>
      <div className="mt-5 flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
        <span>Drop Rate</span>
        <span className="text-sm font-semibold text-slate-100 normal-case tracking-normal">{dropRate}</span>
      </div>
    </div>
  );
};

const ScratchCardGame = () => {
  const navigate = useNavigate();
  const [prizes, setPrizes] = useState([]);
  const [loadingPrizes, setLoadingPrizes] = useState(true);
  const [prizeError, setPrizeError] = useState(null);
  const [isAttempting, setIsAttempting] = useState(false);
  const [cardState, setCardState] = useState('idle');
  const [scratchProgress, setScratchProgress] = useState(0);
  const [isScratching, setIsScratching] = useState(false);
  const [coverCleared, setCoverCleared] = useState(false);
  const [result, setResult] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [attemptError, setAttemptError] = useState(null);

  const timeoutsRef = useRef([]);
  const isMountedRef = useRef(true);
  const canvasRef = useRef(null);
  const surfaceRef = useRef(null);
  const pointerActiveRef = useRef(false);
  const scratchedCellsRef = useRef(new Set());
  const totalCellsRef = useRef(0);
  const scratchCompletedRef = useRef(false);

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

    fetchScratchPrizes()
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
        setPrizeError('We could not load the prize ledger. Please refresh to try again.');
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

  const totalWeight = useMemo(
    () => prizes.reduce((sum, prize) => sum + (prize.weight ?? 0), 0),
    [prizes]
  );

  const queueTimeout = (callback, delay) => {
    const timeoutId = setTimeout(callback, delay);
    timeoutsRef.current.push(timeoutId);
    return timeoutId;
  };

  const handleAttempt = () => {
    if (isAttempting || loadingPrizes || cardState === 'preparing' || cardState === 'ready') {
      return;
    }

    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    setIsAttempting(true);
    setAttemptError(null);
    setIsScratching(false);
    pointerActiveRef.current = false;
    setResult(null);
    setShowResultModal(false);
    setCardState('preparing');
    setScratchProgress(0);
    setCoverCleared(false);
    scratchedCellsRef.current = new Set();
    totalCellsRef.current = 0;
    scratchCompletedRef.current = false;

    attemptScratchCard()
      .then((outcome) => {
        if (!isMountedRef.current) {
          return;
        }
        setResult(outcome);
        setCardState('ready');
      })
      .catch(() => {
        if (!isMountedRef.current) {
          return;
        }
        setAttemptError('Something interrupted the scratch card attempt. Please try again.');
        setCardState('idle');
      })
      .finally(() => {
        if (!isMountedRef.current) {
          return;
        }
        setIsAttempting(false);
      });
  };

  const closeModal = () => {
    setShowResultModal(false);
  };

  const initializeFoil = useCallback(() => {
    if (cardState !== 'ready') {
      return;
    }

    const canvas = canvasRef.current;
    const surface = surfaceRef.current;
    if (!canvas || !surface) {
      return;
    }

    const rect = surface.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return;
    }

    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.globalCompositeOperation = 'source-over';
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#4f46e5');
    gradient.addColorStop(0.45, '#7c3aed');
    gradient.addColorStop(1, '#ec4899');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#ffffff';
    const stripeStep = 28 * dpr;
    for (let offset = -canvas.height; offset < canvas.width * 2; offset += stripeStep) {
      ctx.save();
      ctx.translate(0, offset);
      ctx.rotate((18 * Math.PI) / 180);
      ctx.fillRect(-canvas.width, 0, canvas.width * 3, 8 * dpr);
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    scratchedCellsRef.current = new Set();
    const widthCells = Math.ceil(rect.width / SCRATCH_CELL_SIZE);
    const heightCells = Math.ceil(rect.height / SCRATCH_CELL_SIZE);
    totalCellsRef.current = widthCells * heightCells;
    setScratchProgress(0);
    setCoverCleared(false);
    scratchCompletedRef.current = false;
  }, [cardState]);

  useEffect(() => {
    if (cardState !== 'ready') {
      return;
    }

    initializeFoil();

    const handleResize = () => {
      initializeFoil();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [cardState, initializeFoil]);

  const handleScratchComplete = useCallback(() => {
    if (cardState !== 'ready' || !result || scratchCompletedRef.current) {
      return;
    }

    scratchCompletedRef.current = true;
    setCardState('revealed');
    setCoverCleared(true);
    setScratchProgress(1);

    queueTimeout(() => {
      if (!isMountedRef.current) {
        return;
      }
      setShowResultModal(true);
    }, 650);
  }, [cardState, result]);

  const scratchAt = useCallback(
    (clientX, clientY) => {
      if (cardState !== 'ready') {
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const x = (clientX - rect.left) * dpr;
      const y = (clientY - rect.top) * dpr;

      if (Number.isNaN(x) || Number.isNaN(y)) {
        return;
      }

      const radius = SCRATCH_RADIUS * dpr;
      const gradient = ctx.createRadialGradient(x, y, radius * 0.3, x, y, radius);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.closePath();
      ctx.globalCompositeOperation = 'source-over';

      const normalizedX = clientX - rect.left;
      const normalizedY = clientY - rect.top;
      const cellX = Math.floor(normalizedX / SCRATCH_CELL_SIZE);
      const cellY = Math.floor(normalizedY / SCRATCH_CELL_SIZE);
      const cellKey = `${cellX},${cellY}`;

      if (!scratchedCellsRef.current.has(cellKey)) {
        scratchedCellsRef.current.add(cellKey);
        if (totalCellsRef.current > 0) {
          const ratio = scratchedCellsRef.current.size / totalCellsRef.current;
          setScratchProgress((prev) => (ratio > prev ? ratio : prev));
          if (ratio >= REVEAL_THRESHOLD) {
            handleScratchComplete();
          }
        }
      }
    },
    [cardState, handleScratchComplete]
  );

  const endScratch = useCallback(() => {
    if (!pointerActiveRef.current) {
      return;
    }
    pointerActiveRef.current = false;
    setIsScratching(false);
  }, []);

  const handlePointerDown = useCallback(
    (event) => {
      if (cardState !== 'ready') {
        return;
      }
      event.preventDefault();
      pointerActiveRef.current = true;
      setIsScratching(true);
      if (event.target?.setPointerCapture) {
        event.target.setPointerCapture(event.pointerId);
      }
      const points = event.getCoalescedEvents ? event.getCoalescedEvents() : [event];
      points.forEach((point) => {
        scratchAt(point.clientX, point.clientY);
      });
    },
    [cardState, scratchAt]
  );

  const handlePointerMove = useCallback(
    (event) => {
      if (!pointerActiveRef.current || cardState !== 'ready') {
        return;
      }
      event.preventDefault();
      const points = event.getCoalescedEvents ? event.getCoalescedEvents() : [event];
      points.forEach((point) => {
        scratchAt(point.clientX, point.clientY);
      });
    },
    [cardState, scratchAt]
  );

  const handlePointerUp = useCallback(
    (event) => {
      if (event?.target?.releasePointerCapture) {
        event.target.releasePointerCapture(event.pointerId);
      }
      endScratch();
    },
    [endScratch]
  );

  const handlePointerLeave = useCallback(() => {
    endScratch();
  }, [endScratch]);

  useEffect(() => {
    const handleGlobalPointerUp = () => {
      endScratch();
    };

    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);

    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
    };
  }, [endScratch]);

  const hasRevealed = cardState === 'revealed';
  const progressPercent = Math.min(100, Math.round(scratchProgress * 100));
  const showProgress = cardState === 'ready' || cardState === 'revealed';

  const cardClassName = [
    'scratch-card',
    cardState === 'ready' && isScratching ? 'scratch-card--scratching' : '',
    hasRevealed ? 'scratch-card--revealed' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const foilClassName = [
    'scratch-card__foil',
    cardState === 'ready' ? 'scratch-card__foil--interactive' : '',
    coverCleared ? 'scratch-card__foil--cleared' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const canvasClassName = [
    'scratch-card__foil-canvas',
    cardState !== 'ready' ? 'scratch-card__foil-canvas--inactive' : '',
    coverCleared ? 'scratch-card__foil-canvas--cleared' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const rewardStyle = {
    background:
      hasRevealed && result
        ? `linear-gradient(135deg, ${result.prize.foilColor}, rgba(15, 23, 42, 0.92))`
        : 'linear-gradient(135deg, rgba(148, 163, 184, 0.35), rgba(51, 65, 85, 0.95))',
    boxShadow:
      hasRevealed && result ? `0 20px 48px ${result.prize.glowColor}` : '0 16px 36px rgba(15, 23, 42, 0.45)',
  };

  const glowStyle = {
    background:
      hasRevealed && result
        ? `radial-gradient(circle, ${result.prize.glowColor} 0%, rgba(15, 23, 42, 0) 75%)`
        : 'radial-gradient(circle, rgba(129, 140, 248, 0.45) 0%, rgba(15, 23, 42, 0) 75%)',
  };

  const statusText = (() => {
    if (cardState === 'preparing') {
      return 'Preparing your aurora foil…';
    }
    if (cardState === 'ready') {
      if (scratchProgress >= REVEAL_THRESHOLD) {
        return 'Almost there… keep scratching!';
      }
      if (isScratching) {
        return 'Scratching in progress…';
      }
      return 'Foil ready! Start scratching.';
    }
    if (cardState === 'revealed' && result) {
      return `Prize revealed: ${result.prize.name}`;
    }
    return 'Tap “Get a new card” to begin.';
  })();

  const foilMessage = (() => {
    if (cardState === 'preparing') {
      return 'Charging the foil layers…';
    }
    if (cardState === 'ready') {
      return scratchProgress === 0 ? 'Scratch to reveal your prize' : 'Keep scratching to unveil it!';
    }
    if (cardState === 'revealed') {
      return 'Shimmering reward unlocked!';
    }
    return 'Press the button to draw a card.';
  })();

  const foilMessageDetail = (() => {
    if (cardState === 'ready') {
      return `${progressPercent}% revealed`;
    }
    if (cardState === 'preparing') {
      return 'Infusing with cosmic pigment…';
    }
    if (cardState === 'idle') {
      return 'You have one free scratch awaiting.';
    }
    if (cardState === 'revealed' && result) {
      return result.prize.rarityLabel;
    }
    return '';
  })();

  const buttonLabel = (() => {
    if (cardState === 'preparing' || isAttempting) {
      return 'Preparing card…';
    }
    if (cardState === 'ready') {
      return 'Scratch the foil';
    }
    if (cardState === 'revealed') {
      return 'Get another card';
    }
    return 'Get a new card';
  })();

  const buttonDisabled =
    isAttempting || loadingPrizes || cardState === 'preparing' || cardState === 'ready';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-fuchsia-950 py-12 text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-300/80">Glitterforge Games</p>
            <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl">Aurora Scratch Card</h1>
            <p className="max-w-2xl text-sm text-slate-300/90 sm:text-base">
              Claim a radiant foil, then do the scratching yourself to reveal the treasure hidden beneath. Every swipe
              clears the nebula shimmer until your prize erupts in full color.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-full border border-indigo-400/40 px-5 py-2 text-sm font-medium text-indigo-100 transition hover:border-indigo-300 hover:text-white"
                onClick={() => navigate('/')}
              >
                Back to Store
              </button>
              <button
                type="button"
                onClick={handleAttempt}
                disabled={buttonDisabled}
                className="flex items-center justify-center rounded-full bg-gradient-to-r from-fuchsia-500 via-indigo-500 to-sky-500 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {buttonLabel}
              </button>
            </div>
            {cardState === 'ready' && (
              <span className="text-xs uppercase tracking-[0.3em] text-indigo-200/70">Foil armed &amp; ready</span>
            )}
          </div>
        </div>

        <div className="scratch-card-stage rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/70 via-slate-950/60 to-fuchsia-900/40 p-8 shadow-[0_35px_80px_rgba(59,7,100,0.45)]">
          <div className="scratch-card-container">
            <div className={cardClassName}>
              <div className="scratch-card__inner" ref={surfaceRef}>
                <div className="scratch-card__reward" style={rewardStyle}>
                  <div className="scratch-card__reward-glow" style={glowStyle} />
                  <div className="scratch-card__reward-content">
                    <p className="scratch-card__reward-rarity">
                      {hasRevealed && result ? result.prize.rarityLabel : 'Mystery Reward'}
                    </p>
                    <h3 className="scratch-card__reward-name">
                      {hasRevealed && result
                        ? result.prize.name
                        : cardState === 'ready'
                        ? 'Scratch to reveal'
                        : 'Awaiting scratch'}
                    </h3>
                    <p className="scratch-card__reward-helper">
                      {hasRevealed && result ? result.flairText : 'Drag across the foil to lift the shimmer.'}
                    </p>
                  </div>
                </div>
                <div className={foilClassName}>
                  <canvas
                    ref={canvasRef}
                    className={canvasClassName}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerLeave}
                    onPointerLeave={handlePointerLeave}
                  />
                  <div className="scratch-card__foil-noise" />
                  <div className="scratch-card__foil-shine" />
                  <div
                    className={`scratch-card__foil-message ${
                      cardState !== 'revealed' ? 'scratch-card__foil-message--visible' : ''
                    }`}
                  >
                    <span>{foilMessage}</span>
                    {foilMessageDetail && <span className="scratch-card__foil-detail">{foilMessageDetail}</span>}
                  </div>
                </div>
              </div>
            </div>
            <div className="scratch-card__status-panel">
              <div className="scratch-card__status-badge">{statusText}</div>
              {showProgress && (
                <div className="scratch-card__progress">
                  <div className="scratch-card__progress-track">
                    <div className="scratch-card__progress-fill" style={{ width: `${progressPercent}%` }} />
                  </div>
                  <span className="scratch-card__progress-label">{progressPercent}% revealed</span>
                </div>
              )}
              {cardState === 'revealed' && result && (
                <p className="scratch-card__status-detail">
                  You uncovered the <span>{result.prize.name}</span>!
                </p>
              )}
              {attemptError && <div className="scratch-card-error">{attemptError}</div>}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800/60 bg-slate-950/60 p-7 shadow-[0_30px_70px_rgba(15,23,42,0.45)] backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">Prize Ledger</h2>
            <span className="rounded-full border border-indigo-400/30 px-3 py-1 text-xs uppercase tracking-[0.3em] text-indigo-200/70">
              Drop Rates
            </span>
          </div>
          {loadingPrizes ? (
            <p className="mt-4 text-sm text-slate-400">Loading scratch card lineup…</p>
          ) : prizeError ? (
            <p className="mt-4 text-sm text-rose-300">{prizeError}</p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
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

      {showResultModal && result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-10 backdrop-blur">
          <div className="w-full max-w-lg rounded-3xl border border-indigo-400/40 bg-slate-900/90 p-8 shadow-2xl shadow-indigo-900/50">
            <p className="text-sm uppercase tracking-[0.25em] text-indigo-300">Scratch Card Result</p>
            <h3 className="mt-2 text-3xl font-semibold text-white">{result.prize.name}</h3>
            <p className="mt-1 text-sm text-slate-400">{result.prize.rarityLabel}</p>
            <div className="mt-5 flex items-center justify-center">
              <div
                className="h-28 w-44 rounded-2xl border border-indigo-400/30 bg-gradient-to-br from-slate-700 via-indigo-500/60 to-slate-900 shadow-[0_18px_40px_rgba(79,70,229,0.35)]"
                style={{ boxShadow: `0 18px 40px ${result.prize.glowColor}` }}
              >
                <div
                  className="h-full w-full rounded-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${result.prize.foilColor}, rgba(15, 23, 42, 0.92))`,
                  }}
                />
              </div>
            </div>
            <p className="mt-6 text-sm text-slate-300">{result.prize.description}</p>
            <p className="mt-4 text-sm text-indigo-200">{result.flairText}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="rounded-full border border-slate-600 px-5 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-400 hover:text-white"
                onClick={closeModal}
              >
                Scratch Again
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

export default ScratchCardGame;
