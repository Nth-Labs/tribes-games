import React, { useEffect, useMemo, useState } from 'react';
import GachaponResultsScreen from './gachapon-results-screen';
import { buildConfig } from './config';
import { buildDisplayPrizes, retrieveLuckdrawPrizes } from '../luckdraw-prizes';
import { buildTheme } from './theme';
import './gachapon.css';

const buildMockResult = (config) => {
  const prizes = config.prizes || [];
  const prize = prizes[Math.floor(Math.random() * prizes.length)];

  return {
    resultId: `mock-${Date.now()}`,
    outcome: prize ? `You won ${prize.name}` : 'Better luck next time',
    message: 'This is a mocked result. Connect to the backend to receive live data.',
    prize,
    voucherItems: [
      {
        id: 'voucher-fallback',
        label: 'Launch Voucher',
        code: 'DEMO-12345',
        expiresAt: '2024-12-31T23:59:59.000Z',
      },
    ],
  };
};

const mockPlay = (config) =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve(buildMockResult(config));
    }, 450);
  });

const playGachapon = async ({ config }) => {
  const shouldMock = !config?.play_endpoint || process.env.NODE_ENV !== 'production';

  if (shouldMock) {
    return mockPlay(config);
  }

  const payload = {
    game_id: config.game_id,
    game_template_id: config.game_template_id,
  };

  const response = await fetch(config.play_endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Play request failed with status ${response.status}`);
  }

  const data = await response.json();
  return {
    ...buildMockResult(config),
    ...data,
  };
};

const PrizeCard = ({ prize, theme }) => (
  <article
    className="prize-card"
    style={{
      background: `${theme.primaryColor}cc`,
      borderColor: `${theme.tertiaryColor}33`,
    }}
  >
    <div className="prize-card__media">
      <img src={prize.image} alt={prize.title} />
    </div>
    <div className="prize-card__content">
      <h4>{prize.title}</h4>
      <p>{prize.description}</p>
      {prize.voucherBatchId && (
        <p className="prize-card__meta">Batch: {prize.voucherBatchId}</p>
      )}
      {prize.probability && <p className="prize-card__meta">{prize.probability}</p>}
    </div>
  </article>
);

const GachaponGame = ({ config: rawConfig = {}, onBack }) => {
  const config = useMemo(() => buildConfig(rawConfig), [rawConfig]);
  const theme = useMemo(() => buildTheme(config), [config]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [prizesState, setPrizesState] = useState(() => ({
    items: buildDisplayPrizes(config.prizes),
    includeProbability: false,
    isLoading: true,
    error: null,
  }));

  useEffect(() => {
    let isActive = true;

    const loadPrizes = async () => {
      setPrizesState((previous) => ({
        ...previous,
        isLoading: true,
        error: null,
      }));

      try {
        const prizesResponse = await retrieveLuckdrawPrizes({
          config,
          endpoint: config.prizes_endpoint,
          fallbackPrizes: config.prizes,
        });

        if (!isActive) {
          return;
        }

        setPrizesState({
          items: prizesResponse.prizes,
          includeProbability: prizesResponse.includeProbability,
          isLoading: false,
          error: null,
        });
      } catch (prizeError) {
        if (!isActive) {
          return;
        }

        console.error('[Gachapon] Failed to load luck draw prizes', prizeError);
        setPrizesState((previous) => ({
          ...previous,
          isLoading: false,
          error: prizeError.message || 'Unable to load the prize list.',
        }));
      }
    };

    loadPrizes();

    return () => {
      isActive = false;
    };
  }, [config]);

  const handlePlay = async () => {
    if (isPlaying) {
      return;
    }
    setIsPlaying(true);
    setError(null);

    try {
      const payload = await playGachapon({ config });
      setResult(payload);
    } catch (playError) {
      console.error('[Gachapon] Failed to play', playError);
      setError(playError.message || 'Something went wrong. Please try again.');
    } finally {
      setIsPlaying(false);
    }
  };

  const machineImage =
    config.machine_image ||
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80';
  const backgroundImage =
    config.background_image ||
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1600&q=80';

  if (result) {
    return (
      <GachaponResultsScreen
        config={config}
        result={{ ...result, gameId: config.game_id }}
        onPlayAgain={() => setResult(null)}
        onBack={onBack}
      />
    );
  }

  return (
    <div
      className="gachapon-root"
      style={{
        backgroundImage: `linear-gradient(135deg, ${theme.primaryColor}cc, ${theme.secondaryColor}aa), url(${backgroundImage})`,
        color: theme.textColor,
      }}
    >
      <div
        className="gachapon-card"
        style={{
          background: `${theme.primaryColor}cc`,
          border: `1px solid ${theme.borderColor}`,
        }}
      >
        <header className="gachapon-header">
          <p style={{ color: theme.tertiaryColor, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {config.subtitle || 'Instant Prize Capsule'}
          </p>
          <h1>{config.title || config.name}</h1>
          <p style={{ color: theme.mutedTextColor }}>{config.instructions}</p>
        </header>

        <div className="machine-wrapper">
          <img src={machineImage} alt="Gachapon machine" className="machine-image" />

          <div
            className="machine-panel"
            style={{
              background: `${theme.primaryColor}88`,
              border: `1px solid ${theme.borderColor}`,
            }}
          >
            <h3>Launch a capsule</h3>
            <p>Each play dispenses a capsule containing one of the featured rewards below.</p>
            <button
              type="button"
              onClick={handlePlay}
              disabled={isPlaying}
              className="gachapon-button"
              style={{
                background: theme.secondaryColor,
                color: theme.primaryColor,
              }}
            >
              {isPlaying ? 'Rolling…' : 'Play now'}
            </button>
            {error && <p className="gachapon-error">{error}</p>}
            <button
              type="button"
              onClick={onBack}
              className="gachapon-button"
              style={{
                background: 'transparent',
                border: `1px solid ${theme.borderColor}`,
                color: theme.textColor,
                boxShadow: 'none',
              }}
            >
              Back
            </button>
          </div>
        </div>

        <section className="prizes-section">
          <div className="prizes-section__header">
            <h2>Available prizes</h2>
            {prizesState.isLoading && <span className="prizes-section__status">Loading…</span>}
          </div>
          {prizesState.error ? (
            <p className="prizes-section__status prizes-section__status--error">
              {prizesState.error}
            </p>
          ) : (
            <div className="prize-gallery">
              {prizesState.items.map((prize) => (
                <PrizeCard key={prize.id} prize={prize} theme={theme} />
              ))}
            </div>
          )}
          {prizesState.includeProbability && !prizesState.error && !prizesState.isLoading && (
            <p className="prizes-section__footnote">Probabilities shown are provided by the backend.</p>
          )}
        </section>
      </div>
    </div>
  );
};

export default GachaponGame;
