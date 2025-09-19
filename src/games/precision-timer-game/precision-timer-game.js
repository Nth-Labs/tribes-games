import React, { useEffect, useRef, useState } from 'react';
import precisionTimerConfig from './config';
import ResultsScreen from './results-screen';

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

const PrecisionTimerGame = ({ config = precisionTimerConfig }) => {
  const countdownSeconds = parseCountdownSeconds(config?.countdownSeconds);
  const [displaySeconds, setDisplaySeconds] = useState(() => formatSeconds(countdownSeconds));
  const [status, setStatus] = useState('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const startTimeRef = useRef(null);
  const targetTimeRef = useRef(null);
  const intervalRef = useRef(null);
  const hasFinalisedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
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
      gameId: config?.gameId,
      gameType: config?.gameType,
      gameTitle: config?.title,
      outcome: reason === 'timeout' ? 'Missed' : 'Completed',
      countdownSeconds,
      pressedAtSeconds,
      timeRemainingSeconds,
      score
    };

    const endpoint = config?.submissionEndpoint || `/api/${config?.gameType}/${config?.gameId}`;

    mockSubmitResults(endpoint, payload)
      .then((response) => {
        setResult(response);
        setStatus('submitted');
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  if (result) {
    return <ResultsScreen {...result} />;
  }

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-10 text-center">
      <header className="space-y-2">
        <h2 className="text-3xl font-semibold">{config?.title}</h2>
        {config?.subtitle && <p className="text-lg text-gray-600">{config.subtitle}</p>}
        {config?.description && (
          <p className="max-w-2xl text-gray-500">{config.description}</p>
        )}
      </header>

      <div className="flex flex-col items-center gap-4">
        <div className="rounded-lg border border-gray-200 bg-white px-8 py-6 shadow-sm">
          <span className="text-6xl font-mono tabular-nums text-gray-800">{displaySeconds}</span>
        </div>
        <p className="text-sm text-gray-500">
          Stop the timer as close to zero as possible. The smaller the difference, the better your score.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={startCountdown}
            disabled={status !== 'idle'}
            className="rounded-md bg-blue-600 px-5 py-2 text-white shadow disabled:cursor-not-allowed disabled:opacity-60"
          >
            {config?.startButtonLabel || 'Start'}
          </button>
          <button
            type="button"
            onClick={stopCountdown}
            disabled={status !== 'counting'}
            className="rounded-md bg-emerald-600 px-5 py-2 text-white shadow disabled:cursor-not-allowed disabled:opacity-60"
          >
            {config?.stopButtonLabel || 'Stop'}
          </button>
        </div>
      </div>

      {status === 'counting' && (
        <p className="text-sm text-gray-500">
          Countdown started from {formatSeconds(countdownSeconds)} seconds. Press stop to lock in your attempt.
        </p>
      )}

      {isSubmitting && !result && (
        <p className="text-sm font-medium text-gray-600" role="status" aria-live="polite">
          Submitting results...
        </p>
      )}
    </div>
  );
};

const mockSubmitResults = (url, payload) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        ...payload,
        submittedAt: new Date().toISOString(),
        submissionEndpoint: url
      });
    }, 900);
  });
};

export default PrecisionTimerGame;
