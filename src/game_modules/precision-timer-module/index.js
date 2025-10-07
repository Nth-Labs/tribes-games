import React, { useEffect, useMemo, useState } from 'react';
import PrecisionTimerGame from './precision-timer-game';
import samplePrecisionTimerGameDocument from './sample-game-document';

const mockFetchPrecisionTimerConfig = () =>
  new Promise((resolve, reject) => {
    try {
      setTimeout(() => {
        if (typeof structuredClone === 'function') {
          resolve(structuredClone(samplePrecisionTimerGameDocument));
          return;
        }

        resolve(JSON.parse(JSON.stringify(samplePrecisionTimerGameDocument)));
      }, 250);
    } catch (error) {
      reject(error);
    }
  });

const ErrorState = ({ message, onBack }) => (
  <div className="p-6 text-center">
    <h3 className="text-xl font-semibold text-slate-100">Unable to launch Precision Timer</h3>
    <p className="mt-2 text-slate-300">{message}</p>
    {onBack && (
      <button
        type="button"
        onClick={onBack}
        className="mt-4 rounded-full bg-slate-900 px-4 py-2 text-white shadow"
      >
        Back to library
      </button>
    )}
  </div>
);

const LoadingState = () => (
  <div className="flex items-center justify-center p-10 text-slate-200">Loading configuration…</div>
);

export default function PrecisionTimerGameInit({
  config: externalConfig,
  onBack,
  fetchConfig = mockFetchPrecisionTimerConfig,
}) {
  const [config, setConfig] = useState(() => externalConfig || null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(() => !externalConfig);

  const loadConfig = useMemo(
    () => (typeof fetchConfig === 'function' ? fetchConfig : mockFetchPrecisionTimerConfig),
    [fetchConfig],
  );

  useEffect(() => {
    let cancelled = false;

    if (externalConfig) {
      setConfig(externalConfig);
      setError(null);
      setIsLoading(false);

      return () => {
        cancelled = true;
      };
    }

    setConfig(null);
    setIsLoading(true);
    setError(null);

    loadConfig()
      .then((data) => {
        if (cancelled) {
          return;
        }

        if (!data) {
          throw new Error('The Precision Timer configuration was not found.');
        }

        setConfig(data);
        setIsLoading(false);
      })
      .catch((fetchError) => {
        if (cancelled) {
          return;
        }

        const message =
          fetchError instanceof Error
            ? fetchError.message || 'Failed to fetch the Precision Timer configuration.'
            : 'Failed to fetch the Precision Timer configuration.';

        setError(message);
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [externalConfig, loadConfig]);

  if (error) {
    return <ErrorState message={error} onBack={onBack} />;
  }

  if (isLoading) {
    return <LoadingState />;
  }

  if (!config?.game_template_id && !config?.game_template_name) {
    return (
      <ErrorState
        message="This Precision Timer experience is missing a template id. Check the configuration and try again."
        onBack={onBack}
      />
    );
  }

  return <PrecisionTimerGame config={config} onBack={onBack} />;
}

export { default as samplePrecisionTimerGameDocument } from './sample-game-document';
