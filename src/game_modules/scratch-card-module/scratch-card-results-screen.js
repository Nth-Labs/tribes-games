import React, { useEffect, useMemo, useState } from 'react';
import { buildTheme } from './theme';
import './scratch-card.css';

const fallbackVouchers = [
  {
    id: 'radiant-latte',
    title: 'Radiant Latte',
    description: 'Enjoy a handcrafted latte on us.',
    code: 'RADIANT-LATTE-2024',
  },
  {
    id: 'starlight-pin',
    title: 'Starlight Pin',
    description: 'Collectible enamel pin from the launch collection.',
    code: 'STAR-PIN-008',
  },
];

const buildResultsUrl = (endpoint, resultPayload) => {
  if (!endpoint) {
    return null;
  }

  try {
    const url = new URL(endpoint, window.location.origin);
    if (resultPayload?.resultId) {
      url.searchParams.set('resultId', resultPayload.resultId);
    }
    if (resultPayload?.gameId) {
      url.searchParams.set('gameId', resultPayload.gameId);
    }
    return url.toString();
  } catch (error) {
    console.warn('[ScratchCard][Results] Failed to build results URL', error);
    return null;
  }
};

const ScratchCardResultsScreen = ({ config, result, onPlayAgain, onBack }) => {
  const theme = useMemo(() => buildTheme(config), [config]);
  const [details, setDetails] = useState(() => ({ ...result }));
  const [isLoading, setIsLoading] = useState(() => Boolean(config?.results_endpoint));

  useEffect(() => {
    const url = buildResultsUrl(config?.results_endpoint, result);
    if (!url) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Results request failed with status ${response.status}`);
        }
        return response.json();
      })
      .then((payload) => {
        if (cancelled) {
          return;
        }
        const voucherItems = Array.isArray(payload?.voucherItems)
          ? payload.voucherItems
          : fallbackVouchers;
        setDetails((prev) => ({
          ...prev,
          ...payload,
          voucherItems,
        }));
        setIsLoading(false);
      })
      .catch((error) => {
        console.warn('[ScratchCard][Results] Falling back to mock data', error);
        if (cancelled) {
          return;
        }
        setDetails((prev) => ({
          ...prev,
          voucherItems: prev.voucherItems || fallbackVouchers,
        }));
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [config?.results_endpoint, result]);

  const voucherItems = details?.voucherItems || fallbackVouchers;

  return (
    <div
      className="results-container"
      style={{
        background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor}aa)`,
        color: theme.textColor,
      }}
    >
      <div className="results-panel">
        <header>
          <p style={{ color: theme.tertiaryColor, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {config?.subtitle || 'Scratch Card Results'}
          </p>
          <h2>{details?.outcome || 'Rewards unlocked'}</h2>
          <p>{details?.message || 'Claim your vouchers below.'}</p>
        </header>

        <section>
          <h3>Voucher rewards</h3>
          {isLoading ? (
            <p>Updating your voucher list…</p>
          ) : (
            <div className="voucher-grid">
              {voucherItems.map((voucher) => (
                <article key={voucher.id} className="voucher-card">
                  <h3>{voucher.title}</h3>
                  <p>{voucher.description}</p>
                  <p style={{ color: theme.tertiaryColor }}>Code: {voucher.code}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="results-footer">
          <button
            type="button"
            onClick={onPlayAgain}
            style={{ background: theme.secondaryColor, color: theme.primaryColor }}
          >
            Play again
          </button>
          <button type="button" onClick={onBack} className="secondary">
            Back to games
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ScratchCardResultsScreen;
