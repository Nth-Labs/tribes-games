import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ScratchCardResultsScreen from './scratch-card-results-screen';
import { buildTheme } from './theme';
import './scratch-card.css';

const buildMockRevealResult = (config) => ({
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

const mockReveal = (config) =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve(buildMockRevealResult(config));
    }, 450);
  });

const revealScratchCard = async ({ config }) => {
  const shouldMock = !config?.reveal_endpoint || process.env.NODE_ENV !== 'production';

  if (shouldMock) {
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
    ...buildMockRevealResult(config),
    ...data,
  };
};

const ScratchCardGame = ({ config = {}, onBack }) => {
  const theme = useMemo(() => buildTheme(config), [config]);
  const [result, setResult] = useState(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [error, setError] = useState(null);
  const [scratchProgress, setScratchProgress] = useState(0);
  const [isScratching, setIsScratching] = useState(false);
  const canvasRef = useRef(null);
  const strokeCounterRef = useRef(0);

  const overlayImage =
    config.overlay_pattern ||
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80';
  const cardBackground =
    config.card_background_image ||
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80';
  const pageBackground =
    config.background_image ||
    'https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?auto=format&fit=crop&w=1200&q=80';

  const resetCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * pixelRatio);
    canvas.height = Math.round(rect.height * pixelRatio);

    const context = canvas.getContext('2d');
    if (typeof context.reset === 'function') {
      context.reset();
    } else {
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
    context.scale(pixelRatio, pixelRatio);
    context.globalCompositeOperation = 'source-over';

    const gradient = context.createLinearGradient(0, 0, rect.width, rect.height);
    gradient.addColorStop(0, 'rgba(148, 163, 184, 0.95)');
    gradient.addColorStop(1, 'rgba(226, 232, 240, 0.95)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, rect.width, rect.height);

    setScratchProgress(0);
    strokeCounterRef.current = 0;
  }, []);

  useEffect(() => {
    if (result) {
      return undefined;
    }

    resetCanvas();
    const handleResize = () => {
      resetCanvas();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [resetCanvas, result]);

  const evaluateProgress = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const { width, height } = canvas;
    const pixels = context.getImageData(0, 0, width, height).data;

    let cleared = 0;
    for (let index = 3; index < pixels.length; index += 4) {
      if (pixels[index] === 0) {
        cleared += 1;
      }
    }

    const percent = Math.min(100, (cleared / (width * height)) * 100);
    setScratchProgress(percent);
  }, []);

  const scratchAt = useCallback(
    (event) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      const context = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (event.clientX - rect.left) * scaleX;
      const y = (event.clientY - rect.top) * scaleY;

      context.globalCompositeOperation = 'destination-out';
      const radius = 40;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
      context.globalCompositeOperation = 'source-over';

      strokeCounterRef.current += 1;
      if (strokeCounterRef.current % 6 === 0) {
        evaluateProgress();
      }
    },
    [evaluateProgress],
  );

  const handlePointerDown = useCallback(
    (event) => {
      if (result || isRevealing) {
        return;
      }
      setIsScratching(true);
      scratchAt(event);
    },
    [isRevealing, result, scratchAt],
  );

  const handlePointerMove = useCallback(
    (event) => {
      if (!isScratching) {
        return;
      }
      scratchAt(event);
    },
    [isScratching, scratchAt],
  );

  const handlePointerUp = useCallback(
    (event) => {
      if (isScratching) {
        evaluateProgress();
      }
      setIsScratching(false);
      if (canvasRef.current) {
        const pointerId = event.pointerId ?? event.nativeEvent?.pointerId;
        if (typeof pointerId === 'number') {
          canvasRef.current.releasePointerCapture?.(pointerId);
        }
      }
    },
    [evaluateProgress, isScratching],
  );

  const handlePointerCancel = useCallback(() => {
    setIsScratching(false);
  }, []);

  const handleReveal = useCallback(async () => {
    if (isRevealing || result) {
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
  }, [config, isRevealing, result]);

  useEffect(() => {
    if (scratchProgress >= 65 && !result && !isRevealing) {
      handleReveal();
    }
  }, [handleReveal, isRevealing, result, scratchProgress]);

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
        backgroundImage: `linear-gradient(135deg, ${theme.primaryColor}cc, ${theme.tertiaryColor}aa), url(${pageBackground})`,
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
          <div
            className="scratch-overlay"
            style={{ backgroundImage: `url(${overlayImage})` }}
          >
            <canvas
              ref={canvasRef}
              className={`scratch-canvas${isScratching ? ' is-scratching' : ''}${
                scratchProgress >= 99 ? ' is-complete' : ''
              }`}
              onPointerDown={(event) => {
                event.preventDefault();
                handlePointerDown(event);
                event.currentTarget.setPointerCapture?.(event.pointerId);
              }}
              onPointerMove={(event) => {
                event.preventDefault();
                handlePointerMove(event);
              }}
              onPointerUp={(event) => {
                event.preventDefault();
                handlePointerUp(event);
              }}
              onPointerLeave={(event) => {
                event.preventDefault();
                handlePointerUp(event);
              }}
              onPointerCancel={(event) => {
                event.preventDefault();
                handlePointerCancel();
              }}
            />
          </div>
          <div className="scratch-content">
            <h2>Scratch here</h2>
            <p>
              Reveal progress: {Math.round(scratchProgress)}%. Keep scratching to uncover your
              reward.
            </p>
          </div>
        </div>

        <div className="scratch-actions">
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
          {isRevealing && <p style={{ color: theme.tertiaryColor }}>Unsealing your reward…</p>}
        </div>
      </div>
    </div>
  );
};

export default ScratchCardGame;
