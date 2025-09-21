import baseGameDocument from './base-config.json';
import { buildGameConfigBase, cloneConfigValue } from '../../../utils/gameConfig';

export const mysteryManorFieldSchema = {
  admin: {
    timerSeconds: {
      type: 'number',
      description: 'Global time limit for the scene.'
    },
    maxHints: {
      type: 'number',
      description: 'Total number of hints a player can request.'
    },
    items: {
      type: 'array',
      description: 'List of hidden objects the player must find.',
      itemSchema: {
        type: 'object',
        fields: {
          id: { type: 'string', required: true },
          name: { type: 'string', required: true },
          image: { type: 'image', required: true },
          hotspot: {
            type: 'object',
            required: true,
            fields: {
              type: { type: 'string', enum: ['circle', 'rect'] },
              x: { type: 'number' },
              y: { type: 'number' },
              radius: { type: 'number', required: false },
              width: { type: 'number', required: false },
              height: { type: 'number', required: false }
            }
          },
          hint: { type: 'string', required: false }
        }
      }
    },
    submissionEndpoint: {
      type: 'string',
      description: 'API route to log completion and reward details.'
    }
  },
  merchant: {
    title: { type: 'string', description: 'Campaign-specific headline.' },
    subtitle: { type: 'string', description: 'Short marketing subline shown beneath the title.' },
    description: { type: 'string', description: 'Full description displayed in the intro screen.' },
    backgroundImage: { type: 'image', description: 'Background art, 1920 × 1080 px PNG or JPG.' },
    sceneImage: { type: 'image', description: 'Gameplay scene image, same aspect ratio as background.' },
    hintIcon: { type: 'image', description: 'Icon shown when hints are available.' },
    items: {
      type: 'array',
      description: 'Merchants can update the visual assets and hint copy for each item.',
      editableFields: ['image', 'hint', 'name']
    }
  }
};

const baseConfig = buildGameConfigBase(baseGameDocument);
const { options } = baseConfig;

const normalisedItems = Array.isArray(options.items) ? cloneConfigValue(options.items) : [];

export const mysteryManorApiContract = {
  method: 'POST',
  path: '/games/list',
  requestBody: {
    game_ids: [baseGameDocument.game_id],
    merchant_id: baseGameDocument.merchant_id
  },
  responseType: 'application/json',
  notes:
    'POST /games/list returns full Game documents for the requested IDs. Hidden object definitions are delivered as JSON-stringified values within the options array.',
  sampleResponse: baseGameDocument
};

const mysteryManorConfig = {
  gameId: baseConfig.gameId,
  gameType: baseConfig.gameType,
  title: baseConfig.title,
  subtitle: options.subtitle ?? '',
  description: options.description ?? '',
  backgroundImage: options.backgroundImage ?? '',
  sceneImage: options.sceneImage ?? '',
  hintIcon: options.hintIcon ?? '',
  timerSeconds: options.timerSeconds ?? 0,
  maxHints: options.maxHints ?? 0,
  submissionEndpoint: options.submissionEndpoint ?? '',
  items: normalisedItems,
  fieldSchema: mysteryManorFieldSchema,
  apiContract: mysteryManorApiContract,
  gameDocument: baseGameDocument
};

export const baseMysteryManorConfig = baseGameDocument;

export default mysteryManorConfig;
