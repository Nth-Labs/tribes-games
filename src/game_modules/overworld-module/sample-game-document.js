const legend = {
  G: 'grass',
  P: 'path',
  W: 'water',
  T: 'tree',
  S: 'sand',
  R: 'rock',
};

const tilePlan = [
  'TTTTTTTTTTTTTTTT',
  'TGGGGGGGGGGGGGGT',
  'TGGGPPPPPGGGGGGT',
  'TGGGPGGGPGGGGGGT',
  'TGGGPGWWPGGTTTGT',
  'TGGGPGWWPGGTTTGT',
  'TGGGPPPPPGGGTGGT',
  'TGGGGGGGGGGGTGGT',
  'TGGGGGSSSGGGGGGT',
  'TGGGGGSSSGGGGGGT',
  'TGGGGGGGGGGGGGGT',
  'TTTTTTTTTTTTTTTT',
];

const tiles = tilePlan.map((row) =>
  row.split('').map((symbol) => legend[symbol] || 'grass'),
);

const width = tiles[0].length;
const height = tiles.length;

const sampleThumbnailSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#80c6ff" />
      <stop offset="100%" stop-color="#4caf82" />
    </linearGradient>
  </defs>
  <rect width="160" height="160" fill="url(#bg)" rx="28" />
  <rect x="16" y="86" width="128" height="36" rx="18" fill="#d4b483" opacity="0.85" />
  <circle cx="40" cy="70" r="18" fill="#3f704d" />
  <circle cx="116" cy="60" r="22" fill="#3f704d" />
  <polygon points="80,54 100,92 60,92" fill="#f9f871" stroke="#1f2937" stroke-width="4" stroke-linejoin="round" />
</svg>`;

const sampleThumbnail = `data:image/svg+xml;utf8,${encodeURIComponent(sampleThumbnailSvg)}`;

const sampleOverworldGameDocument = {
  game_template_id: 'overworld-adventure',
  game_type: 'overworld',
  title: 'Sprite Walkabout',
  subtitle: 'Stroll through Sunrise Glade and meet its curiosities.',
  description:
    'Guide the sprite around a friendly overworld. Test movement, collisions, and lightweight interactions.',
  sample_thumbnail: sampleThumbnail,
  world: {
    name: 'Sunrise Glade',
    width,
    height,
    tiles,
    legend: {
      grass: {
        label: 'Grass',
        color: '#6ac17c',
      },
      path: {
        label: 'Path',
        color: '#d7b894',
      },
      water: {
        label: 'Water',
        color: '#4f8fd7',
      },
      sand: {
        label: 'Sand',
        color: '#f1d59a',
      },
      tree: {
        label: 'Trees',
        color: '#3d6b47',
        solid: true,
      },
      rock: {
        label: 'Rock',
        color: '#8d9aa9',
        solid: true,
      },
    },
    items: [
      {
        id: 'campfire',
        name: 'Campfire',
        position: { x: 6, y: 6 },
        interactionMessage: 'The campfire crackles softly. You feel its warmth.',
        icon: 'campfire',
      },
      {
        id: 'notice-board',
        name: 'Notice Board',
        position: { x: 4, y: 3 },
        interactionMessage: 'A faded note reads: "Adventurers welcome!"',
        icon: 'board',
      },
      {
        id: 'sparkling-pond',
        name: 'Sparkling Pond',
        position: { x: 8, y: 4 },
        interactionMessage: 'Sunlight scatters across the pond, revealing darting fish.',
        icon: 'pond',
      },
      {
        id: 'mystery-sprout',
        name: 'Mystery Sprout',
        position: { x: 10, y: 8 },
        interactionMessage: 'The sprout hums when you hover nearby, eager to grow.',
        icon: 'sprout',
      },
    ],
  },
  player: {
    start: { x: 3, y: 5 },
    speed: 2.5,
  },
};

export default sampleOverworldGameDocument;
