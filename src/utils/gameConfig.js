const NUMERIC_OPTION_TYPES = new Set(['number', 'integer', 'float', 'double', 'decimal']);
const JSON_OPTION_TYPES = new Set(['json', 'object', 'array']);
const MULTI_VALUE_OPTION_TYPES = new Set(['list', 'multi-select', 'multiselect']);
const BOOLEAN_TRUE_VALUES = new Set(['true', '1', 'yes', 'y', 'on']);
const BOOLEAN_FALSE_VALUES = new Set(['false', '0', 'no', 'n', 'off']);

const toLowerCase = (value) => (typeof value === 'string' ? value.toLowerCase() : value);

const tryParseJson = (value) => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return value;
  }

  const firstChar = trimmed[0];
  const shouldAttemptParse = firstChar === '{' || firstChar === '[';

  if (!shouldAttemptParse) {
    return value;
  }

  try {
    return JSON.parse(trimmed);
  } catch (error) {
    return value;
  }
};

const parseBoolean = (value) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();

    if (BOOLEAN_TRUE_VALUES.has(normalized)) {
      return true;
    }

    if (BOOLEAN_FALSE_VALUES.has(normalized)) {
      return false;
    }
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  return Boolean(value);
};

const parseNumeric = (value) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const parsed = Number(value.trim());

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
};

export const parseGameOptionValue = (option) => {
  if (!option || typeof option !== 'object') {
    return undefined;
  }

  const { input_type: rawInputType, value } = option;
  const inputType = toLowerCase(rawInputType);

  if (NUMERIC_OPTION_TYPES.has(inputType)) {
    const numericValue = parseNumeric(value);
    return numericValue !== null ? numericValue : value;
  }

  if (inputType === 'boolean') {
    return parseBoolean(value);
  }

  if (JSON_OPTION_TYPES.has(inputType) || MULTI_VALUE_OPTION_TYPES.has(inputType)) {
    return tryParseJson(value);
  }

  if (typeof value === 'string') {
    return tryParseJson(value);
  }

  return value;
};

export const mapGameOptions = (options = []) => {
  return options.reduce(
    (accumulator, option) => {
      if (!option || typeof option !== 'object') {
        return accumulator;
      }

      const { input_name: inputName } = option;

      if (!inputName) {
        return accumulator;
      }

      const parsedValue = parseGameOptionValue(option);
      accumulator.values[inputName] = parsedValue;
      accumulator.meta[inputName] = { ...option };

      return accumulator;
    },
    { values: {}, meta: {} }
  );
};

export const normaliseGameDocument = (gameDocument) => {
  if (!gameDocument || typeof gameDocument !== 'object') {
    return {
      gameId: undefined,
      gameType: undefined,
      name: undefined,
      options: {},
      optionMeta: {},
      metadata: {}
    };
  }

  const { options: optionsArray = [], ...metadata } = gameDocument;
  const { values: options, meta: optionMeta } = mapGameOptions(optionsArray);

  const gameId = metadata.game_id ?? metadata.gameId;
  const gameType = metadata.game_template_name ?? metadata.gameType;
  const resolvedName = metadata.name ?? options.title ?? options.gameTitle;

  return {
    gameId,
    gameType,
    name: resolvedName,
    options,
    optionMeta,
    metadata
  };
};

export const buildGameConfigBase = (gameDocument) => {
  const { gameId, gameType, name, options, optionMeta, metadata } = normaliseGameDocument(gameDocument);
  const title = options.title ?? options.gameTitle ?? name ?? '';

  return {
    gameId,
    gameType,
    title,
    name: name ?? title,
    options,
    optionMeta,
    metadata
  };
};

export const cloneConfigValue = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => cloneConfigValue(item));
  }

  if (value && typeof value === 'object') {
    return { ...value };
  }

  return value;
};

export default normaliseGameDocument;
