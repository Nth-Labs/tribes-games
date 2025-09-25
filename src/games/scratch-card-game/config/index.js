const scratchCardPrizes = [
  {
    id: 'starlit-token',
    name: 'Starlit Token',
    rarity: 'common',
    rarityLabel: 'Common',
    description: 'A token etched with constellations, good for a single campfire wish.',
    weight: 45,
    foilColor: '#CBD5F5',
    glowColor: 'rgba(96, 165, 250, 0.35)',
    flairText: 'Starlight flickers across the token as it reveals itself.'
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
    flairText: 'Threads of light twirl in the air as the prize emerges.'
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
    flairText: 'The charm gleams with the first light of morning.'
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
    flairText: 'A halo of twilight blooms around the crest.'
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
    flairText: 'The aurora surges as the heart ignites in your hands.'
  }
];

const scratchCardConfig = {
  game_id: 'scr-001',
  game_template_id: 'scratch-card',
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
  submissionEndpoint: '/api/games/scratch-card/scr-001/results',
  prizes: scratchCardPrizes
};

export { scratchCardPrizes };

export default scratchCardConfig;
