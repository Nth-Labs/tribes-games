const MOCK_PRIZES = [
  {
    id: 'luminous-orb',
    name: 'Luminous Orb',
    rarity: 'common',
    description: 'A softly glowing orb that keeps your camp lit through the night.',
    weight: 45,
  },
  {
    id: 'ember-charm',
    name: 'Ember Charm',
    rarity: 'uncommon',
    description: 'A flickering charm that warms nearby allies by a few cozy degrees.',
    weight: 30,
  },
  {
    id: 'aurora-cape',
    name: 'Aurora Cape',
    rarity: 'rare',
    description: 'Shimmers with the northern lights and lets you glide short distances.',
    weight: 18,
  },
  {
    id: 'celestial-compass',
    name: 'Celestial Compass',
    rarity: 'epic',
    description: 'Always points toward the nearest secret, no matter where you roam.',
    weight: 6,
  },
  {
    id: 'dragon-heartfire',
    name: 'Dragon Heartfire',
    rarity: 'legendary',
    description: 'A fragment of dragon flame that grants a surge of courage to its bearer.',
    weight: 1,
  },
];

const rarityColors = {
  common: '#E5E7EB',
  uncommon: '#86EFAC',
  rare: '#93C5FD',
  epic: '#C4B5FD',
  legendary: '#FDE68A',
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
  capsuleColor: rarityColors[prize.rarity] ?? '#F3F4F6',
});

export const fetchAvailablePrizes = () =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve(MOCK_PRIZES.map(mapPrizeForResponse));
    }, 700);
  });

const pickWeightedPrize = () => {
  const totalWeight = MOCK_PRIZES.reduce((sum, prize) => sum + prize.weight, 0);
  let threshold = Math.random() * totalWeight;

  for (const prize of MOCK_PRIZES) {
    threshold -= prize.weight;
    if (threshold <= 0) {
      return prize;
    }
  }

  return MOCK_PRIZES[MOCK_PRIZES.length - 1];
};

export const attemptGachapon = () =>
  new Promise((resolve) => {
    const selectedPrize = pickWeightedPrize();

    setTimeout(() => {
      resolve({
        attemptId: `attempt-${Date.now()}`,
        prize: mapPrizeForResponse(selectedPrize),
        flairText: 'The capsule cracks open in a burst of light! 🎉',
        awardedAt: new Date().toISOString(),
      });
    }, 1100);
  });

