import baseConfig from './base-config.json';

export const matchingGameFieldSchema = {
  admin: {
    moveLimit: {
      type: 'number',
      description: 'Maximum number of moves allowed before the game is considered lost.'
    },
    initialRevealSeconds: {
      type: 'number',
      description: 'Duration for the pre-game reveal of all cards (set to 0 to disable).'
    },
    cardUpflipSeconds: {
      type: 'number',
      description: 'How long a card stays face-up before auto-flipping when no match is found.'
    },
    cards: {
      type: 'array',
      description: 'Complete list of card entries available in the game.',
      itemSchema: {
        type: 'object',
        fields: {
          id: { type: 'string', required: true },
          type: { type: 'string', required: true },
          image: { type: 'image', required: true },
          altText: { type: 'string', required: false }
        }
      }
    },
    submissionEndpoint: {
      type: 'string',
      description: 'API route that will receive the post-game payload when the user submits their results.'
    }
  },
  merchant: {
    cardBackImage: {
      type: 'image',
      description: 'Image displayed on the back of every card. Recommended transparent PNG, 512x512 minimum.'
    },
    cards: {
      type: 'array',
      description: 'Merchants can update the artwork and display name for each card asset to fit their campaign.',
      editableFields: ['type', 'image', 'altText']
    }
  }
};

export const matchingGameApiContract = {
  method: 'GET',
  responseType: 'application/json',
  notes: 'The API should respond with the exact shape of baseConfig, optionally overriding the editable fields based on campaign needs.',
  collection: 'gameConfigs',
  documentKey: `${baseConfig.gameType}:${baseConfig.gameId}`
};

const matchingGameConfig = {
  ...baseConfig,
  cards: baseConfig.cards.map((card) => ({ ...card })),
  fieldSchema: matchingGameFieldSchema,
  apiContract: matchingGameApiContract
};

export const baseMatchingGameConfig = baseConfig;

export default matchingGameConfig;
