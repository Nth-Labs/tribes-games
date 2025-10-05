import React, { useEffect, useMemo, useState } from 'react';
import GachaponGame from './gachapon';
import sampleGachaponGameDocument from './sample-game-document';

const mockFetchGachaponConfig = () =>
  new Promise((resolve, reject) => {
    try {
      setTimeout(() => {
        if (typeof structuredClone === 'function') {
          resolve(structuredClone(sampleGachaponGameDocument));
          return;
        }
        resolve(JSON.parse(JSON.stringify(sampleGachaponGameDocument)));
      }, 250);
    } catch (error) {
      reject(error);
    }
  });

const ErrorState = ({ message, onBack }) => (
  <div className="p-6 text-center">
    <h3 className="text-xl font-semibold text-slate-900">Game failed to load</h3>
    <p className="mt-1 text-slate-600">{message}</p>
    {onBack && (
      <button
        type="button"
        onClick={onBack}
        className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-white"
      >
        Go back
      </button>
    )}
  </div>
);

const LoadingState = () => (
  <div className="flex items-center justify-center p-10 text-slate-600">Loading…</div>
);

export default function GachaponGameInit({
  config: externalConfig,
  onBack,
  fetchConfig = mockFetchGachaponConfig,
}) {
  const [config, setConfig] = useState(() => externalConfig || null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(() => !externalConfig);
  const loadConfig = useMemo(
    () => (typeof fetchConfig === 'function' ? fetchConfig : mockFetchGachaponConfig),
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
          throw new Error('Game configuration was not found.');
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
            ? fetchError.message || 'Failed to load the Gachapon configuration.'
            : 'Failed to load the Gachapon configuration.';
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

  if (!config?.game_template_id) {
    return (
      <ErrorState
        message="This game no longer exists or its configuration is missing."
        onBack={onBack}
      />
    );
  }

  return <GachaponGame config={config} onBack={onBack} />;
}

export { default as sampleGachaponGameDocument } from './sample-game-document';
