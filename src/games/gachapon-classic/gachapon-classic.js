import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { attemptGachapon, fetchAvailablePrizes } from '../gachapon-game/gachapon-api';
import { createThemeFromConfig, derivePrizes, normalizeGachaponConfig, rarityOrder } from './config';
import './gachapon-classic.css';

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

const PrizeCard = ({ prize, dropRate }) => (
  <div className={`gachapon-classic-prize-card gachapon-classic-prize-card--${prize.rarity || 'common'}`}>
    <div>
      <p className="gachapon-classic-prize-card__rarity">{prize.rarityLabel}</p>
      <h3 className="gachapon-classic-prize-card__title">{prize.name}</h3>
      <p className="gachapon-classic-prize-card__description">{prize.description}</p>
    </div>
    <div className="gachapon-classic-prize-card__footer">
      <span>Drop rate</span>
      <strong>{dropRate}</strong>
    </div>
  </div>
);

const GachaponClassicGame = ({ config }) => {
  const navigate = useNavigate();

  const mergedConfig = useMemo(() => normalizeGachaponConfig(config), [config]);
  const theme = useMemo(() => createThemeFromConfig(mergedConfig.theme || mergedConfig), [mergedConfig]);
  const [prizes, setPrizes] = useState(() => derivePrizes(mergedConfig));
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

  const backgroundStyle = useMemo(
    () => ({
      '--gachapon-primary': theme.primaryColor,
      '--gachapon-primary-rgb': toRgbComponents(theme.primaryColor, '255, 77, 109'),
      '--gachapon-secondary': theme.secondaryColor,
      '--gachapon-secondary-rgb': toRgbComponents(theme.secondaryColor, '43, 205, 251'),
      '--gachapon-tertiary': theme.tertiaryColor,
      '--gachapon-tertiary-rgb': toRgbComponents(theme.tertiaryColor, '37, 6, 76'),
      '--gachapon-foreground': '#fff7ff',
      '--gachapon-foreground-rgb': '255, 247, 255',
      '--gachapon-contrast': '#210039',
      '--gachapon-background': theme.backgroundImage ? `url(${theme.backgroundImage})` : 'none',
      '--gachapon-machine-image': theme.machineImage ? `url(${theme.machineImage})` : 'none',
      '--gachapon-capsule-image': theme.capsuleImage ? `url(${theme.capsuleImage})` : 'none'
    }),
    [theme]
  );

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
    setAnimationPhase('idle');
    setResult(null);
    setShowResultModal(false);
    setAttemptError(null);
  }, [mergedConfig]);

  useEffect(() => {
    let cancelled = false;
    setLoadingPrizes(true);
    setPrizeError(null);

    fetchAvailablePrizes(mergedConfig)
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

    attemptGachapon(mergedConfig)
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

          setAnimationPhase('opening');

          queueTimeout(() => {
            if (!isMountedRef.current) {
              return;
            }

            setAnimationPhase('result');
            setShowResultModal(true);
            setIsAttempting(false);
          }, 700);
        }, 1200);
      })
      .catch(() => {
        if (!isMountedRef.current) {
          return;
        }
        setAttemptError('Something interrupted the gachapon attempt. Please try again.');
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
        return 'Preparing…';
      case 'shaking':
        return 'Shaking…';
      case 'opening':
        return 'Opening…';
      case 'result':
        return 'Capsule opened!';
      default:
        return 'Ready';
    }
  })();

  const buttonLabel = isAttempting ? 'Dispensing…' : 'Start Gachapon';
  const capsuleColor = result?.prize?.capsuleColor || theme.primaryColor;
  const rarity = result?.prize?.rarity?.toLowerCase();
  const rarityIndex = rarity ? Math.max(0, rarityOrder.indexOf(rarity)) : 0;
  const glowStrength = 0.25 + rarityIndex * 0.1;

  return (
    <div className="gachapon-classic-game" style={backgroundStyle}>
      <div className="gachapon-classic-overlay" />
      <div className="gachapon-classic-content">
        <header className="gachapon-classic-header">
          <div className="gachapon-classic-heading">
            <p className="gachapon-classic-tagline">Capsule experience</p>
            <h1 className="gachapon-classic-title">{mergedConfig.title}</h1>
            <p className="gachapon-classic-description">{mergedConfig.description}</p>
          </div>
          <div className="gachapon-classic-actions">
            <button type="button" className="gachapon-classic-secondary" onClick={() => navigate(-1)}>
              Back to store
            </button>
            <button
              type="button"
              className="gachapon-classic-primary"
              onClick={handleAttempt}
              disabled={isAttempting || loadingPrizes}
            >
              {buttonLabel}
            </button>
          </div>
        </header>

        <main className="gachapon-classic-layout">
          <section className="gachapon-classic-stage">
            <div className="gachapon-classic-machine-wrapper">
              <div
                className={`gachapon-classic-machine gachapon-classic-machine--${animationPhase}`}
                key={animationKey}
              >
                <div className="gachapon-classic-machine__top" />
                <div className="gachapon-classic-machine__body">
                  <div className="gachapon-classic-machine__window">
                    <div
                      className="gachapon-classic-capsule"
                      style={{ backgroundColor: capsuleColor }}
                    >
                      <div
                        className="gachapon-classic-capsule__glow"
                        style={{ opacity: animationPhase === 'result' ? glowStrength : 0 }}
                      />
                    </div>
                  </div>
                  <div className="gachapon-classic-machine__handle">
                    <span className="gachapon-classic-machine__handle-knob" />
                    <span className="gachapon-classic-machine__handle-stick" />
                  </div>
                </div>
                <div className="gachapon-classic-machine__base" />
              </div>

              <aside className="gachapon-classic-status">
                <div className="gachapon-classic-status__badge">{capsuleStatusLabel}</div>
                <p className="gachapon-classic-status__copy">
                  Every shake builds anticipation before the capsule bursts open to reveal your prize.
                </p>
                {attemptError ? <div className="gachapon-classic-error">{attemptError}</div> : null}
                {result ? (
                  <div className="gachapon-classic-result">
                    <h3>{result.prize?.name ?? 'Mystery Capsule'}</h3>
                    <p>{result.flairText ?? 'The capsule cracks open in a burst of light!'}</p>
                  </div>
                ) : null}
              </aside>
            </div>
          </section>

          <section className="gachapon-classic-prizes">
            <div className="gachapon-classic-prizes__header">
              <h2>Prize showcase</h2>
              <p>Browse every prize currently loaded into the capsule.</p>
            </div>
            {loadingPrizes ? (
              <p className="gachapon-classic-prizes__state">Loading prize lineup…</p>
            ) : prizeError ? (
              <p className="gachapon-classic-prizes__state gachapon-classic-prizes__state--error">{prizeError}</p>
            ) : (
              <div className="gachapon-classic-prizes__grid">
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
        <div className="gachapon-classic-modal" role="dialog" aria-modal="true">
          <div className="gachapon-classic-modal__overlay" />
          <div className="gachapon-classic-modal__panel">
            <div className="gachapon-classic-modal__badge">{result.prize?.rarityLabel ?? 'Mystery'}</div>
            <h3 className="gachapon-classic-modal__title">{result.prize?.name ?? 'Gachapon Result'}</h3>
            <p className="gachapon-classic-modal__description">
              {result.flairText ?? 'The capsule cracks open in a burst of light!'}
            </p>
            <button type="button" className="gachapon-classic-primary" onClick={closeModal}>
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default GachaponClassicGame;
