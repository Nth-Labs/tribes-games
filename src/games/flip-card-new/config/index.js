export const unwrapMongoValue = (value) => {
  if (value && typeof value === 'object') {
    if (value.$numberInt !== undefined) {
      return unwrapMongoValue(value.$numberInt);
    }
    if (value.$numberDouble !== undefined) {
      return unwrapMongoValue(value.$numberDouble);
    }
    if (value.$numberLong !== undefined) {
      return unwrapMongoValue(value.$numberLong);
    }
    if (value.$numberDecimal !== undefined) {
      return unwrapMongoValue(value.$numberDecimal);
    }
    if (value.$oid !== undefined) {
      return unwrapMongoValue(value.$oid);
    }
    if (value.$date !== undefined) {
      return unwrapMongoValue(value.$date);
    }
    if (value.value !== undefined) {
      return unwrapMongoValue(value.value);
    }
  }

  return value;
};

export const toCleanString = (value) => {
  const unwrapped = unwrapMongoValue(value);
  if (typeof unwrapped === 'string') {
    return unwrapped.trim();
  }
  if (typeof unwrapped === 'number' && Number.isFinite(unwrapped)) {
    return `${unwrapped}`;
  }
  return '';
};

export const toTitleCase = (value) => {
  const input = toCleanString(value);
  if (!input) {
    return '';
  }

  return input
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
};

const parseCardsArray = (rawCards) => {
  if (!rawCards) {
    return [];
  }

  if (Array.isArray(rawCards)) {
    return rawCards;
  }

  const asString = toCleanString(rawCards);
  if (!asString) {
    return [];
  }

  try {
    const parsed = JSON.parse(asString);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const buildCardFromSource = (image, index) => {
  const cleaned = toCleanString(image);
  if (!cleaned) {
    return null;
  }

  const fileName = cleaned.split('/').pop() ?? '';
  const baseName = fileName.includes('.') ? fileName.slice(0, fileName.lastIndexOf('.')) : fileName;
  const label = toTitleCase(baseName) || `Card ${index + 1}`;

  return {
    id: `card-${index + 1}`,
    type: label,
    image: cleaned,
    altText: `${label} card artwork`
  };
};

export const deriveCardsFromData = (data) => {
  if (!data || typeof data !== 'object') {
    return [];
  }

  const parsedCards = parseCardsArray(data.cards);
  if (parsedCards.length > 0) {
    return parsedCards
      .map((card, index) => {
        const image = toCleanString(card?.image);
        if (!image) {
          return null;
        }

        const id = toCleanString(card?.id) || `card-${index + 1}`;
        const type =
          toCleanString(card?.type) ||
          toTitleCase(image.split('/').pop()?.split('.')?.[0]) ||
          `Card ${index + 1}`;
        const altText = toCleanString(card?.altText) || `${type} card artwork`;

        return {
          id,
          type,
          image,
          altText
        };
      })
      .filter(Boolean);
  }

  const imageEntries = Object.entries(data)
    .filter(([key, value]) => /^image_\d+$/.test(key) && typeof unwrapMongoValue(value) !== 'object')
    .map(([key, value]) => ({ key, value: toCleanString(value) }))
    .filter(({ value }) => Boolean(value))
    .sort((a, b) => a.key.localeCompare(b.key, undefined, { numeric: true }));

  return imageEntries
    .map(({ value }, index) => buildCardFromSource(value, index))
    .filter(Boolean);
};
