import baseConfig from './base-config.json';

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

export const spinTheWheelApiContract = {
  method: 'GET',
  responseType: 'application/json',
  collection: 'gameConfigs',
  documentKey: `${baseConfig.gameType}:${baseConfig.gameId}`,
  notes: 'Backend should merge merchant overrides with the baseConfig before returning it to the frontend.'
};

const spinTheWheelConfig = {
  ...baseConfig,
  prizeSegments: baseConfig.prizeSegments.map((segment) => ({ ...segment })),
  fieldSchema: spinTheWheelFieldSchema,
  apiContract: spinTheWheelApiContract
};

export const baseSpinTheWheelConfig = baseConfig;

export default spinTheWheelConfig;
