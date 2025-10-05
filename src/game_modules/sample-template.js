/**
 * Sample template structure shared across game modules.
 * This is intentionally framework-agnostic so we can re-use it
 * in other repositories when scaffolding new game experiences.
 */
const sampleGameTemplate = {
  game_id: 'uuid-game-id',
  game_template_id: 'template-identifier',
  game_type: 'game-family',
  merchant_id: 'merchant-id',
  name: 'Game display name',
  title: 'Hero title used inside the module',
  subtitle: 'Optional subtitle to add context or instructions.',
  primary_color: '#0f172a',
  secondary_color: '#38bdf8',
  tertiary_color: '#facc15',
  background_image: 'https://example.com/background.jpg',
  card_background_image: 'https://example.com/card.jpg',
  overlay_pattern: 'https://example.com/overlay.png',
  sample_thumbnail: 'https://example.com/thumbnail.jpg',
  play_endpoint: '/api/path-to-trigger-gameplay',
  reveal_endpoint: '/api/path-to-reveal-prize',
  results_endpoint: '/api/path-to-fetch-results',
  assets: {
    logo: 'https://example.com/logo.png',
    gallery: [
      'https://example.com/image-1.jpg',
      'https://example.com/image-2.jpg',
    ],
  },
  prizes: [
    {
      id: 'prize-1',
      name: 'Voucher name',
      description: 'Describe the reward so players know what they win.',
      rarity: 'common',
      image: 'https://example.com/prize.png',
    },
  ],
  metadata: {
    start_date: '2024-05-01T00:00:00.000Z',
    end_date: '2024-06-01T00:00:00.000Z',
    distribution_type: 'score_threshold',
  },
  copy: {
    play_button: 'Play now',
    retry_button: 'Play again',
    results_heading: 'Round complete',
    empty_state: 'This game is no longer available.',
  },
};

export default sampleGameTemplate;
