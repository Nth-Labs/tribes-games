const rarityOrder = ['legendary', 'epic', 'rare', 'uncommon', 'common'];

const defaultRarityLabels = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

const defaultRarityCapsuleColors = {
  common: '#E5E7EB',
  uncommon: '#86EFAC',
  rare: '#93C5FD',
  epic: '#C4B5FD',
  legendary: '#FDE68A',
};

const baseFallbackImage =
  'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=900&q=80';

const toArray = (value) => (Array.isArray(value) ? value : []);

const readString = (value, fallback = '') => {
  if (typeof value !== 'string') {
    return fallback;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : fallback;
};

const toPositiveNumber = (value, fallback) => {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return fallback;
};

const toNonNegativeInteger = (value, fallback) => {
  const parsed = Math.floor(Number(value));
  if (Number.isFinite(parsed) && parsed >= 0) {
    return parsed;
  }
  return fallback;
};

const normaliseRarity = (value, fallback = 'common') => {
  if (typeof value !== 'string') {
    return fallback;
  }
  const cleaned = value.trim().toLowerCase();
  return rarityOrder.includes(cleaned) ? cleaned : fallback;
};

const resolveRarityLabel = (rarity, provided) => {
  if (provided) {
    return provided;
  }
  const fallback = defaultRarityLabels[rarity];
  if (fallback) {
    return fallback;
  }
  return rarity.charAt(0).toUpperCase() + rarity.slice(1);
};

const buildPrize = (prize, index, defaultFlairText, defaultCapsuleColor) => {
  const rarity = normaliseRarity(prize?.rarity);
  const weight = toPositiveNumber(prize?.weight, 1);
  const flairText = readString(prize?.flairText ?? prize?.flair_text, defaultFlairText);
  const capsuleColor =
    readString(prize?.capsuleColor ?? prize?.capsule_color, '') ||
    defaultRarityCapsuleColors[rarity] ||
    defaultCapsuleColor;

  return {
    id: prize?.id || `prize-${index + 1}`,
    name: readString(prize?.name, `Prize ${index + 1}`),
    description: readString(
      prize?.description,
      'Configure prize copy in the template.',
    ),
    rarity,
    rarityLabel: resolveRarityLabel(rarity, prize?.rarityLabel ?? prize?.rarity_label),
    image:
      readString(prize?.image, '') ||
      readString(prize?.image_url, '') ||
      baseFallbackImage,
    weight,
    flairText,
    capsuleColor,
    probabilityLabel: readString(prize?.probability ?? prize?.odds ?? prize?.chance, ''),
  };
};

const normalisePrizes = (prizes = [], defaultFlairText, defaultCapsuleColor) => {
  const items = toArray(prizes)
    .map((prize, index) => buildPrize(prize, index, defaultFlairText, defaultCapsuleColor))
    .filter(Boolean);

  if (!items.length) {
    return [
      buildPrize(
        {
          id: 'gachapon-placeholder',
          name: 'Mystery Capsule',
          description: 'Update the template with your actual prizes.',
          rarity: 'common',
          capsuleColor: defaultCapsuleColor,
          flairText: defaultFlairText,
        },
        0,
        defaultFlairText,
        defaultCapsuleColor,
      ),
    ];
  }

  return items.sort((a, b) => rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity));
};

const createPrizeDictionary = (prizes) =>
  prizes.reduce((accumulator, prize) => {
    accumulator[prize.id] = prize;
    return accumulator;
  }, {});

const baseDefaultFlairText = 'The capsule cracks open in a burst of light! 🎉';
const baseDefaultCapsuleColor = '#38bdf8';

