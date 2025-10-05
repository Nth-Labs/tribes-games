const sampleScratchCardGameDocument = {
  game_id: '15b8f84b-98d3-4ba6-9b18-02ddca4369f5',
  game_template_id: 'scratch-card-starlight',
  game_type: 'scratch-card',
  merchant_id: 'merchant-placeholder',
  name: 'Radiant Scratch Card',
  title: 'Radiant Reveal',
  subtitle: 'Scratch to see if you unlock tonight\'s voucher drop.',
  primary_color: '#0f172a',
  secondary_color: '#f472b6',
  tertiary_color: '#38bdf8',
  background_image:
    'https://images.unsplash.com/photo-1514516430032-7e0ec82494a5?auto=format&fit=crop&w=1600&q=80',
  card_background_image:
    'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=900&q=80',
  overlay_pattern:
    'https://images.unsplash.com/photo-1518873890627-d4bd9f47fca6?auto=format&fit=crop&w=1200&q=80',
  sample_thumbnail:
    'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=400&q=80',
  reveal_endpoint: '/api/scratch-card/reveal',
  results_endpoint: '/api/scratch-card/results',
  prize:
    'Reveal three matching icons to win an instant voucher. Every play guarantees at least one reward.',
};

export default sampleScratchCardGameDocument;
