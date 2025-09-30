export const unwrapMongoValue = (value) => {
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

export const toCleanString = (value) => {
  const unwrapped = unwrapMongoValue(value);
  if (typeof unwrapped === 'string') {
    return unwrapped.trim();
  }
  if (typeof unwrapped === 'number' && Number.isFinite(unwrapped)) {
    return `${unwrapped}`;
  }
  return '';
};

export const coerceNumber = (value) => {
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

export const toPositiveInteger = (value, fallback) => {
  const parsed = coerceNumber(value);
  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.floor(parsed);
  }
  return fallback;
};

export const defaultPrizes = [
  {
    id: 'scratch-classic-token',
    name: 'Aurora Token',
    description: 'A shimmering token ready to be exchanged for campfire delights.',
    rarity: 'common',
    weight: 40
  },
  {
    id: 'scratch-classic-thread',
    name: 'Gleamthread',
    description: 'Woven light that reinforces any gear it touches.',
    rarity: 'uncommon',
    weight: 28
  },
  {
    id: 'scratch-classic-charm',
    name: 'Charm of Dawn',
    description: 'A radiant charm that greets every sunrise with a burst of optimism.',
    rarity: 'rare',
    weight: 18
  },
  {
    id: 'scratch-classic-crest',
    name: 'Eclipse Crest',
    description: 'A crest forged from shadow and light, empowering the bearer at dusk.',
    rarity: 'epic',
    weight: 10
  },
  {
    id: 'scratch-classic-heart',
    name: 'Aurora Heart',
    description: "A prismatic core that pulses with the aurora's rhythm and courage.",
    rarity: 'legendary',
    weight: 4
  }
];

export const defaultScratchCardClassicConfig = {
  game_id: 'scr-classic-001',
  game_template_id: 'scratch-card-classic',
  title: 'Aurora Scratch Card',
  description: 'Peel back the foil to uncover tonight\'s glowing surprise.',
  primaryColor: '#f5e3c3',
  secondaryColor: '#f4b942',
  tertiaryColor: '#0a0a0a',
  backgroundImage: '/images/pattern-bg.png',
  logoImage: '/logo512.png',
  cardBackImage: '/images/matching-game-assets/card-back.png',
  submissionEndpoint: '/api/games/scratch-card/scr-classic-001/results',
  prizes: defaultPrizes
};

export const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

const rarityLabels = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary'
};

export const derivePrizes = (data) => {
  const source = Array.isArray(data?.prizes) ? data.prizes : [];
  const effective = source.length ? source : defaultPrizes;

  return effective.map((prize, index) => {
    const rarity = toCleanString(prize?.rarity)?.toLowerCase() || rarityOrder[index] || 'common';
    const weight = coerceNumber(prize?.weight);
    return {
      id: prize?.id || `scratch-prize-${index + 1}`,
      name: toCleanString(prize?.name) || `Prize ${index + 1}`,
      description:
        toCleanString(prize?.description) || 'Configure prize details in the merchant dashboard.',
      rarity,
      rarityLabel: toCleanString(prize?.rarityLabel) || rarityLabels[rarity] || rarityLabels.common,
      weight: Number.isFinite(weight) && weight > 0 ? weight : defaultPrizes[index]?.weight || 1
    };
  });
};

export const createThemeFromConfig = (config) => {
  const base = config || {};
  return {
    primaryColor: toCleanString(base.primaryColor) || defaultScratchCardClassicConfig.primaryColor,
    secondaryColor: toCleanString(base.secondaryColor) || defaultScratchCardClassicConfig.secondaryColor,
    tertiaryColor: toCleanString(base.tertiaryColor) || defaultScratchCardClassicConfig.tertiaryColor,
    backgroundImage: toCleanString(base.backgroundImage) || defaultScratchCardClassicConfig.backgroundImage,
    logoImage: toCleanString(base.logoImage) || defaultScratchCardClassicConfig.logoImage,
    cardBackImage: toCleanString(base.cardBackImage) || defaultScratchCardClassicConfig.cardBackImage
  };
};

export const normalizeScratchCardConfig = (config) => {
  const theme = createThemeFromConfig(config);
  return {
    ...defaultScratchCardClassicConfig,
    ...config,
    prizes: derivePrizes(config),
    theme
  };
};

export default defaultScratchCardClassicConfig;
