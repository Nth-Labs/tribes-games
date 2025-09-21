import gachaponConfig from './config';

const FETCH_DELAY_MS = 700;
const ATTEMPT_DELAY_MS = 1100;

const clonePrize = (prize) => ({
  ...prize,
  weight: Number.isFinite(prize?.weight) && prize.weight > 0 ? prize.weight : 0,
});

const getPrizesFromConfig = (config) => {
  if (!config) {
    return [];
  }

  const rawPrizes = Array.isArray(config.prizes) ? config.prizes : [];
  return rawPrizes.map((prize) => clonePrize(prize));
};

const pickWeightedPrize = (weightedPrizes) => {
  if (!Array.isArray(weightedPrizes) || weightedPrizes.length === 0) {
    return null;
  }

  const totalWeight = weightedPrizes.reduce((sum, entry) => sum + entry.weight, 0);

  if (totalWeight <= 0) {
    return weightedPrizes[0];
  }

  let threshold = Math.random() * totalWeight;

  for (const entry of weightedPrizes) {
    threshold -= entry.weight;
    if (threshold <= 0) {
      return entry;
    }
  }

  return weightedPrizes[weightedPrizes.length - 1];
};

const resolveFlairText = (prize, config) => {
  const defaultFlair =
    typeof config?.defaultFlairText === 'string' && config.defaultFlairText.trim()
      ? config.defaultFlairText
      : gachaponConfig.defaultFlairText ?? 'The capsule cracks open in a burst of light! 🎉';

  if (typeof prize?.flairText === 'string' && prize.flairText.trim()) {
    return prize.flairText;
  }

  return defaultFlair;
};

export const fetchAvailablePrizes = (config = gachaponConfig) =>
  new Promise((resolve, reject) => {
    const prizes = getPrizesFromConfig(config);

    setTimeout(() => {
      if (!prizes.length) {
        reject(new Error('No gachapon prizes configured'));
        return;
      }

      resolve(prizes.map((prize) => ({ ...prize })));
    }, FETCH_DELAY_MS);
  });

export const attemptGachapon = (config = gachaponConfig) =>
  new Promise((resolve, reject) => {
    const prizes = getPrizesFromConfig(config);

    if (!prizes.length) {
      reject(new Error('No gachapon prizes configured'));
      return;
    }

    const weightedPrizes = prizes.map((prize) => ({ prize, weight: prize.weight }));
    const totalWeight = weightedPrizes.reduce((sum, entry) => sum + entry.weight, 0);

    if (totalWeight <= 0) {
      reject(new Error('Gachapon prizes require a positive weight'));
      return;
    }

    const selectedEntry = pickWeightedPrize(weightedPrizes) ?? weightedPrizes[0];
    const selectedPrize = selectedEntry?.prize ?? prizes[0];
    const flairText = resolveFlairText(selectedPrize, config);

    setTimeout(() => {
      resolve({
        attemptId: `attempt-${Date.now()}`,
        prize: { ...selectedPrize },
        flairText,
        awardedAt: new Date().toISOString(),
      });
    }, ATTEMPT_DELAY_MS);
  });
