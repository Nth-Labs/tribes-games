const sampleDinoJumpGameDocument = {
  game_id: 'dino-jump-demo-001',
  game_template_id: 'dino-jump-canyon-run',
  game_type: 'dino-jump',
  merchant_id: 'nthlabs-demo',
  name: 'Canyon Run Demo',
  title: 'Canyon Run: Dino Dash',
  subtitle: 'Leap past ancient ruins and chase a meteorite high score.',
  primary_color: '#1e293b',
  secondary_color: '#38bdf8',
  tertiary_color: '#f97316',
  background_image:
    'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80',
  sample_thumbnail:
    'https://images.unsplash.com/photo-1524072717771-5842ff6d0184?auto=format&fit=crop&w=600&q=80',
  assets: {
    logo:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=400&q=80',
  },
  copy: {
    play_button: 'Start Run',
    jump_button: 'Jump',
    retry_button: 'Run Again',
    results_heading: 'Run Summary',
    instructions:
      'Tap jump to avoid stone spires. Each obstacle cleared boosts your score.',
  },
  physics: {
    ground_speed: 260,
    gravity: 1800,
    jump_velocity: 720,
    spawn_interval_min: 1.1,
    spawn_interval_max: 2.1,
    score_per_second: 62,
  },
  metadata: {
    distribution_type: 'score_threshold',
    score_thresholds: [
      {
        threshold: 60,
        reward: {
          id: 'ember-pin',
          name: 'Glowing Ember Pin',
          description: 'A keepsake for clearing the first canyon stretch.',
        },
      },
      {
        threshold: 120,
        reward: {
          id: 'fossil-charm',
          name: 'Ancient Fossil Charm',
          description: 'Awarded for outpacing the dust storms.',
        },
      },
      {
        threshold: 200,
        reward: {
          id: 'meteorite-trophy',
          name: 'Meteorite Trophy',
          description: 'Reserved for elite runners who reach the blazing skies.',
        },
      },
    ],
    seed_high_score: 95,
  },
};

export default sampleDinoJumpGameDocument;
