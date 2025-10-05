const rarityOrder = ['legendary', 'epic', 'rare', 'uncommon', 'common'];

const toArray = (value) => (Array.isArray(value) ? value : []);

const normaliseRarity = (value) => {
  if (typeof value !== 'string') {
    return 'common';
  }
  const cleaned = value.trim().toLowerCase();
  return rarityOrder.includes(cleaned) ? cleaned : 'common';
};

export const normalisePrizes = (prizes = []) => {
  const items = toArray(prizes).map((prize, index) => ({
    id: prize?.id || `prize-${index + 1}`,
    name: prize?.name || `Prize ${index + 1}`,
    description: prize?.description || 'Configure prize copy in the template.',
    rarity: normaliseRarity(prize?.rarity),
    image: prize?.image ||
      'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=900&q=80',
  }));

  if (!items.length) {
    return [
      {
        id: 'gachapon-placeholder',
        name: 'Mystery Capsule',
        description: 'Update the template with your actual prizes.',
        rarity: 'common',
        image:
          'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=900&q=80',
      },
    ];
  }

  return items.sort((a, b) => rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity));
};

export const buildConfig = (data = {}) => ({
  ...data,
  prizes: normalisePrizes(data.prizes),
});
