import React from 'react';
import { Link } from 'react-router-dom';

const formatSeconds = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—';
  }
  return Number(value).toFixed(3);
};

const ResultsScreen = ({
  gameId,
  gameType,
  gameTitle,
  outcome,
  countdownSeconds,
  pressedAtSeconds,
  timeRemainingSeconds,
  score,
  submittedAt
}) => {
  const metrics = [
    typeof countdownSeconds !== 'undefined'
      ? { label: 'Countdown Duration', value: `${formatSeconds(countdownSeconds)}s` }
      : null,
    { label: 'Pressed At', value: `${formatSeconds(pressedAtSeconds)}s` },
    { label: 'Time Remaining', value: `${formatSeconds(timeRemainingSeconds)}s` },
    { label: 'Accuracy Score', value: `${formatSeconds(score)}s` }
  ].filter(Boolean);

  const metaItems = [
    gameType ? { label: 'Game Type', value: gameType } : null,
    gameId ? { label: 'Game ID', value: gameId } : null,
    submittedAt
      ? { label: 'Submitted At', value: new Date(submittedAt).toLocaleString() }
      : null
  ].filter(Boolean);

  const resolvedOutcome = outcome || 'Completed';

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 py-16 px-4 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-16 left-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-sky-500/25 blur-3xl" />
        <div className="absolute bottom-0 right-10 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute bottom-16 left-12 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center gap-10 text-center">
        <header className="space-y-4">
          <p className="text-sm uppercase tracking-[0.35em] text-sky-300">Precision Timer</p>
          <h2 className="text-4xl font-semibold text-white drop-shadow">Countdown Results</h2>
          {gameTitle && <p className="text-lg text-slate-200">{gameTitle}</p>}
        </header>

        <span className="rounded-full border border-sky-400/40 bg-slate-900/70 px-6 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-sky-200">
          {resolvedOutcome}
        </span>

        <div className="w-full overflow-hidden rounded-[2rem] border border-slate-800/70 bg-slate-900/80 p-10 text-left shadow-2xl shadow-sky-900/30 backdrop-blur">
          <dl className="grid gap-5 sm:grid-cols-2">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
                <dt className="text-xs uppercase tracking-[0.25em] text-slate-400">{metric.label}</dt>
                <dd className="mt-3 text-3xl font-semibold text-white">{metric.value}</dd>
              </div>
            ))}
          </dl>

          {metaItems.length > 0 && (
            <dl className="mt-8 grid gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-6 text-sm text-slate-300 sm:grid-cols-2">
              {metaItems.map((item) => (
                <div key={item.label} className="flex flex-col gap-1">
                  <dt className="text-xs uppercase tracking-[0.25em] text-slate-500">{item.label}</dt>
                  <dd className="text-base text-slate-200">{item.value}</dd>
                </div>
              ))}
            </dl>
          )}

          <p className="mt-8 rounded-2xl border border-sky-500/20 bg-sky-500/10 px-6 py-4 text-sm text-sky-100">
            A lower accuracy score means you stopped the timer closer to zero. Keep practicing to hone your instinctive timing.
          </p>
        </div>

        <Link
          to="/"
          className="rounded-full border border-sky-400/40 px-6 py-2 text-sm font-medium text-sky-100 transition hover:border-sky-300 hover:text-white"
        >
          Back to Store
        </Link>
      </div>
    </div>
  );
};

export default ResultsScreen;
