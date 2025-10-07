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
const DEFAULT_REVEAL_THRESHOLD = 0.6;

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
    id: 'bonus-topping',
    name: 'Bonus Topping',
    rarity: 'common',
    rarityLabel: 'Common',
    description: 'Add any extra topping to your order on the house.',
    weight: 45,
    foilColor: '#CBD5F5',
    glowColor: 'rgba(96, 165, 250, 0.35)',
    flairText: 'A gentle shimmer reveals the topping upgrade.',
  },
  {
    id: 'size-upgrade',
    name: 'Size Upgrade',
    rarity: 'uncommon',
    rarityLabel: 'Uncommon',
    description: 'Enjoy the next size up for free.',
    weight: 30,
    foilColor: '#8DE6C9',
    glowColor: 'rgba(52, 211, 153, 0.45)',
    flairText: 'The foil peels away to show a bigger cup.',
  },
  {
    id: 'featured-drink',
    name: 'Featured Drink Voucher',
    rarity: 'rare',
    rarityLabel: 'Rare',
    description: 'Redeem a voucher for our featured drink of the week.',
    weight: 18,
    foilColor: '#95C6FF',
    glowColor: 'rgba(59, 130, 246, 0.55)',
    flairText: 'A bright flash highlights the featured reward.',
  },
  {
    id: 'collector-cup',
    name: 'Collector Cup',
    rarity: 'epic',
    rarityLabel: 'Epic',
    description: 'Take home a limited collector cup.',
    weight: 6,
    foilColor: '#D4B3FF',
    glowColor: 'rgba(167, 139, 250, 0.55)',
    flairText: 'Soft light ripples as the cup comes into view.',
  },
  {
    id: 'bogo-voucher',
    name: 'BOGO Voucher',
    rarity: 'legendary',
    rarityLabel: 'Legendary',
    description: 'Buy one drink and get the second free.',
    weight: 1,
    foilColor: '#FDE48A',
    glowColor: 'rgba(251, 191, 36, 0.6)',
    flairText: 'Golden confetti bursts around the winning card.',
  },
];

