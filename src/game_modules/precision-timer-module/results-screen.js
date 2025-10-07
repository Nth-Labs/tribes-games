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

const buildTheme = (config) => {
  const defaults = {
    background: '#020617',
    panel: 'rgba(15, 23, 42, 0.85)',
    highlight: '#38bdf8',
    accent: '#f97316',
    text: '#f8fafc',
  };

  return {
    ...defaults,
    ...(config?.theme || {}),
  };
};

const PrecisionTimerResultsScreen = ({ config, result, onPlayAgain, onBack }) => {
  const theme = buildTheme(config);
  const heading = config?.results_heading || 'Countdown Results';
  const retryLabel = config?.retry_button_label || 'Play again';
  const backLabel = config?.back_button_label || 'Back to games';

  const metrics = [
    result?.countdownSeconds != null
      ? { label: 'Countdown duration', value: `${formatSeconds(result.countdownSeconds)}s` }
      : null,
    result?.pressedAtSeconds != null
      ? { label: 'Pressed at', value: `${formatSeconds(result.pressedAtSeconds)}s` }
      : null,
    result?.timeRemainingSeconds != null
      ? { label: 'Time remaining', value: `${formatSeconds(result.timeRemainingSeconds)}s` }
      : null,
    result?.score != null
      ? { label: 'Accuracy score', value: `${formatSeconds(result.score)}s` }
      : null,
  ].filter(Boolean);

  const rewards = Array.isArray(config?.rewards) ? config.rewards : [];

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-16"
      style={{
        background: theme.background,
        color: theme.text,
      }}
    >
      <div
        className="w-full max-w-3xl space-y-8 rounded-3xl border border-slate-800/60 p-10 text-center shadow-2xl"
        style={{
          background: theme.panel,
        }}
      >
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.35em]" style={{ color: theme.highlight }}>
            Precision Timer
          </p>
          <h2 className="text-3xl font-semibold text-white">{heading}</h2>
          {result?.outcome && (
            <p className="text-sm text-slate-300" style={{ color: theme.text }}>
              Outcome: {result.outcome}
            </p>
          )}
        </div>

        {metrics.length > 0 && (
          <dl className="grid gap-4 text-left sm:grid-cols-2">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-2xl border border-slate-800/60 bg-slate-950/40 p-6"
                style={{ borderColor: `${theme.highlight}33` }}
              >
                <dt className="text-xs uppercase tracking-[0.25em] text-slate-400">{metric.label}</dt>
                <dd className="mt-3 text-2xl font-semibold text-white">{metric.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {rewards.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-sm uppercase tracking-[0.3em]" style={{ color: theme.highlight }}>
              Reward thresholds
            </h3>
            <ul className="grid gap-3 text-left sm:grid-cols-2">
              {rewards.map((reward) => (
                <li
                  key={`${reward.threshold}-${reward.title}`}
                  className="rounded-2xl border border-slate-800/60 bg-slate-950/40 p-5"
                  style={{ borderColor: `${theme.accent}33` }}
                >
                  <p className="text-sm font-semibold text-white">
                    {reward.title || 'Reward'}
                  </p>
                  {reward.description && (
                    <p className="mt-1 text-sm text-slate-300" style={{ color: `${theme.text}cc` }}>
                      {reward.description}
                    </p>
                  )}
                  {typeof reward.threshold === 'number' && (
                    <p className="mt-2 text-xs uppercase tracking-[0.25em]" style={{ color: theme.accent }}>
                      &le; {formatSeconds(reward.threshold)}s
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onPlayAgain}
            className="w-full rounded-full px-6 py-2 text-sm font-semibold text-slate-950 shadow sm:w-auto"
            style={{ background: theme.highlight }}
          >
            {retryLabel}
          </button>
          <button
            type="button"
            onClick={onBack}
            className="w-full rounded-full border px-6 py-2 text-sm font-semibold sm:w-auto"
            style={{
              borderColor: `${theme.text}33`,
              color: theme.text,
            }}
          >
            {backLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrecisionTimerResultsScreen;
