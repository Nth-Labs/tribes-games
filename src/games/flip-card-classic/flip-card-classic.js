import React, { useEffect, useMemo, useRef, useState } from 'react';
import FlipCard from './flip-card';
import uniqueCardsArray from './unique-cards';
import ResultsScreen from '../matching-game/results-screen';
import { createThemeFromConfig, defaultTheme, isCssGradient } from './theme';
import { deriveCardsFromData, toCleanString, unwrapMongoValue } from './config';
import './flip-card-classic.css';

const formatDuration = (seconds) => {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Math.round(seconds)) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  if (minutes <= 0) {
    return `${remainingSeconds}s`;
  }

  return `${minutes}m ${remainingSeconds}s`;
};

const coerceNumber = (value) => {
  const unwrapped = unwrapMongoValue(value);

  if (typeof unwrapped === 'number') {
    return Number.isFinite(unwrapped) ? unwrapped : NaN;
  }

  if (typeof unwrapped === 'string') {
    const trimmed = unwrapped.trim();
    if (!trimmed) {
      return NaN;
    }

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  return NaN;
};

const getNumberOption = (value, fallback) => {
  const parsed = coerceNumber(value);
  if (Number.isFinite(parsed)) {
    return parsed;
  }
  return fallback;
};

const GameStatusModal = ({ status, movesLeft, timeElapsed, onSubmit, isSubmitting, theme }) => {
  const isWin = status === 'won';
  const title = isWin ? 'You did it!' : 'Better luck next time';
  const description = isWin
    ? 'You matched every card before using all of your moves.'
    : 'You ran out of moves before all of the pairs were discovered.';

  const modalStyle = {
    background: theme?.panelBackgroundColor || '#ffffff',
    borderColor: theme?.panelBorderColor || 'rgba(148, 163, 184, 0.28)',
    color: theme?.textColor || '#1f2937'
  };

  const accentColor = theme?.accentColor || '#60a5fa';
  const buttonBackground = theme?.buttonBackgroundColor || accentColor;
  const buttonText = theme?.buttonTextColor || '#ffffff';
  const buttonStyle = {
    background: buttonBackground,
    borderColor: buttonBackground,
    color: buttonText,
    '--flip-accent': buttonBackground
  };

  return (
    <div className="flip-classic-modal-backdrop" role="dialog" aria-modal="true">
      <div className="flip-classic-modal" style={modalStyle}>
        <div className="text-center">
          <h3 className="fw-semibold mb-2">{title}</h3>
          <p className="text-muted mb-4" style={{ color: theme?.subtleTextColor || 'rgba(100, 116, 139, 0.75)' }}>
            {description}
          </p>
          <div className="d-flex justify-content-between gap-3 mb-4 flex-wrap text-uppercase" style={{ color: theme?.subtleTextColor || 'rgba(100, 116, 139, 0.75)', fontSize: '0.65rem', letterSpacing: '0.32em' }}>
            <div className="flex-fill text-center p-3 border rounded-4" style={{ borderColor: theme?.panelBorderColor || 'rgba(148, 163, 184, 0.28)', background: theme?.boardBackgroundColor || 'rgba(239, 246, 255, 0.82)' }}>
              <span>Outcome</span>
              <span className="flip-classic-stat-value">{isWin ? 'Won' : 'Lost'}</span>
            </div>
            <div className="flex-fill text-center p-3 border rounded-4" style={{ borderColor: theme?.panelBorderColor || 'rgba(148, 163, 184, 0.28)', background: theme?.boardBackgroundColor || 'rgba(239, 246, 255, 0.82)' }}>
              <span>Moves left</span>
              <span className="flip-classic-stat-value">{movesLeft}</span>
            </div>
            <div className="flex-fill text-center p-3 border rounded-4" style={{ borderColor: theme?.panelBorderColor || 'rgba(148, 163, 184, 0.28)', background: theme?.boardBackgroundColor || 'rgba(239, 246, 255, 0.82)' }}>
              <span>Time</span>
              <span className="flip-classic-stat-value">{formatDuration(timeElapsed)}</span>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-primary w-100"
            onClick={onSubmit}
            disabled={isSubmitting}
            style={buttonStyle}
          >
            {isSubmitting ? 'Submitting…' : 'Submit results'}
          </button>
        </div>
      </div>
    </div>
  );
};

const swap = (array, i, j) => {
  const temp = array[i];
  array[i] = array[j];
  array[j] = temp;
};

const shuffleCards = (array) => {
  const length = array.length;
  for (let i = length; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * i);
    const currIndex = i - 1;
    swap(array, currIndex, randomIndex);
  }
  return array;
};

