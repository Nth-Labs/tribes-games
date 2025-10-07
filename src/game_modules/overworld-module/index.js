import React, { useEffect, useMemo, useState } from 'react';
import OverworldExplorerGame from './overworld-explorer';
import sampleOverworldGameDocument from './sample-game-document';

const mockFetchOverworldConfig = () =>
  new Promise((resolve, reject) => {
    try {
      setTimeout(() => {
        if (typeof structuredClone === 'function') {
          resolve(structuredClone(sampleOverworldGameDocument));
          return;
        }

        resolve(JSON.parse(JSON.stringify(sampleOverworldGameDocument)));
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

export default function OverworldExplorerInit({
  config: externalConfig,
  onBack,
  fetchConfig = mockFetchOverworldConfig,
}) {
  const [config, setConfig] = useState(() => externalConfig || null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(() => !externalConfig);

  const loadConfig = useMemo(
    () => (typeof fetchConfig === 'function' ? fetchConfig : mockFetchOverworldConfig),
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
            ? fetchError.message || 'Failed to load the overworld configuration.'
            : 'Failed to load the overworld configuration.';
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

  if (!config?.world?.tiles?.length) {
    return (
      <ErrorState
        message="This overworld is missing its map data. Update the configuration and try again."
        onBack={onBack}
      />
    );
  }

  return <OverworldExplorerGame config={config} onBack={onBack} />;
}

export { default as sampleOverworldGameDocument } from './sample-game-document';
