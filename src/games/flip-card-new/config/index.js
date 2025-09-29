const unwrapMongoValue = (value) => {
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

const toCleanString = (value) => {
  const unwrapped = unwrapMongoValue(value);
  if (typeof unwrapped === 'string') {
    return unwrapped.trim();
  }
  if (typeof unwrapped === 'number' && Number.isFinite(unwrapped)) {
    return `${unwrapped}`;
  }
  return '';
};

const toTitleCase = (value) => {
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
        const type = toCleanString(card?.type) || toTitleCase(image.split('/').pop()?.split('.')?.[0]) || `Card ${index + 1}`;
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

const flipCardNewConfig = {
  _id: { $oid: '68d802d09d7be2b64fcdcca4' },
  game_id: '863242b1-e221-4d36-b2b7-7bf31090a749',
  game_template_id: 'flip-card-new-uuid',
  game_type: 'flip-card-new',
  merchant_id: '39aa65fc-6011-70c3-3031-9dc9145858f9',
  name: 'Test Game 1',
  title: 'Azure Breeze Flip Challenge SHAH',
  subtitle: 'Match the pairs before you run out of moves.',
  game_background_image: '/images/pattern-bg.png',
  game_logo_image: '/images/matching-game-assets/white-tiffin-assets/white-tiffin-logo.png',
  move_limit: { $numberInt: '8' },
  initial_reveal_seconds: { $numberInt: '3' },
  card_upflip_seconds: { $numberDouble: '1.2' },
  hard_play_count_limit: { $numberInt: '20' },
  play_count: { $numberInt: '0' },
  distribution_type: 'score_threshold',
  primary_color: '#fdfaf5',
  secondary_color: '#7DD3FC',
  tertiary_color: '#FDE0AB',
  card_back_image: '/images/matching-game-assets/white-tiffin-assets/white-tiffin-logo.png',
  image_1: '/images/matching-game-assets/white-tiffin-assets/mee-siam-with-prawns.png',
  image_2: '/images/matching-game-assets/white-tiffin-assets/local-trio.png',
  image_3: '/images/matching-game-assets/white-tiffin-assets/nasi-lemak-beef.png',
  image_4: '/images/matching-game-assets/white-tiffin-assets/chicken-curry.png',
  image_5: '/images/matching-game-assets/white-tiffin-assets/trio-snack-platter.png',
  image_6: '/images/matching-game-assets/white-tiffin-assets/fish-maw-seafood-soup.png',
  image_7: '/images/matching-game-assets/pokemon-assets/bulbasaur.png',
  image_8: '/images/matching-game-assets/pokemon-assets/arcanine.png',
  prizes: {
    prize_1: {
      min_score: { $numberInt: '10' },
      type: 'Voucher',
      voucher_batch_id: '6b5bc5ac-a788-496a-a10f-280d4fcd6202'
    },
    prize_2: {
      min_score: { $numberInt: '0' },
      type: 'Voucher',
      voucher_batch_id: 'deff4b12-dd2f-43c5-ac3a-d56079d6462b'
    }
  },
  start_date: { $date: { $numberLong: '1758986555527' } },
  end_date: { $date: { $numberLong: '1760628155000' } },
  status: 'Active',
  is_active: false,
  createdAt: { $date: { $numberLong: '1758986961614' } },
  updatedAt: { $date: { $numberLong: '1759126494152' } }
};

export const flipCardNewCards = deriveCardsFromData(flipCardNewConfig);

export const flipCardNewCardImages = flipCardNewCards
  .map((card) => (typeof card?.image === 'string' ? card.image : null))
  .filter(Boolean);

export default flipCardNewConfig;
