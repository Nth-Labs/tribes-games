import { defaultScratchCardClassicConfig } from './config';

const sampleScratchCardClassicGameDocument = {
  ...defaultScratchCardClassicConfig,
  prizes: defaultScratchCardClassicConfig.prizes.map((prize) => ({ ...prize }))
};

export default sampleScratchCardClassicGameDocument;
