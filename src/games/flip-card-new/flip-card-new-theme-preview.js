import React, { useMemo } from 'react';
import { flipCardNewPreviewOptions } from './config';

const DEFAULT_OPTIONS = flipCardNewPreviewOptions ?? {};
const DEFAULT_THEME = DEFAULT_OPTIONS.theme ?? {};
const DEFAULT_TITLE = DEFAULT_OPTIONS.title ?? 'Flip Card Challenge';
const DEFAULT_DESCRIPTION =
  DEFAULT_OPTIONS.description ?? 'Preview how the refreshed flip-card experience responds to theme changes.';

const toCleanString = (value) => (typeof value === 'string' ? value.trim() : '');
const isCssGradient = (value) => typeof value === 'string' && value.includes('gradient(');
const getColor = (value, fallback, fallbackAlt) => {
  const trimmed = toCleanString(value);
  if (trimmed) {
    return trimmed;
  }
  const fallbackTrimmed = toCleanString(fallback);
  if (fallbackTrimmed) {
    return fallbackTrimmed;
  }
  return fallbackAlt;
};

const COLOR_SECTIONS = [
  {
    title: 'Layout & Panels',
    fields: [
      { key: 'backgroundColor', label: 'Background' },
      { key: 'backgroundOverlayColor', label: 'Overlay' },
      { key: 'panelBackgroundColor', label: 'Panel background' },
      { key: 'panelBorderColor', label: 'Panel border' },
      { key: 'panelShadowColor', label: 'Panel shadow' },
      { key: 'boardBackgroundColor', label: 'Board background' },
      { key: 'boardBorderColor', label: 'Board border' },
      { key: 'boardShadowColor', label: 'Board shadow' }
    ]
  },
  {
    title: 'Cards',
    fields: [
      { key: 'cardBackBackgroundColor', label: 'Card back' },
      { key: 'cardFaceBackgroundColor', label: 'Card face' },
      { key: 'cardBorderColor', label: 'Card border' },
      { key: 'cardShadowColor', label: 'Card shadow' },
      { key: 'cardMatchedBackgroundColor', label: 'Matched card' },
      { key: 'cardMatchedGlowColor', label: 'Match glow' }
    ]
  },
  {
    title: 'Typography & Accents',
    fields: [
      { key: 'accentColor', label: 'Accent' },
      { key: 'titleColor', label: 'Headline text' },
      { key: 'textColor', label: 'Body text' },
      { key: 'subtleTextColor', label: 'Secondary text' }
    ]
  },
  {
    title: 'Buttons',
    fields: [
      { key: 'buttonBackgroundColor', label: 'Button background' },
      { key: 'buttonHoverBackgroundColor', label: 'Hover background' },
      { key: 'buttonTextColor', label: 'Button text' }
    ]
  }
];

const ColorSwatch = ({ label, value, isCustom }) => {
  const displayValue = toCleanString(value);
  return (
    <div className="flex flex-col rounded-xl border border-slate-200/70 bg-white/80 p-3 shadow-sm shadow-slate-200/60">
      <div className="flex items-center justify-between text-xs font-medium text-slate-600">
        <span>{label}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            isCustom ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {isCustom ? 'Custom' : 'Default'}
        </span>
      </div>
      <div
        className="mt-3 h-12 w-full overflow-hidden rounded-lg border border-slate-200/80"
        style={{
          background: displayValue || 'linear-gradient(135deg, rgba(148,163,184,0.25), rgba(203,213,225,0.45))'
        }}
      />
      <div className="mt-2 break-words text-[11px] text-slate-500">{displayValue || 'Not set'}</div>
    </div>
  );
};

