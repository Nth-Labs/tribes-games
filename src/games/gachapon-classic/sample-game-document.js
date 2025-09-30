import { defaultGachaponClassicConfig } from './config';

const sampleGachaponClassicGameDocument = {
  ...defaultGachaponClassicConfig,
  prizes: defaultGachaponClassicConfig.prizes.map((prize) => ({ ...prize }))
};

export default sampleGachaponClassicGameDocument;
