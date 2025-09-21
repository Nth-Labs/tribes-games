import baseGameDocument from './base-config.json';
import { buildGameConfigBase, cloneConfigValue } from '../../../utils/gameConfig';

export const spinTheWheelFieldSchema = {
  admin: {
    maxSpinsPerUser: {
      type: 'number',
      description: 'Maximum number of spins allowed per user for the campaign.'
    },
    spinCooldownSeconds: {
      type: 'number',
      description: 'Cool-down period (in seconds) before a user can spin again.'
    },
    prizeSegments: {
      type: 'array',
      description: 'Defines the wheel segments and win probabilities.',
      itemSchema: {
        type: 'object',
        fields: {
          id: { type: 'string', required: true },
          label: { type: 'string', required: true },
          probability: { type: 'number', required: true },
          image: { type: 'image', required: true },
          description: { type: 'string', required: false }
        }
      }
    },
    submissionEndpoint: {
      type: 'string',
      description: 'Endpoint that records the prize awarded after a spin completes.'
    }
  },
  merchant: {
    wheelImage: {
      type: 'image',
      description: 'PNG or SVG of the wheel face (2048 × 2048 px recommended).'
    },
    pointerImage: {
      type: 'image',
      description: 'Pointer or indicator asset (transparent PNG preferred).'
    },
    backgroundImage: {
      type: 'image',
      description: 'Background image for the experience. 1920 × 1080 px recommended.'
    },
    spinButtonImage: {
      type: 'image',
      description: 'Asset for the spin trigger button.'
    },
    prizeSegments: {
      type: 'array',
      description: 'Merchants can tweak the label, artwork, and copy for each prize.',
      editableFields: ['label', 'image', 'description']
    }
  }
};

const baseConfig = buildGameConfigBase(baseGameDocument);
const { options } = baseConfig;

const normalisedPrizeSegments =
  Array.isArray(options.prizeSegments) ? cloneConfigValue(options.prizeSegments) : [];

export const spinTheWheelApiContract = {
  method: 'POST',
  path: '/games/list',
  requestBody: {
    game_ids: [baseGameDocument.game_id],
    merchant_id: baseGameDocument.merchant_id
  },
  responseType: 'application/json',
  notes:
    'POST /games/list responds with immutable Game documents. Prize segments and other complex fields are returned as JSON-stringified values in the options array.',
  sampleResponse: baseGameDocument
};

const spinTheWheelConfig = {
  gameId: baseConfig.gameId,
  gameType: baseConfig.gameType,
  title: baseConfig.title,
  description: options.description ?? '',
  wheelImage: options.wheelImage ?? '',
  pointerImage: options.pointerImage ?? '',
  backgroundImage: options.backgroundImage ?? '',
  spinButtonImage: options.spinButtonImage ?? '',
  maxSpinsPerUser: options.maxSpinsPerUser ?? 0,
  spinCooldownSeconds: options.spinCooldownSeconds ?? 0,
  submissionEndpoint: options.submissionEndpoint ?? '',
  prizeSegments: normalisedPrizeSegments,
  fieldSchema: spinTheWheelFieldSchema,
  apiContract: spinTheWheelApiContract,
  gameDocument: baseGameDocument
};

export const baseSpinTheWheelConfig = baseGameDocument;

export default spinTheWheelConfig;