const FlipCardNewThemePreview = ({ theme, title, description }) => {
  const mergedTheme = useMemo(() => ({ ...DEFAULT_THEME, ...(theme || {}) }), [theme]);
  const heading = toCleanString(title) || DEFAULT_TITLE;
  const body = toCleanString(description) || DEFAULT_DESCRIPTION;

  const backgroundStyle = useMemo(() => {
    const style = {
      backgroundColor: getColor(mergedTheme.backgroundColor, DEFAULT_THEME.backgroundColor, '#fdfaf5')
    };
    const backgroundImage =
      toCleanString(mergedTheme.backgroundImage) || toCleanString(DEFAULT_THEME.backgroundImage);
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
  }, [mergedTheme]);

  const overlayColor = getColor(
    mergedTheme.backgroundOverlayColor,
    DEFAULT_THEME.backgroundOverlayColor,
    'rgba(255,255,255,0.82)'
  );
  const accentColor = getColor(mergedTheme.accentColor, DEFAULT_THEME.accentColor, '#60a5fa');
  const subtleTextColor = getColor(
    mergedTheme.subtleTextColor,
    DEFAULT_THEME.subtleTextColor,
    'rgba(100,116,139,0.75)'
  );
  const titleColor = getColor(mergedTheme.titleColor, DEFAULT_THEME.titleColor, '#0f172a');
  const textColor = getColor(mergedTheme.textColor, DEFAULT_THEME.textColor, '#1f2937');
  const buttonBackground = getColor(
    mergedTheme.buttonBackgroundColor,
    DEFAULT_THEME.buttonBackgroundColor,
    accentColor
  );
  const buttonHoverBackground = getColor(
    mergedTheme.buttonHoverBackgroundColor,
    DEFAULT_THEME.buttonHoverBackgroundColor,
    accentColor
  );
  const buttonTextColor = getColor(mergedTheme.buttonTextColor, DEFAULT_THEME.buttonTextColor, '#ffffff');
  const panelShadow = getColor(
    mergedTheme.panelShadowColor,
    DEFAULT_THEME.panelShadowColor,
    'rgba(148,163,184,0.26)'
  );
  const boardShadow = getColor(
    mergedTheme.boardShadowColor,
    DEFAULT_THEME.boardShadowColor,
    'rgba(100,116,139,0.24)'
  );
  const cardShadow = getColor(
    mergedTheme.cardShadowColor,
    DEFAULT_THEME.cardShadowColor,
    'rgba(148,163,184,0.4)'
  );
  const matchedGlow = getColor(
    mergedTheme.cardMatchedGlowColor,
    DEFAULT_THEME.cardMatchedGlowColor,
    accentColor
  );

  const panelStyle = {
    background: getColor(
      mergedTheme.panelBackgroundColor,
      DEFAULT_THEME.panelBackgroundColor,
      'rgba(255,255,255,0.88)'
    ),
    borderColor: getColor(
      mergedTheme.panelBorderColor,
      DEFAULT_THEME.panelBorderColor,
      'rgba(148,163,184,0.32)'
    ),
    boxShadow: panelShadow ? `0 34px 80px -45px ${panelShadow}` : undefined
  };

  const boardStyle = {
    background: getColor(
      mergedTheme.boardBackgroundColor,
      DEFAULT_THEME.boardBackgroundColor,
      'rgba(255,255,255,0.92)'
    ),
    borderColor: getColor(
      mergedTheme.boardBorderColor,
      DEFAULT_THEME.boardBorderColor,
      'rgba(191,219,254,0.7)'
    ),
    boxShadow: boardShadow ? `0 45px 120px -65px ${boardShadow}` : undefined
  };

  const cardBorderColor = getColor(
    mergedTheme.cardBorderColor,
    DEFAULT_THEME.cardBorderColor,
    'rgba(191,219,254,0.9)'
  );
  const cardBackBackground = getColor(
    mergedTheme.cardBackBackgroundColor,
    DEFAULT_THEME.cardBackBackgroundColor,
    'rgba(226,232,240,0.85)'
  );
  const cardFaceBackground = getColor(
    mergedTheme.cardFaceBackgroundColor,
    DEFAULT_THEME.cardFaceBackgroundColor,
    'rgba(239,246,255,0.92)'
  );
  const matchedBackground = getColor(
    mergedTheme.cardMatchedBackgroundColor,
    DEFAULT_THEME.cardMatchedBackgroundColor,
    'rgba(191,227,255,0.65)'
  );

  const cardBaseStyle = {
    borderColor: cardBorderColor,
    boxShadow: cardShadow ? `0 28px 55px -40px ${cardShadow}` : undefined
  };

  const cardBackStyle = {
    ...cardBaseStyle,
    background: cardBackBackground,
    color: accentColor
  };

  const cardFrontStyle = {
    ...cardBaseStyle,
    background: cardFaceBackground,
    color: titleColor
  };

  const matchedCardStyle = {
    ...cardBaseStyle,
    background: matchedBackground,
    color: titleColor,
    boxShadow: matchedGlow
      ? `0 0 0 2px ${matchedBackground}, 0 30px 60px -40px ${matchedGlow}`
      : cardBaseStyle.boxShadow
  };

  const swatchSections = COLOR_SECTIONS.map((section) => ({
    ...section,
    fields: section.fields.map((field) => ({
      ...field,
      value: mergedTheme[field.key],
      isCustom: Boolean(theme && toCleanString(theme[field.key]))
    }))
  }));

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[32px] border border-slate-200/60 bg-white shadow-[0_30px_80px_-45px_rgba(15,23,42,0.38)]">
        <div className="relative">
          <div className="absolute inset-0" style={backgroundStyle} />
          <div className="absolute inset-0" style={{ background: overlayColor }} />
          <div className="relative space-y-6 px-8 py-10">
            <div className="space-y-2">
              <p
                className="text-xs font-semibold uppercase tracking-[0.3em]"
                style={{ color: subtleTextColor }}
              >
                Flip card preview
              </p>
              <h2 className="text-2xl font-semibold tracking-tight" style={{ color: titleColor }}>
                {heading}
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: textColor }}>
                {body}
              </p>
            </div>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
              <div className="rounded-3xl border p-5 shadow-sm" style={panelStyle}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p
                      className="text-xs uppercase tracking-[0.24em]"
                      style={{ color: subtleTextColor }}
                    >
                      Moves left
                    </p>
                    <p className="text-2xl font-semibold" style={{ color: titleColor }}>
                      6
                    </p>
                  </div>
                  <div>
                    <p
                      className="text-xs uppercase tracking-[0.24em]"
                      style={{ color: subtleTextColor }}
                    >
                      Pairs found
                    </p>
                    <p className="text-2xl font-semibold" style={{ color: titleColor }}>
                      4 / 8
                    </p>
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: subtleTextColor }}>Progress</span>
                    <span style={{ color: titleColor }}>60%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/60">
                    <div
                      className="h-full rounded-full"
                      style={{ background: accentColor, width: '60%' }}
                    />
                  </div>
                </div>
                <div className="mt-6 rounded-2xl border border-dashed border-slate-200/60 bg-white/60 p-4 text-xs" style={{ color: subtleTextColor }}>
                  Hover colour preview: <span style={{ color: accentColor }}>{buttonHoverBackground}</span>
                </div>
                <button
                  type="button"
                  className="mt-6 w-full rounded-2xl px-5 py-3 text-sm font-semibold transition"
                  style={{ background: buttonBackground, color: buttonTextColor }}
                >
                  Submit score
                </button>
              </div>
              <div className="rounded-3xl border p-5" style={boardStyle}>
                <div className="grid grid-cols-4 gap-3 text-sm font-semibold">
                  <div
                    className="flex aspect-[3/4] items-center justify-center rounded-xl border"
                    style={cardFrontStyle}
                  >
                    ☀️
                  </div>
                  <div
                    className="flex aspect-[3/4] items-center justify-center rounded-xl border"
                    style={cardBackStyle}
                  >
                    ?
                  </div>
                  <div
                    className="flex aspect-[3/4] items-center justify-center rounded-xl border"
                    style={matchedCardStyle}
                  >
                    ✅
                  </div>
                  <div
                    className="flex aspect-[3/4] items-center justify-center rounded-xl border"
                    style={{ ...cardFrontStyle, color: subtleTextColor }}
                  >
                    💫
                  </div>
                </div>
                <div className="mt-6 grid gap-3 text-xs" style={{ color: subtleTextColor }}>
                  <div className="flex items-center justify-between">
                    <span>Time elapsed</span>
                    <span style={{ color: titleColor }}>01:12</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Next reward</span>
                    <span style={{ color: accentColor }}>Free drink</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        {swatchSections.map((section) => (
          <div key={section.title} className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">
              {section.title}
            </h3>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {section.fields.map((field) => (
                <ColorSwatch
                  key={field.key}
                  label={field.label}
                  value={field.value}
                  isCustom={field.isCustom}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FlipCardNewThemePreview;
