const matchingGameConfig = {
  game_id: 'f6c8f7c4-5ab7-41f2-9a1f-abc123xyz456',
  game_template_id: 'flip-card-new-uuid',
  distribution_info: {
    type: 'score_threshold',
    endpoint: '/api/games/flip-card/claim/score-threshold'
  },
  title: 'Azure Breeze Flip Challenge',
  subtitle: 'Match the pairs before you run out of moves.',
  move_limit: 8,
  initial_reveal_seconds: 3,
  card_upflip_seconds: 1.2,
  primary_color: '#fdfaf5',
  secondary_color: '#7DD3FC',
  tertiary_color: '#FDE0AB',
  card_back_image: '/images/matching-game-assets/card-back.png',
  image_1: '/images/matching-game-assets/white-tiffin-assets/mee-siam-with-prawns.png',
  image_2: '/images/matching-game-assets/white-tiffin-assets/local-trio.png',
  image_3: '/images/matching-game-assets/white-tiffin-assets/nasi-lemak-beef.png',
  image_4: '/images/matching-game-assets/white-tiffin-assets/chicken-curry.png',
  image_5: '/images/matching-game-assets/white-tiffin-assets/trio-snack-platter.png',
  image_6: '/images/matching-game-assets/white-tiffin-assets/fish-maw-seafood-soup.png',
  image_7: '/images/matching-game-assets/pokemon-assets/bulbasaur.png',
  image_8: '/images/matching-game-assets/pokemon-assets/arcanine.png'
};

export const matchingGameCardImages = [
  matchingGameConfig.image_1,
  matchingGameConfig.image_2,
  matchingGameConfig.image_3,
  matchingGameConfig.image_4,
  matchingGameConfig.image_5,
  matchingGameConfig.image_6,
  matchingGameConfig.image_7,
  matchingGameConfig.image_8
].filter((src) => typeof src === 'string' && src.trim().length > 0);

export default matchingGameConfig;
