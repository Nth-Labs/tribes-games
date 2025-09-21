import matchingGameConfig from './config';

const uniqueCardsArray = Array.isArray(matchingGameConfig.cards)
  ? matchingGameConfig.cards.map((card) => ({ ...card }))
  : [];

export default uniqueCardsArray;
