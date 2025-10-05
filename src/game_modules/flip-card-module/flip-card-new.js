import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import FlipCard from './flip-card';
import uniqueCardsArray from './unique-cards';
import FlipCardResultsScreen from './flip-card-results-screen';
import { createThemeFromConfig, defaultTheme, isCssGradient } from './theme';
import { deriveCardsFromData } from './config';
import "./flip-card.css";

// services/flipCardService.js
import axios from "axios";

const BACKEND = process.env.REACT_APP_BACKEND_URL;

/* -------------------- internal utils (not exported) -------------------- */
const toCamelFromSnake = (key) =>
  key.replace(/_([a-z])/g, (_, char) => char.toUpperCase());

const camelizeObject = (object) => {
  if (!object || typeof object !== "object") return {};
  return Object.entries(object).reduce((acc, [key, value]) => {
    if (!key) return acc;
    acc[toCamelFromSnake(key)] = value;
    return acc;
  }, {});
};

const normalizePrizes = (prizes) => {
  if (!prizes) return [];
  const toList = Array.isArray(prizes)
    ? prizes
    : typeof prizes === "object"
    ? Object.values(prizes).flat()
    : [];
  return toList
    .map((prize, index) => {
      if (!prize || typeof prize !== "object") return null;
      const camelPrize = camelizeObject(prize);
      const voucherBatchRaw = prize.voucher_batch || prize.voucherBatch;
      const voucherBatch = camelizeObject(voucherBatchRaw || {});
      const derivedName =
        camelPrize.name ||
        voucherBatch.title ||
        voucherBatch.label ||
        (voucherBatch.merchantName
          ? `${voucherBatch.merchantName} Reward`
          : undefined) ||
        `Prize ${index + 1}`;
      const derivedDescription =
        camelPrize.description || voucherBatch.description || "";
      const derivedValue =
        camelPrize.value ||
        voucherBatch.value ||
        voucherBatch.rewardValue ||
        voucherBatch.discountLabel ||
        "";
      return {
        ...camelPrize,
        id: camelPrize.id || voucherBatch.id || `prize-${index}`,
        name: derivedName,
        description: derivedDescription,
        value: derivedValue,
        voucherBatch: Object.keys(voucherBatch).length > 0 ? voucherBatch : null,
      };
    })
    .filter(Boolean);
};

const normalizeSubmissionResponse = (response, payload) => {
  const payloadResults = camelizeObject(payload?.results || {});
  const responseObject =
    response && typeof response === "object" ? response : {};
  const responseResults = camelizeObject(
    responseObject.results || responseObject
  );

  const mergedResults = { ...payloadResults, ...responseResults };

  const scoreBreakdown = camelizeObject(
    responseObject.score_breakdown ||
      responseObject.scoreBreakdown ||
      mergedResults.scoreBreakdown ||
      {}
  );

  const submittedAt =
    responseObject.submitted_at ||
    responseObject.submittedAt ||
    mergedResults.submittedAt ||
    new Date().toISOString();

  const normalizedOutcome = (() => {
    const outcome = mergedResults.outcome || responseObject.outcome;
    if (typeof outcome === "string" && outcome) {
      return outcome.charAt(0).toUpperCase() + outcome.slice(1);
    }
    return outcome;
  })();

  return {
    ...mergedResults,
    ...camelizeObject(responseObject),
    scoreBreakdown,
    prizes: normalizePrizes(responseObject.prizes || mergedResults.prizes),
    submittedAt,
    outcome: normalizedOutcome,
    gameId: payload?.game_id || null,
    gameTemplateId: payload?.game_template_id || null,
  };
};

/* -------------------- API funcs -------------------- */
const submitResults = async ({ url, payload, idToken }) => {
  if (!url) {
    console.error("[FlipCard][API] No submission URL provided");
    return {
      ...payload,
      outcome: "Error",
      prizes: [],
      submittedAt: new Date().toISOString(),
    };
  }

  try {
    if (!idToken) throw new Error("No idToken provided to flipCardService");
    const fullUrl = `${BACKEND}${url}`;

    const headers = {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const res = await axios.post(fullUrl, payload, { headers });
    return normalizeSubmissionResponse(res.data, payload);
  } catch (error) {
    console.error("[FlipCard][API] Submission request failed", {
      url,
      error,
      response: error.response?.data,
    });
    return {
      ...payload,
      outcome: "Error",
      prizes: [],
      submittedAt: new Date().toISOString(),
    };
  }
};

// --- END OF SERVICE ---

const formatDuration = (seconds) => {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Math.round(seconds)) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  if (minutes <= 0) {
    return `${remainingSeconds}s`;
  }

  return `${minutes}m ${remainingSeconds}s`;
};

