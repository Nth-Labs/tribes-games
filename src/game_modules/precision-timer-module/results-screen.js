import React, { useMemo } from 'react';
import './precision-timer-styles.css';

const formatSeconds = (value) => {
  if (value === null || typeof value === 'undefined') {
    return '—';
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '—';
  }

  return numeric.toFixed(3);
};

const pick = (object, keys, fallback = null) => {
  for (const key of keys) {
    if (object && Object.prototype.hasOwnProperty.call(object, key)) {
      return object[key];
    }
  }
  return fallback;
};

const buildTheme = (config) => {
  const palette = config?.theme || {};
  return {
    backgroundFrom: palette.background_from || palette.background || '#0f172a',
    backgroundTo: palette.background_to || palette.highlight || '#2563eb',
    surface: palette.surface || '#ffffff',
    surfaceText: palette.surface_text || '#0f172a',
    accent: palette.highlight || '#2563eb',
    accentSoft: palette.highlight_soft || '#dbeafe',
    accentContrast: palette.highlight_contrast || '#ffffff',
    stopAccent: palette.accent || '#f97316',
    subtleText: palette.subtle_text || '#64748b',
  };
};

const withOpacity = (color, opacity) => {
  if (!color) {
    return `rgba(0, 0, 0, ${opacity})`;
  }

  if (color.startsWith('#')) {
    const normalized = color.slice(1);
    const hex =
      normalized.length === 3
        ? normalized
            .split('')
            .map((char) => char + char)
            .join('')
        : normalized.padEnd(6, '0').slice(0, 6);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  return color;
};

const mapScoreBreakdown = (scoreBreakdown) => {
  if (!scoreBreakdown || typeof scoreBreakdown !== 'object') {
    return [];
  }

  return Object.entries(scoreBreakdown).map(([key, value]) => ({
    key,
    label: key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase()),
    value: typeof value === 'number' ? value.toLocaleString() : value,
  }));
};

