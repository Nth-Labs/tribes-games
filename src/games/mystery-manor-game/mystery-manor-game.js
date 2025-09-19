import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiEye,
  FiInfo,
  FiRefreshCcw,
  FiSearch
} from 'react-icons/fi';
import mysteryManorConfig from './config';

const formatTime = (value) => {
  const numeric = Number(value);
  const safeValue = Number.isFinite(numeric) && numeric > 0 ? Math.floor(numeric) : 0;
  const minutes = Math.floor(safeValue / 60);
  const seconds = safeValue % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

const hasValidHotspot = (hotspot) => {
  if (!hotspot || typeof hotspot !== 'object') {
    return false;
  }
  const { x, y } = hotspot;
  return typeof x === 'number' && typeof y === 'number';
};

const getHotspotStyle = (hotspot) => {
  if (!hasValidHotspot(hotspot)) {
    return {};
  }

  const clamp = (value) => Math.min(Math.max(value, 0), 1);
  const centerX = clamp(hotspot.x) * 100;
  const centerY = clamp(hotspot.y) * 100;
  const baseStyle = {
    left: `${centerX}%`,
    top: `${centerY}%`,
  };

  if (hotspot.type === 'rect') {
    const width = clamp(hotspot.width ?? 0.15) * 100;
    const height = clamp(hotspot.height ?? 0.15) * 100;
    return {
      ...baseStyle,
      width: `${width}%`,
      height: `${height}%`,
      transform: 'translate(-50%, -50%)'
    };
  }

  const radius = clamp(hotspot.radius ?? 0.08) * 100;
  const diameter = radius * 2;

  return {
    ...baseStyle,
    width: `${diameter}%`,
    height: `${diameter}%`,
    transform: 'translate(-50%, -50%)'
  };
};

const ImageWithFallback = ({ src, alt, className, fallback }) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return typeof fallback === 'function' ? fallback() : fallback;
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setHasError(true)}
      className={className}
    />
  );
};

const DefaultItemArt = ({ name }) => {
  const fallbackLetter = name?.trim()?.charAt(0)?.toUpperCase() || '?';
  return (
    <div className="flex h-full w-full items-center justify-center rounded-xl bg-slate-900/80 text-lg font-semibold text-indigo-200">
      {fallbackLetter}
    </div>
  );
};

const SceneFallback = () => (
  <div className="absolute inset-0 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
    <div className="absolute -left-20 top-10 h-80 w-80 rounded-full bg-purple-700/30 blur-3xl" />
    <div className="absolute right-10 top-24 h-72 w-72 rounded-full bg-amber-400/30 blur-3xl" />
    <div className="absolute inset-0 flex items-end justify-between gap-6 p-10">
      <div className="flex-1 rounded-3xl border border-indigo-500/20 bg-slate-900/60 backdrop-blur">
        <div className="h-full w-full rounded-3xl border border-indigo-400/10" />
      </div>
      <div className="hidden h-[70%] w-40 rounded-3xl border border-indigo-400/20 bg-slate-900/50 backdrop-blur md:block" />
      <div className="hidden h-[55%] w-28 rounded-3xl border border-amber-400/30 bg-slate-900/50 backdrop-blur lg:block" />
    </div>
    <div className="absolute inset-x-10 bottom-8 rounded-2xl border border-slate-700/50 bg-slate-950/70 p-6 text-center text-slate-300 shadow-lg">
      <p className="text-lg font-semibold text-indigo-200">Mystery Manor briefing</p>
      <p className="text-sm text-slate-400">Locate the highlighted artefacts hidden within the manor to unravel the story.</p>
    </div>
  </div>
);

