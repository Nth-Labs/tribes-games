import React, { useEffect, useMemo, useRef, useState } from 'react';
import FlipCard from './flip-card';
import uniqueCardsArray from './unique-cards';
import ResultsScreen from '../matching-game/results-screen';

const isCssGradient = (value) => typeof value === 'string' && value.trim().includes('gradient(');

const formatDuration = (seconds) => {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Math.round(seconds)) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  if (minutes <= 0) {
    return `${remainingSeconds}s`;
  }

  return `${minutes}m ${remainingSeconds}s`;
};

const defaultTheme = {
  backgroundColor: '#fdfaf5',
  backgroundImage:
    'radial-gradient(circle at 10% 0%, rgba(125, 211, 252, 0.45), transparent 55%), radial-gradient(circle at 90% -20%, rgba(253, 224, 171, 0.6), transparent 52%), linear-gradient(160deg, #fdfaf5 0%, #e8f3ff 55%, #fdfaf5 100%)',
  backgroundOverlayColor: 'rgba(255, 255, 255, 0.82)',
  accentColor: '#60a5fa',
  titleColor: '#0f172a',
  textColor: '#1f2937',
  subtleTextColor: 'rgba(71, 85, 105, 0.75)',
  panelBackgroundColor: 'rgba(255, 255, 255, 0.88)',
  panelBorderColor: 'rgba(148, 163, 184, 0.32)',
  panelShadowColor: 'rgba(148, 163, 184, 0.26)',
  boardBackgroundColor: 'rgba(255, 255, 255, 0.92)',
  boardBorderColor: 'rgba(191, 219, 254, 0.7)',
  boardShadowColor: 'rgba(100, 116, 139, 0.24)',
  cardBackBackgroundColor: 'rgba(226, 232, 240, 0.85)',
  cardFaceBackgroundColor: 'rgba(239, 246, 255, 0.92)',
  cardBorderColor: 'rgba(191, 219, 254, 0.9)',
  cardMatchedBackgroundColor: 'rgba(191, 227, 255, 0.65)',
  cardMatchedGlowColor: 'rgba(96, 165, 250, 0.58)',
  cardShadowColor: 'rgba(148, 163, 184, 0.4)',
  buttonBackgroundColor: '#3b82f6',
  buttonHoverBackgroundColor: '#2563eb',
  buttonTextColor: '#f8fafc',
  cardFlipDurationMs: 520
};

const GameStatusModal = ({ status, movesLeft, timeElapsed, onSubmit, isSubmitting, theme }) => {
  const isWin = status === 'won';
  const title = isWin ? 'You did it!' : 'Better luck next time';
  const description = isWin
    ? 'You matched every card before using all of your moves.'
    : 'You ran out of moves before all of the pairs were discovered.';

  const modalBackground = theme?.panelBackgroundColor || '#ffffff';
  const modalTextColor = theme?.textColor || '#1f2937';
  const modalBorderColor = theme?.panelBorderColor || 'rgba(148, 163, 184, 0.28)';
  const modalSubtleTextColor = theme?.subtleTextColor || 'rgba(100, 116, 139, 0.75)';
  const buttonBackground = theme?.buttonBackgroundColor || theme?.accentColor || '#60a5fa';
  const buttonHoverBackground = theme?.buttonHoverBackgroundColor || buttonBackground;
  const buttonTextColor = theme?.buttonTextColor || '#ffffff';

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center px-4 py-6">
      <div className="absolute inset-0 bg-slate-900/30" aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="flip-card-new-status-title"
        aria-describedby="flip-card-new-status-description"
        className="relative w-full max-w-sm overflow-hidden rounded-[28px] border shadow-[0_25px_80px_rgba(148,163,184,0.28)] backdrop-blur-md"
        style={{
          background: modalBackground,
          borderColor: modalBorderColor
        }}
      >
        <div className="space-y-6 px-7 py-8 text-center" style={{ color: modalTextColor }}>
          <div className="space-y-2">
            <h3 id="flip-card-new-status-title" className="text-2xl font-semibold tracking-tight">
              {title}
            </h3>
            <p id="flip-card-new-status-description" className="text-sm" style={{ color: modalSubtleTextColor }}>
              {description}
            </p>
          </div>
          <div
            className="grid grid-cols-3 gap-3 rounded-2xl border px-4 py-3 text-[0.65rem] font-semibold uppercase tracking-[0.32em]"
            style={{
              borderColor: modalBorderColor,
              background: theme?.boardBackgroundColor || 'rgba(239, 246, 255, 0.82)'
            }}
          >
            <div className="space-y-1">
              <span style={{ color: modalSubtleTextColor }}>Outcome</span>
              <p className="text-base font-semibold" style={{ color: modalTextColor }}>
                {isWin ? 'Won' : 'Lost'}
              </p>
            </div>
            <div className="space-y-1">
              <span style={{ color: modalSubtleTextColor }}>Moves left</span>
              <p className="text-base font-semibold" style={{ color: modalTextColor }}>
                {movesLeft}
              </p>
            </div>
            <div className="space-y-1">
              <span style={{ color: modalSubtleTextColor }}>Time</span>
              <p className="text-base font-semibold" style={{ color: modalTextColor }}>
                {formatDuration(timeElapsed)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="w-full rounded-2xl px-6 py-3 text-base font-semibold transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-75 [background:var(--flip-button-bg)] [color:var(--flip-button-text)] hover:[background:var(--flip-button-hover-bg)]"
            style={{
              '--flip-button-bg': buttonBackground,
              '--flip-button-hover-bg': buttonHoverBackground,
              '--flip-button-text': buttonTextColor
            }}
          >
            {isSubmitting ? 'Submitting…' : 'Submit results'}
          </button>
        </div>
      </div>
    </div>
  );
};

