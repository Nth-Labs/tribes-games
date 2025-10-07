import React, { useEffect, useRef, useState } from 'react';
import ResultsScreen from './results-screen';
import samplePrecisionTimerGameDocument from './sample-game-document';

const formatSeconds = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '0.000';
  }
  return numeric.toFixed(3);
};

const parseCountdownSeconds = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 5;
  }
  return numeric;
};

const resolveConfigValue = (config, keys, fallback) => {
  for (const key of keys) {
    if (config && Object.prototype.hasOwnProperty.call(config, key)) {
      return config[key];
    }
  }
  return fallback;
};

const PrecisionTimerGame = ({ config = samplePrecisionTimerGameDocument, onBack }) => {
  const countdownSeconds = parseCountdownSeconds(
    resolveConfigValue(config, ['countdownSeconds', 'countdown_seconds'], 5),
  );
  const startLabel =
    resolveConfigValue(config, ['startButtonLabel', 'start_button_label'], null) || 'Start';
  const stopLabel =
    resolveConfigValue(config, ['stopButtonLabel', 'stop_button_label'], null) || 'Stop';

  const [displaySeconds, setDisplaySeconds] = useState(() => formatSeconds(countdownSeconds));
  const [status, setStatus] = useState('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const startTimeRef = useRef(null);
  const targetTimeRef = useRef(null);
  const intervalRef = useRef(null);
  const hasFinalisedRef = useRef(false);

  useEffect(() => () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (status === 'idle') {
      setDisplaySeconds(formatSeconds(countdownSeconds));
    }
  }, [countdownSeconds, status]);

  const startCountdown = () => {
    if (status !== 'idle') {
      return;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const now = Date.now();
    startTimeRef.current = now;
    targetTimeRef.current = now + countdownSeconds * 1000;
    hasFinalisedRef.current = false;

    setDisplaySeconds(formatSeconds(countdownSeconds));
    setStatus('counting');

    intervalRef.current = setInterval(() => {
      const remainingMs = targetTimeRef.current - Date.now();

      if (remainingMs <= 0) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setDisplaySeconds('0.000');
        finaliseResult({ reason: 'timeout', stopTime: targetTimeRef.current });
        return;
      }

      setDisplaySeconds(formatSeconds(remainingMs / 1000));
    }, 50);
  };

  const stopCountdown = () => {
    if (status !== 'counting' || hasFinalisedRef.current) {
      return;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const stopTime = Date.now();
    const remainingMs = targetTimeRef.current - stopTime;
    setDisplaySeconds(formatSeconds(remainingMs / 1000));
    finaliseResult({ reason: 'player', stopTime });
  };

  const finaliseResult = ({ reason, stopTime }) => {
    if (hasFinalisedRef.current) {
      return;
    }

    hasFinalisedRef.current = true;
    setStatus('submitting');
    setIsSubmitting(true);

    const startedAt = startTimeRef.current || stopTime;
    const resolvedStopTime = stopTime || Date.now();

    let pressedAtSeconds = null;
    let timeRemainingSeconds = null;
    let score = null;

    if (reason === 'timeout') {
      timeRemainingSeconds = 0;
      score = Number(countdownSeconds.toFixed(3));
    } else {
      const deltaMs = targetTimeRef.current - resolvedStopTime;
      timeRemainingSeconds = Number((deltaMs / 1000).toFixed(3));
      pressedAtSeconds = Number(((resolvedStopTime - startedAt) / 1000).toFixed(3));
      score = Number(Math.abs(deltaMs / 1000).toFixed(3));
    }

    const payload = {
      gameId: resolveConfigValue(config, ['gameId', 'game_id'], ''),
      gameType: resolveConfigValue(config, ['gameType', 'game_type'], 'precision-timer'),
      gameTitle: config?.title,
      outcome: reason === 'timeout' ? 'Missed' : 'Completed',
      countdownSeconds,
      pressedAtSeconds,
      timeRemainingSeconds,
      score,
    };

    const endpoint =
      resolveConfigValue(config, ['submissionEndpoint', 'submission_endpoint'], null) ||
      `/api/${payload.gameType || 'precision-timer'}/${payload.gameId || 'demo'}`;

    mockSubmitResults(endpoint, payload)
      .then((response) => {
        setResult(response);
        setStatus('submitted');
      })
      .catch((error) => {
        console.warn('[PrecisionTimer] Failed to submit results, falling back to mock payload.', error);
        setResult({ ...payload, submissionEndpoint: endpoint, submittedAt: new Date().toISOString() });
        setStatus('submitted');
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const handlePlayAgain = () => {
    setResult(null);
    setStatus('idle');
    setDisplaySeconds(formatSeconds(countdownSeconds));
    startTimeRef.current = null;
    targetTimeRef.current = null;
    hasFinalisedRef.current = false;
  };

  const statusLabels = {
    idle: 'Ready',
    counting: 'Counting down',
    submitting: 'Submitting',
    submitted: 'Complete',
  };

  const statusMessage = (() => {
    switch (status) {
      case 'counting':
        return 'Trust your instincts and stop the countdown as close to zero as you can.';
      case 'submitting':
        return 'Locking in your timing—hang tight while we record the results.';
      case 'submitted':
        return 'Great timing! Review your summary below.';
      default:
        return 'Start the countdown when you are ready and aim for absolute precision.';
    }
  })();

  if (result) {
    return (
      <ResultsScreen
        config={config}
        result={result}
        onPlayAgain={handlePlayAgain}
        onBack={onBack}
      />
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 py-16 px-4 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-sky-500/25 blur-3xl" />
        <div className="absolute bottom-0 right-12 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute -bottom-20 left-8 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center gap-10">
        <header className="space-y-3 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-sky-300">Precision Timer</p>
          <h2 className="text-4xl font-semibold text-white drop-shadow">{config?.title}</h2>
          {config?.subtitle && <p className="text-lg text-slate-300">{config.subtitle}</p>}
          {config?.description && (
            <p className="mx-auto max-w-2xl text-base text-slate-400">{config.description}</p>
          )}
        </header>

        <div className="relative w-full overflow-hidden rounded-[2rem] border border-slate-800/60 bg-slate-900/70 p-10 text-center shadow-2xl shadow-sky-900/30 backdrop-blur">
          <div className="absolute inset-x-16 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/60 to-transparent" />
          <div className="flex flex-col items-center gap-10">
            <div className="flex flex-col items-center gap-4">
              <span className="rounded-full border border-sky-400/60 bg-slate-900/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-sky-200">
                {statusLabels[status] || statusLabels.idle}
              </span>
              <div className="relative">
                <div className="absolute inset-0 -translate-y-6 scale-125 rounded-full bg-sky-500/25 blur-3xl" />
                <div className="relative flex h-56 w-56 items-center justify-center rounded-full border border-sky-400/40 bg-slate-950/80 shadow-[0_22px_45px_rgba(15,23,42,0.55)]">
                  <div className="absolute inset-4 rounded-full border border-sky-500/20 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 shadow-inner shadow-[inset_0_-8px_18px_rgba(15,23,42,0.55)]" />
                  <span className="relative text-6xl font-mono font-semibold tabular-nums text-sky-100">{displaySeconds}</span>
                </div>
              </div>
            </div>

            <div className="grid w-full gap-4 text-left text-sm text-slate-300 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                <h3 className="text-xs uppercase tracking-[0.25em] text-slate-400">Challenge</h3>
                <p className="mt-2 text-slate-200">
                  Stop the timer as close to zero as possible. Every millisecond counts towards your final score.
                </p>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Countdown duration</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{formatSeconds(countdownSeconds)}s</p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p>Press stop the moment you sense the final second vanish.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={startCountdown}
                disabled={status !== 'idle'}
                className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-emerald-400 via-sky-500 to-indigo-500 px-8 py-3 text-lg font-semibold text-white shadow-[0_18px_35px_rgba(14,116,144,0.45)] transition-transform disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span className="relative drop-shadow-[0_2px_6px_rgba(6,182,212,0.5)]">{startLabel}</span>
              </button>
              <button
                type="button"
                onClick={stopCountdown}
                disabled={status !== 'counting'}
                className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 px-8 py-3 text-lg font-semibold text-white shadow-[0_18px_35px_rgba(190,24,93,0.45)] transition-transform disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span className="relative drop-shadow-[0_2px_6px_rgba(249,115,22,0.5)]">{stopLabel}</span>
              </button>
            </div>

            <div className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 p-5 text-sm text-slate-200">
              <p>{statusMessage}</p>
              {status === 'counting' && (
                <p className="mt-2 text-xs uppercase tracking-[0.25em] text-slate-500">
                  Countdown began at {formatSeconds(countdownSeconds)} seconds
                </p>
              )}
              {isSubmitting && !result && (
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.3em] text-sky-300" role="status" aria-live="polite">
                  Submitting results…
                </p>
              )}
            </div>

            {typeof onBack === 'function' && (
              <button
                type="button"
                onClick={onBack}
                className="mt-2 text-sm font-medium text-slate-300 underline-offset-2 hover:text-white hover:underline"
              >
                Back to games
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const mockSubmitResults = (url, payload) =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        ...payload,
        submissionEndpoint: url,
        submittedAt: new Date().toISOString(),
      });
    }, 600);
  });

export default PrecisionTimerGame;
