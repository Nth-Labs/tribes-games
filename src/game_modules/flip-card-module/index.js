import React, { useEffect, useMemo, useState } from 'react';
import FlipCardNewGame from './flip-card-new';
import sampleFlipCardNewGameDocument from './sample-game-document';
import { toCleanString } from './config';

const mockFetchFlipCardNewConfig = () =>
  new Promise((resolve, reject) => {
    try {
      setTimeout(() => {
        if (typeof structuredClone === 'function') {
          resolve(structuredClone(sampleFlipCardNewGameDocument));
          return;
        }

        resolve(JSON.parse(JSON.stringify(sampleFlipCardNewGameDocument)));
      }, 400);
    } catch (error) {
      reject(error);
    }
  });

const getGameIdentifier = (data) => {
  if (!data || typeof data !== 'object') {
    return '';
  }

  const snakeCaseId = toCleanString(data.game_id);
  if (snakeCaseId) {
    return snakeCaseId;
  }

  return toCleanString(data.gameId);
};

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

export default function FlipCardNewGameInit({ config: externalConfig, onBack, fetchConfig = mockFetchFlipCardNewConfig }) {
  const [config, setConfig] = useState(() => externalConfig || null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(() => !externalConfig);
  const loadConfig = useMemo(
    () => (typeof fetchConfig === 'function' ? fetchConfig : mockFetchFlipCardNewConfig),
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
            ? fetchError.message || 'Failed to load the Flip Card New configuration.'
            : 'Failed to load the Flip Card New configuration.';
        setError(message);
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [externalConfig, loadConfig]);

  const hasValidConfig = useMemo(() => Boolean(getGameIdentifier(config)), [config]);

  if (error) {
    return <ErrorState message={error} onBack={onBack} />;
  }

  if (isLoading) {
    return <LoadingState />;
  }

  if (!hasValidConfig) {
    return (
      <ErrorState
        message="This game no longer exists or its configuration is missing."
        onBack={onBack}
      />
    );
  }

  return <FlipCardNewGame config={config} onBack={onBack} />;
}

export { deriveCardsFromData } from './config';
