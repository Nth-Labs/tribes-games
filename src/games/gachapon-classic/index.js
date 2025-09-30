import React, { useEffect, useMemo, useState } from 'react';
import GachaponClassicGame from './gachapon-classic';
import sampleGachaponClassicGameDocument from './sample-game-document';
import { toCleanString } from './config';

const mockFetchGachaponClassicConfig = () =>
  new Promise((resolve, reject) => {
    try {
      setTimeout(() => {
        if (typeof structuredClone === 'function') {
          resolve(structuredClone(sampleGachaponClassicGameDocument));
          return;
        }

        resolve(JSON.parse(JSON.stringify(sampleGachaponClassicGameDocument)));
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
  <div className="p-4 text-center text-light">
    <h3 className="fw-semibold">Game failed to load</h3>
    <p className="text-muted">{message}</p>
    {onBack && (
      <button type="button" onClick={onBack} className="btn btn-primary mt-3">
        Go back
      </button>
    )}
  </div>
);

const LoadingState = () => (
  <div className="d-flex justify-content-center align-items-center p-5 text-light">Loading…</div>
);

export default function GachaponClassicGameInit({ onBack }) {
  const [config, setConfig] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    setError(null);

    mockFetchGachaponClassicConfig()
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
            ? fetchError.message || 'Failed to load the gachapon configuration.'
            : 'Failed to load the gachapon configuration.';
        setError(message);
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

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

  return <GachaponClassicGame config={config} />;
}

export { createThemeFromConfig, derivePrizes } from './config';
