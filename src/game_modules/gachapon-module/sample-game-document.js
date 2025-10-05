const sampleGachaponGameDocument = {
  game_id: '6d64f279-19a8-4cde-bd16-bb6b208407a1',
  game_template_id: 'gachapon-celebration',
  game_type: 'gachapon',
  merchant_id: 'merchant-placeholder',
  name: 'Celestial Capsule Gachapon',
  title: 'Celestial Capsule',
  subtitle: 'Spin the capsule to discover stellar rewards.',
  instructions: 'Tap the handle to launch a capsule and reveal a prize.',
  primary_color: '#1f2937',
  secondary_color: '#38bdf8',
  tertiary_color: '#fcd34d',
  background_image:
    'https://images.unsplash.com/photo-1520971340542-ef72f47f4a6a?auto=format&fit=crop&w=1600&q=80',
  machine_image:
    'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80',
  sample_thumbnail:
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=400&q=80',
  play_endpoint: '/api/gachapon/play',
  results_endpoint: '/api/gachapon/results',
  prizes: [
    {
      id: 'capsule-emerald',
      name: 'Emerald Nebula Pin',
      description: 'Limited edition enamel pin inspired by the northern lights.',
      rarity: 'rare',
      image:
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'capsule-lantern',
      name: 'Starlit Lantern',
      description: 'Redeemable voucher for a themed lantern at participating stores.',
      rarity: 'uncommon',
      image:
        'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'capsule-comet',
      name: 'Comet Coffee Voucher',
      description: 'Free handcrafted drink from the Celestial Café menu.',
      rarity: 'common',
      image:
        'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=800&q=80',
    },
  ],
};

export default sampleGachaponGameDocument;
