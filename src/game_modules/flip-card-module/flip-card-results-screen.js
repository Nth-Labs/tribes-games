import React, { useEffect, useMemo } from 'react';
import { defaultTheme, isCssGradient } from './theme';
import './flip-card.css';

const formatSeconds = (value, { allowSubSecond = false } = {}) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return '—';
  }

  if (parsed < 60) {
    if (!allowSubSecond) {
      return `${Math.round(parsed)}s`;
    }
    const precision = parsed < 10 ? 1 : 0;
    return `${parsed.toFixed(precision)}s`;
  }

  const minutes = Math.floor(parsed / 60);
  const seconds = Math.round(parsed % 60);
  return `${minutes}m ${seconds}s`;
};

const formatPercentage = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return '—';
  }
  return `${Math.round(parsed * 100)}%`;
};

const formatDate = (value) => {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    day: 'numeric',
  });
};

const toSafeArray = (value) => (Array.isArray(value) ? value : []);

const FlipCardResultsScreen = ({ result = {}, theme = {}, onPlayAgain, onBack }) => {
  useEffect(() => {
    console.log('[FlipCard][ResultsScreen] Rendering with result payload', {
      result,
      theme,
    });
  }, [result, theme]);

  const accentColor = theme.accentColor || defaultTheme.accentColor;
  const panelBackground = theme.panelBackgroundColor || defaultTheme.panelBackgroundColor;
  const panelBorder = theme.panelBorderColor || defaultTheme.panelBorderColor;
  const textColor = theme.titleColor || defaultTheme.titleColor;
  const subtleTextColor = theme.subtleTextColor || defaultTheme.subtleTextColor;
  const buttonBackground = theme.buttonBackgroundColor || accentColor;
  const buttonHoverBackground = theme.buttonHoverBackgroundColor || accentColor;
  const buttonTextColor = theme.buttonTextColor || '#ffffff';

  const backgroundStyle = useMemo(() => {
    const style = {
      backgroundColor: theme.backgroundColor || defaultTheme.backgroundColor,
    };

    const backgroundImage = theme.backgroundImage;
    if (backgroundImage) {
      if (isCssGradient(backgroundImage)) {
        style.backgroundImage = backgroundImage;
      } else {
        style.backgroundImage = `url(${backgroundImage})`;
        style.backgroundSize = 'cover';
        style.backgroundPosition = 'center';
        style.backgroundRepeat = 'no-repeat';
      }
    }

    return style;
  }, [theme.backgroundColor, theme.backgroundImage]);

  const overlayStyle = useMemo(
    () => ({ background: theme.backgroundOverlayColor || defaultTheme.backgroundOverlayColor }),
    [theme.backgroundOverlayColor],
  );

  const score = Number.isFinite(result.score) ? result.score : null;
  const breakdownLabels = {
    completion: 'Completion',
    accuracy: 'Accuracy',
    efficiency: 'Efficiency',
    speed: 'Speed',
  };
  const breakdownEntries = Object.entries(result.scoreBreakdown || {})
    .map(([key, value]) => ({ key, value }))
    .filter(({ value }) => Number.isFinite(value))
    .map(({ key, value }) => ({
      key,
      label: breakdownLabels[key] || key,
      value,
    }));
  const prizes = toSafeArray(result.prizes);
  const simplePrizes = prizes.filter((prize) => !prize?.voucherBatch);

  const metrics = [
    { label: 'Outcome', value: result.outcome || '—' },
    {
      label: 'Pairs Matched',
      value:
        Number.isFinite(result.pairsFound) && Number.isFinite(result.totalPairs)
          ? `${result.pairsFound}/${result.totalPairs}`
          : '—',
    },
    {
      label: 'Pairs Remaining',
      value: Number.isFinite(result.pairsRemaining) ? result.pairsRemaining : '—',
    },
    { label: 'Moves Taken', value: Number.isFinite(result.movesTaken) ? result.movesTaken : '—' },
    { label: 'Moves Left', value: Number.isFinite(result.movesLeft) ? result.movesLeft : '—' },
    { label: 'Completion', value: formatPercentage(result.completionRate) },
    { label: 'Accuracy', value: formatPercentage(result.accuracy) },
    { label: 'Total Time', value: formatSeconds(result.timeElapsedSeconds) },
    {
      label: 'Avg / Move',
      value: formatSeconds(result.averageMoveDurationSeconds, { allowSubSecond: true }),
    },
    { label: 'Started', value: formatDate(result.startedAt) },
    { label: 'Completed', value: formatDate(result.completedAt) },
    { label: 'Submitted', value: formatDate(result.submittedAt) },
  ];

  const handlePlayAgain = () => {
    if (typeof onPlayAgain === 'function') {
      onPlayAgain();
      return;
    }
    window.location.reload();
  };

  const handleBack = () => {
    if (typeof onBack === 'function') {
      onBack();
      return;
    }
    window.location.href = '/stores';
  };

  const heading = result.outcome === 'Won' ? 'Victory!' : 'Round complete';
  const subtitle =
    result.message ||
    (result.outcome === 'Won'
      ? 'You cleared every pair before the clock ran out.'
      : 'Nice effort! Review the stats and try again.');

  return (
    <div className="game-root">
      <div className="game-bg" style={backgroundStyle} aria-hidden="true" />
      <div className="game-overlay" style={overlayStyle} aria-hidden="true" />

      <div className="results-wrapper">
        <section
          className="results-card"
          style={{
            background: panelBackground,
            borderColor: panelBorder,
            color: textColor,
          }}
        >
          <div className="results-header">
            <span
              className="game-badge"
              style={{
                background: theme.cardMatchedBackgroundColor || defaultTheme.cardMatchedBackgroundColor,
                color: accentColor,
              }}
            >
              Flip & Match
            </span>
            <h1 className="results-title" style={{ color: textColor }}>
              {heading}
            </h1>
            <p className="results-subtitle" style={{ color: subtleTextColor }}>
              {subtitle}
            </p>
          </div>

          <div
            className="results-score"
            style={{
              borderColor: theme.cardBorderColor || defaultTheme.cardBorderColor,
              background: theme.boardBackgroundColor || defaultTheme.boardBackgroundColor,
            }}
          >
            <span style={{ color: subtleTextColor }}>Score</span>
            <div className="results-score-value" style={{ color: accentColor }}>
              <strong>{score !== null ? score : '—'}</strong>
              <span>/100</span>
            </div>
          </div>

          {breakdownEntries.length > 0 && (
            <div className="results-breakdown">
              {breakdownEntries.map(({ key, label, value }) => (
                <div key={key} className="results-breakdown-item">
                  <div className="results-breakdown-header">
                    <span>{label}</span>
                    <span>{Math.round(value)}</span>
                  </div>
                  <div className="results-breakdown-bar">
                    <div
                      className="results-breakdown-bar-fill"
                      style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: accentColor }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section
          className="results-metrics"
          style={{
            background: theme.boardBackgroundColor || defaultTheme.boardBackgroundColor,
            borderColor: theme.cardBorderColor || defaultTheme.cardBorderColor,
            color: subtleTextColor,
          }}
        >
          <h2 style={{ color: textColor }}>Performance</h2>
          <dl className="results-metrics-grid">
            {metrics.map(({ label, value }) => (
              <div key={label} className="results-metric">
                <dt>{label}</dt>
                <dd style={{ color: textColor }}>{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section
          className="results-prizes"
          style={{
            background: panelBackground,
            borderColor: panelBorder,
            color: textColor,
          }}
        >
          <h2>Prizes unlocked</h2>

          {simplePrizes.length > 0 && (
            <div className="results-voucher-list">
              {simplePrizes.map((v, idx) => {
                const voucher = v?.voucher || {};
                return (
                  <div key={voucher.id || idx} className="voucher-card">
                    <div className="voucher-image-wrap">
                      <img
                        src={voucher.image_url || voucher.voucher_icon_url}
                        alt={voucher.description || 'Voucher'}
                        className="voucher-image"
                      />
                    </div>

                    <div className="voucher-details">
                      <h4 className="voucher-title">{voucher.type || 'Voucher'}</h4>
                      <p className="voucher-description">
                        {voucher.description || 'Enjoy your prize!'}
                      </p>

                      <div className="voucher-meta">
                        {voucher.value && (
                          <span className="voucher-value">Value: {voucher.value}</span>
                        )}
                        {voucher.expiry_date && (
                          <span className="voucher-expiry">
                            🗓️ Expires{' '}
                            {new Date(voucher.expiry_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}


          {simplePrizes.length === 0 && (
            <p className="results-empty" style={{ color: subtleTextColor }}>
              No prizes this round — keep playing to unlock rewards.
            </p>
          )}
        </section>

        <div className="results-actions">
          <button
            type="button"
            className="results-button primary"
            onClick={handlePlayAgain}
            style={{
              background: buttonBackground,
              color: buttonTextColor,
            }}
            onMouseOver={(event) => {
              event.currentTarget.style.background = buttonHoverBackground;
            }}
            onMouseOut={(event) => {
              event.currentTarget.style.background = buttonBackground;
            }}
          >
            Play again
          </button>
          <button
            type="button"
            className="results-button secondary"
            onClick={handleBack}
            style={{
              borderColor: theme.cardBorderColor || defaultTheme.cardBorderColor,
              color: accentColor,
            }}
          >
            Back to store
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlipCardResultsScreen;
