const MOCK_SCRATCH_PRIZES = [
  {
    id: 'starlit-token',
    name: 'Starlit Token',
    rarity: 'common',
    description: 'A token etched with constellations, good for a single campfire wish.',
    weight: 45,
  },
  {
    id: 'glimmer-thread',
    name: 'Glimmer Thread',
    rarity: 'uncommon',
    description: 'Woven from comet tails, it reinforces any gear you stitch it into.',
    weight: 30,
  },
  {
    id: 'dawn-charm',
    name: 'Charm of Dawn',
    rarity: 'rare',
    description: 'A radiant charm that greets every sunrise with a burst of optimism.',
    weight: 18,
  },
  {
    id: 'eclipse-crest',
    name: 'Eclipse Crest',
    rarity: 'epic',
    description: 'A crest forged from shadow and light, empowering the bearer at dusk.',
    weight: 6,
  },
  {
    id: 'aurora-heart',
    name: 'Aurora Heart',
    rarity: 'legendary',
    description: 'A prismatic core that pulses with the aurora\'s rhythm and courage.',
    weight: 1,
  },
];

const rarityFoilColors = {
  common: '#CBD5F5',
  uncommon: '#8DE6C9',
  rare: '#95C6FF',
  epic: '#D4B3FF',
  legendary: '#FDE48A',
};

const rarityGlowColors = {
  common: 'rgba(96, 165, 250, 0.4)',
  uncommon: 'rgba(52, 211, 153, 0.45)',
  rare: 'rgba(59, 130, 246, 0.55)',
  epic: 'rgba(167, 139, 250, 0.55)',
  legendary: 'rgba(251, 191, 36, 0.6)',
};

const rarityLabels = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

const mapPrizeForResponse = (prize) => ({
  ...prize,
  rarityLabel: rarityLabels[prize.rarity] ?? prize.rarity,
  foilColor: rarityFoilColors[prize.rarity] ?? '#E0E7FF',
  glowColor: rarityGlowColors[prize.rarity] ?? 'rgba(96, 165, 250, 0.35)',
});

export const fetchScratchPrizes = () =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve(MOCK_SCRATCH_PRIZES.map(mapPrizeForResponse));
    }, 650);
  });

const pickWeightedPrize = () => {
  const totalWeight = MOCK_SCRATCH_PRIZES.reduce((sum, prize) => sum + prize.weight, 0);
  let threshold = Math.random() * totalWeight;

  for (const prize of MOCK_SCRATCH_PRIZES) {
    threshold -= prize.weight;
    if (threshold <= 0) {
      return prize;
    }
  }

  return MOCK_SCRATCH_PRIZES[MOCK_SCRATCH_PRIZES.length - 1];
};

export const attemptScratchCard = () =>
  new Promise((resolve) => {
    const selectedPrize = pickWeightedPrize();

    setTimeout(() => {
      resolve({
        attemptId: `scratch-${Date.now()}`,
        prize: mapPrizeForResponse(selectedPrize),
        flairText: 'The foil peels away and the prize gleams brilliantly! ✨',
        awardedAt: new Date().toISOString(),
      });
    }, 1150);
  });
