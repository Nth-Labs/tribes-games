const gachaponPrizes = [
  {
    id: 'luminous-orb',
    name: 'Luminous Orb',
    description: 'A softly glowing orb that keeps your camp lit through the night.',
    capsuleColor: '#E5E7EB',
    flairText: 'The orb hums gently as it rolls into your hands.'
  },
  {
    id: 'ember-charm',
    name: 'Ember Charm',
    description: 'A flickering charm that warms nearby allies by a few cozy degrees.',
    capsuleColor: '#86EFAC',
    flairText: 'Sparks of emberlight trace the capsule as it opens.'
  },
  {
    id: 'aurora-cape',
    name: 'Aurora Cape',
    description: 'Shimmers with the northern lights and lets you glide short distances.',
    capsuleColor: '#93C5FD',
    flairText: 'The cape unfurls with a cascade of aurora hues.'
  },
  {
    id: 'celestial-compass',
    name: 'Celestial Compass',
    description: 'Always points toward the nearest secret, no matter where you roam.',
    capsuleColor: '#C4B5FD',
    flairText: 'Starlit runes ignite as the compass clicks into place.'
  },
  {
    id: 'dragon-heartfire',
    name: 'Dragon Heartfire',
    description: "A fragment of dragon flame that grants a surge of courage to its bearer.",
    capsuleColor: '#FDE68A',
    flairText: "A plume of golden flame roars from the capsule's core."
  }
];

const gachaponConfig = {
  game_id: 'gacha-001',
  game_template_id: 'gachapon',
  title: 'Celestial Capsule Gachapon',
  tagline: 'Arcade Feature',
  description:
    'Pull the lever to see what treasure is sealed within the capsule. Every attempt reveals one colourful surprise from the same prize pool.',
  ctaLabel: 'Start Gachapon',
  preparingLabel: 'Dispensing…',
  resultModalTitle: 'Gachapon Result',
  capsuleMachineLabel: 'Capsule Machine',
  capsuleStatusIdleLabel: 'Ready',
  capsuleStatusPreparingLabel: 'Priming capsule…',
  capsuleStatusShakingLabel: 'Shaking…',
  capsuleStatusOpeningLabel: 'Opening…',
  capsuleStatusResultLabel: 'Capsule opened!',
  capsuleDescription:
    'Every shake builds anticipation before the capsule bursts open to reveal your prize. Hold tight and watch the glow change as the machine prepares your reward.',
  prizeShowcaseTitle: 'Prize Showcase',
  prizeShowcaseDescription: 'Browse every prize currently loaded into the capsule.',
  prizeListLoadingText: 'Loading prize lineup…',
  prizeListErrorText: 'We could not load the prize list. Please refresh to try again.',
  attemptErrorText: 'Something interrupted the gachapon attempt. Please try again.',
  defaultFlairText: 'The capsule cracks open in a burst of light! 🎉',
  defaultCapsuleColor: '#38bdf8',
  submissionEndpoint: '/api/games/gachapon/gacha-001/results',
  shakeDurationMs: 1200,
  explosionDurationMs: 650,
  prizes: gachaponPrizes
};

export { gachaponPrizes };

export default gachaponConfig;