const MysteryManorGame = ({ config = mysteryManorConfig }) => {
  const sanitizedTimerSeconds = useMemo(() => {
    const raw = Number(config?.timerSeconds);
    if (Number.isFinite(raw) && raw > 0) {
      return Math.floor(raw);
    }
    return 120;
  }, [config?.timerSeconds]);

  const sanitizedMaxHints = useMemo(() => {
    const raw = Number(config?.maxHints);
    if (Number.isFinite(raw) && raw >= 0) {
      return Math.floor(raw);
    }
    return 0;
  }, [config?.maxHints]);

  const { items, invalidItemsCount } = useMemo(() => {
    if (!Array.isArray(config?.items)) {
      return { items: [], invalidItemsCount: 0 };
    }

    let invalidCount = 0;
    const validItems = config.items.reduce((acc, rawItem, index) => {
      if (!rawItem || typeof rawItem.id !== 'string' || !hasValidHotspot(rawItem.hotspot)) {
        invalidCount += 1;
        return acc;
      }

      acc.push({
        id: rawItem.id,
        name: rawItem.name || `Artefact ${index + 1}`,
        image: rawItem.image,
        hint: rawItem.hint || '',
        hotspot: { ...rawItem.hotspot }
      });
      return acc;
    }, []);

    return { items: validItems, invalidItemsCount: invalidCount };
  }, [config?.items]);

  const totalItems = items.length;

  const [status, setStatus] = useState(() => (totalItems === 0 ? 'no-items' : 'ready'));
  const [timeLeft, setTimeLeft] = useState(sanitizedTimerSeconds);
  const [foundItemIds, setFoundItemIds] = useState([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [activeHintId, setActiveHintId] = useState(null);
  const [lastAction, setLastAction] = useState(null);
  const [recentlyFoundId, setRecentlyFoundId] = useState(null);

  useEffect(() => {
    setTimeLeft(sanitizedTimerSeconds);
    setFoundItemIds([]);
    setHintsUsed(0);
    setActiveHintId(null);
    setLastAction(totalItems === 0 ? { type: 'empty' } : null);
    setRecentlyFoundId(null);
    setStatus(totalItems === 0 ? 'no-items' : 'ready');
  }, [config?.gameId, sanitizedTimerSeconds, totalItems]);

  useEffect(() => {
    if (status !== 'playing') {
      return undefined;
    }

    if (timeLeft <= 0) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          return 0;
        }
        return previous - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [status]);

  useEffect(() => {
    if (status === 'playing' && timeLeft === 0) {
      setStatus('lost');
      setLastAction({ type: 'lost' });
    }
  }, [status, timeLeft]);

  useEffect(() => {
    if (status === 'playing' && totalItems > 0 && foundItemIds.length === totalItems) {
      setStatus('won');
      setLastAction({ type: 'won' });
    }
  }, [status, foundItemIds, totalItems]);

  useEffect(() => {
    if (!activeHintId || status !== 'playing') {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setActiveHintId(null);
    }, 4000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeHintId, status]);

  useEffect(() => {
    if (!recentlyFoundId) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setRecentlyFoundId(null);
    }, 1400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [recentlyFoundId]);

  const resetForNewRun = useCallback(() => {
    setTimeLeft(sanitizedTimerSeconds);
    setFoundItemIds([]);
    setHintsUsed(0);
    setActiveHintId(null);
    setRecentlyFoundId(null);
  }, [sanitizedTimerSeconds]);

  const handleStart = useCallback(() => {
    if (totalItems === 0) {
      return;
    }
    resetForNewRun();
    setStatus('playing');
    setLastAction({ type: 'start' });
  }, [resetForNewRun, totalItems]);

  const handleRestart = useCallback(() => {
    if (totalItems === 0) {
      return;
    }
    resetForNewRun();
    setStatus('playing');
    setLastAction({ type: 'restart' });
  }, [resetForNewRun, totalItems]);

  const handleHotspotClick = useCallback((item) => {
    if (status !== 'playing' || !item) {
      return;
    }

    setFoundItemIds((previous) => {
      if (previous.includes(item.id)) {
        return previous;
      }

      const updated = [...previous, item.id];
      const remaining = Math.max(totalItems - updated.length, 0);
      setLastAction({ type: 'found', item, remaining });
      setRecentlyFoundId(item.id);
      setActiveHintId((current) => (current === item.id ? null : current));
      return updated;
    });
  }, [status, totalItems]);

  const handleHintRequest = useCallback(() => {
    if (status !== 'playing') {
      return;
    }

    if (foundItemIds.length >= totalItems) {
      setLastAction({ type: 'hint-none' });
      return;
    }

    if (hintsUsed >= sanitizedMaxHints) {
      setLastAction({ type: 'no-hints' });
      return;
    }

    const nextItem = items.find((item) => !foundItemIds.includes(item.id));
    if (!nextItem) {
      setLastAction({ type: 'hint-none' });
      return;
    }

    setHintsUsed((previous) => previous + 1);
    setActiveHintId(nextItem.id);
    setLastAction({ type: 'hint', item: nextItem });
  }, [status, items, foundItemIds, hintsUsed, sanitizedMaxHints, totalItems]);

  const foundCount = foundItemIds.length;
  const itemsRemaining = Math.max(totalItems - foundCount, 0);
  const hintsRemaining = Math.max(sanitizedMaxHints - hintsUsed, 0);
  const progress = totalItems === 0 ? 0 : Math.min(100, Math.round((foundCount / totalItems) * 100));
  const canUseHint = status === 'playing' && hintsRemaining > 0 && itemsRemaining > 0;
  const canRestart = totalItems > 0;

  const statusMessage = useMemo(() => {
    if (status === 'no-items') {
      return 'Add at least one hidden object with a hotspot to run Mystery Manor.';
    }

    if (status === 'ready') {
      return `Recover ${totalItems} hidden artefact${totalItems === 1 ? '' : 's'} in ${formatTime(sanitizedTimerSeconds)}.`;
    }

    if (status === 'playing') {
      if (!lastAction) {
        return `Recover ${totalItems} artefact${totalItems === 1 ? '' : 's'} before the clock runs out.`;
      }

      switch (lastAction.type) {
        case 'found':
          return `${lastAction.item.name} recovered! ${lastAction.remaining === 0 ? 'All artefacts secured.' : `${lastAction.remaining} remaining.`}`;
        case 'hint':
          return lastAction.item.hint
            ? `Hint for ${lastAction.item.name}: ${lastAction.item.hint}`
            : `${lastAction.item.name} highlighted on the scene.`;
        case 'no-hints':
          return 'All hints have been used.';
        case 'hint-none':
          return 'Every artefact has already been recovered.';
        case 'start':
          return `The search begins. ${totalItems} artefact${totalItems === 1 ? '' : 's'} to locate.`;
        case 'restart':
          return `Search reset. Find all ${totalItems} artefact${totalItems === 1 ? '' : 's'} again.`;
        default:
          return `Keep searching. ${Math.max(totalItems - foundItemIds.length, 0)} artefact${itemsRemaining === 1 ? '' : 's'} remain.`;
      }
    }

    if (status === 'won') {
      return `You recovered every artefact with ${formatTime(timeLeft)} left on the clock!`;
    }

    if (status === 'lost') {
      return 'Time expired before all artefacts were recovered. Try again!';
    }

    return '';
  }, [status, totalItems, sanitizedTimerSeconds, lastAction, foundItemIds.length, itemsRemaining, timeLeft]);

  const renderOverlay = () => {
    if (status === 'playing') {
      return null;
    }

    if (status === 'no-items') {
      return (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/85 px-6 py-8 text-center backdrop-blur-md">
          <div className="w-full max-w-xl space-y-4 rounded-3xl border border-slate-700 bg-slate-900/90 p-8 text-slate-200 shadow-2xl">
            <FiAlertTriangle className="mx-auto h-12 w-12 text-amber-400" aria-hidden="true" />
            <h3 className="text-2xl font-semibold text-white">Mystery Manor setup incomplete</h3>
            <p className="text-base text-slate-300">
              The current configuration does not include any hidden artefacts with hotspots. Add at least one
              item in the configuration dashboard to start the experience.
            </p>
          </div>
        </div>
      );
    }

    let icon = null;
    let title = '';
    let description = '';
    let statsBlock = null;
    let primaryLabel = '';
    let onPrimary = handleStart;

    if (status === 'ready') {
      icon = <FiSearch className="h-12 w-12 text-indigo-300" aria-hidden="true" />;
      title = 'Prepare for the search';
      description = `Study the manor and recover ${totalItems} artefact${totalItems === 1 ? '' : 's'} before time runs out.`;
      primaryLabel = 'Start search';
      statsBlock = (
        <div className="grid grid-cols-2 gap-3 rounded-2xl border border-indigo-400/40 bg-indigo-500/10 p-4 text-sm text-indigo-100">
          <div>
            <p className="text-xs uppercase tracking-wide text-indigo-200">Time limit</p>
            <p className="text-lg font-semibold text-white">{formatTime(sanitizedTimerSeconds)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-indigo-200">Artefacts</p>
            <p className="text-lg font-semibold text-white">{totalItems}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-indigo-200">Hints available</p>
            <p className="text-lg font-semibold text-white">{sanitizedMaxHints}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-indigo-200">Objective</p>
            <p className="text-sm text-slate-200">Collect everything before the clock reaches zero.</p>
          </div>
        </div>
      );
    } else if (status === 'won') {
      icon = <FiCheckCircle className="h-12 w-12 text-emerald-300" aria-hidden="true" />;
      title = 'All artefacts recovered!';
      description = 'Great work – the manor mystery is solved.';
      primaryLabel = 'Play again';
      onPrimary = handleRestart;
      statsBlock = (
        <div className="grid grid-cols-2 gap-3 rounded-2xl border border-emerald-400/60 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          <div>
            <p className="text-xs uppercase tracking-wide text-emerald-200">Recovered</p>
            <p className="text-lg font-semibold">{foundCount} / {totalItems}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-emerald-200">Time remaining</p>
            <p className="text-lg font-semibold">{formatTime(timeLeft)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-emerald-200">Hints used</p>
            <p className="text-lg font-semibold">{hintsUsed}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-emerald-200">Search duration</p>
            <p className="text-lg font-semibold">{formatTime(Math.max(sanitizedTimerSeconds - timeLeft, 0))}</p>
          </div>
        </div>
      );
    } else if (status === 'lost') {
      icon = <FiAlertTriangle className="h-12 w-12 text-amber-300" aria-hidden="true" />;
      title = 'Time has expired';
      description = 'The manor resets before every artefact was recovered.';
      primaryLabel = 'Try again';
      onPrimary = handleRestart;
      statsBlock = (
        <div className="grid grid-cols-2 gap-3 rounded-2xl border border-rose-400/60 bg-rose-500/10 p-4 text-sm text-rose-100">
          <div>
            <p className="text-xs uppercase tracking-wide text-rose-200">Recovered</p>
            <p className="text-lg font-semibold">{foundCount} / {totalItems}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-rose-200">Time elapsed</p>
            <p className="text-lg font-semibold">{formatTime(Math.max(0, sanitizedTimerSeconds - timeLeft))}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-rose-200">Hints used</p>
            <p className="text-lg font-semibold">{hintsUsed}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-rose-200">Artefacts remaining</p>
            <p className="text-lg font-semibold">{itemsRemaining}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/85 px-6 py-8 text-center backdrop-blur-md">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="w-full max-w-xl space-y-5 rounded-3xl border border-slate-700 bg-slate-900/90 p-8 text-slate-200 shadow-2xl"
        >
          <div className="flex justify-center">{icon}</div>
          <h3 className="text-2xl font-semibold text-white">{title}</h3>
          <p className="text-base text-slate-300">{description}</p>
          {statsBlock}
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={onPrimary}
              className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-6 py-2 text-base font-semibold text-white shadow-lg transition hover:bg-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-300"
            >
              {status === 'ready' ? <FiSearch className="h-5 w-5" aria-hidden="true" /> : <FiRefreshCcw className="h-5 w-5" aria-hidden="true" />}
              <span>{primaryLabel}</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const title = config?.title || 'Mystery Manor';
  const subtitle = config?.subtitle || 'Find the hidden artefacts before time runs out';
  const description = config?.description || 'Explore the manor, uncover clues, and recover the artefacts.';

  if (totalItems === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 py-10 text-center text-slate-200">
        <div className="mx-auto max-w-2xl space-y-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-10 shadow-2xl">
          <FiAlertTriangle className="mx-auto h-14 w-14 text-amber-400" aria-hidden="true" />
          <h2 className="text-3xl font-semibold text-white">{title}</h2>
          <p className="text-lg text-slate-300">{subtitle}</p>
          <p className="text-base text-slate-400">{description}</p>
          <p className="text-sm text-slate-400">
            The configuration currently has no playable items. Update the `items` list with hotspots to enable the game.
          </p>
          {invalidItemsCount > 0 && (
            <p className="text-xs text-amber-300">
              {invalidItemsCount} item{invalidItemsCount === 1 ? ' was' : 's were'} skipped because hotspot data was incomplete.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 lg:px-8">
        <header className="flex flex-col gap-3 text-center lg:text-left">
          <span className="text-xs uppercase tracking-[0.4em] text-indigo-400">Hidden-object challenge</span>
          <h1 className="text-4xl font-semibold text-white sm:text-5xl">{title}</h1>
          <p className="text-lg text-slate-300">{subtitle}</p>
          <p className="max-w-3xl text-base text-slate-400">{description}</p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-slate-300 lg:justify-start">
            <div className="flex items-center gap-2 rounded-full border border-indigo-400/40 bg-slate-900/60 px-3 py-1.5">
              <FiClock className="h-4 w-4 text-indigo-300" aria-hidden="true" />
              <span>
                {status === 'playing' ? formatTime(timeLeft) : formatTime(sanitizedTimerSeconds)}
                <span className="text-slate-500"> / {formatTime(sanitizedTimerSeconds)}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-emerald-400/40 bg-slate-900/60 px-3 py-1.5">
              <FiCheckCircle className="h-4 w-4 text-emerald-300" aria-hidden="true" />
              <span>{foundCount} / {totalItems} recovered</span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-amber-400/40 bg-slate-900/60 px-3 py-1.5">
              <FiEye className="h-4 w-4 text-amber-300" aria-hidden="true" />
              <span>{hintsRemaining} hint{hintsRemaining === 1 ? '' : 's'} left</span>
            </div>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 shadow-2xl">
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <ImageWithFallback
                src={config?.sceneImage || config?.backgroundImage}
                alt="Mystery Manor hidden-object scene"
                className="absolute inset-0 h-full w-full rounded-3xl object-cover"
                fallback={() => <SceneFallback />}
              />

              <div className="pointer-events-none absolute left-4 top-4 flex flex-wrap gap-3 text-xs">
                <div className="flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-950/60 px-3 py-1.5 text-slate-200 shadow">
                  <FiClock className="h-4 w-4 text-indigo-300" aria-hidden="true" />
                  <span className="font-semibold">{formatTime(timeLeft)}</span>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-950/60 px-3 py-1.5 text-slate-200 shadow">
                  <FiCheckCircle className="h-4 w-4 text-emerald-300" aria-hidden="true" />
                  <span className="font-semibold">{itemsRemaining} left</span>
                </div>
              </div>

              {items.map((item) => {
                const isFound = foundItemIds.includes(item.id);
                const isHinted = activeHintId === item.id && status === 'playing';
                const hotspotStyle = getHotspotStyle(item.hotspot);
                const isCircle = item.hotspot?.type !== 'rect';

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleHotspotClick(item)}
                    disabled={isFound || status !== 'playing'}
                    style={hotspotStyle}
                    className={`absolute flex items-center justify-center overflow-hidden border transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300/60 ${
                      isCircle ? 'rounded-full' : 'rounded-2xl'
                    } ${
                      isFound
                        ? 'cursor-default border-emerald-400/70 bg-emerald-500/10'
                        : 'cursor-pointer border-indigo-400/40 bg-slate-900/40 hover:border-indigo-300/60 hover:bg-indigo-400/10'
                    } ${isHinted ? 'animate-pulse ring-4 ring-amber-300/60' : ''}`}
                  >
                    <span className="sr-only">{isFound ? `${item.name} recovered` : `Select ${item.name}`}</span>
                    <div className={`pointer-events-none flex h-full w-full items-center justify-center transition-opacity ${isFound ? 'opacity-80' : 'opacity-95'}`}>
                      <ImageWithFallback
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-contain"
                        fallback={() => <DefaultItemArt name={item.name} />}
                      />
                    </div>
                    {isFound && (
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-emerald-300">
                        <FiCheckCircle className="h-8 w-8 drop-shadow" aria-hidden="true" />
                      </div>
                    )}
                  </button>
                );
              })}

              {renderOverlay()}
            </div>
            <div className="border-t border-slate-800/80 bg-slate-950/60 px-6 py-4 text-sm text-slate-300">
              <div aria-live="polite" className="flex items-center gap-2">
                <FiInfo className="h-5 w-5 text-indigo-300" aria-hidden="true" />
                <span>{statusMessage}</span>
              </div>
            </div>
          </section>

          <aside className="flex min-h-full flex-col gap-5 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Artefact dossier</h2>
                <span className="text-sm text-slate-400">{foundCount} / {totalItems} recovered</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleHintRequest}
                disabled={!canUseHint}
                className="inline-flex items-center justify-between gap-2 rounded-2xl border border-amber-400/50 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-900/60 disabled:text-slate-400"
              >
                <span className="flex items-center gap-2">
                  <FiEye className="h-5 w-5" aria-hidden="true" />
                  Use hint
                </span>
                <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-xs font-semibold">{hintsRemaining}</span>
              </button>
              <button
                type="button"
                onClick={handleRestart}
                disabled={!canRestart}
                className="inline-flex items-center gap-2 rounded-2xl border border-indigo-400/50 bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-indigo-100 transition hover:bg-indigo-500/20 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-900/60 disabled:text-slate-400"
              >
                <FiRefreshCcw className="h-5 w-5" aria-hidden="true" />
                Restart search
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {items.map((item) => {
                const isFound = foundItemIds.includes(item.id);
                const isHinted = activeHintId === item.id && status === 'playing';
                const isRecent = recentlyFoundId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 rounded-2xl border px-3 py-3 transition-all duration-300 ${
                      isFound
                        ? 'border-emerald-400/60 bg-emerald-500/10 text-emerald-100'
                        : 'border-slate-700 bg-slate-900/50 text-slate-200'
                    } ${isHinted ? 'ring-2 ring-amber-300/60' : ''} ${isRecent ? 'animate-pulse' : ''}`}
                  >
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-900/60">
                      <ImageWithFallback
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-contain"
                        fallback={() => <DefaultItemArt name={item.name} />}
                      />
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="text-base font-semibold text-white">{item.name}</p>
                      {item.hint && <p className="text-xs text-slate-300">Hint: {item.hint}</p>}
                      <p className="text-xs text-slate-400">
                        Status: {isFound ? 'Recovered' : isHinted ? 'Highlighted' : 'Hidden'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
              <div className="flex items-start gap-2">
                <FiInfo className="mt-0.5 h-5 w-5 text-indigo-300" aria-hidden="true" />
                <div className="space-y-2">
                  <p>Tap artefacts within the scene to recover them. Use hints to briefly highlight an unfound target.</p>
                  <p className="text-xs text-slate-500">Submission endpoint: {config?.submissionEndpoint || 'Not configured'}</p>
                  {invalidItemsCount > 0 && (
                    <p className="text-xs text-amber-300">
                      {invalidItemsCount} item{invalidItemsCount === 1 ? ' was' : 's were'} skipped because hotspot data was incomplete.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default MysteryManorGame;