const PrecisionTimerResultsScreen = ({ config, result, onPlayAgain, onBack }) => {
  const theme = buildTheme(config);
  const containerStyle = useMemo(
    () => ({
      backgroundImage: `linear-gradient(135deg, ${theme.backgroundFrom}, ${theme.backgroundTo})`,
      color: theme.surfaceText,
    }),
    [theme],
  );

  const cardStyle = useMemo(
    () => ({
      backgroundColor: theme.surface,
      color: theme.surfaceText,
      border: `1px solid ${withOpacity(theme.accentSoft, 0.4)}`,
    }),
    [theme],
  );
  const heading = pick(config, ['results_heading', 'resultsHeading'], 'Countdown Summary');
  const retryLabel = pick(config, ['retry_button_label', 'retryButtonLabel'], 'Play again');
  const backLabel = pick(config, ['back_button_label', 'backButtonLabel'], 'Back to games');

  const countdownSeconds =
    pick(result, ['countdownSeconds', 'countdown_seconds']) ??
    pick(result?.rawResponse, ['countdown_seconds']);
  const pressedAtSeconds = pick(result, ['pressedAtSeconds', 'pressed_at_seconds']);
  const timeRemainingSeconds = pick(result, ['timeRemainingSeconds', 'time_remaining_seconds']);
  const accuracyScore = pick(result, ['score']);
  const outcome = pick(result, ['outcome'], 'Completed');
  const submittedAt = pick(result, ['submittedAt', 'submitted_at']);

  const metrics = [
    countdownSeconds != null
      ? { label: 'Countdown duration', value: `${formatSeconds(countdownSeconds)}s` }
      : null,
    pressedAtSeconds != null
      ? { label: 'Pressed at', value: `${formatSeconds(pressedAtSeconds)}s` }
      : null,
    timeRemainingSeconds != null
      ? { label: 'Time remaining', value: `${formatSeconds(timeRemainingSeconds)}s` }
      : null,
    accuracyScore != null
      ? { label: 'Accuracy score', value: `${formatSeconds(accuracyScore)}s` }
      : null,
  ].filter(Boolean);

  const scoreBreakdown = mapScoreBreakdown(
    pick(result, ['scoreBreakdown', 'score_breakdown'], {}) || {},
  );

  const prizes = Array.isArray(result?.prizes) ? result.prizes : [];
  const configRewards = Array.isArray(config?.rewards) ? config.rewards : [];
  const displayRewards = prizes.length > 0 ? prizes : configRewards;
  const rewardTitle = prizes.length > 0 ? 'Unlocked rewards' : 'Reward thresholds';

  return (
    <div className="precision-timer-results" style={containerStyle}>
      <div className="precision-timer-results__card" style={cardStyle}>
        <header className="precision-timer-results__header">
          <p
            className="precision-timer-results__eyebrow"
            style={{
              backgroundColor: withOpacity(theme.accentSoft, 0.8),
              color: theme.accent,
            }}
          >
            Precision Timer
          </p>
          <h2 className="precision-timer-results__title" style={{ color: theme.surfaceText }}>
            {heading}
          </h2>
          <p className="precision-timer-results__meta" style={{ color: theme.subtleText }}>
            Outcome: {outcome}
          </p>
          {submittedAt && (
            <p className="precision-timer-results__note" style={{ color: withOpacity(theme.subtleText, 0.85) }}>
              Submitted at {new Date(submittedAt).toLocaleString()}
            </p>
          )}
        </header>

        {metrics.length > 0 && (
          <dl className="precision-timer-results__metrics">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="precision-timer-results__metric"
                style={{
                  backgroundColor: withOpacity(theme.accentSoft, 0.2),
                  border: `1px solid ${withOpacity(theme.accentSoft, 0.6)}`,
                }}
              >
                <dt
                  className="precision-timer-results__metric-label"
                  style={{ color: theme.subtleText }}
                >
                  {metric.label}
                </dt>
                <dd
                  className="precision-timer-results__metric-value"
                  style={{ color: theme.surfaceText }}
                >
                  {metric.value}
                </dd>
              </div>
            ))}
          </dl>
        )}

        {scoreBreakdown.length > 0 && (
          <section>
            <h3
              className="precision-timer-results__section-title"
              style={{ color: theme.accent }}
            >
              Score breakdown
            </h3>
            <ul className="precision-timer-results__breakdown">
              {scoreBreakdown.map((item) => (
                <li
                  key={item.key}
                  className="precision-timer-results__breakdown-item"
                  style={{
                    backgroundColor: withOpacity(theme.accentSoft, 0.18),
                    border: `1px solid ${withOpacity(theme.accentSoft, 0.55)}`,
                  }}
                >
                  <p
                    className="precision-timer-results__breakdown-label"
                    style={{ color: theme.subtleText }}
                  >
                    {item.label}
                  </p>
                  <p
                    className="precision-timer-results__breakdown-value"
                    style={{ color: theme.surfaceText }}
                  >
                    {item.value}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {displayRewards.length > 0 && (
          <section>
            <h3
              className="precision-timer-results__section-title"
              style={{ color: theme.accent }}
            >
              {rewardTitle}
            </h3>
            <ul className="precision-timer-results__rewards">
              {displayRewards.map((reward) => {
                const threshold = pick(reward, ['threshold']);
                const name = pick(reward, ['title', 'name'], 'Reward');
                const description = pick(reward, ['description', 'details']);
                return (
                  <li
                    key={`${name}-${threshold}`}
                    className="precision-timer-results__reward"
                    style={{
                      backgroundColor: withOpacity(theme.accentSoft, 0.18),
                      border: `1px solid ${withOpacity(theme.accentSoft, 0.55)}`,
                    }}
                  >
                    <p
                      className="precision-timer-results__reward-title"
                      style={{ color: theme.surfaceText }}
                    >
                      {name}
                    </p>
                    {description && (
                      <p
                        className="precision-timer-results__reward-description"
                        style={{ color: withOpacity(theme.subtleText, 0.85) }}
                      >
                        {description}
                      </p>
                    )}
                    {typeof threshold === 'number' && (
                      <p
                        className="precision-timer-results__reward-threshold"
                        style={{ color: theme.subtleText }}
                      >
                        Threshold: ≤ {formatSeconds(threshold)}s
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <div className="precision-timer-results__actions">
          <button
            type="button"
            onClick={onPlayAgain}
            className="precision-timer-results__button precision-timer-results__button--primary"
            style={{
              backgroundColor: theme.accent,
              color: theme.accentContrast,
            }}
          >
            {retryLabel}
          </button>
          {typeof onBack === 'function' && (
            <button
              type="button"
              onClick={onBack}
              className="precision-timer-results__button precision-timer-results__button--secondary"
              style={{
                borderColor: withOpacity(theme.accentSoft, 0.6),
                color: theme.surfaceText,
              }}
            >
              {backLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrecisionTimerResultsScreen;
