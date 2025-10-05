import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import './scratch-card.css';

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

const defaultRarityLabels = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

const defaultRarityFoilColors = {
  common: '#CBD5F5',
  uncommon: '#8DE6C9',
  rare: '#95C6FF',
  epic: '#D4B3FF',
  legendary: '#FDE48A',
};

const defaultRarityGlowColors = {
  common: 'rgba(96, 165, 250, 0.35)',
  uncommon: 'rgba(52, 211, 153, 0.45)',
  rare: 'rgba(59, 130, 246, 0.55)',
  epic: 'rgba(167, 139, 250, 0.55)',
  legendary: 'rgba(251, 191, 36, 0.6)',
};

const defaultPrizes = [
  {
    id: 'starlit-token',
    name: 'Starlit Token',
    rarity: 'common',
    rarityLabel: 'Common',
    description: 'A token etched with constellations, good for a single campfire wish.',
    weight: 45,
    foilColor: '#CBD5F5',
    glowColor: 'rgba(96, 165, 250, 0.35)',
    flairText: 'Starlight flickers across the token as it reveals itself.',
  },
  {
    id: 'glimmer-thread',
    name: 'Glimmer Thread',
    rarity: 'uncommon',
    rarityLabel: 'Uncommon',
    description: 'Woven from comet tails, it reinforces any gear you stitch it into.',
    weight: 30,
    foilColor: '#8DE6C9',
    glowColor: 'rgba(52, 211, 153, 0.45)',
    flairText: 'Threads of light twirl in the air as the prize emerges.',
  },
  {
    id: 'dawn-charm',
    name: 'Charm of Dawn',
    rarity: 'rare',
    rarityLabel: 'Rare',
    description: 'A radiant charm that greets every sunrise with a burst of optimism.',
    weight: 18,
    foilColor: '#95C6FF',
    glowColor: 'rgba(59, 130, 246, 0.55)',
    flairText: 'The charm gleams with the first light of morning.',
  },
  {
    id: 'eclipse-crest',
    name: 'Eclipse Crest',
    rarity: 'epic',
    rarityLabel: 'Epic',
    description: 'A crest forged from shadow and light, empowering the bearer at dusk.',
    weight: 6,
    foilColor: '#D4B3FF',
    glowColor: 'rgba(167, 139, 250, 0.55)',
    flairText: 'A halo of twilight blooms around the crest.',
  },
  {
    id: 'aurora-heart',
    name: 'Aurora Heart',
    rarity: 'legendary',
    rarityLabel: 'Legendary',
    description: "A prismatic core that pulses with the aurora's rhythm and courage.",
    weight: 1,
    foilColor: '#FDE48A',
    glowColor: 'rgba(251, 191, 36, 0.6)',
    flairText: 'The aurora surges as the heart ignites in your hands.',
  },
];

const defaultScratchConfig = {
  title: 'Aurora Scratch Card',
  tagline: 'Glitterforge Games',
  description:
    'Claim a radiant foil, then do the scratching yourself to reveal the treasure hidden beneath. Every swipe clears the nebula shimmer until your prize erupts in full color.',
  ctaLabel: 'Get a new card',
  scratchActionLabel: 'Scratch the foil',
  playAgainLabel: 'Get another card',
  preparingLabel: 'Preparing card…',
  resultModalTitle: 'Scratch Card Result',
  prizeLedgerTitle: 'Prize Ledger',
  prizeLedgerSubtitle: 'Review every reward hiding beneath the aurora foil.',
  prizeLedgerBadgeLabel: 'Drop Rates',
  prizeListLoadingText: 'Loading scratch card lineup…',
  prizeListErrorText: 'We could not load the prize ledger. Please refresh to try again.',
  attemptErrorText: 'Something interrupted the scratch card attempt. Please try again.',
  defaultFlairText: 'The foil peels away and the prize gleams brilliantly! ✨',
  submissionEndpoint: '/api/games/scratch-card/results',
  backgroundImage:
    'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=900&q=80',
};

const FETCH_DELAY_MS = 650;
const ATTEMPT_DELAY_MS = 1150;

const toPositiveNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) {
    return numeric;
  }
  return fallback;
};

