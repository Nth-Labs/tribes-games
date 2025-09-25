import React, { useEffect, useMemo, useRef, useState } from 'react';
import Card from './match-card';
import uniqueCardsArray from './unique-cards';
import ResultsScreen from './results-screen';

const isCssGradient = (value) => {
  return typeof value === 'string' && value.trim().includes('gradient(');
};

const formatDuration = (seconds) => {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Math.round(seconds)) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  if (minutes <= 0) {
    return `${remainingSeconds}s`;
  }

  return `${minutes}m ${remainingSeconds}s`;
};

const hexToRgba = (hex, alpha) => {
  if (typeof hex !== 'string') {
    return null;
  }

  const cleaned = hex.replace('#', '').trim();
  if (cleaned.length !== 3 && cleaned.length !== 6) {
    return null;
  }

  const expanded = cleaned.length === 3 ? cleaned.split('').map((char) => char + char).join('') : cleaned;
  const numeric = Number.parseInt(expanded, 16);

  if (Number.isNaN(numeric)) {
    return null;
  }

  const r = (numeric >> 16) & 255;
  const g = (numeric >> 8) & 255;
  const b = numeric & 255;
  const safeAlpha = typeof alpha === 'number' ? Math.min(Math.max(alpha, 0), 1) : 1;

  return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`;
};

const pickColor = (value, fallback) => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed) {
      return trimmed;
    }
  }
  return fallback;
};

const defaultTheme = {
  backgroundColor: '#fdfaf5',
  backgroundImage: '',
  backgroundOverlayColor: 'rgba(255, 255, 255, 0.92)',
  accentColor: '#38bdf8',
  titleColor: '#0f172a',
  textColor: '#1f2937',
  subtleTextColor: 'rgba(100, 116, 139, 0.75)',
  panelBackgroundColor: '#ffffff',
  panelBorderColor: 'rgba(148, 163, 184, 0.25)',
  panelShadowColor: 'rgba(15, 23, 42, 0.08)',
  boardBackgroundColor: '#ffffff',
  boardBorderColor: 'rgba(148, 163, 184, 0.25)',
  boardShadowColor: 'rgba(15, 23, 42, 0.08)',
  cardBackBackgroundColor: '#FDE0AB',
  cardFaceBackgroundColor: '#ffffff',
  cardBorderColor: 'rgba(148, 163, 184, 0.3)',
  cardMatchedBackgroundColor: 'rgba(125, 211, 252, 0.25)',
  cardMatchedGlowColor: 'rgba(125, 211, 252, 0.55)',
  cardShadowColor: 'rgba(15, 23, 42, 0.08)',
  buttonBackgroundColor: '#38bdf8',
  buttonHoverBackgroundColor: '#0ea5e9',
  buttonTextColor: '#0f172a',
  cardFlipDurationMs: 480
};

const createThemeFromConfig = (config) => {
  if (!config) {
    return defaultTheme;
  }

  const background = pickColor(config.primary_color, defaultTheme.backgroundColor);
  const accent = pickColor(config.secondary_color, defaultTheme.accentColor);
  const support = pickColor(config.tertiary_color, defaultTheme.cardBackBackgroundColor);
  const accentSoft = hexToRgba(accent, 0.2) || defaultTheme.cardMatchedBackgroundColor;
  const accentGlow = hexToRgba(accent, 0.55) || defaultTheme.cardMatchedGlowColor;
  const borderTint = hexToRgba(accent, 0.35) || defaultTheme.cardBorderColor;

  return {
    ...defaultTheme,
    backgroundColor: background,
    accentColor: accent,
    cardBackBackgroundColor: support,
    cardMatchedBackgroundColor: accentSoft,
    cardMatchedGlowColor: accentGlow,
    buttonBackgroundColor: accent,
    buttonHoverBackgroundColor: accent,
    boardBorderColor: borderTint,
    cardBorderColor: borderTint
  };
};

const getNumberOption = (value, fallback) => {
  const parsed = Number(value);
  if (Number.isFinite(parsed)) {
    return parsed;
  }
  return fallback;
};

const buildCardsFromConfig = (config) => {
  if (!config) {
    return [];
  }

  if (Array.isArray(config.cards) && config.cards.length > 0) {
    return config.cards
      .map((card, index) => ({
        id: card?.id ?? `config-card-${index + 1}`,
        type: card?.type ?? `Card ${index + 1}`,
        image: typeof card?.image === 'string' ? card.image : null,
        altText: card?.altText ?? card?.type ?? `Card ${index + 1}`
      }))
      .filter((card) => typeof card.image === 'string' && card.image.trim().length > 0);
  }

  const imageEntries = Object.entries(config)
    .filter(([key, value]) => key.startsWith('image_') && typeof value === 'string' && value.trim().length > 0)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB, undefined, { numeric: true }));

  return imageEntries.map(([_, value], index) => ({
    id: `config-card-${index + 1}`,
    type: `Card ${index + 1}`,
    image: value,
    altText: `Card ${index + 1}`
  }));
};

const GameStatusModal = ({ status, movesLeft, timeElapsed, onSubmit, isSubmitting, theme }) => {
  const isWin = status === 'won';
  const title = isWin ? 'Great job!' : 'Game over';
  const description = isWin
    ? 'You matched all of the cards before running out of moves.'
    : 'You ran out of moves before matching all of the cards.';

  const modalBackground = theme?.panelBackgroundColor || '#ffffff';
  const modalTextColor = theme?.textColor || '#1f2937';
  const modalBorderColor = theme?.panelBorderColor || 'rgba(148, 163, 184, 0.28)';
  const modalSubtleTextColor = theme?.subtleTextColor || 'rgba(100, 116, 139, 0.88)';
  const buttonBackground = theme?.buttonBackgroundColor || theme?.accentColor || '#2563eb';
  const buttonHoverBackground = theme?.buttonHoverBackgroundColor || buttonBackground;
  const buttonTextColor = theme?.buttonTextColor || '#ffffff';

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center px-4 py-6">
      <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="matching-game-status-title"
        aria-describedby="matching-game-status-description"
        className="relative w-full max-w-md overflow-hidden rounded-3xl border backdrop-blur-lg shadow-[0_35px_120px_rgba(8,15,32,0.65)]"
        style={{
          background: modalBackground,
          borderColor: modalBorderColor
        }}
      >
        <div className="space-y-6 px-8 py-9 text-center" style={{ color: modalTextColor }}>
          <div className="space-y-2">
            <h3 id="matching-game-status-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h3>
            <p id="matching-game-status-description" className="text-sm sm:text-base" style={{ color: modalSubtleTextColor }}>
              {description}
            </p>
          </div>
          <div
            className="grid grid-cols-3 gap-3 rounded-2xl border px-4 py-3 text-xs font-medium uppercase tracking-[0.32em]"
            style={{
              borderColor: modalBorderColor,
              background: theme?.boardBackgroundColor || 'rgba(15, 23, 42, 0.08)'
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
            className="w-full rounded-2xl px-6 py-3 text-base font-semibold transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:opacity-70 [background:var(--mg-button-bg)] [color:var(--mg-button-text)] hover:[background:var(--mg-button-hover-bg)]"
            style={{
              '--mg-button-bg': buttonBackground,
              '--mg-button-hover-bg': buttonHoverBackground,
              '--mg-button-text': buttonTextColor
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Results'}
          </button>
        </div>
      </div>
    </div>
  );
};

const MatchingGame = ({ config }) => {
  const cardsFromConfig = useMemo(() => {
    const derived = buildCardsFromConfig(config);
    if (derived.length > 0) {
      return derived;
    }
    return uniqueCardsArray;
  }, [config]);
  const [cards] = useState(() => shuffleCards(cardsFromConfig.concat(cardsFromConfig)));
  const totalPairs = cards.length / 2;
  const moveLimitValue = getNumberOption(config?.move_limit ?? config?.moveLimit, 8);
  const moveLimit = Number.isFinite(moveLimitValue) && moveLimitValue > 0 ? Math.round(moveLimitValue) : 5;
  const initialRevealRaw = getNumberOption(config?.initial_reveal_seconds ?? config?.initialRevealSeconds, 0);
  const initialRevealDuration = Math.max(0, initialRevealRaw);
  const cardUpflipSecondsValue = getNumberOption(config?.card_upflip_seconds ?? config?.cardUpflipSeconds, 1);
  const cardUpflipSeconds = cardUpflipSecondsValue >= 0 ? cardUpflipSecondsValue : 1;
  const cardUpflipDurationMs = cardUpflipSeconds * 1000;
  const evaluationDelayMs = Math.min(cardUpflipDurationMs, 500);
  const flipBackDelayMs = Math.max(cardUpflipDurationMs - evaluationDelayMs, 0);
  const cardBackImage = config?.card_back_image ?? config?.cardBackImage;

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

  const theme = useMemo(() => createThemeFromConfig(config), [config]);

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

  const overlayStyle = useMemo(() => ({
    background: theme.backgroundOverlayColor || defaultTheme.backgroundOverlayColor
  }), [theme.backgroundOverlayColor]);

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
      cardBackImage,
      isCssGradient(backgroundImageSource) ? null : backgroundImageSource,
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

    const preloadPromises = uniqueSources.map((src) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = resolve;
        img.src = src;
      });
    });

    Promise.all(preloadPromises).then(() => {
      if (!isCancelled) {
        setAssetsLoaded(true);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [assetsLoaded, cardsFromConfig, cardBackImage, theme.backgroundImage]);

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

  const checkIsFlipped = (index) => {
    return isInitialRevealActive || openCards.includes(index);
  };

  const checkIsInactive = (card) => {
    return Boolean(clearedCards[card.type]);
  };

  const handleSubmitResults = () => {
    if (isSubmitting || gameStatusRef.current === 'playing') {
      return;
    }

    setIsSubmitting(true);
    const finalElapsedTime = elapsedTime || Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
    const templateId = typeof config?.game_template_id === 'string' && config.game_template_id
      ? config.game_template_id
      : 'matching-game';
    const payload = {
      gameId: config?.game_id,
      gameTemplateId: templateId,
      distribution: config?.distribution_info,
      outcome: gameStatus === 'won' ? 'Won' : 'Lost',
      movesLeft,
      timeElapsed: finalElapsedTime
    };
    const url = `/api/games/${templateId}/results`;

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
            className="h-16 w-16 animate-spin rounded-full border-[3px] border-white/20"
            style={{ borderTopColor: theme.accentColor || defaultTheme.accentColor }}
            aria-hidden="true"
          />
          <div className="space-y-2">
            <p
              className="text-lg font-semibold tracking-wide"
              style={{ color: theme.titleColor || defaultTheme.titleColor }}
            >
              Preparing your game board
            </p>
            <p className="text-sm" style={{ color: theme.subtleTextColor || defaultTheme.subtleTextColor }}>
              Loading artwork and shuffling cards...
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
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-4 py-12 sm:px-8 lg:px-12">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]">
          <aside
            className="relative overflow-hidden rounded-3xl border px-6 py-8 backdrop-blur-md sm:px-8"
            style={{
              background: theme.panelBackgroundColor || defaultTheme.panelBackgroundColor,
              borderColor: theme.panelBorderColor || defaultTheme.panelBorderColor,
              boxShadow: `0 45px 120px -60px ${theme.panelShadowColor || defaultTheme.panelShadowColor}`
            }}
          >
            <div
              className="pointer-events-none absolute -right-28 top-24 h-64 w-64 rounded-full opacity-20 blur-3xl"
              style={{ background: theme.accentColor || defaultTheme.accentColor }}
              aria-hidden="true"
            />
            <div className="relative space-y-8">
              <div className="space-y-4 text-center lg:text-left">
                <span
                  className="inline-flex items-center justify-center rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.38em]"
                  style={{
                    background: theme.cardMatchedBackgroundColor || defaultTheme.cardMatchedBackgroundColor,
                    color: theme.accentColor || defaultTheme.accentColor
                  }}
                >
                  Memory Match
                </span>
                <h1
                  className="text-3xl font-semibold leading-tight sm:text-4xl"
                  style={{ color: theme.titleColor || defaultTheme.titleColor }}
                >
                  {config?.title || 'Matching Game'}
                </h1>
                {config?.subtitle && (
                  <p
                    className="text-sm leading-relaxed sm:text-base"
                    style={{ color: theme.subtleTextColor || defaultTheme.subtleTextColor }}
                  >
                    {config.subtitle}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div
                  className="rounded-2xl border px-4 py-4 text-left"
                  style={{
                    borderColor: theme.cardBorderColor || defaultTheme.cardBorderColor,
                    background: theme.boardBackgroundColor || defaultTheme.boardBackgroundColor
                  }}
                >
                  <p
                    className="text-xs uppercase tracking-[0.4em]"
                    style={{ color: theme.subtleTextColor || defaultTheme.subtleTextColor }}
                  >
                    Moves left
                  </p>
                  <p
                    className="mt-3 text-3xl font-semibold"
                    style={{ color: theme.titleColor || defaultTheme.titleColor }}
                  >
                    {movesLeft}
                  </p>
                </div>
                <div
                  className="rounded-2xl border px-4 py-4 text-left"
                  style={{
                    borderColor: theme.cardBorderColor || defaultTheme.cardBorderColor,
                    background: theme.boardBackgroundColor || defaultTheme.boardBackgroundColor
                  }}
                >
                  <p
                    className="text-xs uppercase tracking-[0.4em]"
                    style={{ color: theme.subtleTextColor || defaultTheme.subtleTextColor }}
                  >
                    Pairs found
                  </p>
                  <p
                    className="mt-3 text-3xl font-semibold"
                    style={{ color: theme.titleColor || defaultTheme.titleColor }}
                  >
                    {pairsFound}/{totalPairs}
                  </p>
                </div>
                <div
                  className="col-span-2 rounded-2xl border px-4 py-4 text-left"
                  style={{
                    borderColor: theme.cardBorderColor || defaultTheme.cardBorderColor,
                    background: theme.boardBackgroundColor || defaultTheme.boardBackgroundColor
                  }}
                >
                  <p
                    className="text-xs uppercase tracking-[0.4em]"
                    style={{ color: theme.subtleTextColor || defaultTheme.subtleTextColor }}
                  >
                    Time played
                  </p>
                  <p
                    className="mt-3 text-2xl font-semibold"
                    style={{ color: theme.titleColor || defaultTheme.titleColor }}
                  >
                    {formattedLiveDuration}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div
                  className="flex items-center justify-between text-[0.7rem] uppercase tracking-[0.35em]"
                  style={{ color: theme.subtleTextColor || defaultTheme.subtleTextColor }}
                >
                  <span>Round progress</span>
                  <span>{progressPercentage}% complete</span>
                </div>
                <div
                  className="h-2 w-full overflow-hidden rounded-full"
                  style={{ background: 'rgba(148, 163, 184, 0.24)' }}
                >
                  <div
                    className="h-full rounded-full transition-[width] duration-500 ease-out"
                    style={{ width: `${progressPercentage}%`, background: theme.accentColor || defaultTheme.accentColor }}
                  />
                </div>
              </div>
              {isInitialRevealActive && (
                <div
                  className="flex items-center justify-between rounded-2xl border px-4 py-4 text-xs font-semibold uppercase tracking-[0.32em]"
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
            </div>
          </aside>
          <section
            className="relative overflow-hidden rounded-3xl border backdrop-blur-md"
            style={{
              background: theme.boardBackgroundColor || defaultTheme.boardBackgroundColor,
              borderColor: theme.boardBorderColor || defaultTheme.boardBorderColor,
              boxShadow: `0 60px 140px -65px ${theme.boardShadowColor || defaultTheme.boardShadowColor}`
            }}
          >
            <div
              className="pointer-events-none absolute -left-24 top-10 h-56 w-56 rounded-full opacity-20 blur-3xl"
              style={{ background: theme.accentColor || defaultTheme.accentColor }}
              aria-hidden="true"
            />
            <div className="relative flex flex-wrap items-center justify-between gap-4 px-6 py-6 sm:px-8">
              <div>
                <p
                  className="text-xs uppercase tracking-[0.35em]"
                  style={{ color: theme.subtleTextColor || defaultTheme.subtleTextColor }}
                >
                  Find all {totalPairs} pairs
                </p>
                <h2
                  className="mt-2 text-2xl font-semibold sm:text-3xl"
                  style={{ color: theme.titleColor || defaultTheme.titleColor }}
                >
                  {movesLeft} moves remaining
                </h2>
              </div>
              <div
                className="rounded-full border px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.35em]"
                style={{
                  borderColor: theme.cardBorderColor || defaultTheme.cardBorderColor,
                  background: theme.cardBackBackgroundColor || defaultTheme.cardBackBackgroundColor,
                  color: theme.accentColor || defaultTheme.accentColor
                }}
              >
                {isInitialRevealActive ? 'Memorise' : isBoardLocked ? 'Checking' : 'Keep Matching'}
              </div>
            </div>
            {isBoardLocked && (
              <div
                className="pointer-events-none absolute inset-x-6 top-24 z-10 flex items-center justify-center rounded-2xl border px-4 py-3 text-xs font-medium uppercase tracking-[0.32em] sm:inset-x-8"
                style={{
                  borderColor: theme.cardBorderColor || defaultTheme.cardBorderColor,
                  background: 'rgba(15, 23, 42, 0.55)',
                  color: theme.subtleTextColor || defaultTheme.subtleTextColor
                }}
              >
                Evaluating match...
              </div>
            )}
            <div className="relative px-4 pb-8 sm:px-8 sm:pb-10">
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 lg:gap-5 xl:gap-6">
                {cards.map((card, index) => (
                  <Card
                    key={index}
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
                ))}
              </div>
            </div>
          </section>
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

// Fisher Yates Shuffle
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

const mockSubmitResults = (url, payload) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(payload);
    }, 1000);
  });
};

export default MatchingGame;
