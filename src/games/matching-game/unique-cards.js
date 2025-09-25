const defaultCardImages = [
  '/images/matching-game-assets/pokemon-assets/abra.png',
  '/images/matching-game-assets/pokemon-assets/alakazam.png',
  '/images/matching-game-assets/pokemon-assets/arcanine.png',
  '/images/matching-game-assets/pokemon-assets/beedrill.png',
  '/images/matching-game-assets/pokemon-assets/braviary.png',
  '/images/matching-game-assets/pokemon-assets/bulbasaur.png'
];

const uniqueCardsArray = defaultCardImages.map((src, index) => ({
  id: `default-card-${index + 1}`,
  type: `Card ${index + 1}`,
  image: src,
  altText: `Card ${index + 1}`
}));

export default uniqueCardsArray;
