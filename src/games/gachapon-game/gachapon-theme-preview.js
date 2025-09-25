import React, { useMemo } from 'react';
import gachaponConfig, { gachaponPrizes } from './config';

const DEFAULT_CONFIG = gachaponConfig;
const DEFAULT_PRIZES = gachaponPrizes;
const DEFAULT_CAPSULE_COLOR = DEFAULT_CONFIG.defaultCapsuleColor ?? '#38bdf8';
const DEFAULT_FLAIR = DEFAULT_CONFIG.defaultFlairText ?? 'The capsule cracks open in a burst of light! 🎉';

const toCleanString = (value) => (typeof value === 'string' ? value.trim() : '');

const pickColor = (value, fallback, fallbackAlt) => {
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

const CapsuleColorSwatch = ({ label, value, isCustom }) => {
  const displayValue = toCleanString(value);
  return (
    <div className="flex flex-col rounded-xl border border-slate-200/70 bg-white/85 p-3 shadow-sm shadow-slate-200/60">
      <div className="flex items-center justify-between text-xs font-medium text-slate-600">
        <span>{label}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            isCustom ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
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

const GachaponThemePreview = ({ config }) => {
  const data = config ?? DEFAULT_CONFIG;
  const capsuleColor = pickColor(data?.defaultCapsuleColor, DEFAULT_CAPSULE_COLOR, '#38bdf8');
  const heroFlair = toCleanString(data?.defaultFlairText) || DEFAULT_FLAIR;
  const isDefaultConfig = data === DEFAULT_CONFIG;

  const previewPrizes = useMemo(() => {
    const source = Array.isArray(data?.prizes) && data.prizes.length ? data.prizes : DEFAULT_PRIZES;

    return source.slice(0, 4).map((prize, index) => {
      const fallback = DEFAULT_PRIZES[index] ?? {};
      const color = pickColor(prize?.capsuleColor, fallback.capsuleColor, capsuleColor);
      const label =
        toCleanString(prize?.rarityLabel) ||
        toCleanString(prize?.name) ||
        toCleanString(fallback.rarityLabel) ||
        toCleanString(fallback.name) ||
        `Prize ${index + 1}`;
      const flair = toCleanString(prize?.flairText) || toCleanString(fallback.flairText) || heroFlair;
      const isCustom = !isDefaultConfig && Boolean(toCleanString(prize?.capsuleColor));

      return {
        id: prize?.id ?? fallback.id ?? `gachapon-prize-${index}`,
        label,
        color,
        flair,
        isCustom
      };
    });
  }, [capsuleColor, data, heroFlair, isDefaultConfig]);

  const swatchEntries = useMemo(() => {
    const entries = [
      {
        label: 'Default capsule',
        value: capsuleColor,
        isCustom: !isDefaultConfig && Boolean(toCleanString(data?.defaultCapsuleColor))
      }
    ];

    previewPrizes.forEach((prize, index) => {
      entries.push({
        label: `${prize.label} colour`,
        value: prize.color,
        isCustom: prize.isCustom,
        id: prize.id ?? `gachapon-swatch-${index}`
      });
    });

    return entries;
  }, [capsuleColor, data, isDefaultConfig, previewPrizes]);

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[32px] border border-slate-800/50 bg-slate-950 text-slate-100 shadow-[0_30px_90px_-45px_rgba(2,6,23,0.8)]">
        <div className="relative px-8 py-10">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 opacity-95" />
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="flex flex-col items-center gap-4 text-center">
              <div
                className="relative flex h-40 w-40 items-center justify-center rounded-full border-4 border-slate-900/60 shadow-[0_40px_80px_-45px_rgba(56,189,248,0.55)]"
                style={{ background: capsuleColor }}
              >
                <div className="absolute inset-x-6 bottom-4 h-4 rounded-full bg-white/40 blur" />
                <span className="relative text-3xl font-semibold text-slate-900/80">✨</span>
              </div>
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.32em] text-slate-400">Default capsule</p>
                <p className="text-sm font-semibold text-slate-100">{capsuleColor}</p>
              </div>
              <p className="max-w-xs text-sm text-slate-400">{heroFlair}</p>
            </div>
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Prize capsule accents</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {previewPrizes.map((prize) => (
                  <div
                    key={prize.id}
                    className="flex h-full flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg shadow-slate-900/40"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 text-lg"
                        style={{
                          background: prize.color || 'linear-gradient(135deg, rgba(148,163,184,0.25), rgba(203,213,225,0.45))'
                        }}
                      >
                        🎁
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">{prize.label}</p>
                        <p className="text-sm font-semibold text-slate-100">{prize.color || 'Not set'}</p>
                      </div>
                    </div>
                    <p className="mt-3 line-clamp-2 text-xs text-slate-400">{prize.flair}</p>
                    <span
                      className={`mt-3 inline-flex w-fit rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide ${
                        prize.isCustom ? 'bg-emerald-500/10 text-emerald-300' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {prize.isCustom ? 'Custom colour' : 'Default colour'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {swatchEntries.map((entry) => (
          <CapsuleColorSwatch
            key={entry.id ?? entry.label}
            label={entry.label}
            value={entry.value}
            isCustom={entry.isCustom}
          />
        ))}
      </div>
    </div>
  );
};

export default GachaponThemePreview;
