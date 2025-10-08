import React, { useEffect, useMemo, useRef, useState } from 'react';
import ResultsScreen from './results-screen';
import samplePrecisionTimerGameDocument from './sample-game-document';
import {
  normaliseScoreThresholdResponse,
  submitScoreThresholdResults,
} from './score-threshold-service';

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

const buildTheme = (config) => {
  const palette = config?.theme || {};
  return {
    backgroundFrom: palette.background_from || palette.background || '#0f172a',
    backgroundTo: palette.background_to || palette.highlight || '#2563eb',
    surface: palette.surface || '#ffffff',
    surfaceText: palette.surface_text || '#0f172a',
    accent: palette.highlight || '#2563eb',
    accentContrast: palette.highlight_contrast || '#ffffff',
    accentSoft: palette.highlight_soft || '#dbeafe',
    stopAccent: palette.accent || '#f97316',
    stopContrast: palette.accent_contrast || '#0f172a',
    subtleText: palette.subtle_text || '#64748b',
    outline: palette.outline || '#cbd5f5',
  };
};

const PrecisionTimerGame = ({ config = samplePrecisionTimerGameDocument, onBack }) => {
  const countdownSeconds = parseCountdownSeconds(
    resolveConfigValue(config, ['countdownSeconds', 'countdown_seconds'], 5),
  );
  const startLabel =
    resolveConfigValue(config, ['startButtonLabel', 'start_button_label'], null) || 'Start';
  const stopLabel = resolveConfigValue(config, ['stopButtonLabel', 'stop_button_label'], null) || 'Stop';
  const instructions = resolveConfigValue(config, ['description', 'instructions'], null);
  const title = resolveConfigValue(config, ['title', 'name'], 'Precision Timer');
  const subtitle = resolveConfigValue(config, ['subtitle'], null);
  const theme = useMemo(() => buildTheme(config), [config]);
  const idToken = useMemo(
    () => resolveConfigValue(config, ['id_token', 'idToken'], null),
    [config],
  );
  const gameId = useMemo(
    () => resolveConfigValue(config, ['game_id', 'gameId'], ''),
    [config],
  );
  const gameTemplateId = useMemo(
    () => resolveConfigValue(config, ['game_template_id', 'gameTemplateId'], ''),
    [config],
  );
  const gameType = useMemo(
    () => resolveConfigValue(config, ['game_type', 'gameType'], 'precision-timer'),
    [config],
  );
  const playerId = useMemo(
    () => resolveConfigValue(config, ['player_id', 'playerId'], null),
    [config],
  );

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

    const startedAtMs = startTimeRef.current || stopTime || Date.now();
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
      pressedAtSeconds = Number(((resolvedStopTime - startedAtMs) / 1000).toFixed(3));
      score = Number(Math.abs(deltaMs / 1000).toFixed(3));
    }

    const startedAtIso = new Date(startedAtMs).toISOString();
    const completedAtIso = new Date(resolvedStopTime).toISOString();
    const outcome = reason === 'timeout' ? 'Missed' : 'Completed';

    const resultsPayload = {
      countdown_seconds: countdownSeconds,
      pressed_at_seconds: pressedAtSeconds,
      time_remaining_seconds: timeRemainingSeconds,
      score,
      outcome,
      started_at: startedAtIso,
      completed_at: completedAtIso,
    };

    const submissionPayload = {
      game_id: gameId,
      game_template_id: gameTemplateId,
      game_type: gameType,
      results: resultsPayload,
    };

    if (playerId) {
      submissionPayload.player_id = playerId;
    }

    if (config?.metadata) {
      submissionPayload.metadata = config.metadata;
    }

    if (idToken) {
      submissionPayload.id_token = idToken;
    }

    const fallbackResult = normaliseScoreThresholdResponse({}, submissionPayload);

    submitScoreThresholdResults({ payload: submissionPayload, idToken })
      .then((response) => {
        setResult(response || fallbackResult);
        setStatus('submitted');
      })
      .catch((error) => {
        console.warn('[PrecisionTimer] Falling back to local result after submission failure.', error);
        setResult({ ...fallbackResult, error });
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
    idle: 'Ready to begin',
    counting: 'Counting down',
    submitting: 'Submitting results',
    submitted: 'Complete',
  };

  const statusMessage = (() => {
    switch (status) {
      case 'counting':
        return 'Stay focused and hit stop when your internal clock reaches zero.';
      case 'submitting':
        return 'Recording your precision. Hold tight while we sync with the server.';
      case 'submitted':
        return 'Great timing! Review your summary below or try again for an even tighter score.';
      default:
        return 'Start the countdown when you are ready and see how close you can get to zero.';
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
    <div
      className="flex min-h-screen items-center justify-center px-4 py-16"
      style={{
        backgroundImage: `linear-gradient(135deg, ${theme.backgroundFrom}, ${theme.backgroundTo})`,
        color: theme.surfaceText,
      }}
    >
      <div
        className="w-full max-w-xl space-y-8 rounded-3xl border p-8 shadow-xl backdrop-blur"
        style={{
          background: theme.surface,
          borderColor: `${theme.outline}40`,
          color: theme.surfaceText,
        }}
      >
        <header className="space-y-2 text-center">
          <p
            className="mx-auto inline-flex rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em]"
            style={{
              backgroundColor: `${theme.accentSoft}80`,
              color: theme.accent,
            }}
          >
            Precision Timer
          </p>
          <h1 className="text-3xl font-semibold text-slate-900" style={{ color: theme.surfaceText }}>
            {title}
          </h1>
          {subtitle && (
            <p className="text-base" style={{ color: theme.subtleText }}>
              {subtitle}
            </p>
          )}
          {instructions && (
            <p className="text-sm" style={{ color: `${theme.subtleText}cc` }}>
              {instructions}
            </p>
          )}
        </header>

        <div className="flex flex-col items-center gap-6 text-center">
          <span
            className="rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em]"
            style={{
              backgroundColor: `${theme.accentSoft}60`,
              color: theme.accent,
            }}
          >
            {statusLabels[status] || statusLabels.idle}
          </span>
          <div className="flex h-48 w-48 items-center justify-center rounded-full border-4 text-6xl font-mono font-semibold tabular-nums shadow-inner"
            style={{
              borderColor: theme.accent,
              color: theme.surfaceText,
              boxShadow: `inset 0 0 0 8px ${theme.accentSoft}80`,
            }}
          >
            {displaySeconds}
          </div>
          <p className="text-sm" style={{ color: theme.subtleText }}>
            {statusMessage}
          </p>
        </div>

        <dl className="grid gap-4 rounded-2xl bg-white/40 p-5 text-left sm:grid-cols-2"
          style={{
            backgroundColor: `${theme.accentSoft}33`,
            color: theme.surfaceText,
          }}
        >
          <div>
            <dt className="text-xs uppercase tracking-[0.25em]" style={{ color: theme.subtleText }}>
              Countdown
            </dt>
            <dd className="mt-1 text-xl font-semibold">{formatSeconds(countdownSeconds)}s</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.25em]" style={{ color: theme.subtleText }}>
              Target
            </dt>
            <dd className="mt-1 text-xl font-semibold">Tap stop at zero</dd>
          </div>
        </dl>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button
            type="button"
            onClick={startCountdown}
            disabled={status !== 'idle'}
            className="w-full rounded-full px-6 py-3 text-base font-semibold shadow transition focus:outline-none focus:ring-2 focus:ring-offset-2 sm:w-auto"
            style={{
              backgroundColor: theme.accent,
              color: theme.accentContrast,
              opacity: status !== 'idle' ? 0.65 : 1,
            }}
          >
            {startLabel}
          </button>
          <button
            type="button"
            onClick={stopCountdown}
            disabled={status !== 'counting'}
            className="w-full rounded-full px-6 py-3 text-base font-semibold shadow transition focus:outline-none focus:ring-2 focus:ring-offset-2 sm:w-auto"
            style={{
              backgroundColor: theme.stopAccent,
              color: theme.stopContrast,
              opacity: status !== 'counting' ? 0.65 : 1,
            }}
          >
            {stopLabel}
          </button>
        </div>

        <div className="rounded-2xl px-5 py-4 text-sm"
          style={{
            backgroundColor: `${theme.accentSoft}26`,
            color: theme.subtleText,
          }}
        >
          {isSubmitting && (
            <p className="font-medium" role="status" aria-live="polite">
              Submitting your results…
            </p>
          )}
          {!isSubmitting && (
            <p>{status === 'idle' ? 'Press start to launch the countdown.' : 'Focus on the rhythm of the timer and trust your instincts.'}</p>
          )}
        </div>

        {typeof onBack === 'function' && (
          <button
            type="button"
            onClick={onBack}
            className="mx-auto block text-sm font-medium underline-offset-4 hover:underline"
            style={{ color: theme.subtleText }}
          >
            Back to games
          </button>
        )}
      </div>
    </div>
  );
};

export default PrecisionTimerGame;
