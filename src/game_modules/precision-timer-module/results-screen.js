import React from 'react';

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
    <div
      className="flex min-h-screen items-center justify-center px-4 py-16"
      style={{
        backgroundImage: `linear-gradient(135deg, ${theme.backgroundFrom}, ${theme.backgroundTo})`,
        color: theme.surfaceText,
      }}
    >
      <div
        className="w-full max-w-3xl space-y-8 rounded-3xl border p-10 shadow-xl backdrop-blur"
        style={{
          background: theme.surface,
          borderColor: `${theme.accentSoft}40`,
          color: theme.surfaceText,
        }}
      >
        <header className="space-y-3 text-center">
          <p
            className="mx-auto inline-flex rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em]"
            style={{
              backgroundColor: `${theme.accentSoft}80`,
              color: theme.accent,
            }}
          >
            Precision Timer
          </p>
          <h2 className="text-3xl font-semibold text-slate-900" style={{ color: theme.surfaceText }}>
            {heading}
          </h2>
          <p className="text-sm" style={{ color: theme.subtleText }}>
            Outcome: {outcome}
          </p>
          {submittedAt && (
            <p className="text-xs" style={{ color: `${theme.subtleText}cc` }}>
              Submitted at {new Date(submittedAt).toLocaleString()}
            </p>
          )}
        </header>

        {metrics.length > 0 && (
          <dl className="grid gap-4 text-left sm:grid-cols-2">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-2xl border px-5 py-4"
                style={{
                  borderColor: `${theme.accentSoft}80`,
                  backgroundColor: `${theme.accentSoft}33`,
                }}
              >
                <dt className="text-xs uppercase tracking-[0.25em]" style={{ color: theme.subtleText }}>
                  {metric.label}
                </dt>
                <dd className="mt-2 text-2xl font-semibold" style={{ color: theme.surfaceText }}>
                  {metric.value}
                </dd>
              </div>
            ))}
          </dl>
        )}

        {scoreBreakdown.length > 0 && (
          <section className="space-y-3 text-left">
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em]" style={{ color: theme.accent }}>
              Score breakdown
            </h3>
            <ul className="grid gap-3 sm:grid-cols-2">
              {scoreBreakdown.map((item) => (
                <li
                  key={item.key}
                  className="rounded-2xl border px-4 py-3"
                  style={{
                    borderColor: `${theme.accentSoft}60`,
                    backgroundColor: `${theme.accentSoft}26`,
                  }}
                >
                  <p className="text-xs uppercase tracking-[0.2em]" style={{ color: theme.subtleText }}>
                    {item.label}
                  </p>
                  <p className="mt-1 text-base font-semibold" style={{ color: theme.surfaceText }}>
                    {item.value}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {displayRewards.length > 0 && (
          <section className="space-y-3 text-left">
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em]" style={{ color: theme.accent }}>
              {rewardTitle}
            </h3>
            <ul className="grid gap-3 sm:grid-cols-2">
              {displayRewards.map((reward) => {
                const threshold = pick(reward, ['threshold']);
                const name = pick(reward, ['title', 'name'], 'Reward');
                const description = pick(reward, ['description', 'details']);
                return (
                  <li
                    key={`${name}-${threshold}`}
                    className="rounded-2xl border px-4 py-4"
                    style={{
                      borderColor: `${theme.accentSoft}60`,
                      backgroundColor: `${theme.accentSoft}26`,
                    }}
                  >
                    <p className="text-base font-semibold" style={{ color: theme.surfaceText }}>
                      {name}
                    </p>
                    {description && (
                      <p className="mt-1 text-sm" style={{ color: `${theme.subtleText}cc` }}>
                        {description}
                      </p>
                    )}
                    {typeof threshold === 'number' && (
                      <p className="mt-2 text-xs uppercase tracking-[0.2em]" style={{ color: theme.subtleText }}>
                        Threshold: ≤ {formatSeconds(threshold)}s
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onPlayAgain}
            className="w-full rounded-full px-6 py-3 text-sm font-semibold shadow focus:outline-none focus:ring-2 focus:ring-offset-2 sm:w-auto"
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
              className="w-full rounded-full border px-6 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 sm:w-auto"
              style={{
                borderColor: `${theme.accentSoft}80`,
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
