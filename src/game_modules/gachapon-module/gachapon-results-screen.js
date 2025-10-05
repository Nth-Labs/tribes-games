import React, { useEffect, useMemo, useState } from 'react';
import { buildTheme, defaultTheme } from './theme';

const fallbackVoucherItems = [
  {
    id: 'voucher-aurora',
    label: 'Aurora Latte Voucher',
    code: 'AURORA-LATTE-2024',
    expiresAt: '2024-12-31T23:59:59.000Z',
  },
  {
    id: 'voucher-pin',
    label: 'Nebula Pin Voucher',
    code: 'PIN-GLOW-7781',
    expiresAt: '2024-10-10T23:59:59.000Z',
  },
];

const formatDate = (value) => {
  if (!value) {
    return 'No expiry';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'No expiry';
  }

  return parsed.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

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
    console.warn('[Gachapon][Results] Failed to build results URL', error);
    return null;
  }
};

const mockFetchResults = (config, resultPayload) =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        ...resultPayload,
        message:
          'Mocked rewards preview. Connect the live API endpoint to display real-time results.',
        voucherItems: fallbackVoucherItems,
        updatedAt: new Date().toISOString(),
        theme: config?.theme,
      });
    }, 400);
  });

const VoucherItem = ({ item, theme }) => (
  <li
    className="voucher-item"
    style={{
      borderColor: theme.secondaryColor,
    }}
  >
    <div>
      <p className="voucher-name">{item.label}</p>
      <p className="voucher-code">Code: {item.code}</p>
    </div>
    <p className="voucher-expiry">{formatDate(item.expiresAt)}</p>
  </li>
);

const PrizePreview = ({ prize, theme }) => (
  <div
    className="prize-preview"
    style={{ borderColor: theme.tertiaryColor }}
  >
    <img src={prize.image} alt={prize.name} className="prize-image" />
    <div>
      <p className="prize-rarity">{prize.rarity}</p>
      <h3 className="prize-name">{prize.name}</h3>
      <p className="prize-description">{prize.description}</p>
    </div>
  </div>
);

const GachaponResultsScreen = ({
  config,
  result,
  onPlayAgain,
  onBack,
}) => {
  const theme = useMemo(() => buildTheme(config), [config]);
  const shouldUseLiveEndpoint =
    Boolean(config?.results_endpoint) && process.env.NODE_ENV === 'production';
  const [isLoading, setIsLoading] = useState(() => shouldUseLiveEndpoint);
  const [error, setError] = useState(null);
  const [details, setDetails] = useState(() => ({ ...result }));

  useEffect(() => {
    const shouldMock = !config?.results_endpoint || process.env.NODE_ENV !== 'production';

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const liveUrl = shouldMock ? null : buildResultsUrl(config?.results_endpoint, result);

    const resolver = shouldMock || !liveUrl
      ? mockFetchResults(config, result)
      : fetch(liveUrl).then((response) => {
          if (!response.ok) {
            throw new Error(`Results request failed with status ${response.status}`);
          }
          return response.json();
        });

    resolver
      .then((payload) => {
        if (cancelled) {
          return;
        }
        const voucherItems = Array.isArray(payload?.voucherItems)
          ? payload.voucherItems
          : fallbackVoucherItems;
        setDetails((prev) => ({
          ...prev,
          ...payload,
          voucherItems,
        }));
        setIsLoading(false);
      })
      .catch((fetchError) => {
        console.warn('[Gachapon][Results] Falling back to local data', fetchError);
        if (cancelled) {
          return;
        }
        setDetails((prev) => ({
          ...prev,
          voucherItems: prev.voucherItems || fallbackVoucherItems,
        }));
        setIsLoading(false);
        setError('We could not refresh the latest results. Showing offline data.');
      });

    return () => {
      cancelled = true;
    };
  }, [config, result]);

  const voucherItems = details?.voucherItems || fallbackVoucherItems;

  return (
    <div
      className="gachapon-results"
      style={{
        background: theme.primaryColor,
        color: theme.textColor,
      }}
    >
      <div className="results-card" style={{ borderColor: theme.borderColor }}>
        <header>
          <p className="results-subtitle">{config?.title || 'Gachapon Results'}</p>
          <h2 className="results-title">{details?.outcome || 'Prize Revealed'}</h2>
          <p className="results-message">{details?.message || 'Collect your rewards below.'}</p>
          {error && <p className="results-error">{error}</p>}
        </header>

        {details?.prize && <PrizePreview prize={details.prize} theme={theme} />}

        <section>
          <h3 className="section-title">Voucher Items</h3>
          {isLoading ? (
            <p className="loading-text">Fetching the latest vouchers…</p>
          ) : (
            <ul className="voucher-list">
              {voucherItems.map((item) => (
                <VoucherItem key={item.id} item={item} theme={theme} />
              ))}
            </ul>
          )}
        </section>

        <footer className="results-actions">
          <button
            type="button"
            className="results-button"
            style={{ background: theme.secondaryColor, color: defaultTheme.textColor }}
            onClick={onPlayAgain}
          >
            Play again
          </button>
          <button
            type="button"
            className="results-link"
            onClick={onBack}
          >
            Back to games
          </button>
        </footer>
      </div>
    </div>
  );
};

export default GachaponResultsScreen;
