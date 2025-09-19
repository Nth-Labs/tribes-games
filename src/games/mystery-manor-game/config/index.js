import baseConfig from './base-config.json';

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

export const mysteryManorApiContract = {
  method: 'GET',
  responseType: 'application/json',
  collection: 'gameConfigs',
  documentKey: `${baseConfig.gameType}:${baseConfig.gameId}`,
  notes: 'The backend should serve the scene configuration and assets with URLs accessible by the client.'
};

const mysteryManorConfig = {
  ...baseConfig,
  items: baseConfig.items.map((item) => ({
    ...item,
    hotspot: { ...item.hotspot }
  })),
  fieldSchema: mysteryManorFieldSchema,
  apiContract: mysteryManorApiContract
};

export const baseMysteryManorConfig = baseConfig;

export default mysteryManorConfig;
