import baseGameDocument from './base-config.json';
import { buildGameConfigBase } from '../../../utils/gameConfig';

export const precisionTimerFieldSchema = {
  admin: {
    countdownSeconds: {
      type: 'number',
      description: 'Number of seconds the countdown should run before players try to stop it.'
    },
    submissionEndpoint: {
      type: 'string',
      description: 'API endpoint that records the player\'s timing attempt once the game ends.'
    }
  },
  merchant: {
    title: {
      type: 'string',
      description: 'Headline displayed at the top of the countdown screen.'
    },
    subtitle: {
      type: 'string',
      description: 'Optional subheading reinforcing the campaign message.'
    },
    description: {
      type: 'string',
      description: 'Supporting copy that explains how the challenge works.'
    },
    startButtonLabel: {
      type: 'string',
      description: 'Text displayed on the button that begins the countdown.'
    },
    stopButtonLabel: {
      type: 'string',
      description: 'Text displayed on the button that submits the player\'s attempt.'
    }
  }
};

const baseConfig = buildGameConfigBase(baseGameDocument);
const { options } = baseConfig;

export const precisionTimerApiContract = {
  method: 'POST',
  path: '/games/list',
  requestBody: {
    game_ids: [baseGameDocument.game_id],
    merchant_id: baseGameDocument.merchant_id
  },
  responseType: 'application/json',
  notes:
    'POST /games/list responds with an array of Game documents. Values in the options array are persisted as strings and should be parsed on the client.',
  sampleResponse: baseGameDocument
};

const precisionTimerConfig = {
  gameId: baseConfig.gameId,
  gameType: baseConfig.gameType,
  title: baseConfig.title,
  subtitle: options.subtitle ?? '',
  description: options.description ?? '',
  countdownSeconds: options.countdownSeconds ?? 0,
  startButtonLabel: options.startButtonLabel ?? '',
  stopButtonLabel: options.stopButtonLabel ?? '',
  submissionEndpoint: options.submissionEndpoint ?? '',
  fieldSchema: precisionTimerFieldSchema,
  apiContract: precisionTimerApiContract,
  gameDocument: baseGameDocument
};

export const basePrecisionTimerConfig = baseGameDocument;

export default precisionTimerConfig;
