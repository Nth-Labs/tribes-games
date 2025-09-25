import React, { useMemo } from 'react';
import matchingGameConfig, { matchingGameCardImages } from './config';

const DEFAULT_CONFIG = matchingGameConfig;

const toCleanString = (value) => {
  return typeof value === 'string' ? value.trim() : '';
};

const FALLBACK_COLORS = {
  primary: '#fdfaf5',
  secondary: '#7DD3FC',
  tertiary: '#FDE0AB'
};

const MatchingGameThemePreview = ({ config }) => {
  const data = config ?? DEFAULT_CONFIG;

  const title = toCleanString(data?.title) || 'Matching Game';
  const subtitle = toCleanString(data?.subtitle);

  const colors = [
    { label: 'Primary', value: toCleanString(data?.primary_color) || FALLBACK_COLORS.primary },
    { label: 'Secondary', value: toCleanString(data?.secondary_color) || FALLBACK_COLORS.secondary },
    { label: 'Tertiary', value: toCleanString(data?.tertiary_color) || FALLBACK_COLORS.tertiary }
  ];

  const cardImages = useMemo(() => {
    const fromConfig = Object.keys(data || {})
      .filter((key) => key.startsWith('image_'))
      .map((key) => data[key])
      .filter((src) => typeof src === 'string' && src.trim().length > 0);

    if (fromConfig.length > 0) {
      return fromConfig;
    }

    return matchingGameCardImages;
  }, [data]);

  return (
    <div className="space-y-6 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm shadow-slate-200/60">
      <header className="space-y-2 text-center sm:text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Matching Game</p>
        <h2 className="text-2xl font-semibold text-slate-800">{title}</h2>
        {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
      </header>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Colours</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {colors.map(({ label, value }) => (
            <div
              key={label}
              className="rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm shadow-slate-200/60"
            >
              <div className="mb-3 h-12 w-full rounded-xl border border-slate-200" style={{ background: value }} />
              <div className="text-xs font-medium text-slate-600">{label}</div>
              <div className="mt-1 break-words text-[11px] text-slate-500">{value}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Card Faces</h3>
        <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-5">
          {cardImages.slice(0, 8).map((src, index) => (
            <div
              key={`${src}-${index}`}
              className="flex aspect-square items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-2"
            >
              <img src={src} alt={`Card ${index + 1}`} className="max-h-full max-w-full object-contain" />
            </div>
          ))}
          {cardImages.length === 0 && (
            <p className="col-span-4 text-sm text-slate-500 sm:col-span-5">No card images configured yet.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default MatchingGameThemePreview;
