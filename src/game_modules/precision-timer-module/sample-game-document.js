const samplePrecisionTimerGameDocument = {
  game_id: 'precision-timer-demo-001',
  game_template_id: 'precision-timer-classic',
  game_type: 'precision-timer',
  merchant_id: 'nthlabs-demo',
  name: 'Precision Countdown Demo',
  title: 'Precision Countdown Challenge',
  subtitle: 'Stop the clock exactly when you feel it hits zero.',
  description:
    'Launch the countdown, trust your instincts, and tap stop the instant you think the timer reaches zero. Each millisecond away from perfect adds to your score.',
  sample_thumbnail:
    'https://images.unsplash.com/photo-1522199755839-a2bacb67c546?auto=format&fit=crop&w=600&q=80',
  countdown_seconds: 5,
  start_button_label: 'Start Countdown',
  stop_button_label: 'Stop at Zero',
  retry_button_label: 'Try Again',
  results_heading: 'Countdown Summary',
  theme: {
    background: '#020617',
    highlight: '#38bdf8',
    accent: '#f59e0b',
    text: '#f8fafc',
  },
  rewards: [
    {
      threshold: 0.15,
      title: 'Crystal Focus Pin',
      description: 'Awarded for stopping within 0.15s of zero.',
    },
    {
      threshold: 0.05,
      title: 'Chronomaster Patch',
      description: 'Stop within 0.05s and earn this limited run patch.',
    },
  ],
};

export default samplePrecisionTimerGameDocument;
