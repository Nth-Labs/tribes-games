import React, { useEffect, useMemo, useRef, useState } from 'react';
import ResultsScreen from './results-screen';
import samplePrecisionTimerGameDocument from './sample-game-document';
import {
  normaliseScoreThresholdResponse,
  submitScoreThresholdResults,
} from './score-threshold-service';
import './precision-timer-styles.css';

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
      border: `1px solid ${withOpacity(theme.outline, 0.4)}`,
    }),
    [theme],
  );

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
    <div className="precision-timer" style={containerStyle}>
      <div className="precision-timer__card" style={cardStyle}>
        <header className="precision-timer__header">
          <p
            className="precision-timer__eyebrow"
            style={{
              backgroundColor: withOpacity(theme.accentSoft, 0.8),
              color: theme.accent,
            }}
          >
            Precision Timer
          </p>
          <h1 className="precision-timer__title" style={{ color: theme.surfaceText }}>
            {title}
          </h1>
          {subtitle && (
            <p className="precision-timer__subtitle" style={{ color: theme.subtleText }}>
              {subtitle}
            </p>
          )}
          {instructions && (
            <p
              className="precision-timer__instructions"
              style={{ color: withOpacity(theme.subtleText, 0.85) }}
            >
              {instructions}
            </p>
          )}
        </header>

        <div className="precision-timer__countdown-wrapper">
          <span
            className="precision-timer__status-chip"
            style={{
              backgroundColor: withOpacity(theme.accentSoft, 0.6),
              color: theme.accent,
            }}
          >
            {statusLabels[status] || statusLabels.idle}
          </span>
          <div
            className="precision-timer__countdown"
            style={{
              borderColor: theme.accent,
              boxShadow: `inset 0 0 0 8px ${withOpacity(theme.accentSoft, 0.5)}`,
              color: theme.surfaceText,
            }}
          >
            {displaySeconds}
          </div>
          <p className="precision-timer__status-copy" style={{ color: theme.subtleText }}>
            {statusMessage}
          </p>
        </div>

        <dl
          className="precision-timer__stats"
          style={{
            backgroundColor: withOpacity(theme.accentSoft, 0.25),
            color: theme.surfaceText,
          }}
        >
          <div>
            <dt className="precision-timer__stat-label" style={{ color: theme.subtleText }}>
              Countdown
            </dt>
            <dd className="precision-timer__stat-value">{formatSeconds(countdownSeconds)}s</dd>
          </div>
          <div>
            <dt className="precision-timer__stat-label" style={{ color: theme.subtleText }}>
              Target
            </dt>
            <dd className="precision-timer__stat-value">Tap stop at zero</dd>
          </div>
        </dl>

        <div className="precision-timer__actions">
          <button
            type="button"
            onClick={startCountdown}
            disabled={status !== 'idle'}
            className="precision-timer__button precision-timer__button--start"
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
            className="precision-timer__button precision-timer__button--stop"
            style={{
              backgroundColor: theme.stopAccent,
              color: theme.stopContrast,
              opacity: status !== 'counting' ? 0.65 : 1,
            }}
          >
            {stopLabel}
          </button>
        </div>

        <div
          className="precision-timer__note"
          style={{
            backgroundColor: withOpacity(theme.accentSoft, 0.15),
            color: withOpacity(theme.subtleText, 0.95),
          }}
        >
          {isSubmitting && (
            <p className="precision-timer__status-copy" role="status" aria-live="polite">
              Submitting your results…
            </p>
          )}
          {!isSubmitting && (
            <p className="precision-timer__status-copy">
              {status === 'idle'
                ? 'Press start to launch the countdown.'
                : 'Focus on the rhythm of the timer and trust your instincts.'}
            </p>
          )}
        </div>

        {typeof onBack === 'function' && (
          <button
            type="button"
            onClick={onBack}
            className="precision-timer__back-button"
            style={{ color: withOpacity(theme.subtleText, 0.9) }}
          >
            Back to games
          </button>
        )}
      </div>
    </div>
  );
};

export default PrecisionTimerGame;