const FlipCardNewGame = ({ config }) => {
  const cardsFromConfig = useMemo(() => config?.cards || uniqueCardsArray, [config?.cards]);
  const [cards] = useState(() => shuffleCards(cardsFromConfig.concat(cardsFromConfig)));
  const totalPairs = cards.length / 2;
  const moveLimit = config?.moveLimit || 8;
  const initialRevealDuration = config?.initialRevealSeconds ?? 0;
  const cardUpflipSecondsValue = Number(config?.cardUpflipSeconds);
  const cardUpflipSeconds = Number.isFinite(cardUpflipSecondsValue) && cardUpflipSecondsValue >= 0
    ? cardUpflipSecondsValue
    : 1;
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

  const theme = useMemo(
    () => ({
      ...defaultTheme,
      ...(config?.theme || {})
    }),
    [config?.theme]
  );

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

    if (theme.backgroundImage) {
      const trimmed = theme.backgroundImage.trim();
      if (isCssGradient(trimmed)) {
        style.backgroundImage = trimmed;
      } else {
        style.backgroundImage = `url(${trimmed})`;
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
    const backgroundImageSource = theme.backgroundImage;
    const imageSources = [
      ...cardsFromConfig.map((card) => card?.image).filter(Boolean),
      config?.cardBackImage,
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
  }, [assetsLoaded, cardsFromConfig, config?.cardBackImage, theme.backgroundImage]);

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
      setLiveElapsedTime(Math.floor((Date.now() - gameStartTimeRef.current) / 1000));
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [assetsLoaded, gameStatus]);

  const finalizeGame = (status) => {
    if (gameStatusRef.current !== 'playing') {
      return;
    }
    stopAllTimeouts();
    setOpenCards([]);
    const finalDuration = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
    setElapsedTime(finalDuration);
    setLiveElapsedTime(finalDuration);
    setShowModal(true);
    setShouldDisableAllCards(true);
    setGameStatus(status);
  };

  useEffect(() => {
    if (moves >= moveLimit && gameStatusRef.current === 'playing') {
      finalizeGame('lost');
    }
  }, [moves, moveLimit]);

  const evaluate = () => {
    const [first, second] = openCards;
    if (first === undefined || second === undefined) {
      return;
    }

    if (cards[first].type === cards[second].type) {
      setClearedCards((prev) => {
        const updated = { ...prev, [cards[first].type]: true };
        if (Object.keys(updated).length === totalPairs) {
          finalizeGame('won');
        } else if (gameStatusRef.current === 'playing') {
          setShouldDisableAllCards(false);
        }
        return updated;
      });
      setOpenCards([]);
    } else {
      if (flipBackTimeoutRef.current) {
        clearTimeout(flipBackTimeoutRef.current);
        flipBackTimeoutRef.current = null;
      }

      if (flipBackDelayMs <= 0) {
        setOpenCards([]);
        if (gameStatusRef.current === 'playing') {
          setShouldDisableAllCards(false);
        }
      } else {
        flipBackTimeoutRef.current = setTimeout(() => {
          setOpenCards([]);
          if (gameStatusRef.current === 'playing') {
            setShouldDisableAllCards(false);
          }
          flipBackTimeoutRef.current = null;
        }, flipBackDelayMs);
      }
    }
  };

  useEffect(() => {
    if (openCards.length === 2) {
      if (evaluationTimeoutRef.current) {
        clearTimeout(evaluationTimeoutRef.current);
        evaluationTimeoutRef.current = null;
      }

      evaluationTimeoutRef.current = setTimeout(() => {
        evaluate();
        evaluationTimeoutRef.current = null;
      }, evaluationDelayMs);
    }

    return () => {
      if (evaluationTimeoutRef.current) {
        clearTimeout(evaluationTimeoutRef.current);
        evaluationTimeoutRef.current = null;
      }
    };
  }, [openCards, evaluationDelayMs, flipBackDelayMs]);

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
      gameId: config?.gameId,
      gameType: config?.gameType,
      outcome: gameStatus === 'won' ? 'Won' : 'Lost',
      movesLeft,
      timeElapsed: finalElapsedTime
    };
    const url = config?.submissionEndpoint || `/api/${config?.gameType}/${config?.gameId}`;

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
      <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden" role="status" aria-live="polite">
        <div className="absolute inset-0" style={backgroundStyle} aria-hidden="true" />
        <div className="absolute inset-0" style={overlayStyle} aria-hidden="true" />
        <div className="relative z-10 flex flex-col items-center space-y-5 text-center">
          <div
            className="h-14 w-14 animate-spin rounded-full border-[3px] border-slate-200"
            style={{ borderTopColor: theme.accentColor || defaultTheme.accentColor }}
            aria-hidden="true"
          />
          <div className="space-y-1.5">
            <p className="text-base font-semibold tracking-wide" style={{ color: theme.titleColor || defaultTheme.titleColor }}>
              Shuffling your cards
            </p>
            <p className="text-sm" style={{ color: theme.subtleTextColor || defaultTheme.subtleTextColor }}>
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
    <div className="relative min-h-screen w-full overflow-hidden">
      <div className="absolute inset-0" style={backgroundStyle} aria-hidden="true" />
      <div className="absolute inset-0" style={overlayStyle} aria-hidden="true" />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-6">
        <header
          className="rounded-[32px] border px-5 py-6 shadow-[0_25px_80px_rgba(148,163,184,0.26)] backdrop-blur-sm"
          style={{
            background: theme.panelBackgroundColor || defaultTheme.panelBackgroundColor,
            borderColor: theme.panelBorderColor || defaultTheme.panelBorderColor
          }}
        >
          <div className="space-y-3 text-center">
            <span
              className="inline-flex items-center justify-center rounded-full px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.45em]"
              style={{
                background: theme.cardMatchedBackgroundColor || defaultTheme.cardMatchedBackgroundColor,
                color: theme.accentColor || defaultTheme.accentColor
              }}
            >
              Flip & Match
            </span>
            <h1 className="text-2xl font-semibold leading-snug" style={{ color: theme.titleColor || defaultTheme.titleColor }}>
              {config?.title || 'Flip Card New'}
            </h1>
            {config?.description && (
              <p className="text-sm leading-relaxed" style={{ color: theme.subtleTextColor || defaultTheme.subtleTextColor }}>
                {config.description}
              </p>
            )}
          </div>
          <div
            className="mt-6 grid grid-cols-3 gap-3 rounded-2xl border px-3 py-3 text-[0.6rem] font-semibold uppercase tracking-[0.38em]"
            style={{
              borderColor: theme.cardBorderColor || defaultTheme.cardBorderColor,
              background: theme.boardBackgroundColor || defaultTheme.boardBackgroundColor,
              color: theme.subtleTextColor || defaultTheme.subtleTextColor
            }}
          >
            <div className="space-y-1 text-center">
              <span>Moves</span>
              <p className="text-lg font-semibold" style={{ color: theme.titleColor || defaultTheme.titleColor }}>
                {movesLeft}
              </p>
            </div>
            <div className="space-y-1 text-center">
              <span>Pairs</span>
              <p className="text-lg font-semibold" style={{ color: theme.titleColor || defaultTheme.titleColor }}>
                {pairsFound}/{totalPairs}
              </p>
            </div>
            <div className="space-y-1 text-center">
              <span>Time</span>
              <p className="text-lg font-semibold" style={{ color: theme.titleColor || defaultTheme.titleColor }}>
                {formattedLiveDuration}
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-2">
            <div
              className="flex items-center justify-between text-[0.7rem] uppercase tracking-[0.32em]"
              style={{ color: theme.subtleTextColor || defaultTheme.subtleTextColor }}
            >
              <span>Round progress</span>
              <span>{progressPercentage}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'rgba(191, 219, 254, 0.45)' }}>
              <div
                className="h-full rounded-full transition-[width] duration-500 ease-out"
                style={{ width: `${progressPercentage}%`, background: theme.accentColor || defaultTheme.accentColor }}
              />
            </div>
          </div>
          {isInitialRevealActive && (
            <div
              className="mt-5 flex items-center justify-between rounded-2xl border px-4 py-3 text-[0.65rem] font-semibold uppercase tracking-[0.32em]"
              style={{
                borderColor: theme.cardBorderColor || defaultTheme.cardBorderColor,
                background: theme.cardMatchedBackgroundColor || defaultTheme.cardMatchedBackgroundColor,
                color: theme.titleColor || defaultTheme.titleColor
              }}
            >
              <span>Memorise the cards</span>
              {initialRevealCountdown > 0 && (
                <span style={{ color: theme.subtleTextColor || defaultTheme.subtleTextColor }}>
                  Starts in {initialRevealCountdown}s
                </span>
              )}
            </div>
          )}
        </header>
        <main
          className="relative mt-6 flex-1 rounded-[32px] border px-4 pb-6 pt-5 shadow-[0_32px_90px_rgba(148,163,184,0.22)] backdrop-blur-sm"
          style={{
            background: theme.boardBackgroundColor || defaultTheme.boardBackgroundColor,
            borderColor: theme.boardBorderColor || defaultTheme.boardBorderColor
          }}
        >
          <div className="flex items-center justify-between text-[0.65rem] uppercase tracking-[0.32em]" style={{ color: theme.subtleTextColor || defaultTheme.subtleTextColor }}>
            <span>Find all {totalPairs} pairs</span>
            <span>{isInitialRevealActive ? 'Memorise' : isBoardLocked ? 'Checking' : 'Flip away'}</span>
          </div>
          {isBoardLocked && (
            <div
              className="mt-4 rounded-2xl border px-3 py-2 text-center text-[0.65rem] font-medium uppercase tracking-[0.3em]"
              style={{
                borderColor: theme.cardBorderColor || defaultTheme.cardBorderColor,
                background: 'rgba(255, 255, 255, 0.75)',
                color: theme.subtleTextColor || defaultTheme.subtleTextColor
              }}
            >
              Checking match…
            </div>
          )}
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-3.5">
            {cards.map((card, index) => (
              <FlipCard
                key={index}
                card={card}
                index={index}
                isDisabled={shouldDisableAllCards}
                isInactive={checkIsInactive(card)}
                isFlipped={checkIsFlipped(index)}
                onClick={handleCardClick}
                cardBackImage={config?.cardBackImage}
                theme={theme}
                flipDurationMs={flipDurationMs}
              />
            ))}
          </div>
        </main>
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

export default FlipCardNewGame;
