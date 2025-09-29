const defaultCards = [
  {
    id: 'mee-siam-with-prawns',
    type: 'Mee Siam With Prawns',
    image: '/images/matching-game-assets/white-tiffin-assets/mee-siam-with-prawns.png',
    altText: 'Mee Siam With Prawns card artwork'
  },
  {
    id: 'local-trio',
    type: 'Local Trio',
    image: '/images/matching-game-assets/white-tiffin-assets/local-trio.png',
    altText: 'Local Trio card artwork'
  },
  {
    id: 'nasi-lemak-beef',
    type: 'Nasi Lemak Beef',
    image: '/images/matching-game-assets/white-tiffin-assets/nasi-lemak-beef.png',
    altText: 'Nasi Lemak Beef card artwork'
  },
  {
    id: 'chicken-curry',
    type: 'Chicken Curry',
    image: '/images/matching-game-assets/white-tiffin-assets/chicken-curry.png',
    altText: 'Chicken Curry card artwork'
  },
  {
    id: 'trio-snack-platter',
    type: 'Trio Snack Platter',
    image: '/images/matching-game-assets/white-tiffin-assets/trio-snack-platter.png',
    altText: 'Trio Snack Platter card artwork'
  },
  {
    id: 'fish-maw-seafood-soup',
    type: 'Fish Maw Seafood Soup',
    image: '/images/matching-game-assets/white-tiffin-assets/fish-maw-seafood-soup.png',
    altText: 'Fish Maw Seafood Soup card artwork'
  }
];

const uniqueCardsArray = defaultCards.map((card) => ({ ...card }));

export default uniqueCardsArray;
