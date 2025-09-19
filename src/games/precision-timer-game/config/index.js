import baseConfig from './base-config.json';

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

export const precisionTimerApiContract = {
  method: 'GET',
  responseType: 'application/json',
  collection: 'gameConfigs',
  documentKey: `${baseConfig.gameType}:${baseConfig.gameId}`,
  notes: 'Backend services should merge merchant overrides with the base configuration before returning the payload.'
};

const precisionTimerConfig = {
  ...baseConfig,
  fieldSchema: precisionTimerFieldSchema,
  apiContract: precisionTimerApiContract
};

export const basePrecisionTimerConfig = baseConfig;

export default precisionTimerConfig;
