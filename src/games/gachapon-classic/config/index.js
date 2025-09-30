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
    id: 'gachapon-classic-orb',
    name: 'Luminous Orb',
    description: 'A softly glowing orb that keeps your camp lit through the night.',
    rarity: 'common',
    weight: 40,
    capsuleColor: '#E5E7EB'
  },
  {
    id: 'gachapon-classic-charm',
    name: 'Ember Charm',
    description: 'A flickering charm that warms nearby allies by a few cozy degrees.',
    rarity: 'uncommon',
    weight: 28,
    capsuleColor: '#86EFAC'
  },
  {
    id: 'gachapon-classic-cape',
    name: 'Aurora Cape',
    description: 'Shimmers with the northern lights and lets you glide short distances.',
    rarity: 'rare',
    weight: 18,
    capsuleColor: '#93C5FD'
  },
  {
    id: 'gachapon-classic-compass',
    name: 'Celestial Compass',
    description: 'Always points toward the nearest secret, no matter where you roam.',
    rarity: 'epic',
    weight: 10,
    capsuleColor: '#C4B5FD'
  },
  {
    id: 'gachapon-classic-heartfire',
    name: 'Dragon Heartfire',
    description: "A fragment of dragon flame that grants a surge of courage to its bearer.",
    rarity: 'legendary',
    weight: 4,
    capsuleColor: '#FDE68A'
  }
];

export const defaultGachaponClassicConfig = {
  game_id: 'gacha-classic-001',
  game_template_id: 'gachapon-classic',
  title: 'Celestial Capsule Machine',
  description: 'Pull the lever to see what treasure is sealed within the capsule.',
  primaryColor: '#ff4d6d',
  secondaryColor: '#2bcdfb',
  tertiaryColor: '#25064c',
  backgroundImage: '/images/pattern-bg.png',
  machineImage: '/images/gachapon-game-thumb.svg',
  capsuleImage: '/images/gachapon-game-thumb.svg',
  submissionEndpoint: '/api/games/gachapon/gacha-classic-001/results',
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
      id: prize?.id || `gachapon-prize-${index + 1}`,
      name: toCleanString(prize?.name) || `Prize ${index + 1}`,
      description:
        toCleanString(prize?.description) || 'Configure prize details in the merchant dashboard.',
      rarity,
      rarityLabel: toCleanString(prize?.rarityLabel) || rarityLabels[rarity] || rarityLabels.common,
      weight: Number.isFinite(weight) && weight > 0 ? weight : defaultPrizes[index]?.weight || 1,
      capsuleColor: toCleanString(prize?.capsuleColor) || defaultPrizes[index]?.capsuleColor || '#E5E7EB'
    };
  });
};

export const createThemeFromConfig = (config) => {
  const base = config || {};
  return {
    primaryColor: toCleanString(base.primaryColor) || defaultGachaponClassicConfig.primaryColor,
    secondaryColor: toCleanString(base.secondaryColor) || defaultGachaponClassicConfig.secondaryColor,
    tertiaryColor: toCleanString(base.tertiaryColor) || defaultGachaponClassicConfig.tertiaryColor,
    backgroundImage: toCleanString(base.backgroundImage) || defaultGachaponClassicConfig.backgroundImage,
    machineImage: toCleanString(base.machineImage) || defaultGachaponClassicConfig.machineImage,
    capsuleImage: toCleanString(base.capsuleImage) || defaultGachaponClassicConfig.capsuleImage
  };
};

export const normalizeGachaponConfig = (config) => {
  const theme = createThemeFromConfig(config);
  return {
    ...defaultGachaponClassicConfig,
    ...config,
    prizes: derivePrizes(config),
    theme
  };
};

export default defaultGachaponClassicConfig;