const resolveConfigValue = (config, keys, fallback) => {
  const keyArray = Array.isArray(keys) ? keys : [keys];
  for (const key of keyArray) {
    if (key in (config || {})) {
      const value = config[key];
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed) {
          return trimmed;
        }
      } else if (value !== undefined && value !== null) {
        return value;
      }
    }
  }
  return fallback;
};

const normalisePrizes = (rawPrizes, fallbackPrizes, fallbackFlairText) => {
  const basePrizes = Array.isArray(rawPrizes)
    ? rawPrizes.filter((prize) => prize && typeof prize === 'object')
    : [];
  const templatePrizes = Array.isArray(fallbackPrizes)
    ? fallbackPrizes.filter((prize) => prize && typeof prize === 'object')
    : [];

  let effectivePrizes = basePrizes.length ? basePrizes : templatePrizes;

  if (!effectivePrizes.length) {
    effectivePrizes = [
      {
        id: 'scratch-placeholder-1',
        name: 'Mystery Reward',
        description: 'Configure scratch card prizes to replace this placeholder reward.',
        rarity: 'common',
        rarityLabel: 'Mystery',
        weight: 1,
        foilColor: defaultRarityFoilColors.common,
        glowColor: defaultRarityGlowColors.common,
        flairText: fallbackFlairText,
      },
    ];
  }

  return effectivePrizes.map((prize, index) => {
    const rarityValue =
      typeof prize.rarity === 'string' && prize.rarity.trim()
        ? prize.rarity.trim().toLowerCase()
        : 'common';
    const rarityLabel =
      typeof prize.rarityLabel === 'string' && prize.rarityLabel.trim()
        ? prize.rarityLabel
        : defaultRarityLabels[rarityValue] ?? rarityValue.charAt(0).toUpperCase() + rarityValue.slice(1);
    const weight = toPositiveNumber(prize.weight, 1);
    const foilColor =
      typeof prize.foilColor === 'string' && prize.foilColor.trim()
        ? prize.foilColor
        : defaultRarityFoilColors[rarityValue] ?? defaultRarityFoilColors.common;
    const glowColor =
      typeof prize.glowColor === 'string' && prize.glowColor.trim()
        ? prize.glowColor
        : defaultRarityGlowColors[rarityValue] ?? defaultRarityGlowColors.common;
    const flairText =
      typeof prize.flairText === 'string' && prize.flairText.trim() ? prize.flairText : fallbackFlairText;

    return {
      ...prize,
      id: prize.id ?? `scratch-prize-${index}`,
      name: prize.name ?? prize.title ?? `Prize ${index + 1}`,
      description: prize.description ?? 'Configure prize details in the template options.',
      rarity: rarityValue,
      rarityLabel,
      weight,
      foilColor,
      glowColor,
      flairText,
    };
  });
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

const clonePrize = (prize) => ({
  ...prize,
  weight: toPositiveNumber(prize?.weight, 0),
});

const getPrizesFromConfig = (config) => {
  if (!config) {
    return [];
  }

  const rawPrizes = Array.isArray(config.prizes) ? config.prizes : [];
  return rawPrizes.map((prize) => clonePrize(prize));
};

const pickWeightedPrize = (weightedPrizes) => {
  if (!Array.isArray(weightedPrizes) || weightedPrizes.length === 0) {
    return null;
  }

  const totalWeight = weightedPrizes.reduce((sum, entry) => sum + entry.weight, 0);

  if (totalWeight <= 0) {
    return weightedPrizes[0];
  }

  let threshold = Math.random() * totalWeight;

  for (const entry of weightedPrizes) {
    threshold -= entry.weight;
    if (threshold <= 0) {
      return entry;
    }
  }

  return weightedPrizes[weightedPrizes.length - 1];
};

const resolveFlairText = (prize, config) => {
  if (typeof prize?.flairText === 'string' && prize.flairText.trim()) {
    return prize.flairText;
  }

  const fallback = resolveConfigValue(
    config,
    ['defaultFlairText', 'default_flair_text'],
    defaultScratchConfig.defaultFlairText,
  );

  return fallback;
};

const fetchScratchPrizes = (config) =>
  new Promise((resolve, reject) => {
    const prizes = getPrizesFromConfig(config);

    setTimeout(() => {
      if (!prizes.length) {
        reject(new Error('No scratch card prizes configured'));
        return;
      }

      resolve(prizes.map((prize) => ({ ...prize })));
    }, FETCH_DELAY_MS);
  });

const attemptScratchCard = (config) =>
  new Promise((resolve, reject) => {
    const prizes = getPrizesFromConfig(config);

    if (!prizes.length) {
      reject(new Error('No scratch card prizes configured'));
      return;
    }

    const weightedPrizes = prizes.map((prize) => ({ prize, weight: prize.weight }));
    const totalWeight = weightedPrizes.reduce((sum, entry) => sum + entry.weight, 0);

    if (totalWeight <= 0) {
      reject(new Error('Scratch card prizes require a positive weight'));
      return;
    }

    const selectedEntry = pickWeightedPrize(weightedPrizes) ?? weightedPrizes[0];
    const selectedPrize = selectedEntry?.prize ?? prizes[0];
    const flairText = resolveFlairText(selectedPrize, config);

    setTimeout(() => {
      resolve({
        attemptId: `scratch-${Date.now()}`,
        prize: { ...selectedPrize },
        flairText,
        awardedAt: new Date().toISOString(),
      });
    }, ATTEMPT_DELAY_MS);
  });

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

const ScratchCardGame = ({ config = {}, onBack }) => {
  const baseDefaultFlair = resolveConfigValue(
    config,
    ['defaultFlairText', 'default_flair_text'],
    defaultScratchConfig.defaultFlairText,
  );

  const normalisedConfig = useMemo(() => {
    const providedDefaultFlair = resolveConfigValue(
      config,
      ['defaultFlairText', 'default_flair_text'],
      baseDefaultFlair,
    );

    const prizes = normalisePrizes(config?.prizes, defaultPrizes, providedDefaultFlair);

    return {
      ...defaultScratchConfig,
      ...config,
      prizes,
      title: resolveConfigValue(config, ['title', 'name'], defaultScratchConfig.title),
      tagline: resolveConfigValue(config, ['tagline', 'subtitle'], defaultScratchConfig.tagline),
      description: resolveConfigValue(
        config,
        ['description', 'prize', 'body'],
        defaultScratchConfig.description,
      ),
      ctaLabel: resolveConfigValue(
        config,
        ['ctaLabel', 'cta_label'],
        defaultScratchConfig.ctaLabel,
      ),
      scratchActionLabel: resolveConfigValue(
        config,
        ['scratchActionLabel', 'scratch_action_label'],
        defaultScratchConfig.scratchActionLabel,
      ),
      playAgainLabel: resolveConfigValue(
        config,
        ['playAgainLabel', 'play_again_label'],
        defaultScratchConfig.playAgainLabel,
      ),
      preparingLabel: resolveConfigValue(
        config,
        ['preparingLabel', 'preparing_label'],
        defaultScratchConfig.preparingLabel,
      ),
      resultModalTitle: resolveConfigValue(
        config,
        ['resultModalTitle', 'result_modal_title'],
        defaultScratchConfig.resultModalTitle,
      ),
      prizeLedgerTitle: resolveConfigValue(
        config,
        ['prizeLedgerTitle', 'prize_ledger_title'],
        defaultScratchConfig.prizeLedgerTitle,
      ),
      prizeLedgerSubtitle: resolveConfigValue(
        config,
        ['prizeLedgerSubtitle', 'prize_ledger_subtitle'],
        defaultScratchConfig.prizeLedgerSubtitle,
      ),
      prizeLedgerBadgeLabel: resolveConfigValue(
        config,
        ['prizeLedgerBadgeLabel', 'prize_ledger_badge_label'],
        defaultScratchConfig.prizeLedgerBadgeLabel,
      ),
      prizeListLoadingText: resolveConfigValue(
        config,
        ['prizeListLoadingText', 'prize_list_loading_text'],
        defaultScratchConfig.prizeListLoadingText,
      ),
      prizeListErrorText: resolveConfigValue(
        config,
        ['prizeListErrorText', 'prize_list_error_text'],
        defaultScratchConfig.prizeListErrorText,
      ),
      attemptErrorText: resolveConfigValue(
        config,
        ['attemptErrorText', 'attempt_error_text'],
        defaultScratchConfig.attemptErrorText,
      ),
      defaultFlairText: providedDefaultFlair,
      submissionEndpoint: resolveConfigValue(
        config,
        ['submissionEndpoint', 'submission_endpoint', 'results_endpoint'],
        defaultScratchConfig.submissionEndpoint,
      ),
      backgroundImage: resolveConfigValue(
        config,
        ['backgroundImage', 'background_image'],
        defaultScratchConfig.backgroundImage,
      ),
    };
  }, [baseDefaultFlair, config]);

  const [prizes, setPrizes] = useState(normalisedConfig.prizes ?? []);
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
    setPrizes(normalisedConfig.prizes ?? []);
    setCardState('idle');
    setScratchProgress(0);
    setCoverCleared(false);
    setResult(null);
    setShowResultModal(false);
    setAttemptError(null);
  }, [normalisedConfig]);

  useEffect(() => {
    let cancelled = false;
    setLoadingPrizes(true);
    setPrizeError(null);

    fetchScratchPrizes(normalisedConfig)
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
        setPrizeError(normalisedConfig.prizeListErrorText);
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
  }, [normalisedConfig]);

  const totalWeight = useMemo(
    () => prizes.reduce((sum, prize) => sum + (prize.weight ?? 0), 0),
    [prizes],
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

    attemptScratchCard(normalisedConfig)
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
        setAttemptError(normalisedConfig.attemptErrorText);
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
    [cardState, handleScratchComplete],
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
    [cardState, scratchAt],
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
    [cardState, scratchAt],
  );

  const handlePointerUp = useCallback(
    (event) => {
      if (event?.target?.releasePointerCapture) {
        event.target.releasePointerCapture(event.pointerId);
      }
      endScratch();
    },
    [endScratch],
  );

  const handlePointerLeave = useCallback(() => {
    endScratch();
  }, [endScratch]);

  useEffect(() => {
    return () => {
      pointerActiveRef.current = false;
    };
  }, []);

  const hasRevealed = cardState === 'revealed';
  const showProgress = cardState === 'ready' || cardState === 'revealed';
  const progressPercent = Math.min(100, Math.round(scratchProgress * 100));

  const cardClassName = `scratch-card ${
    cardState === 'ready' && isScratching ? 'scratch-card--scratching' : ''
  } ${cardState === 'revealed' ? 'scratch-card--revealed' : ''}`;
  const foilClassName = `scratch-card__foil ${
    cardState === 'ready' ? 'scratch-card__foil--interactive' : ''
  } ${coverCleared ? 'scratch-card__foil--cleared' : ''}`;
  const canvasClassName = `scratch-card__foil-canvas ${
    cardState !== 'ready' ? 'scratch-card__foil-canvas--inactive' : ''
  } ${coverCleared ? 'scratch-card__foil-canvas--cleared' : ''}`;

  const buttonLabel =
    cardState === 'idle'
      ? normalisedConfig.ctaLabel
      : cardState === 'preparing'
      ? normalisedConfig.preparingLabel
      : cardState === 'ready'
      ? normalisedConfig.scratchActionLabel
      : normalisedConfig.playAgainLabel;

  const buttonDisabled =
    cardState === 'preparing' || cardState === 'ready' || loadingPrizes || isAttempting;

  const statusText =
    cardState === 'idle'
      ? 'Awaiting attempt'
      : cardState === 'preparing'
      ? 'Forging foil card'
      : cardState === 'ready'
      ? 'Foil armed & ready'
      : 'Reward unveiled';

  const foilMessage =
    cardState === 'ready'
      ? normalisedConfig.scratchActionLabel
      : cardState === 'revealed'
      ? 'Foil fully lifted'
      : 'Claim a card to begin';

  const foilMessageDetail =
    cardState === 'ready'
      ? 'Drag to reveal the hidden reward.'
      : cardState === 'revealed'
      ? 'Your prize awaits in full splendor.'
      : null;

  const showButtonProgress = cardState === 'preparing';

  const rewardStyle = result
    ? {
        background: `linear-gradient(135deg, ${result.prize.foilColor}, rgba(15, 23, 42, 0.92))`,
      }
    : {};

  const glowStyle = result
    ? {
        boxShadow: `0 0 60px ${result.prize.glowColor}`,
        background: `radial-gradient(circle, ${result.prize.glowColor} 0%, rgba(15, 23, 42, 0) 70%)`,
      }
    : {};

  return (
    <div
      className="scratch-module-root"
      style={{
        backgroundImage: `linear-gradient(120deg, rgba(15, 23, 42, 0.82), rgba(30, 41, 59, 0.88)), url(${normalisedConfig.backgroundImage})`,
      }}
    >
      <div className="scratch-module-surface">
        <div className="rounded-3xl border border-slate-800/60 bg-slate-950/60 p-7 shadow-[0_30px_70px_rgba(15,23,42,0.45)] backdrop-blur">
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-indigo-200/70">{normalisedConfig.tagline}</p>
              <h1 className="mt-3 text-4xl font-semibold text-white">{normalisedConfig.title}</h1>
              <p className="mt-4 text-base text-slate-300">{normalisedConfig.description}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={handleAttempt}
                disabled={buttonDisabled}
                className="flex items-center justify-center rounded-full bg-gradient-to-r from-fuchsia-500 via-indigo-500 to-sky-500 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {buttonLabel}
              </button>
              {showButtonProgress ? (
                <span className="text-xs uppercase tracking-[0.3em] text-indigo-200/70">Forging your foil…</span>
              ) : cardState === 'ready' ? (
                <span className="text-xs uppercase tracking-[0.3em] text-indigo-200/70">Foil armed &amp; ready</span>
              ) : null}
            </div>
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
                      {hasRevealed && result
                        ? result.flairText ?? normalisedConfig.defaultFlairText
                        : 'Drag across the foil to lift the shimmer.'}
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
              {showProgress ? (
                <div className="scratch-card__progress">
                  <div className="scratch-card__progress-track">
                    <div className="scratch-card__progress-fill" style={{ width: `${progressPercent}%` }} />
                  </div>
                  <span className="scratch-card__progress-label">{progressPercent}% revealed</span>
                </div>
              ) : null}
              {cardState === 'revealed' && result ? (
                <p className="scratch-card__status-detail">
                  You uncovered the <span>{result.prize.name}</span>!
                </p>
              ) : null}
              {attemptError ? <div className="scratch-card-error">{attemptError}</div> : null}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800/60 bg-slate-950/60 p-7 shadow-[0_30px_70px_rgba(15,23,42,0.45)] backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">{normalisedConfig.prizeLedgerTitle}</h2>
              {normalisedConfig.prizeLedgerSubtitle ? (
                <p className="mt-1 text-sm text-slate-400">{normalisedConfig.prizeLedgerSubtitle}</p>
              ) : null}
            </div>
            {normalisedConfig.prizeLedgerBadgeLabel ? (
              <span className="rounded-full border border-indigo-400/30 px-3 py-1 text-xs uppercase tracking-[0.3em] text-indigo-200/70">
                {normalisedConfig.prizeLedgerBadgeLabel}
              </span>
            ) : null}
          </div>
          {loadingPrizes ? (
            <p className="mt-4 text-sm text-slate-400">{normalisedConfig.prizeListLoadingText}</p>
          ) : prizeError ? (
            <p className="mt-4 text-sm text-rose-300">{prizeError}</p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {prizes.map((prize) => (
                <PrizeCard key={prize.id} prize={prize} dropRate={formatDropRate(prize.weight ?? 0, totalWeight)} />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="rounded-full border border-slate-600 px-5 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-400 hover:text-white"
          >
            Back to Store
          </button>
          {cardState === 'revealed' ? (
            <button
              type="button"
              className="rounded-full bg-indigo-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
              onClick={handleAttempt}
            >
              {normalisedConfig.playAgainLabel}
            </button>
          ) : null}
        </div>
      </div>

      {showResultModal && result ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-10 backdrop-blur">
          <div className="w-full max-w-lg rounded-3xl border border-indigo-400/40 bg-slate-900/90 p-8 shadow-2xl shadow-indigo-900/50">
            <p className="text-sm uppercase tracking-[0.25em] text-indigo-300">{normalisedConfig.resultModalTitle}</p>
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
            <p className="mt-4 text-sm text-indigo-200">{result.flairText ?? normalisedConfig.defaultFlairText}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="rounded-full border border-slate-600 px-5 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-400 hover:text-white"
                onClick={() => {
                  closeModal();
                  handleAttempt();
                }}
              >
                {normalisedConfig.playAgainLabel}
              </button>
              <button
                type="button"
                className="rounded-full bg-indigo-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
                onClick={() => {
                  closeModal();
                  onBack?.();
                }}
              >
                Back to Store
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ScratchCardGame;
