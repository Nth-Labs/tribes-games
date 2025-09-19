import baseConfig from './config/base-config.json';

const uniqueCardsArray = baseConfig.cards.map((card) => ({ ...card }));

export default uniqueCardsArray;
