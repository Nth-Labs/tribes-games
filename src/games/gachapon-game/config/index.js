import template from './template.json';

const previewMetadata = {
  gameId: 'gacha-001',
  merchantId: 'merchant-demo'
};

const previewOptions = {
  ...template.defaults
};

const templateFields = Array.isArray(template.fields) ? template.fields : [];

const serialiseOptionValue = (field, value) => {
  if (value === null) {
    return null;
  }

  if (typeof value === 'undefined') {
    return '';
  }

  const fieldType = field?.type;

  if (fieldType === 'number' && typeof value === 'number') {
    return value.toString();
  }

  if (fieldType === 'boolean' && typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (fieldType === 'array' || fieldType === 'object' || fieldType === 'json') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value) || typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
};

const buildOptionEntry = (field) => {
  const optionName = field?.name;

  if (!optionName) {
    return null;
  }

  const hasCustomValue = Object.prototype.hasOwnProperty.call(previewOptions, optionName);
  const optionValue = hasCustomValue ? previewOptions[optionName] : field?.default;

  if (typeof optionValue === 'undefined') {
    return null;
  }

  return {
    input_name: optionName,
    input_type: field?.type ?? 'string',
    required: Boolean(field?.required),
    value: serialiseOptionValue(field, optionValue)
  };
};

const previewGameDocument = {
  game_id: previewMetadata.gameId,
  game_template_name: template.gameType,
  merchant_id: previewMetadata.merchantId,
  name: previewOptions.title ?? template.metadata?.name ?? '',
  status: 'draft',
  is_active: true,
  hard_play_count_limit: 0,
  play_count: 0,
  prize_distribution_strategy: 'cascade',
  options: templateFields.map((field) => buildOptionEntry(field)).filter(Boolean)
};

const gachaponConfig = {
  gameId: previewMetadata.gameId,
  gameType: template.gameType,
  title: previewOptions.title,
  tagline: previewOptions.tagline,
  description: previewOptions.description,
  ctaLabel: previewOptions.ctaLabel,
  preparingLabel: previewOptions.preparingLabel,
  resultModalTitle: previewOptions.resultModalTitle,
  capsuleMachineLabel: previewOptions.capsuleMachineLabel,
  capsuleStatusIdleLabel: previewOptions.capsuleStatusIdleLabel,
  capsuleStatusPreparingLabel: previewOptions.capsuleStatusPreparingLabel,
  capsuleStatusShakingLabel: previewOptions.capsuleStatusShakingLabel,
  capsuleStatusOpeningLabel: previewOptions.capsuleStatusOpeningLabel,
  capsuleStatusResultLabel: previewOptions.capsuleStatusResultLabel,
  capsuleDescription: previewOptions.capsuleDescription,
  prizeShowcaseTitle: previewOptions.prizeShowcaseTitle,
  prizeShowcaseDescription: previewOptions.prizeShowcaseDescription,
  prizeListLoadingText: previewOptions.prizeListLoadingText,
  prizeListErrorText: previewOptions.prizeListErrorText,
  attemptErrorText: previewOptions.attemptErrorText,
  defaultFlairText: previewOptions.defaultFlairText,
  defaultCapsuleColor: previewOptions.defaultCapsuleColor,
  submissionEndpoint: previewOptions.submissionEndpoint,
  shakeDurationMs: previewOptions.shakeDurationMs,
  explosionDurationMs: previewOptions.explosionDurationMs,
  prizes: previewOptions.prizes,
  template,
  templateVersion: template.version,
  previewOptions,
  previewMetadata,
  fields: templateFields,
  apiContract: {
    method: 'POST',
    path: '/games/list',
    requestBody: {
      game_ids: [previewMetadata.gameId],
      merchant_id: previewMetadata.merchantId
    },
    responseType: 'application/json',
    notes:
      'POST /games/list returns Game documents with option values serialised as strings. Structured defaults are stringified during publishing.',
    sampleResponse: previewGameDocument
  },
  gameDocument: previewGameDocument
};

export const gachaponTemplate = template;
export const gachaponPreviewOptions = previewOptions;
export const gachaponPreviewGameDocument = previewGameDocument;

export default gachaponConfig;
