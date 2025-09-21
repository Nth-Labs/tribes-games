import baseGameDocument from './base-config.json';
import { buildGameConfigBase, cloneConfigValue } from '../../../utils/gameConfig';

export const flipCardNewFieldSchema = {
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
    },
    theme: {
      type: 'object',
      description: 'Visual customisation options for the flip card game surface and interface.',
      fields: {
        backgroundColor: {
          type: 'string',
          description: 'Fallback background colour used when no background image is provided.'
        },
        backgroundImage: {
          type: 'string',
          description: 'CSS gradient definition or image URL used for the game background.'
        },
        backgroundOverlayColor: {
          type: 'string',
          description: 'Colour applied over the background to improve card contrast.'
        },
        accentColor: {
          type: 'string',
          description: 'Primary accent colour for progress indicators and highlights.'
        },
        titleColor: {
          type: 'string',
          description: 'Primary heading colour within the game layout.'
        },
        textColor: {
          type: 'string',
          description: 'Default text colour used on modals and supporting copy.'
        },
        subtleTextColor: {
          type: 'string',
          description: 'Muted text colour for labels and helper text.'
        },
        panelBackgroundColor: {
          type: 'string',
          description: 'Background colour for the information panels and modals.'
        },
        panelBorderColor: {
          type: 'string',
          description: 'Border colour for the panels and modal surfaces.'
        },
        panelShadowColor: {
          type: 'string',
          description: 'Shadow colour used to elevate information panels.'
        },
        boardBackgroundColor: {
          type: 'string',
          description: 'Background colour for the card grid container.'
        },
        boardBorderColor: {
          type: 'string',
          description: 'Border colour for the game board wrapper.'
        },
        boardShadowColor: {
          type: 'string',
          description: 'Shadow colour applied behind the card grid container.'
        },
        cardBackBackgroundColor: {
          type: 'string',
          description: 'Colour shown behind the card back artwork.'
        },
        cardFaceBackgroundColor: {
          type: 'string',
          description: 'Colour shown behind the revealed card artwork.'
        },
        cardBorderColor: {
          type: 'string',
          description: 'Border colour applied to each individual card.'
        },
        cardMatchedBackgroundColor: {
          type: 'string',
          description: 'Overlay colour displayed when a pair has been matched.'
        },
        cardMatchedGlowColor: {
          type: 'string',
          description: 'Glow colour used for matched cards to emphasise success.'
        },
        cardShadowColor: {
          type: 'string',
          description: 'Ambient shadow colour used for resting cards.'
        },
        buttonBackgroundColor: {
          type: 'string',
          description: 'Background colour for primary buttons such as the results submission call-to-action.'
        },
        buttonHoverBackgroundColor: {
          type: 'string',
          description: 'Hover state background colour for primary buttons.'
        },
        buttonTextColor: {
          type: 'string',
          description: 'Text colour used on buttons.'
        },
        cardFlipDurationMs: {
          type: 'number',
          description: 'Duration of the flip animation in milliseconds.'
        }
      }
    }
  }
};

const baseConfig = buildGameConfigBase(baseGameDocument);
const { options } = baseConfig;

const normalisedTheme =
  options.theme && typeof options.theme === 'object' ? cloneConfigValue(options.theme) : {};
const normalisedCards = Array.isArray(options.cards) ? cloneConfigValue(options.cards) : [];

export const flipCardNewApiContract = {
  method: 'POST',
  path: '/games/list',
  requestBody: {
    game_ids: [baseGameDocument.game_id],
    merchant_id: baseGameDocument.merchant_id
  },
  responseType: 'application/json',
  notes:
    'POST /games/list returns full Game documents with immutable metadata and the options array mirrored in this configuration.',
  sampleResponse: baseGameDocument
};

const flipCardNewConfig = {
  gameId: baseConfig.gameId,
  gameType: baseConfig.gameType,
  title: baseConfig.title,
  description: options.description ?? options.gameDescription ?? '',
  moveLimit: options.moveLimit ?? 0,
  initialRevealSeconds: options.initialRevealSeconds ?? 0,
  cardUpflipSeconds: options.cardUpflipSeconds ?? 0,
  cardBackImage: options.cardBackImage ?? '',
  theme: normalisedTheme,
  submissionEndpoint: options.submissionEndpoint ?? '',
  cards: normalisedCards,
  fieldSchema: flipCardNewFieldSchema,
  apiContract: flipCardNewApiContract,
  gameDocument: baseGameDocument
};

export const baseFlipCardNewConfig = baseGameDocument;

export default flipCardNewConfig;
