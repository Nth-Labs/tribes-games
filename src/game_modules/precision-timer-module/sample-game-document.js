const samplePrecisionTimerGameDocument = {
  game_id: 'precision-timer-demo-001',
  game_template_id: 'precision-timer-classic',
  game_type: 'precision-timer',
  merchant_id: 'nthlabs-demo',
  name: 'Precision Countdown Challenge',
  title: 'Precision Countdown Challenge',
  subtitle: 'Trust your instincts and stop the timer at zero.',
  description:
    'Hit start, feel the rhythm, and tap stop exactly when you believe the countdown reaches zero. The closer you are, the better your score.',
  sample_thumbnail:
    'https://images.unsplash.com/photo-1522199755839-a2bacb67c546?auto=format&fit=crop&w=600&q=80',
  countdown_seconds: 5,
  start_button_label: 'Start Countdown',
  stop_button_label: 'Stop at Zero',
  retry_button_label: 'Play Again',
  results_heading: 'Your Timing Summary',
  theme: {
    background: '#0f172a',
    background_to: '#38bdf8',
    surface: '#ffffff',
    surface_text: '#0f172a',
    highlight: '#2563eb',
    highlight_soft: '#bfdbfe',
    accent: '#f97316',
    accent_contrast: '#0f172a',
    subtle_text: '#64748b',
    outline: '#cbd5f5',
  },
  metadata: {
    distribution_type: 'score_threshold',
    score_thresholds: [
      {
        threshold: 0.2,
        reward: {
          id: 'focus-pin',
          name: 'Focus Pin',
          description: 'Stop within 0.20 seconds of zero to earn this enamel pin.',
        },
      },
      {
        threshold: 0.1,
        reward: {
          id: 'chrono-patch',
          name: 'Chrono Patch',
          description: 'Lock in 0.10 seconds or less to secure this limited patch.',
        },
      },
      {
        threshold: 0.05,
        reward: {
          id: 'timekeeper-medal',
          name: 'Timekeeper Medal',
          description: 'Perfectionist! Staying within 0.05 seconds unlocks the top prize.',
        },
      },
    ],
  },
  rewards: [
    {
      threshold: 0.2,
      title: 'Focus Pin',
      description: 'Stop within 0.20 seconds of zero to earn this enamel pin.',
    },
    {
      threshold: 0.1,
      title: 'Chrono Patch',
      description: 'Lock in 0.10 seconds or less to secure this limited patch.',
    },
    {
      threshold: 0.05,
      title: 'Timekeeper Medal',
      description: 'Perfectionist! Staying within 0.05 seconds unlocks the top prize.',
    },
  ],
};

export default samplePrecisionTimerGameDocument;
