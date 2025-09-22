import React, { useMemo } from 'react';
import { scratchCardPreviewOptions } from './config';

const DEFAULT_OPTIONS = scratchCardPreviewOptions ?? {};
const DEFAULT_PRIZES = Array.isArray(DEFAULT_OPTIONS.prizes) ? DEFAULT_OPTIONS.prizes : [];
const DEFAULT_TITLE = DEFAULT_OPTIONS.title ?? 'Scratch & Reveal';
const DEFAULT_DESCRIPTION =
  DEFAULT_OPTIONS.description ?? 'Peel back the foil to uncover prizes and a glowing palette.';

const toCleanString = (value) => (typeof value === 'string' ? value.trim() : '');
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

const ScratchGradientSwatch = ({ label, foil, glow, isCustom }) => {
  const foilValue = toCleanString(foil);
  const glowValue = toCleanString(glow);
  const gradient = `linear-gradient(135deg, ${foilValue || '#cbd5f5'}, ${glowValue || foilValue || '#64748b'})`;

  return (
    <div className="flex flex-col rounded-xl border border-slate-200/70 bg-white/85 p-3 shadow-sm shadow-slate-200/60">
      <div className="flex items-center justify-between text-xs font-medium text-slate-600">
        <span>{label}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            isCustom ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {isCustom ? 'Custom' : 'Default'}
        </span>
      </div>
      <div
        className="mt-3 h-12 w-full overflow-hidden rounded-lg border border-slate-200/80"
        style={{ background: gradient }}
      />
      <div className="mt-2 space-y-1 text-[11px] text-slate-500">
        <p>Foil: {foilValue || 'Not set'}</p>
        <p>Glow: {glowValue || 'Not set'}</p>
      </div>
    </div>
  );
};

const ScratchCardThemePreview = ({ prizes, title, description }) => {
  const providedPrizes = Array.isArray(prizes) ? prizes : [];
  const heading = toCleanString(title) || DEFAULT_TITLE;
  const body = toCleanString(description) || DEFAULT_DESCRIPTION;

  const previewPrizes = useMemo(() => {
    const source = providedPrizes.length ? providedPrizes : DEFAULT_PRIZES;
    return source.slice(0, 5).map((prize, index) => {
      const fallback = DEFAULT_PRIZES[index] ?? {};
      const foil = getColor(prize?.foilColor, fallback.foilColor, '#cbd5f5');
      const glow = getColor(prize?.glowColor, fallback.glowColor, 'rgba(148, 163, 184, 0.45)');
      const label =
        toCleanString(prize?.rarityLabel) ||
        toCleanString(prize?.name) ||
        toCleanString(fallback.rarityLabel) ||
        toCleanString(fallback.name) ||
        `Prize ${index + 1}`;
      const isCustom = Boolean(
        providedPrizes.length &&
          (toCleanString(providedPrizes[index]?.foilColor) || toCleanString(providedPrizes[index]?.glowColor))
      );

      return {
        id: prize?.id ?? fallback.id ?? `scratch-prize-${index}`,
        label,
        foil,
        glow,
        isCustom
      };
    });
  }, [providedPrizes]);

  const heroPrize = previewPrizes[0] ?? {
    label: 'Prize reveal',
    foil: '#cbd5f5',
    glow: 'rgba(148, 163, 184, 0.45)'
  };
  const heroGradient = `linear-gradient(135deg, ${heroPrize.foil}, ${heroPrize.glow || heroPrize.foil})`;

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[32px] border border-slate-200/60 bg-slate-950 text-slate-100 shadow-[0_30px_90px_-45px_rgba(15,23,42,0.65)]">
        <div className="relative px-8 py-10">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 opacity-95" />
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
                  Scratch card palette preview
                </p>
                <h2 className="text-2xl font-semibold tracking-tight text-white">{heading}</h2>
                <p className="text-sm leading-relaxed text-white/80">{body}</p>
              </div>
              <div className="relative overflow-hidden rounded-[28px] border border-white/15 bg-slate-900/70 px-6 py-8">
                <div className="absolute inset-0 opacity-90" style={{ background: heroGradient }} />
                <div
                  className="absolute inset-5 rounded-[24px] border border-white/30 bg-white/10 backdrop-blur-sm"
                  style={{ boxShadow: `0 0 70px ${heroPrize.glow || 'rgba(255,255,255,0.25)'}` }}
                />
                <div className="relative flex h-full flex-col items-center justify-center text-center">
                  <p className="text-xs uppercase tracking-[0.28em] text-white/75">Foil reveal</p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">{heroPrize.label}</h3>
                  <p className="mt-3 max-w-xs text-sm text-white/80">
                    This mock scratch area reflects the selected foil and glow colours.
                  </p>
                  <div className="mt-5 flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1">
                      <span className="h-3 w-3 rounded-full" style={{ background: heroPrize.foil }} />
                      Foil
                    </span>
                    <span className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1">
                      <span className="h-3 w-3 rounded-full" style={{ background: heroPrize.glow }} />
                      Glow
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/60">
                Foil & glow palette
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {previewPrizes.map((prize) => {
                  const gradient = `linear-gradient(135deg, ${prize.foil}, ${prize.glow || prize.foil})`;
                  return (
                    <div
                      key={prize.id}
                      className="flex h-full flex-col justify-between rounded-2xl border border-white/15 bg-slate-900/70 p-4 shadow-lg shadow-slate-900/40"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-12 w-12 rounded-xl border border-white/25"
                          style={{ background: gradient }}
                        />
                        <div>
                          <p className="text-xs uppercase tracking-wide text-white/70">{prize.label}</p>
                          <p className="text-[11px] text-white/70">Foil: {prize.foil || 'Not set'}</p>
                          <p className="text-[11px] text-white/70">Glow: {prize.glow || 'Not set'}</p>
                        </div>
                      </div>
                      <span
                        className={`mt-3 inline-flex w-fit rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide ${
                          prize.isCustom ? 'bg-amber-500/10 text-amber-200' : 'bg-white/10 text-white/60'
                        }`}
                      >
                        {prize.isCustom ? 'Custom palette' : 'Default palette'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {previewPrizes.map((prize) => (
          <ScratchGradientSwatch
            key={`scratch-swatch-${prize.id}`}
            label={prize.label}
            foil={prize.foil}
            glow={prize.glow}
            isCustom={prize.isCustom}
          />
        ))}
      </div>
    </div>
  );
};

export default ScratchCardThemePreview;
