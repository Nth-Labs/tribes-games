import React, { useMemo, useState } from 'react';
import ScratchCardResultsScreen from './scratch-card-results-screen';
import { buildTheme } from './theme';
import './scratch-card.css';

const mockReveal = (config) => ({
  resultId: `mock-${Date.now()}`,
  outcome: 'You unlocked a voucher!',
  message: 'Connect a backend endpoint to serve the live reveal.',
  reveal: '✨✨✨',
  voucherItems: [
    {
      id: 'mock-card',
      title: 'Launch Drink Voucher',
      description: 'Redeemable for any handcrafted beverage.',
      code: 'SCRATCH-DEMO-01',
    },
  ],
});

const revealScratchCard = async ({ config }) => {
  if (!config?.reveal_endpoint) {
    return mockReveal(config);
  }

  const payload = {
    game_id: config.game_id,
    game_template_id: config.game_template_id,
  };

  const response = await fetch(config.reveal_endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Reveal request failed with status ${response.status}`);
  }

  const data = await response.json();
  return {
    ...mockReveal(config),
    ...data,
  };
};

const ScratchCardGame = ({ config = {}, onBack }) => {
  const theme = useMemo(() => buildTheme(config), [config]);
  const [result, setResult] = useState(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [error, setError] = useState(null);

  const overlayImage =
    config.overlay_pattern ||
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80';
  const cardBackground =
    config.card_background_image ||
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80';

  const handleReveal = async () => {
    if (isRevealing) {
      return;
    }
    setIsRevealing(true);
    setError(null);

    try {
      const payload = await revealScratchCard({ config });
      setResult(payload);
    } catch (revealError) {
      console.error('[ScratchCard] Failed to reveal', revealError);
      setError(revealError.message || 'We could not complete the reveal. Please try again.');
    } finally {
      setIsRevealing(false);
    }
  };

  if (result) {
    return (
      <ScratchCardResultsScreen
        config={config}
        result={{ ...result, gameId: config.game_id }}
        onPlayAgain={() => setResult(null)}
        onBack={onBack}
      />
    );
  }

  return (
    <div
      className="scratch-root"
      style={{
        backgroundImage: `linear-gradient(135deg, ${theme.primaryColor}cc, ${theme.tertiaryColor}aa), url(${config.background_image})`,
        color: theme.textColor,
      }}
    >
      <div
        className="scratch-card"
        style={{
          background: `${theme.primaryColor}cc`,
          border: `1px solid ${theme.borderColor}`,
        }}
      >
        <header className="scratch-header">
          <p style={{ color: theme.tertiaryColor, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {config.subtitle || 'Digital scratch experience'}
          </p>
          <h1>{config.title || config.name}</h1>
          <p style={{ color: theme.mutedTextColor }}>{config.prize}</p>
        </header>

        <div
          className="scratch-area"
          style={{ backgroundImage: `url(${cardBackground})`, backgroundSize: 'cover' }}
        >
          <div className="scratch-overlay">
            <img src={overlayImage} alt="Scratch overlay" />
          </div>
          <div className="scratch-content">
            <h2>Scratch here</h2>
            <p>Click reveal to uncover tonight&apos;s reward.</p>
          </div>
        </div>

        <div className="scratch-actions">
          <button
            type="button"
            className="scratch-button"
            style={{
              background: theme.secondaryColor,
              color: theme.primaryColor,
            }}
            disabled={isRevealing}
            onClick={handleReveal}
          >
            {isRevealing ? 'Revealing…' : 'Reveal reward'}
          </button>
          <button
            type="button"
            className="scratch-button"
            style={{
              background: 'transparent',
              border: `1px solid ${theme.borderColor}`,
              color: theme.textColor,
              boxShadow: 'none',
            }}
            onClick={onBack}
          >
            Back
          </button>
          {error && <p style={{ color: theme.tertiaryColor }}>{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default ScratchCardGame;