const unwrapMongoValue = (value) => {
  if (value && typeof value === 'object') {
    if (value.$numberInt !== undefined) {
      return unwrapMongoValue(value.$numberInt);
    }
    if (value.$numberDouble !== undefined) {
      return unwrapMongoValue(value.$numberDouble);
    }
    if (value.$numberLong !== undefined) {
      return unwrapMongoValue(value.$numberLong);
    }
    if (value.$numberDecimal !== undefined) {
      return unwrapMongoValue(value.$numberDecimal);
    }
    if (value.$oid !== undefined) {
      return unwrapMongoValue(value.$oid);
    }
    if (value.$date !== undefined) {
      return unwrapMongoValue(value.$date);
    }
    if (value.value !== undefined) {
      return unwrapMongoValue(value.value);
    }
  }

  return value;
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

const toCleanString = (value) => {
  const unwrapped = unwrapMongoValue(value);
  if (typeof unwrapped === 'string') {
    return unwrapped.trim();
  }
  if (typeof unwrapped === 'number' && Number.isFinite(unwrapped)) {
    return `${unwrapped}`;
  }
  return '';
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
    <div className="modal-overlay">
      <div className="modal-backdrop" aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="flip-card-new-status-title"
        aria-describedby="flip-card-new-status-description"
        className="modal-container"
        style={{
          background: modalBackground,
          borderColor: modalBorderColor,
        }}
      >
        <div className="modal-content" style={{ color: modalTextColor }}>
          <div>
            <h3 id="flip-card-new-status-title" className="modal-title">
              {title}
            </h3>
            <p
              id="flip-card-new-status-description"
              className="modal-description"
              style={{ color: modalSubtleTextColor }}
            >
              {description}
            </p>
          </div>

          <div
            className="modal-stats"
            style={{
              borderColor: modalBorderColor,
              background:
                theme?.boardBackgroundColor || "rgba(239, 246, 255, 0.82)",
            }}
          >
            <div>
              <span style={{ color: modalSubtleTextColor }}>Outcome</span>
              <p className="modal-stat-value" style={{ color: modalTextColor }}>
                {isWin ? "Won" : "Lost"}
              </p>
            </div>
            <div>
              <span style={{ color: modalSubtleTextColor }}>Moves left</span>
              <p className="modal-stat-value" style={{ color: modalTextColor }}>
                {movesLeft}
              </p>
            </div>
            <div>
              <span style={{ color: modalSubtleTextColor }}>Time</span>
              <p className="modal-stat-value" style={{ color: modalTextColor }}>
                {formatDuration(timeElapsed)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="modal-button"
            style={{
              background: buttonBackground,
              color: buttonTextColor,
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.background = buttonHoverBackground)
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.background = buttonBackground)
            }
          >
            {isSubmitting ? "Submitting…" : "Submit results"}
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

const FlipCardNewGame = ({ config, onBack }) => {
  const { idToken } = useSelector((state) => state.auth);
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

  const headerTitle = toCleanString(config?.title) || toCleanString(config?.name) || 'Flip Card New';

  const gameId = toCleanString(config?.game_id) || 'flip-new-001';
  const gameTemplateId = toCleanString(config?.game_template_id) || 'flip-card-new';
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
      console.log('[FlipCard][Submit] Ignoring submit attempt', {
        isSubmitting,
        currentStatus: gameStatusRef.current,
      });
      return;
    }

    console.log('[FlipCard][Submit] Preparing submission payload', {
      timestamp: new Date().toISOString(),
      finalGameStatus: gameStatusRef.current,
      pairsFound,
      totalPairs,
      moveLimit,
      moves,
      elapsedTime,
    });

    setIsSubmitting(true);
    const finalElapsedTime = elapsedTime || Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
    const startedAtIso = new Date(gameStartTimeRef.current).toISOString();
    const completedAtIso = new Date(gameStartTimeRef.current + finalElapsedTime * 1000).toISOString();
    const movesTaken = moves;
    const accuracy = movesTaken > 0 ? pairsFound / movesTaken : 0;
    const completionRate = totalPairs > 0 ? pairsFound / totalPairs : 0;
    const averageMoveDurationSeconds = movesTaken > 0 ? finalElapsedTime / movesTaken : 0;
    const pairsRemaining = Math.max(totalPairs - pairsFound, 0);
    const finalMovesLeft = Math.max(moveLimit - movesTaken, 0);

    const url = submissionEndpoint || `/api/${gameTemplateId}`;
    const resultsPayload = {
      outcome: gameStatus === 'won' ? 'won' : 'lost',
      move_limit: moveLimit,
      moves_taken: movesTaken,
      moves_left: finalMovesLeft,
      total_pairs: totalPairs,
      pairs_found: pairsFound,
      pairs_remaining: pairsRemaining,
      completion_rate: completionRate,
      accuracy,
      time_elapsed_seconds: finalElapsedTime,
      average_move_duration_seconds: averageMoveDurationSeconds,
      started_at: startedAtIso,
      completed_at: completedAtIso,
      initial_reveal_seconds: initialRevealDuration,
      card_upflip_seconds: cardUpflipSeconds,
    };

    const payload = {
      game_id: gameId,
      game_template_id: gameTemplateId,
      results: resultsPayload,
    };

    if (idToken) {
      payload.id_token = idToken;
    }

    console.log('[FlipCard][Submit] Dispatching request', {
      url,
      payload,
    });

    
    submitResults({ url: "/api/score_threshold", payload, idToken })
      .then((response) => {
        console.log("FlipCard response:", response);
        setResult(response);
      })
      .catch((err) => console.error("FlipCard error:", err))
      .finally(() => setIsSubmitting(false));
    };

  if (!assetsLoaded) {
    return (
      <div
        className="loading-screen"
        role="status"
        aria-live="polite"
      >
        <div className="loading-bg" style={backgroundStyle} aria-hidden="true" />
        <div className="loading-overlay" style={overlayStyle} aria-hidden="true" />

        <div className="loading-content">
          <div
            className="loading-spinner"
            style={{
              borderTopColor: theme.accentColor || defaultTheme.accentColor,
            }}
            aria-hidden="true"
          />
          <div>
            <p
              className="loading-title"
              style={{
                color: theme.titleColor || defaultTheme.titleColor,
              }}
            >
              Shuffling your cards
            </p>
            <p
              className="loading-subtitle"
              style={{
                color: theme.subtleTextColor || defaultTheme.subtleTextColor,
              }}
            >
              Loading artwork and preparing the deck…
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <FlipCardResultsScreen
        result={result}
        theme={theme}
        onPlayAgain={() => window.location.reload()}
        onBack={onBack}
      />
    );
  }

  return (
    <div className="game-root">
      <div className="game-bg" style={backgroundStyle} aria-hidden="true" />
      <div className="game-overlay" style={overlayStyle} aria-hidden="true" />

      <div className="game-wrapper">
        <header
          className="game-header"
          style={{
            background: theme.panelBackgroundColor || defaultTheme.panelBackgroundColor,
            borderColor: theme.panelBorderColor || defaultTheme.panelBorderColor,
          }}
        >
          <div className="text-center">
            <span
              className="game-badge"
              style={{
                background: theme.cardMatchedBackgroundColor || defaultTheme.cardMatchedBackgroundColor,
                color: theme.accentColor || defaultTheme.accentColor,
              }}
            >
              Flip & Match
            </span>
            <h1
              className="game-title"
              style={{ color: theme.titleColor || defaultTheme.titleColor }}
            >
              {headerTitle}
            </h1>
            {headerSubtitle && (
              <p
                className="game-subtitle"
                style={{ color: theme.subtleTextColor || defaultTheme.subtleTextColor }}
              >
                {headerSubtitle}
              </p>
            )}
          </div>

          <div
            className="game-stats"
            style={{
              borderColor: theme.cardBorderColor || defaultTheme.cardBorderColor,
              background: theme.boardBackgroundColor || defaultTheme.boardBackgroundColor,
              color: theme.subtleTextColor || defaultTheme.subtleTextColor,
            }}
          >
            <div>
              <span>Moves</span>
              <p
                className="game-stat-value"
                style={{ color: theme.titleColor || defaultTheme.titleColor }}
              >
                {movesLeft}
              </p>
            </div>
            <div>
              <span>Pairs</span>
              <p
                className="game-stat-value"
                style={{ color: theme.titleColor || defaultTheme.titleColor }}
              >
                {pairsFound}/{totalPairs}
              </p>
            </div>
            <div>
              <span>Time</span>
              <p
                className="game-stat-value"
                style={{ color: theme.titleColor || defaultTheme.titleColor }}
              >
                {formattedLiveDuration}
              </p>
            </div>
          </div>

          <div className="mt-5">
            <div
              className="progress-label"
              style={{ color: theme.subtleTextColor || defaultTheme.subtleTextColor }}
            >
              <span>Round progress</span>
              <span>{progressPercentage}%</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{
                  width: `${progressPercentage}%`,
                  background: theme.accentColor || defaultTheme.accentColor,
                }}
              />
            </div>
          </div>

          {isInitialRevealActive && (
            <div
              className="memorise-banner"
              style={{
                borderColor: theme.cardBorderColor || defaultTheme.cardBorderColor,
                background: theme.cardMatchedBackgroundColor || defaultTheme.cardMatchedBackgroundColor,
                color: theme.titleColor || defaultTheme.titleColor,
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
          className="game-board"
          style={{
            background: theme.boardBackgroundColor || defaultTheme.boardBackgroundColor,
            borderColor: theme.boardBorderColor || defaultTheme.boardBorderColor,
          }}
        >
          <div
            className="board-header"
            style={{ color: theme.subtleTextColor || defaultTheme.subtleTextColor }}
          >
            <span>Find all {totalPairs} pairs</span>
            <span>
              {isInitialRevealActive ? "Memorise" : isBoardLocked ? "Checking" : "Flip away"}
            </span>
          </div>

          {/* {isBoardLocked && (
            <div
              className="board-checking"
              style={{
                borderColor: theme.cardBorderColor || defaultTheme.cardBorderColor,
                color: theme.subtleTextColor || defaultTheme.subtleTextColor,
              }}
            >
              Checking match…
            </div>
          )} */}

          <div className="card-grid-frame">
            <div className="card-grid">
              {cards.map((card, index) => (
                <FlipCard
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

export default FlipCardNewGame;
