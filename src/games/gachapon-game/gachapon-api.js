import gachaponConfig from './config';

const FETCH_DELAY_MS = 700;
const ATTEMPT_DELAY_MS = 1100;

const clonePrize = (prize) => ({
  ...prize,
});

const getPrizesFromConfig = (config) => {
  if (!config) {
    return [];
  }

  const rawPrizes = Array.isArray(config.prizes) ? config.prizes : [];
  return rawPrizes.map((prize) => clonePrize(prize));
};

const pickRandomPrize = (prizes) => {
  if (!Array.isArray(prizes) || prizes.length === 0) {
    return null;
  }

  const index = Math.floor(Math.random() * prizes.length);
  return prizes[index] ?? prizes[0];
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

    const selectedPrize = pickRandomPrize(prizes) ?? prizes[0];
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
