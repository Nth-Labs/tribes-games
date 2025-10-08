import axios from '../flip-card-module/axios-lite';

const BACKEND = process.env.REACT_APP_BACKEND_URL || '';

const toNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const pick = (object, candidates, fallback = null) => {
  for (const key of candidates) {
    if (object && Object.prototype.hasOwnProperty.call(object, key)) {
      return object[key];
    }
  }
  return fallback;
};

const normaliseScoreThresholdResponse = (response = {}, payload = {}) => {
  const results = payload?.results || {};
  const gameId = payload?.game_id || payload?.gameId || null;
  const gameTemplateId = payload?.game_template_id || payload?.gameTemplateId || null;

  const countdownSeconds =
    pick(results, ['countdown_seconds', 'countdownSeconds']) ?? toNumber(results.countdown);
  const pressedAtSeconds = pick(results, ['pressed_at_seconds', 'pressedAtSeconds']);
  const timeRemainingSeconds = pick(results, ['time_remaining_seconds', 'timeRemainingSeconds']);
  const score = pick(results, ['score', 'accuracy']);
  const outcome = pick(results, ['outcome']) || pick(response, ['outcome'], 'Completed');
  const startedAt = pick(results, ['started_at', 'startedAt']);
  const completedAt = pick(results, ['completed_at', 'completedAt']);

  const scoreBreakdown =
    pick(response, ['score_breakdown', 'scoreBreakdown']) ||
    pick(results, ['score_breakdown', 'scoreBreakdown']) ||
    {};

  const prizes = Array.isArray(response?.prizes)
    ? response.prizes
    : Array.isArray(results?.prizes)
    ? results.prizes
    : [];

  return {
    gameId,
    gameTemplateId,
    countdownSeconds,
    pressedAtSeconds,
    timeRemainingSeconds,
    score,
    outcome,
    startedAt,
    completedAt,
    scoreBreakdown,
    prizes,
    rawResponse: response,
    submittedAt:
      pick(response, ['submitted_at', 'submittedAt']) ||
      pick(results, ['submitted_at', 'submittedAt']) ||
      new Date().toISOString(),
    reward: pick(response, ['reward']),
    message:
      pick(response, ['message', 'status_message']) ||
      pick(results, ['message']) ||
      null,
  };
};

export const submitScoreThresholdResults = async ({
  url = '/api/games/score_threshold',
  payload,
  idToken,
}) => {
  if (!payload) {
    throw new Error('A payload is required to submit score threshold results.');
  }

  const fullUrl = `${BACKEND}${url}`;
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  if (idToken) {
    headers.Authorization = `Bearer ${idToken}`;
  }

  try {
    const response = await axios.post(fullUrl, payload, { headers });
    return normaliseScoreThresholdResponse(response?.data, payload);
  } catch (error) {
    console.error('[PrecisionTimer][API] Score threshold submission failed', {
      url,
      error,
      response: error?.response?.data,
    });
    throw error;
  }
};

export { normaliseScoreThresholdResponse };
