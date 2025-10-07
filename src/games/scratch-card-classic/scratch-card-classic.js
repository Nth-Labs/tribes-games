import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { attemptScratchCard, fetchScratchPrizes } from '../scratch-card-game/scratch-card-api';
import { createThemeFromConfig, derivePrizes, normalizeScratchCardConfig, rarityOrder } from './config';
import './scratch-card-classic.css';

const SCRATCH_CELL_SIZE = 32;
const SCRATCH_RADIUS = 28;
const REVEAL_THRESHOLD = 0.6;

const toRgbComponents = (hexColor, fallback) => {
  if (typeof hexColor !== 'string') {
    return fallback;
  }

  const normalized = hexColor.trim();
  if (!normalized) {
    return fallback;
  }

  const hexMatch = normalized.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!hexMatch) {
    return fallback;
  }

  let hex = hexMatch[1];
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((char) => `${char}${char}`)
      .join('');
  }

  const intVal = parseInt(hex, 16);
  if (Number.isNaN(intVal)) {
    return fallback;
  }

  const r = (intVal >> 16) & 255;
  const g = (intVal >> 8) & 255;
  const b = intVal & 255;
  return `${r}, ${g}, ${b}`;
};

const rarityAccentClass = {
  common: 'scratch-classic-prize-card--common',
  uncommon: 'scratch-classic-prize-card--uncommon',
  rare: 'scratch-classic-prize-card--rare',
  epic: 'scratch-classic-prize-card--epic',
  legendary: 'scratch-classic-prize-card--legendary'
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
  const rarityClass = rarityAccentClass[prize.rarity] || rarityAccentClass.common;
  return (
    <div className={`scratch-classic-prize-card ${rarityClass}`}>
      <div className="scratch-classic-prize-card__body">
        <p className="scratch-classic-prize-card__rarity">{prize.rarityLabel}</p>
        <h3 className="scratch-classic-prize-card__title">{prize.name}</h3>
        <p className="scratch-classic-prize-card__description">{prize.description}</p>
      </div>
      <div className="scratch-classic-prize-card__footer">
        <span>Drop rate</span>
        <strong>{dropRate}</strong>
      </div>
    </div>
  );
};

