const sampleDinoRunGameDocument = {
  game_template_id: 'dino-runner-demo',
  game_type: 'dino-runner',
  title: 'Blocky Runner',
  subtitle: 'Leap over obstacles with a single tap or keypress.',
  description:
    'A speedy endless runner where your customizable block hero dodges cactus-shaped obstacles. Tap the jump button or press the space bar to stay alive.',
  theme: {
    backgroundColor: '#f5f5f5',
    groundColor: '#e2e8f0',
    playerColor: '#2563eb',
    obstacleColor: '#ea580c',
    scoreColor: '#0f172a',
  },
  difficulty: {
    baseSpeed: 320,
    maxSpeed: 520,
  },
  assets: {
    playerShape: 'stacked-blocks',
  },
};

export default sampleDinoRunGameDocument;