const defaultScratchConfig = {
  gameId: 'scratch-card-sample',
  merchantId: 'merchant-sample-001',
  game_template_id: 'scratch-card-v1',
  game_type: 'scratch-card',
  title: 'Scratch & Win',
  name: 'Scratch & Win',
  headline: 'Reveal your reward',
  subtitle: 'Scratch the foil to see what you get.',
  tagline: 'Daily Treats',
  description:
    'Tap the button to arm a new card, then scratch away the foil to uncover your reward.',
  instructions:
    'Clear at least 60% of the foil. Once enough has been scratched away the prize will appear automatically.',
  ctaLabel: 'Arm a new card',
  scratchActionLabel: 'Scratch to reveal',
  playAgainLabel: 'Play again',
  preparingLabel: 'Preparing card…',
  resultModalTitle: 'You uncovered',
  prizeLedgerTitle: 'Available rewards',
  prizeLedgerSubtitle: 'Every reward in this scratch card, with its drop rate.',
  prizeLedgerBadgeLabel: 'Drop rates',
  prizeListLoadingText: 'Loading prize list…',
  prizeListErrorText: 'We could not load the prize ledger. Please try again.',
  attemptErrorText: 'Something interrupted the scratch card attempt. Please try again.',
  defaultFlairText: 'The foil peels away and the prize gleams brilliantly! ✨',
  scratchThresholdPercent: 60,
  distributionType: 'luckdraw',
  submissionEndpoint: '/api/luckdraw',
  prizesEndpoint: '/api/luckdraw-prizes/scratch-card-sample',
  resultsEndpoint: '/api/luckdraw-results/scratch-card-sample',
  prizes: defaultPrizes,
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

const PrizeCard = ({ prize, dropRate }) => (
  <article className="prize-card">
    <span className="prize-card__rarity">{prize.rarityLabel}</span>
    <h3 className="prize-card__name">{prize.name}</h3>
    <p className="prize-card__description">{prize.description}</p>
    <div className="prize-card__footer">
      <span>Drop rate</span>
      <span>{dropRate}</span>
    </div>
  </article>
);

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

    const prizes = normalisePrizes(config?.prizes, defaultScratchConfig.prizes, providedDefaultFlair);

    const title = resolveConfigValue(config, ['title', 'headline', 'name'], defaultScratchConfig.title);
    const name = resolveConfigValue(config, ['name', 'title'], defaultScratchConfig.name);
    const headline = resolveConfigValue(config, ['headline', 'title'], defaultScratchConfig.headline);
    const subtitle = resolveConfigValue(config, ['subtitle'], defaultScratchConfig.subtitle);
    const tagline = resolveConfigValue(config, ['tagline', 'subtitle', 'headline'], defaultScratchConfig.tagline);
    const description = resolveConfigValue(
      config,
      ['description', 'instructions', 'body'],
      defaultScratchConfig.description,
    );
    const instructions = resolveConfigValue(
      config,
      ['instructions', 'description'],
      defaultScratchConfig.instructions,
    );
    const ctaLabel = resolveConfigValue(config, ['ctaLabel', 'cta_label'], defaultScratchConfig.ctaLabel);
    const scratchActionLabel = resolveConfigValue(
      config,
      ['scratchActionLabel', 'scratch_action_label'],
      defaultScratchConfig.scratchActionLabel,
    );
    const playAgainLabel = resolveConfigValue(
      config,
      ['playAgainLabel', 'play_again_label'],
      defaultScratchConfig.playAgainLabel,
    );
    const preparingLabel = resolveConfigValue(
      config,
      ['preparingLabel', 'preparing_label'],
      defaultScratchConfig.preparingLabel,
    );
    const resultModalTitle = resolveConfigValue(
      config,
      ['resultModalTitle', 'result_modal_title'],
      defaultScratchConfig.resultModalTitle,
    );
    const prizeLedgerTitle = resolveConfigValue(
      config,
      ['prizeLedgerTitle', 'prize_ledger_title'],
      defaultScratchConfig.prizeLedgerTitle,
    );
    const prizeLedgerSubtitle = resolveConfigValue(
      config,
      ['prizeLedgerSubtitle', 'prize_ledger_subtitle'],
      defaultScratchConfig.prizeLedgerSubtitle,
    );
    const prizeLedgerBadgeLabel = resolveConfigValue(
      config,
      ['prizeLedgerBadgeLabel', 'prize_ledger_badge_label'],
      defaultScratchConfig.prizeLedgerBadgeLabel,
    );
    const prizeListLoadingText = resolveConfigValue(
      config,
      ['prizeListLoadingText', 'prize_list_loading_text'],
      defaultScratchConfig.prizeListLoadingText,
    );
    const prizeListErrorText = resolveConfigValue(
      config,
      ['prizeListErrorText', 'prize_list_error_text'],
      defaultScratchConfig.prizeListErrorText,
    );
    const attemptErrorText = resolveConfigValue(
      config,
      ['attemptErrorText', 'attempt_error_text'],
      defaultScratchConfig.attemptErrorText,
    );
    const submissionEndpoint = resolveConfigValue(
      config,
      ['submissionEndpoint', 'submission_endpoint'],
      defaultScratchConfig.submissionEndpoint,
    );
    const prizesEndpoint = resolveConfigValue(
      config,
      ['prizesEndpoint', 'prizes_endpoint'],
      defaultScratchConfig.prizesEndpoint,
    );
    const resultsEndpoint = resolveConfigValue(
      config,
      ['resultsEndpoint', 'results_endpoint'],
      defaultScratchConfig.resultsEndpoint,
    );
    const distributionType = resolveConfigValue(
      config,
      ['distributionType', 'distribution_type'],
      defaultScratchConfig.distributionType,
    );
    const backgroundImage = resolveConfigValue(
      config,
      ['backgroundImage', 'background_image'],
      defaultScratchConfig.backgroundImage,
    );
    const cardBackgroundImage = resolveConfigValue(
      config,
      ['cardBackgroundImage', 'card_background_image'],
      defaultScratchConfig.cardBackgroundImage,
    );
    const scratchOverlayImage = resolveConfigValue(
      config,
      ['scratchOverlayImage', 'scratch_overlay_image'],
      defaultScratchConfig.scratchOverlayImage,
    );
    const revealedImage = resolveConfigValue(
      config,
      ['revealedImage', 'revealed_image'],
      defaultScratchConfig.revealedImage,
    );
    const overlayPattern = resolveConfigValue(
      config,
      ['overlayPattern', 'overlay_pattern'],
      defaultScratchConfig.overlayPattern,
    );
    const sampleThumbnail = resolveConfigValue(
      config,
      ['sampleThumbnail', 'sample_thumbnail'],
      defaultScratchConfig.sampleThumbnail,
    );
    const scratchThresholdPercent = toPositiveNumber(
      resolveConfigValue(
        config,
        ['scratchThresholdPercent', 'scratch_threshold_percent'],
        defaultScratchConfig.scratchThresholdPercent,
      ),
      defaultScratchConfig.scratchThresholdPercent,
    );
    const gameId = resolveConfigValue(config, ['game_id', 'gameId'], defaultScratchConfig.gameId);
    const merchantId = resolveConfigValue(
      config,
      ['merchant_id', 'merchantId'],
      defaultScratchConfig.merchantId,
    );

    return {
      ...defaultScratchConfig,
      ...config,
      prizes,
      title,
      name,
      headline,
      subtitle,
      tagline,
      description,
      instructions,
      ctaLabel,
      scratchActionLabel,
      playAgainLabel,
      preparingLabel,
      resultModalTitle,
      prizeLedgerTitle,
      prizeLedgerSubtitle,
      prizeLedgerBadgeLabel,
      prizeListLoadingText,
      prizeListErrorText,
      attemptErrorText,
      defaultFlairText: providedDefaultFlair,
      default_flair_text: providedDefaultFlair,
      submissionEndpoint,
      submission_endpoint: submissionEndpoint,
      prizesEndpoint,
      prizes_endpoint: prizesEndpoint,
      resultsEndpoint,
      results_endpoint: resultsEndpoint,
      distributionType,
      distribution_type: distributionType,
      backgroundImage,
      background_image: backgroundImage,
      cardBackgroundImage,
      card_background_image: cardBackgroundImage,
      scratchOverlayImage,
      scratch_overlay_image: scratchOverlayImage,
      revealedImage,
      revealed_image: revealedImage,
      overlayPattern,
      overlay_pattern: overlayPattern,
      sampleThumbnail,
      sample_thumbnail: sampleThumbnail,
      scratchThresholdPercent,
      scratch_threshold_percent: scratchThresholdPercent,
      gameId,
      game_id: gameId,
      merchantId,
      merchant_id: merchantId,
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

  const revealThreshold = useMemo(() => {
    const percent = toPositiveNumber(
      normalisedConfig.scratchThresholdPercent,
      defaultScratchConfig.scratchThresholdPercent,
    );
    if (!percent) {
      return DEFAULT_REVEAL_THRESHOLD;
    }
    const fraction = percent / 100;
    if (!Number.isFinite(fraction) || fraction <= 0) {
      return DEFAULT_REVEAL_THRESHOLD;
    }
    return Math.min(0.95, Math.max(0.2, fraction));
  }, [normalisedConfig.scratchThresholdPercent]);

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
    gradient.addColorStop(0, '#d4dae7');
    gradient.addColorStop(0.5, '#f1f5f9');
    gradient.addColorStop(1, '#c7d1e5');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#ffffff';
    const stripeStep = 28 * dpr;
    for (let offset = -canvas.height; offset < canvas.width * 2; offset += stripeStep) {
      ctx.save();
      ctx.translate(0, offset);
      ctx.rotate((16 * Math.PI) / 180);
      ctx.fillRect(-canvas.width, 0, canvas.width * 3, 6 * dpr);
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
    }, 500);
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
          if (ratio >= revealThreshold) {
            handleScratchComplete();
          }
        }
      }
    },
    [cardState, handleScratchComplete, revealThreshold],
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
  const overlayClassName = `scratch-card__overlay ${
    cardState === 'ready' ? 'scratch-card__overlay--interactive' : ''
  } ${coverCleared ? 'scratch-card__overlay--cleared' : ''}`;
  const canvasClassName = `scratch-card__overlay-canvas ${
    cardState !== 'ready' ? 'scratch-card__overlay-canvas--inactive' : ''
  } ${coverCleared ? 'scratch-card__overlay-canvas--cleared' : ''}`;

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
      ? 'Tap the button to get a new card'
      : cardState === 'preparing'
      ? 'Shuffling prizes'
      : cardState === 'ready'
      ? 'Ready to scratch'
      : 'Prize revealed';

  const overlayMessage =
    cardState === 'ready'
      ? normalisedConfig.scratchActionLabel
      : cardState === 'revealed'
      ? 'Foil cleared'
      : 'Arm a card to start';

  const overlayDetail =
    cardState === 'ready'
      ? `Clear about ${Math.round(revealThreshold * 100)}% of the foil.`
      : cardState === 'revealed'
      ? 'Enjoy your reward.'
      : null;

  const innerStyle = useMemo(() => {
    if (!normalisedConfig.cardBackgroundImage) {
      return undefined;
    }

    return {
      backgroundImage: `linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(241, 245, 249, 0.85)), url(${normalisedConfig.cardBackgroundImage})`,
      backgroundSize: 'cover, 100% 100%',
      backgroundPosition: 'center, center',
    };
  }, [normalisedConfig.cardBackgroundImage]);

  const overlayStyle = useMemo(() => {
    const layers = [];
    const sizes = [];
    const positions = [];
    const repeats = [];

    if (normalisedConfig.scratchOverlayImage) {
      layers.push(`url(${normalisedConfig.scratchOverlayImage})`);
      sizes.push('cover');
      positions.push('center');
      repeats.push('no-repeat');
    }

    if (normalisedConfig.overlayPattern) {
      layers.push(`url(${normalisedConfig.overlayPattern})`);
      sizes.push('cover');
      positions.push('center');
      repeats.push('repeat');
    }

    if (!layers.length) {
      return undefined;
    }

    return {
      backgroundImage: layers.join(', '),
      backgroundSize: sizes.join(', '),
      backgroundPosition: positions.join(', '),
      backgroundRepeat: repeats.join(', '),
    };
  }, [normalisedConfig.overlayPattern, normalisedConfig.scratchOverlayImage]);

  const rewardHighlightStyle = useMemo(() => {
    if (!hasRevealed || !result?.prize?.foilColor) {
      return undefined;
    }

    return {
      background: `linear-gradient(135deg, ${result.prize.foilColor}, rgba(255, 255, 255, 0.85))`,
      borderRadius: '12px',
      padding: '16px',
    };
  }, [hasRevealed, result]);

  return (
    <div className="scratch-module-root">
      <div className="scratch-module-surface">
        <section className="scratch-intro-card">
          <div className="scratch-intro-text">
            {normalisedConfig.tagline ? (
              <span className="scratch-intro-tagline">{normalisedConfig.tagline}</span>
            ) : null}
            <h1>{normalisedConfig.title ?? normalisedConfig.name}</h1>
            {normalisedConfig.subtitle ? <p className="scratch-intro-subtitle">{normalisedConfig.subtitle}</p> : null}
            {normalisedConfig.description ? (
              <p className="scratch-intro-body">{normalisedConfig.description}</p>
            ) : null}
          </div>
          <div className="scratch-intro-actions">
            <button
              type="button"
              className="scratch-button scratch-button--secondary"
              onClick={onBack}
            >
              Back to store
            </button>
            <button
              type="button"
              className="scratch-button scratch-button--primary"
              onClick={handleAttempt}
              disabled={buttonDisabled}
            >
              {buttonLabel}
            </button>
          </div>
        </section>

        <section className="scratch-layout">
          <div className="scratch-card-column">
            <div className="scratch-card-frame">
              <div className={cardClassName}>
                <div className="scratch-card__inner" ref={surfaceRef} style={innerStyle}>
                  <div className="scratch-card__reward" style={rewardHighlightStyle}>
                    <span className="scratch-card__reward-rarity">
                      {hasRevealed && result ? result.prize.rarityLabel : 'Mystery reward'}
                    </span>
                    <h3 className="scratch-card__reward-name">
                      {hasRevealed && result
                        ? result.prize.name
                        : cardState === 'ready'
                        ? 'Scratch to reveal'
                        : 'Waiting to arm'}
                    </h3>
                    <p className="scratch-card__reward-helper">
                      {hasRevealed && result
                        ? result.flairText ?? normalisedConfig.defaultFlairText
                        : normalisedConfig.instructions}
                    </p>
                  </div>
                  <div className={overlayClassName} style={overlayStyle}>
                    <canvas
                      ref={canvasRef}
                      className={canvasClassName}
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerCancel={handlePointerLeave}
                      onPointerLeave={handlePointerLeave}
                    />
                    <div
                      className={`scratch-card__overlay-message ${
                        cardState !== 'revealed' ? 'is-visible' : ''
                      }`}
                    >
                      <span>{overlayMessage}</span>
                      {overlayDetail ? (
                        <span className="scratch-card__overlay-detail">{overlayDetail}</span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="scratch-status">
              <div className="scratch-status__badge">{statusText}</div>
              {showProgress ? (
                <div className="scratch-progress">
                  <div className="scratch-progress__track">
                    <div className="scratch-progress__fill" style={{ width: `${progressPercent}%` }} />
                  </div>
                  <p className="scratch-progress__label">{progressPercent}% revealed</p>
                </div>
              ) : null}
              {cardState === 'revealed' && result ? (
                <p className="scratch-status__text">
                  You uncovered the <span>{result.prize.name}</span>!
                </p>
              ) : null}
              {attemptError ? <p className="scratch-error">{attemptError}</p> : null}
            </div>
          </div>

          <div className="scratch-prize-panel">
            <div className="scratch-prize-header">
              <h2>{normalisedConfig.prizeLedgerTitle}</h2>
              {normalisedConfig.prizeLedgerSubtitle ? (
                <p>{normalisedConfig.prizeLedgerSubtitle}</p>
              ) : null}
            </div>
            {normalisedConfig.prizeLedgerBadgeLabel ? (
              <span className="scratch-prize-badge">{normalisedConfig.prizeLedgerBadgeLabel}</span>
            ) : null}
            {loadingPrizes ? (
              <p>{normalisedConfig.prizeListLoadingText}</p>
            ) : prizeError ? (
              <p className="scratch-error">{prizeError}</p>
            ) : (
              <div className="scratch-prize-grid">
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
        </section>

        <div className="scratch-footer-actions">
          <button
            type="button"
            className="scratch-button scratch-button--secondary"
            onClick={onBack}
          >
            Back to store
          </button>
          {cardState === 'revealed' ? (
            <button
              type="button"
              className="scratch-button scratch-button--primary"
              onClick={handleAttempt}
            >
              {normalisedConfig.playAgainLabel}
            </button>
          ) : null}
        </div>
      </div>

      {showResultModal && result ? (
        <div className="scratch-modal" role="dialog" aria-modal="true">
          <div className="scratch-modal__dialog">
            <span className="scratch-card__reward-rarity">{normalisedConfig.resultModalTitle}</span>
            <h3>{result.prize.name}</h3>
            <p>{result.prize.description}</p>
            <p>{result.flairText ?? normalisedConfig.defaultFlairText}</p>
            <div className="scratch-modal__actions">
              <button
                type="button"
                className="scratch-button scratch-button--primary"
                onClick={() => {
                  closeModal();
                  handleAttempt();
                }}
              >
                {normalisedConfig.playAgainLabel}
              </button>
              <button
                type="button"
                className="scratch-button scratch-button--secondary"
                onClick={() => {
                  closeModal();
                  onBack?.();
                }}
              >
                Back to store
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ScratchCardGame;
