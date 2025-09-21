import flipCardNewConfig from './config';

const uniqueCardsArray = Array.isArray(flipCardNewConfig.cards)
  ? flipCardNewConfig.cards.map((card) => ({ ...card }))
  : [];

export default uniqueCardsArray;