const mockSubmitResults = (url, payload) => new Promise((resolve) => {
  setTimeout(() => {
    resolve(payload);
  }, 800);
});

const FlipCardClassicGame = ({ config }) => {
  const cardsFromConfig = useMemo(() => {
    const derivedCards = deriveCardsFromData(config);
    if (derivedCards.length > 0) {
      return derivedCards;
    }
    return uniqueCardsArray;
  }, [config]);

  const [cards] = useState(() => shuffleCards(cardsFromConfig.concat(cardsFromConfig)));
  const totalPairs = cards.length / 2;
  const moveLimit = Math.max(0, getNumberOption(config?.move_limit ?? config?.moveLimit, 8));
  const initialRevealDuration = Math.max(0, getNumberOption(config?.initial_reveal_seconds ?? config?.initialRevealSeconds, 0));
  const cardUpflipSecondsRaw = getNumberOption(config?.card_upflip_seconds ?? config?.cardUpflipSeconds, 1);
  const cardUpflipSeconds = cardUpflipSecondsRaw >= 0 ? cardUpflipSecondsRaw : 1;
  const cardUpflipDurationMs = cardUpflipSeconds * 1000;
  const evaluationDelayMs = Math.min(cardUpflipDurationMs, 500);
  const flipBackDelayMs = Math.max(cardUpflipDurationMs - evaluationDelayMs, 0);

  const [openCards, setOpenCards] = useState([]);
  const [clearedCards, setClearedCards] = useState({});
  const [moves, setMoves] = useState(0);
  const [result, setResult] = useState(null);
  const [gameStatus, setGameStatus] = useState('playing');
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialRevealActive, setIsInitialRevealActive] = useState(initialRevealDuration > 0);
  const [shouldDisableAllCards, setShouldDisableAllCards] = useState(initialRevealDuration > 0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [initialRevealCountdown, setInitialRevealCountdown] = useState(
    initialRevealDuration > 0 ? Math.ceil(initialRevealDuration) : 0
  );
  const [liveElapsedTime, setLiveElapsedTime] = useState(0);

  const gameStartTimeRef = useRef(Date.now());
  const gameStatusRef = useRef('playing');
  const flipBackTimeoutRef = useRef(null);
  const evaluationTimeoutRef = useRef(null);
  const initialRevealTimeoutRef = useRef(null);
  const preloadedSourcesRef = useRef('');

  const movesLeft = Math.max(moveLimit - moves, 0);

  const cardBackImage = useMemo(() => {
    const camel = toCleanString(config?.cardBackImage);
    if (camel) {
      return camel;
    }
    const snake = toCleanString(config?.card_back_image);
    if (snake) {
      return snake;
    }
    return '/images/matching-game-assets/white-tiffin-assets/white-tiffin-logo.png';
  }, [config?.cardBackImage, config?.card_back_image]);

  const theme = useMemo(() => createThemeFromConfig(config || {}), [config]);

  const headerSubtitle = useMemo(() => {
    const description = toCleanString(config?.description);
    if (description) {
      return description;
    }

    const subtitle = toCleanString(config?.subtitle);
    if (subtitle) {
      return subtitle;
    }

    return '';
  }, [config]);

  const headerTitle = toCleanString(config?.title) || toCleanString(config?.name) || 'Flip Card Classic';

  const gameId = toCleanString(config?.gameId) || toCleanString(config?.game_id) || 'flip-classic-001';
  const gameType = toCleanString(config?.gameType) || toCleanString(config?.game_type) || 'flip-card-classic';
  const submissionEndpoint =
    toCleanString(config?.submissionEndpoint) || toCleanString(config?.submission_endpoint);

  const flipDurationMs = useMemo(() => {
    const parsed = Number(theme?.cardFlipDurationMs);
    if (Number.isFinite(parsed) && parsed >= 120) {
      return parsed;
    }
    return defaultTheme.cardFlipDurationMs;
  }, [theme?.cardFlipDurationMs]);

  const backgroundStyle = useMemo(() => {
    const style = {
      backgroundColor: theme.backgroundColor || defaultTheme.backgroundColor
    };

    const backgroundImage = toCleanString(theme.backgroundImage);
    if (backgroundImage) {
      if (isCssGradient(backgroundImage)) {
        style.backgroundImage = backgroundImage;
      } else {
        style.backgroundImage = `url(${backgroundImage})`;
        style.backgroundSize = 'cover';
        style.backgroundPosition = 'center';
        style.backgroundRepeat = 'no-repeat';
      }
    }

    return style;
  }, [theme.backgroundColor, theme.backgroundImage]);

  const overlayStyle = useMemo(
    () => ({ background: theme.backgroundOverlayColor || defaultTheme.backgroundOverlayColor }),
    [theme.backgroundOverlayColor]
  );

  const pairsFound = useMemo(() => Object.keys(clearedCards).length, [clearedCards]);

  const progressPercentage = useMemo(() => {
    if (totalPairs <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((pairsFound / totalPairs) * 100));
  }, [pairsFound, totalPairs]);

  const formattedLiveDuration = formatDuration(liveElapsedTime);
  const isBoardLocked = shouldDisableAllCards && !isInitialRevealActive && gameStatus === 'playing';

  const stopAllTimeouts = () => {
    if (initialRevealTimeoutRef.current) {
      clearTimeout(initialRevealTimeoutRef.current);
      initialRevealTimeoutRef.current = null;
    }
    if (flipBackTimeoutRef.current) {
      clearTimeout(flipBackTimeoutRef.current);
      flipBackTimeoutRef.current = null;
    }
    if (evaluationTimeoutRef.current) {
      clearTimeout(evaluationTimeoutRef.current);
      evaluationTimeoutRef.current = null;
    }
  };

  useEffect(() => () => stopAllTimeouts(), []);

  useEffect(() => {
    gameStatusRef.current = gameStatus;
  }, [gameStatus]);

  useEffect(() => {
    const backgroundImageSource = toCleanString(theme.backgroundImage);
    const imageSources = [
      ...cardsFromConfig.map((card) => card?.image).filter(Boolean),
      cardBackImage,
      isCssGradient(backgroundImageSource) ? null : backgroundImageSource
    ].filter(Boolean);

    const uniqueSources = Array.from(new Set(imageSources));
    const sortedKey = uniqueSources.slice().sort().join('|');

    if (sortedKey === preloadedSourcesRef.current && assetsLoaded) {
      return;
    }

    preloadedSourcesRef.current = sortedKey;

    if (uniqueSources.length === 0) {
      setAssetsLoaded(true);
      return;
    }

    let isCancelled = false;

    setShouldDisableAllCards(true);
    setAssetsLoaded(false);

    const preloadPromises = uniqueSources.map((src) => new Promise((resolve) => {
      const img = new Image();
      img.onload = resolve;
      img.onerror = resolve;
      img.src = src;
    }));

    Promise.all(preloadPromises).then(() => {
      if (!isCancelled) {
        setAssetsLoaded(true);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [assetsLoaded, cardBackImage, cardsFromConfig, theme.backgroundImage]);

  useEffect(() => {
    if (initialRevealTimeoutRef.current) {
      clearTimeout(initialRevealTimeoutRef.current);
      initialRevealTimeoutRef.current = null;
    }

    if (!assetsLoaded) {
      return undefined;
    }

    gameStartTimeRef.current = Date.now();
    setLiveElapsedTime(0);
    setElapsedTime(0);

    if (initialRevealDuration > 0) {
      setIsInitialRevealActive(true);
      setShouldDisableAllCards(true);
      setInitialRevealCountdown(Math.ceil(initialRevealDuration));
      initialRevealTimeoutRef.current = setTimeout(() => {
        setIsInitialRevealActive(false);
        if (gameStatusRef.current === 'playing') {
          setShouldDisableAllCards(false);
        }
        initialRevealTimeoutRef.current = null;
      }, initialRevealDuration * 1000);
    } else {
      setIsInitialRevealActive(false);
      setInitialRevealCountdown(0);
      if (gameStatusRef.current === 'playing') {
        setShouldDisableAllCards(false);
      }
    }

    return () => {
      if (initialRevealTimeoutRef.current) {
        clearTimeout(initialRevealTimeoutRef.current);
        initialRevealTimeoutRef.current = null;
      }
    };
  }, [initialRevealDuration, assetsLoaded]);

  useEffect(() => {
    if (!isInitialRevealActive || initialRevealDuration <= 0) {
      setInitialRevealCountdown(0);
      return undefined;
    }

    setInitialRevealCountdown(Math.ceil(initialRevealDuration));

    const interval = setInterval(() => {
      setInitialRevealCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isInitialRevealActive, initialRevealDuration]);

  useEffect(() => {
    if (!assetsLoaded || gameStatus !== 'playing') {
      return undefined;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const secondsElapsed = Math.floor((now - gameStartTimeRef.current) / 1000);
      setLiveElapsedTime(secondsElapsed);
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [assetsLoaded, gameStatus]);

  useEffect(() => {
    if (openCards.length !== 2) {
      return undefined;
    }

    const [firstIndex, secondIndex] = openCards;

    const evaluate = () => {
      const first = cards[firstIndex];
      const second = cards[secondIndex];

      if (!first || !second) {
        setOpenCards([]);
        setShouldDisableAllCards(false);
        return;
      }

      if (first.type === second.type) {
        setClearedCards((prev) => ({ ...prev, [first.type]: true }));
        setOpenCards([]);
        setShouldDisableAllCards(false);
        return;
      }

      flipBackTimeoutRef.current = setTimeout(() => {
        setOpenCards([]);
        setShouldDisableAllCards(false);
        flipBackTimeoutRef.current = null;
      }, flipBackDelayMs);
    };

    if (evaluationTimeoutRef.current) {
      clearTimeout(evaluationTimeoutRef.current);
      evaluationTimeoutRef.current = null;
    }

    evaluationTimeoutRef.current = setTimeout(() => {
      evaluate();
      evaluationTimeoutRef.current = null;
    }, evaluationDelayMs);

    return () => {
      if (evaluationTimeoutRef.current) {
        clearTimeout(evaluationTimeoutRef.current);
        evaluationTimeoutRef.current = null;
      }
    };
  }, [openCards, evaluationDelayMs, flipBackDelayMs, cards]);

  useEffect(() => {
    if (Object.keys(clearedCards).length === totalPairs && totalPairs > 0) {
      setGameStatus('won');
      setShowModal(true);
      const finalElapsedTime = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
      setElapsedTime(finalElapsedTime);
      setShouldDisableAllCards(true);
    }
  }, [clearedCards, totalPairs]);

  useEffect(() => {
    if (movesLeft <= 0 && gameStatus === 'playing') {
      setGameStatus('lost');
      setShowModal(true);
      setShouldDisableAllCards(true);
      const finalElapsedTime = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
      setElapsedTime(finalElapsedTime);
    }
  }, [movesLeft, gameStatus]);

  const handleCardClick = (index) => {
    if (shouldDisableAllCards || gameStatusRef.current !== 'playing' || isInitialRevealActive) {
      return;
    }

    if (openCards.includes(index)) {
      return;
    }

    if (openCards.length === 1) {
      setOpenCards((prev) => [...prev, index]);
      setMoves((prevMoves) => prevMoves + 1);
      setShouldDisableAllCards(true);
    } else {
      if (flipBackTimeoutRef.current) {
        clearTimeout(flipBackTimeoutRef.current);
        flipBackTimeoutRef.current = null;
      }
      setOpenCards([index]);
    }
  };

  const checkIsFlipped = (index) => isInitialRevealActive || openCards.includes(index);

  const checkIsInactive = (card) => Boolean(clearedCards[card.type]);

  const handleSubmitResults = () => {
    if (isSubmitting || gameStatusRef.current === 'playing') {
      return;
    }

    setIsSubmitting(true);
    const finalElapsedTime = elapsedTime || Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
    const payload = {
      gameId,
      gameType,
      outcome: gameStatus === 'won' ? 'Won' : 'Lost',
      movesLeft,
      timeElapsed: finalElapsedTime
    };
    const url = submissionEndpoint || `/api/${gameType}/${gameId}`;

    mockSubmitResults(url, payload)
      .then((response) => {
        setResult(response);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  if (!assetsLoaded) {
    return (
      <div className="flip-classic-game" style={backgroundStyle} role="status" aria-live="polite">
        <div className="flip-classic-overlay" style={overlayStyle} aria-hidden="true" />
        <div className="flip-classic-content d-flex align-items-center justify-content-center text-center">
          <div>
            <div
              className="spinner-border mb-4"
              role="status"
              style={{ color: theme.accentColor || defaultTheme.accentColor }}
            >
              <span className="visually-hidden">Loading…</span>
            </div>
            <p className="fw-semibold" style={{ color: theme.titleColor || defaultTheme.titleColor }}>
              Shuffling your cards
            </p>
            <p className="text-muted" style={{ color: theme.subtleTextColor || defaultTheme.subtleTextColor }}>
              Loading artwork and preparing the deck…
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (result) {
    return <ResultsScreen {...result} />;
  }

  return (
    <div className="flip-classic-game" style={backgroundStyle}>
      <div className="flip-classic-overlay" style={overlayStyle} aria-hidden="true" />
      <div className="flip-classic-content container py-5">
        <header
          className="flip-classic-scoreboard mb-4"
          style={{
            '--flip-panel-bg': theme.panelBackgroundColor || defaultTheme.panelBackgroundColor,
            '--flip-panel-border': theme.panelBorderColor || defaultTheme.panelBorderColor,
            '--flip-subtle-text': theme.subtleTextColor || defaultTheme.subtleTextColor,
            '--flip-text-color': theme.titleColor || defaultTheme.titleColor,
            '--flip-board-bg': theme.boardBackgroundColor || defaultTheme.boardBackgroundColor
          }}
        >
          <div className="flip-classic-header mb-4">
            <span
              className="badge rounded-pill px-3 py-2 text-uppercase"
              style={{
                background: theme.cardMatchedBackgroundColor || defaultTheme.cardMatchedBackgroundColor,
                color: theme.accentColor || defaultTheme.accentColor,
                letterSpacing: '0.32em',
                fontSize: '0.6rem'
              }}
            >
              Flip & Match
            </span>
            <h1 className="mt-3" style={{ color: theme.titleColor || defaultTheme.titleColor }}>
              {headerTitle}
            </h1>
            {headerSubtitle && (
              <p className="text-muted mb-0" style={{ color: theme.subtleTextColor || defaultTheme.subtleTextColor }}>
                {headerSubtitle}
              </p>
            )}
          </div>
          <div className="flip-classic-stats">
            <div className="flip-classic-stat-card">
              Moves
              <span className="flip-classic-stat-value">{movesLeft}</span>
            </div>
            <div className="flip-classic-stat-card">
              Pairs
              <span className="flip-classic-stat-value">{pairsFound}/{totalPairs}</span>
            </div>
            <div className="flip-classic-stat-card">
              Time
              <span className="flip-classic-stat-value">{formattedLiveDuration}</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="d-flex justify-content-between text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.32em', color: theme.subtleTextColor || defaultTheme.subtleTextColor }}>
              <span>Round progress</span>
              <span>{progressPercentage}%</span>
            </div>
            <div className="flip-classic-progress mt-2">
              <div
                className="flip-classic-progress-bar"
                style={{ width: `${progressPercentage}%`, '--flip-accent': theme.accentColor || defaultTheme.accentColor }}
              />
            </div>
          </div>
          {isInitialRevealActive && (
            <div
              className="mt-4 p-3 border rounded-4 text-uppercase"
              style={{
                borderColor: theme.cardBorderColor || defaultTheme.cardBorderColor,
                background: theme.cardMatchedBackgroundColor || defaultTheme.cardMatchedBackgroundColor,
                color: theme.titleColor || defaultTheme.titleColor,
                fontSize: '0.65rem',
                letterSpacing: '0.32em'
              }}
            >
              <div className="d-flex justify-content-between">
                <span>Memorise the cards</span>
                {initialRevealCountdown > 0 && (
                  <span style={{ color: theme.subtleTextColor || defaultTheme.subtleTextColor }}>
                    Starts in {initialRevealCountdown}s
                  </span>
                )}
              </div>
            </div>
          )}
        </header>
        <main
          className="flip-classic-grid"
          style={{
            '--flip-board-bg': theme.boardBackgroundColor || defaultTheme.boardBackgroundColor,
            '--flip-panel-border': theme.boardBorderColor || defaultTheme.boardBorderColor
          }}
        >
          <div className="d-flex justify-content-between text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '0.32em', color: theme.subtleTextColor || defaultTheme.subtleTextColor }}>
            <span>Find all {totalPairs} pairs</span>
            <span>{isInitialRevealActive ? 'Memorise' : isBoardLocked ? 'Checking' : 'Flip away'}</span>
          </div>
          {isBoardLocked && (
            <div
              className="mt-3 text-center p-3 border rounded-4 text-uppercase"
              style={{
                borderColor: theme.cardBorderColor || defaultTheme.cardBorderColor,
                background: 'rgba(255, 255, 255, 0.75)',
                color: theme.subtleTextColor || defaultTheme.subtleTextColor,
                fontSize: '0.65rem',
                letterSpacing: '0.3em'
              }}
            >
              Checking match…
            </div>
          )}
          <div className="mt-4">
            <div className="row g-3 g-md-4">
              {cards.map((card, index) => (
                <div key={index} className="col-4 col-sm-3">
                  <FlipCard
                    card={card}
                    index={index}
                    isDisabled={shouldDisableAllCards}
                    isInactive={checkIsInactive(card)}
                    isFlipped={checkIsFlipped(index)}
                    onClick={handleCardClick}
                    cardBackImage={cardBackImage}
                    theme={theme}
                    flipDurationMs={flipDurationMs}
                  />
                </div>
              ))}
            </div>
          </div>
          {isInitialRevealActive && initialRevealCountdown > 0 && (
            <div className="flip-classic-initial-countdown">{initialRevealCountdown}s</div>
          )}
          {shouldDisableAllCards && !isInitialRevealActive && (
            <div className="flip-classic-lock-overlay">Please wait…</div>
          )}
        </main>
        <div className="flip-classic-footer">
          Finish the round before your moves run out to claim the top reward.
        </div>
      </div>
      {showModal && (
        <GameStatusModal
          status={gameStatus}
          movesLeft={movesLeft}
          timeElapsed={elapsedTime}
          onSubmit={handleSubmitResults}
          isSubmitting={isSubmitting}
          theme={theme}
        />
      )}
    </div>
  );
};

export default FlipCardClassicGame;
