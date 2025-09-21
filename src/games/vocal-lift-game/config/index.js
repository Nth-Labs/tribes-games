import baseGameDocument from './base-config.json';
import { buildGameConfigBase, cloneConfigValue } from '../../../utils/gameConfig';

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

const baseConfig = buildGameConfigBase(baseGameDocument);
const { options } = baseConfig;

const normalisedBallAsset =
  options.ballAsset && typeof options.ballAsset === 'object' ? cloneConfigValue(options.ballAsset) : {};

export const vocalLiftApiContract = {
  method: 'POST',
  path: '/games/list',
  requestBody: {
    game_ids: [baseGameDocument.game_id],
    merchant_id: baseGameDocument.merchant_id
  },
  responseType: 'application/json',
  notes:
    'POST /games/list responds with Game documents that include all immutable metadata and the options array shown in this mock configuration.',
  sampleResponse: baseGameDocument
};

const vocalLiftConfig = {
  gameId: baseConfig.gameId,
  gameType: baseConfig.gameType,
  title: baseConfig.title,
  subtitle: options.subtitle ?? '',
  description: options.description ?? '',
  instructions: options.instructions ?? '',
  targetSeconds: options.targetSeconds ?? 0,
  soundThreshold: options.soundThreshold ?? 0,
  silenceToleranceMs: options.silenceToleranceMs ?? 0,
  ballAsset: normalisedBallAsset,
  startButtonLabel: options.startButtonLabel ?? '',
  stopButtonLabel: options.stopButtonLabel ?? '',
  submissionEndpoint: options.submissionEndpoint ?? '',
  notes: options.notes ?? '',
  fieldSchema: vocalLiftFieldSchema,
  apiContract: vocalLiftApiContract,
  gameDocument: baseGameDocument
};

export const baseVocalLiftConfig = baseGameDocument;

export default vocalLiftConfig;
