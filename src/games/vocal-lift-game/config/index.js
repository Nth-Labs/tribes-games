import baseConfig from './base-config.json';

export const vocalLiftFieldSchema = {
  admin: {
    targetSeconds: {
      type: 'number',
      description: 'Number of seconds the player must sustain sound to win the challenge.'
    },
    soundThreshold: {
      type: 'number',
      description: 'Normalized microphone level (0-1) required to keep the floating object airborne.'
    },
    silenceToleranceMs: {
      type: 'number',
      description:
        'Grace period, in milliseconds, that the player is allowed to dip below the sound threshold before the object falls.'
    },
    submissionEndpoint: {
      type: 'string',
      description: 'Endpoint that receives post-game submissions when a player completes the challenge.'
    }
  },
  merchant: {
    title: {
      type: 'string',
      description: 'Headline displayed at the top of the experience.'
    },
    subtitle: {
      type: 'string',
      description: 'Optional sub-heading that appears below the title.'
    },
    description: {
      type: 'text',
      description: 'Introductory copy shown before the player starts the challenge.'
    },
    instructions: {
      type: 'text',
      description: 'Optional instructions rendered above the call-to-action button.'
    },
    startButtonLabel: {
      type: 'string',
      description: 'Text for the button that initiates microphone access and begins the challenge.'
    },
    stopButtonLabel: {
      type: 'string',
      description: 'Text for the button that stops microphone capture and resets the session.'
    },
    ballAsset: {
      type: 'object',
      description: 'Image object for the floating asset. Use CDN-hosted URLs in production environments.',
      fields: {
        url: { type: 'image', required: true },
        altText: { type: 'string', required: false }
      }
    }
  }
};

export const vocalLiftApiContract = {
  method: 'GET',
  responseType: 'application/json',
  notes: 'The API should merge campaign overrides into the base configuration before returning the payload.',
  collection: 'gameConfigs',
  documentKey: `${baseConfig.gameType}:${baseConfig.gameId}`
};

const vocalLiftConfig = {
  ...baseConfig,
  ballAsset: { ...baseConfig.ballAsset },
  fieldSchema: vocalLiftFieldSchema,
  apiContract: vocalLiftApiContract
};

export const baseVocalLiftConfig = baseConfig;

export default vocalLiftConfig;
