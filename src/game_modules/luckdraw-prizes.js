const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1616401784845-180882ba9ba6?auto=format&fit=crop&w=900&q=80';

const DEFAULT_PRIZES = [
  {
    prize_key: 'default-1',
    label: 'Mystery Reward',
    description: 'Connect your luck draw API to showcase live prizes.',
    image_url: DEFAULT_IMAGE,
  },
  {
    prize_key: 'default-2',
    label: 'Bonus Entry',
    description: 'Keep playing for a chance to win featured rewards.',
    image_url:
      'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80',
  },
];

const toArray = (value) => (Array.isArray(value) ? value : []);

const ensureGameId = (config = {}) => config.game_id || 'demo-luckdraw-game';

const ensurePrizeItems = (prizes, fallback) => {
  const normalisedPrizes = toArray(prizes);
  if (normalisedPrizes.length) {
    return normalisedPrizes;
  }
  const normalisedFallback = toArray(fallback);
  if (normalisedFallback.length) {
    return normalisedFallback;
  }
  return DEFAULT_PRIZES;
};

const formatProbability = (probability) => {
  if (probability === null || probability === undefined) {
    return null;
  }

  if (typeof probability === 'number') {
    if (Number.isNaN(probability)) {
      return null;
    }
    if (probability > 0 && probability <= 1) {
      return `${(probability * 100).toFixed(1)}% chance`;
    }
    if (probability > 1 && probability <= 100) {
      return `${probability.toFixed(1)}% chance`;
    }
    return `${probability}`;
  }

  if (typeof probability === 'string') {
    return probability.trim() || null;
  }

  return null;
};

const buildDisplayPrize = (prize, index) => {
  const title =
    prize?.title ||
    prize?.name ||
    prize?.label ||
    `Prize ${typeof index === 'number' ? index + 1 : 1}`;

  return {
    id: prize?.id || prize?.prize_key || `prize-${index + 1}`,
    title,
    description:
      prize?.description ||
      'Update the luck draw configuration to customise this prize.',
    image:
      prize?.image ||
      prize?.image_url ||
      prize?.thumbnail ||
      DEFAULT_IMAGE,
    voucherBatchId: prize?.voucherBatchId || prize?.voucher_batch_id || null,
    probability: formatProbability(prize?.probability ?? prize?.odds ?? prize?.chance),
  };
};

export const buildDisplayPrizes = (prizes, fallback) =>
  ensurePrizeItems(prizes, fallback).map((prize, index) => buildDisplayPrize(prize, index));

const resolveEndpoint = (config = {}, endpoint) => {
  const gameId = encodeURIComponent(ensureGameId(config));

  if (!endpoint) {
    return `/luckdraw-prizes/${gameId}`;
  }

  if (endpoint.includes(':game_id')) {
    return endpoint.replace(':game_id', gameId);
  }

  if (endpoint.endsWith('/')) {
    return `${endpoint}${gameId}`;
  }

  return `${endpoint}/${gameId}`;
};

export const mockLuckdrawPrizes = (config = {}, fallbackPrizes) =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        message: 'Luck draw prizes retrieved successfully.',
        game_id: ensureGameId(config),
        includeProbability: false,
        prizes: buildDisplayPrizes(fallbackPrizes),
      });
    }, 300);
  });

export const retrieveLuckdrawPrizes = async ({
  config = {},
  endpoint,
  fallbackPrizes,
} = {}) => {
  const url = resolveEndpoint(config, endpoint);
  const shouldMock = process.env.NODE_ENV !== 'production';

  if (shouldMock) {
    return mockLuckdrawPrizes(config, fallbackPrizes);
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Luck draw prizes request failed with status ${response.status}`);
    }

    const payload = await response.json();

    return {
      message: payload?.message || 'Luck draw prizes retrieved successfully.',
      game_id: payload?.game_id || ensureGameId(config),
      includeProbability: Boolean(payload?.includeProbability),
      prizes: buildDisplayPrizes(payload?.prizes, fallbackPrizes),
    };
  } catch (error) {
    console.warn('[Luckdraw] Falling back to mock prizes due to error:', error);
    return mockLuckdrawPrizes(config, fallbackPrizes);
  }
};