export const buildConfig = (data = {}) => {
  const defaultFlairText = readString(
    data.default_flair_text ?? data.defaultFlairText,
    baseDefaultFlairText,
  );
  const defaultCapsuleColor =
    readString(data.default_capsule_color ?? data.defaultCapsuleColor, '') ||
    readString(data.secondary_color ?? data.secondaryColor, '') ||
    baseDefaultCapsuleColor;

  const prizes = normalisePrizes(data.prizes, defaultFlairText, defaultCapsuleColor);

  return {
    ...data,
    title: readString(data.title, readString(data.name, 'Gachapon Game')),
    tagline: readString(data.subtitle ?? data.tagline),
    description: readString(data.instructions ?? data.description),
    ctaLabel: readString(data.cta_label ?? data.ctaLabel, 'Start Gachapon'),
    preparingLabel: readString(data.preparing_label ?? data.preparingLabel, 'Dispensing…'),
    resultModalTitle: readString(data.result_modal_title ?? data.resultModalTitle, 'Gachapon Result'),
    capsuleMachineLabel: readString(
      data.capsule_machine_label ?? data.capsuleMachineLabel,
      'Capsule Machine',
    ),
    capsuleStatusIdleLabel: readString(
      data.capsule_status_idle_label ?? data.capsuleStatusIdleLabel,
      'Ready',
    ),
    capsuleStatusPreparingLabel: readString(
      data.capsule_status_preparing_label ?? data.capsuleStatusPreparingLabel,
      'Preparing…',
    ),
    capsuleStatusShakingLabel: readString(
      data.capsule_status_shaking_label ?? data.capsuleStatusShakingLabel,
      'Shaking…',
    ),
    capsuleStatusOpeningLabel: readString(
      data.capsule_status_opening_label ?? data.capsuleStatusOpeningLabel,
      'Opening…',
    ),
    capsuleStatusResultLabel: readString(
      data.capsule_status_result_label ?? data.capsuleStatusResultLabel,
      'Capsule opened!',
    ),
    capsuleDescription: readString(
      data.capsule_description ?? data.capsuleDescription,
      'Every shake builds anticipation before the capsule bursts open to reveal your prize.',
    ),
    prizeShowcaseTitle: readString(
      data.prize_showcase_title ?? data.prizeShowcaseTitle,
      'Prize Showcase',
    ),
    prizeShowcaseDescription: readString(
      data.prize_showcase_description ?? data.prizeShowcaseDescription,
      'Browse every prize currently loaded into the capsule.',
    ),
    prizeListLoadingText: readString(
      data.prize_list_loading_text ?? data.prizeListLoadingText,
      'Loading prize lineup…',
    ),
    prizeListErrorText: readString(
      data.prize_list_error_text ?? data.prizeListErrorText,
      'We could not load the prize list. Please refresh to try again.',
    ),
    attemptErrorText: readString(
      data.attempt_error_text ?? data.attemptErrorText,
      'Something interrupted the gachapon attempt. Please try again.',
    ),
    defaultFlairText,
    defaultCapsuleColor,
    shakeDurationMs: toNonNegativeInteger(data.shake_duration_ms ?? data.shakeDurationMs, 1200),
    explosionDurationMs: toNonNegativeInteger(
      data.explosion_duration_ms ?? data.explosionDurationMs,
      650,
    ),
    prizes,
    prizeDictionary: createPrizeDictionary(prizes),
  };
};

export const mergeDisplayPrizes = (displayPrizes, config) => {
  const basePrizes = config.prizes || [];
  const byId = config.prizeDictionary || {};
  const merged = [];
  const seen = new Set();

  toArray(displayPrizes).forEach((item, index) => {
    const fallback = byId[item?.id] || basePrizes[index] || basePrizes[0];
    if (!fallback) {
      return;
    }

    const mergedPrize = {
      ...fallback,
      id: item?.id || fallback.id || `display-${index}`,
      name: readString(item?.title, fallback.name),
      description: readString(item?.description, fallback.description),
      image: readString(item?.image, fallback.image),
      probabilityLabel: readString(item?.probability, fallback.probabilityLabel),
    };

    merged.push(mergedPrize);
    seen.add(mergedPrize.id);
  });

  basePrizes.forEach((prize) => {
    if (!seen.has(prize.id)) {
      merged.push(prize);
    }
  });

  return merged;
};

export const normaliseResult = (payload = {}, config = {}) => {
  const byId = config.prizeDictionary || {};
  const basePrize = payload?.prize?.id ? byId[payload.prize.id] : null;
  const fallbackPrize = basePrize || config.prizes?.[0];

  const resolvedFallback =
    fallbackPrize ||
    buildPrize(
      {
        id: 'gachapon-result-placeholder',
        name: 'Mystery Capsule',
        description: 'Configure prize copy in the template.',
        rarity: 'common',
      },
      0,
      config.defaultFlairText || baseDefaultFlairText,
      config.defaultCapsuleColor || baseDefaultCapsuleColor,
    );

  const mergedPrize = {
    ...resolvedFallback,
    ...(payload?.prize || {}),
  };

  const rarity = normaliseRarity(mergedPrize.rarity, resolvedFallback.rarity);

  const finalPrize = {
    ...resolvedFallback,
    ...mergedPrize,
    rarity,
    rarityLabel: resolveRarityLabel(rarity, mergedPrize.rarityLabel ?? mergedPrize.rarity_label),
    capsuleColor:
      readString(mergedPrize.capsuleColor ?? mergedPrize.capsule_color, '') ||
      resolvedFallback.capsuleColor ||
      config.defaultCapsuleColor ||
      baseDefaultCapsuleColor,
    flairText: readString(mergedPrize.flairText ?? mergedPrize.flair_text, resolvedFallback.flairText),
    weight: toPositiveNumber(mergedPrize.weight, resolvedFallback.weight ?? 1),
  };

  return {
    ...payload,
    resultId: payload?.resultId ?? `result-${Date.now()}`,
    outcome: payload?.outcome ?? `You won ${finalPrize.name}`,
    message: payload?.message ?? 'Collect your rewards below.',
    flairText:
      readString(payload?.flairText ?? payload?.flair_text, '') ||
      finalPrize.flairText ||
      config.defaultFlairText ||
      baseDefaultFlairText,
    prize: finalPrize,
  };
};