const ScratchCardClassicGame = ({ config }) => {
  const navigate = useNavigate();

  const mergedConfig = useMemo(() => normalizeScratchCardConfig(config), [config]);
  const theme = useMemo(() => createThemeFromConfig(mergedConfig.theme || mergedConfig), [mergedConfig]);
  const [prizes, setPrizes] = useState(() => derivePrizes(mergedConfig));
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

  const backgroundStyle = useMemo(() => {
    const style = {
      '--scratch-primary': theme.primaryColor,
      '--scratch-primary-rgb': toRgbComponents(theme.primaryColor, '245, 227, 195'),
      '--scratch-secondary': theme.secondaryColor,
      '--scratch-secondary-rgb': toRgbComponents(theme.secondaryColor, '244, 185, 66'),
      '--scratch-tertiary': theme.tertiaryColor,
      '--scratch-tertiary-rgb': toRgbComponents(theme.tertiaryColor, '10, 10, 10'),
      '--scratch-foreground': '#fff8e8',
      '--scratch-foreground-rgb': '255, 248, 232',
      '--scratch-contrast': '#1d1304',
      '--scratch-card-back': theme.cardBackImage ? `url(${theme.cardBackImage})` : 'none',
      '--scratch-background': theme.backgroundImage ? `url(${theme.backgroundImage})` : 'none'
    };

    return style;
  }, [theme]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, []);

  useEffect(() => {
    setPrizes(derivePrizes(mergedConfig));
    setCardState('idle');
    setScratchProgress(0);
    setCoverCleared(false);
    setResult(null);
    setShowResultModal(false);
    setAttemptError(null);
  }, [mergedConfig]);

  useEffect(() => {
    let cancelled = false;
    setLoadingPrizes(true);
    setPrizeError(null);

    fetchScratchPrizes(mergedConfig)
      .then((availablePrizes) => {
        if (cancelled || !isMountedRef.current) {
          return;
        }
        if (Array.isArray(availablePrizes) && availablePrizes.length) {
          setPrizes(availablePrizes);
        }
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
  }, [mergedConfig]);

  const totalWeight = useMemo(
    () => prizes.reduce((sum, prize) => sum + (Number.isFinite(prize.weight) ? prize.weight : 0), 0),
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

    attemptScratchCard(mergedConfig)
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
    gradient.addColorStop(0, theme.primaryColor);
    gradient.addColorStop(0.45, theme.secondaryColor);
    gradient.addColorStop(1, theme.primaryColor);
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
  }, [cardState, theme.primaryColor, theme.secondaryColor]);

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

  const buttonDisabled = isAttempting || loadingPrizes || cardState === 'preparing';
  const buttonLabel =
    cardState === 'idle'
      ? 'Get a new card'
      : cardState === 'preparing'
      ? 'Preparing…'
      : cardState === 'ready'
      ? 'Scratch again'
      : 'Play again';

  const hasRevealed = cardState === 'revealed';
  const showProgress = cardState === 'ready' || cardState === 'revealed';
  const progressPercent = Math.min(100, Math.round(scratchProgress * 100));
  const statusText =
    cardState === 'preparing'
      ? 'Preparing card'
      : cardState === 'ready'
      ? isScratching
        ? 'Scratching…'
        : 'Ready to scratch'
      : cardState === 'revealed'
      ? 'Prize revealed'
      : 'Awaiting attempt';

  const foilMessage =
    cardState === 'idle'
      ? 'Tap the button to receive your scratch card.'
      : cardState === 'preparing'
      ? 'Summoning foil shimmer…'
      : cardState === 'ready'
      ? 'Scratch to reveal your prize.'
      : 'Prize revealed!';

  const foilMessageDetail = cardState === 'ready' && !isScratching ? 'Drag or click to scratch the foil.' : '';

  const canvasClassName = `scratch-classic-foil__canvas${cardState !== 'ready' ? ' scratch-classic-foil__canvas--inactive' : ''}$
{coverCleared ? ' scratch-classic-foil__canvas--cleared' : ''}`;

  const foilClassName = `scratch-classic-foil${cardState === 'ready' ? ' scratch-classic-foil--interactive' : ''}${coverCleared ? ' scratch-classic-foil--cleared' : ''}`;

  const cardClassName = `scratch-classic-card scratch-classic-card--${cardState}${
    cardState === 'ready' && isScratching ? ' scratch-classic-card--scratching' : ''
  }${hasRevealed ? ' scratch-classic-card--revealed' : ''}`;

  const prizeRarity = result?.prize?.rarity?.toLowerCase();
  const rarityIndex = prizeRarity ? Math.max(0, rarityOrder.indexOf(prizeRarity)) : 0;
  const glowStrength = 0.25 + rarityIndex * 0.15;
  const glowStyle = {
    opacity: hasRevealed ? 1 : 0,
    background: `radial-gradient(circle at center, rgba(255,255,255,${glowStrength}) 0%, rgba(15,23,42,0) 70%)`
  };

  const rewardImageStyle = theme.cardBackImage
    ? {
        backgroundImage: `var(--scratch-card-back)`
      }
    : undefined;

  const modalTitle = result?.prize?.name || 'Scratch Card Result';
  const modalRarity = result?.prize?.rarityLabel || 'Mystery';
  const modalFlair = result?.flairText || 'The foil peels away and the prize gleams brilliantly!';

  return (
    <div className="scratch-classic-game" style={backgroundStyle}>
      <div className="scratch-classic-overlay" />
      <div className="scratch-classic-content">
        <header className="scratch-classic-header">
          <div className="scratch-classic-branding">
            {theme.logoImage ? <img src={theme.logoImage} alt="Game logo" className="scratch-classic-logo" /> : null}
            <div>
              <p className="scratch-classic-tagline">Scratch &amp; reveal</p>
              <h1 className="scratch-classic-title">{mergedConfig.title}</h1>
              <p className="scratch-classic-description">{mergedConfig.description}</p>
            </div>
          </div>
        </header>

        <main className="scratch-classic-layout">
          <section className="scratch-classic-stage">
            <aside className="scratch-classic-status">
              <div className="scratch-classic-status__badge">{statusText}</div>
              {showProgress ? (
                <div className="scratch-classic-progress">
                  <div className="scratch-classic-progress__track">
                    <div
                      className="scratch-classic-progress__fill"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="scratch-classic-progress__label">{progressPercent}% revealed</span>
                </div>
              ) : null}
              {cardState === 'revealed' && result ? (
                <p className="scratch-classic-status__detail">
                  You uncovered the <span>{result.prize.name}</span>!
                </p>
              ) : null}
              {attemptError ? <div className="scratch-classic-error">{attemptError}</div> : null}
            </aside>

            <div className="scratch-classic-card-wrapper">
              <div className={cardClassName}>
                <div className="scratch-classic-card__inner" ref={surfaceRef}>
                  <div className="scratch-classic-reward" style={rewardImageStyle}>
                    <div className="scratch-classic-reward__glow" style={glowStyle} />
                    <div className="scratch-classic-reward__body" aria-live="polite">
                      {hasRevealed && result ? (
                        <>
                          <p className="scratch-classic-reward__rarity">{result.prize.rarityLabel}</p>
                          <h3 className="scratch-classic-reward__title">{result.prize.name}</h3>
                          <p className="scratch-classic-reward__helper">
                            {result.flairText || 'The prize gleams brilliantly!'}
                          </p>
                        </>
                      ) : null}
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
                    <div className="scratch-classic-foil__noise" />
                    <div className="scratch-classic-foil__shine" />
                    <div
                      className={`scratch-classic-foil__message${
                        cardState !== 'revealed' ? ' scratch-classic-foil__message--visible' : ''
                      }`}
                    >
                      <span>{foilMessage}</span>
                      {foilMessageDetail ? (
                        <span className="scratch-classic-foil__detail">{foilMessageDetail}</span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="scratch-classic-actions scratch-classic-actions--footer">
              <button type="button" className="scratch-classic-secondary" onClick={() => navigate(-1)}>
                Back to store
              </button>
              <button
                type="button"
                className="scratch-classic-primary"
                onClick={handleAttempt}
                disabled={buttonDisabled}
              >
                {buttonLabel}
              </button>
            </div>
          </section>

          <section className="scratch-classic-prizes">
            <div className="scratch-classic-prizes__header">
              <h2>Prize ledger</h2>
              <p>Review every reward hiding beneath the aurora foil.</p>
            </div>
            {loadingPrizes ? (
              <p className="scratch-classic-prizes__state">Loading prizes…</p>
            ) : prizeError ? (
              <p className="scratch-classic-prizes__state scratch-classic-prizes__state--error">{prizeError}</p>
            ) : (
              <div className="scratch-classic-prizes__grid">
                {prizes.map((prize) => (
                  <PrizeCard
                    key={prize.id}
                    prize={prize}
                    dropRate={formatDropRate(prize.weight ?? 0, totalWeight)}
                  />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      {showResultModal && result ? (
        <div className="scratch-classic-modal" role="dialog" aria-modal="true">
          <div className="scratch-classic-modal__overlay" />
          <div className="scratch-classic-modal__panel">
            <div className="scratch-classic-modal__badge">{modalRarity}</div>
            <h3 className="scratch-classic-modal__title">{modalTitle}</h3>
            <p className="scratch-classic-modal__description">{modalFlair}</p>
            <button type="button" className="scratch-classic-primary" onClick={closeModal}>
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ScratchCardClassicGame;
