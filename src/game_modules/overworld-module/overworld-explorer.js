import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const TILE_SIZE = 48;
const MOVEMENT_MAP = {
  ArrowUp: 'up',
  w: 'up',
  W: 'up',
  ArrowDown: 'down',
  s: 'down',
  S: 'down',
  ArrowLeft: 'left',
  a: 'left',
  A: 'left',
  ArrowRight: 'right',
  d: 'right',
  D: 'right',
};

const SOLID_TILES = new Set(['tree', 'water', 'rock']);

const ITEM_RENDERERS = {
  campfire: (ctx, centerX, centerY) => {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.moveTo(-12, 16);
    ctx.lineTo(12, 16);
    ctx.lineTo(0, -4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.quadraticCurveTo(14, -8, 0, 18);
    ctx.quadraticCurveTo(-14, -8, 0, -18);
    ctx.fill();

    ctx.restore();
  },
  board: (ctx, centerX, centerY) => {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(-14, -16, 28, 20);
    ctx.fillStyle = '#fde68a';
    ctx.fillRect(-10, -12, 20, 12);
    ctx.fillStyle = '#92400e';
    ctx.fillRect(-2, 4, 4, 14);
    ctx.restore();
  },
  pond: (ctx, centerX, centerY) => {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.fillStyle = '#60a5fa';
    ctx.beginPath();
    ctx.ellipse(0, 0, 26, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(4, -2, 12, 6, 0.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  },
  sprout: (ctx, centerX, centerY) => {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.fillStyle = '#166534';
    ctx.fillRect(-2, 4, 4, 14);
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.ellipse(-6, 0, 8, 12, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(6, -2, 8, 12, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },
};

const fallbackItemRenderer = (ctx, centerX, centerY) => {
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.fillStyle = '#1f2937';
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f9fafb';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('?', 0, 0);
  ctx.restore();
};

const drawTile = (ctx, tile, x, y, tileSize, colors) => {
  const color = colors[tile] || '#6ac17c';
  ctx.fillStyle = color;
  ctx.fillRect(x, y, tileSize, tileSize);

  if (tile === 'water') {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x + tileSize * 0.35, y + tileSize * 0.4, tileSize * 0.25, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (tile === 'path' || tile === 'sand') {
    ctx.strokeStyle = 'rgba(120, 72, 30, 0.25)';
    ctx.strokeRect(x + 4, y + 4, tileSize - 8, tileSize - 8);
  }
};

const isTileSolid = (tile, legend) => {
  if (SOLID_TILES.has(tile)) {
    return true;
  }

  const metadata = legend?.[tile];
  return Boolean(metadata?.solid);
};

const createDefaultState = (config) => {
  const startX = config?.player?.start?.x ?? 1;
  const startY = config?.player?.start?.y ?? 1;

  return {
    keys: {
      up: false,
      down: false,
      left: false,
      right: false,
    },
    position: {
      x: (startX + 0.5) * TILE_SIZE,
      y: (startY + 0.5) * TILE_SIZE,
    },
    direction: 'down',
    nearbyItemId: null,
  };
};

const OverworldExplorerGame = ({ config, onBack }) => {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const stateRef = useRef(createDefaultState(config));
  const [nearbyItem, setNearbyItem] = useState(null);
  const [eventLog, setEventLog] = useState([]);

  const world = useMemo(() => config?.world ?? { tiles: [[]], width: 1, height: 1 }, [config]);
  const tileColors = useMemo(() => {
    const legend = world.legend || {};
    const entries = Object.entries(legend).map(([key, value]) => [key, value?.color]);
    return Object.fromEntries(entries);
  }, [world]);

  const handleInteract = useCallback(() => {
    const { nearbyItemId } = stateRef.current;
    if (!nearbyItemId) {
      return;
    }

    const item = world.items?.find((entry) => entry.id === nearbyItemId);
    if (!item) {
      return;
    }

    const message = item.interactionMessage || `You examine the ${item.name}.`;

    setEventLog((previous) => {
      const next = [
        {
          id: `${item.id}-${Date.now()}`,
          text: message,
        },
        ...previous,
      ];
      return next.slice(0, 5);
    });
  }, [world.items]);

  useEffect(() => {
    stateRef.current = createDefaultState(config);
  }, [config]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const direction = MOVEMENT_MAP[event.key];
      if (direction) {
        event.preventDefault();
        stateRef.current.keys[direction] = true;
      }

      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        handleInteract();
      }
    };

    const handleKeyUp = (event) => {
      const direction = MOVEMENT_MAP[event.key];
      if (direction) {
        event.preventDefault();
        stateRef.current.keys[direction] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleInteract]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const ctx = canvas.getContext('2d');
    const { width, height, tiles = [[]] } = world;
    const canvasWidth = Math.max(1, width * TILE_SIZE);
    const canvasHeight = Math.max(1, height * TILE_SIZE);
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const solidCheckLegend = world.legend || {};
    const items = world.items || [];

    let lastTime = performance.now();

    const canMoveTo = (targetX, targetY) => {
      const radius = TILE_SIZE * 0.35;
      const offsets = [
        [0, 0],
        [radius, 0],
        [-radius, 0],
        [0, radius],
        [0, -radius],
      ];

      return offsets.every(([offsetX, offsetY]) => {
        const sampleX = targetX + offsetX;
        const sampleY = targetY + offsetY;
        const tileX = Math.floor(sampleX / TILE_SIZE);
        const tileY = Math.floor(sampleY / TILE_SIZE);

        if (tileX < 0 || tileY < 0 || tileX >= width || tileY >= height) {
          return false;
        }

        const tile = tiles[tileY]?.[tileX];
        return !isTileSolid(tile, solidCheckLegend);
      });
    };

    const drawItems = () => {
      items.forEach((item) => {
        const centerX = (item.position?.x + 0.5) * TILE_SIZE;
        const centerY = (item.position?.y + 0.5) * TILE_SIZE;
        const renderer = ITEM_RENDERERS[item.icon] || fallbackItemRenderer;
        renderer(ctx, centerX, centerY);

        if (stateRef.current.nearbyItemId === item.id) {
          ctx.save();
          ctx.strokeStyle = 'rgba(250, 204, 21, 0.8)';
          ctx.lineWidth = 3;
          ctx.setLineDash([6, 6]);
          ctx.beginPath();
          ctx.arc(centerX, centerY, TILE_SIZE * 0.48, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      });
    };

    const drawPlayer = () => {
      const { position, direction } = stateRef.current;
      const centerX = position.x;
      const centerY = position.y;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.fillStyle = '#fbbf24';
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = 3;

      if (direction === 'left') {
        ctx.beginPath();
        ctx.moveTo(-18, 0);
        ctx.lineTo(18, -16);
        ctx.lineTo(18, 16);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (direction === 'right') {
        ctx.beginPath();
        ctx.moveTo(18, 0);
        ctx.lineTo(-18, -16);
        ctx.lineTo(-18, 16);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (direction === 'up') {
        ctx.fillRect(-14, -24, 28, 40);
        ctx.strokeRect(-14, -24, 28, 40);
      } else {
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-16, -20, 32, 40);
        ctx.strokeRect(-16, -20, 32, 40);
      }

      ctx.fillStyle = '#1f2937';
      ctx.beginPath();
      ctx.arc(0, -8, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawWorld = () => {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      for (let row = 0; row < height; row += 1) {
        for (let col = 0; col < width; col += 1) {
          const tile = tiles[row]?.[col];
          drawTile(ctx, tile, col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, tileColors);
        }
      }

      drawItems();
      drawPlayer();
    };

    const updateNearbyItem = () => {
      if (!items.length) {
        if (stateRef.current.nearbyItemId) {
          stateRef.current.nearbyItemId = null;
          setNearbyItem(null);
        }
        return;
      }

      const { position } = stateRef.current;
      const threshold = TILE_SIZE * 0.8;
      let closestItem = null;
      let closestDistance = Infinity;

      items.forEach((item) => {
        const centerX = (item.position?.x + 0.5) * TILE_SIZE;
        const centerY = (item.position?.y + 0.5) * TILE_SIZE;
        const distance = Math.hypot(centerX - position.x, centerY - position.y);

        if (distance < threshold && distance < closestDistance) {
          closestItem = item;
          closestDistance = distance;
        }
      });

      const currentId = stateRef.current.nearbyItemId;
      const nextId = closestItem?.id ?? null;

      if (currentId !== nextId) {
        stateRef.current.nearbyItemId = nextId;
        setNearbyItem(closestItem || null);
      }
    };

    const tick = (now) => {
      const deltaMs = now - lastTime;
      lastTime = now;
      const deltaMultiplier = Math.min(3, deltaMs / 16.67);

      const { keys, position } = stateRef.current;
      let dx = 0;
      let dy = 0;

      if (keys.up) dy -= 1;
      if (keys.down) dy += 1;
      if (keys.left) dx -= 1;
      if (keys.right) dx += 1;

      if (dx !== 0 || dy !== 0) {
        const length = Math.hypot(dx, dy) || 1;
        dx /= length;
        dy /= length;

        const speedPerFrame = (config?.player?.speed ?? 2.5) * 3 * deltaMultiplier;
        const proposedX = position.x + dx * speedPerFrame;
        const proposedY = position.y + dy * speedPerFrame;

        const clampedX = Math.min(Math.max(proposedX, TILE_SIZE * 0.5), canvasWidth - TILE_SIZE * 0.5);
        const clampedY = Math.min(Math.max(proposedY, TILE_SIZE * 0.5), canvasHeight - TILE_SIZE * 0.5);

        if (canMoveTo(clampedX, position.y)) {
          position.x = clampedX;
        }
        if (canMoveTo(position.x, clampedY)) {
          position.y = clampedY;
        }

        if (Math.abs(dx) > Math.abs(dy)) {
          stateRef.current.direction = dx > 0 ? 'right' : 'left';
        } else if (dy !== 0) {
          stateRef.current.direction = dy > 0 ? 'down' : 'up';
        }
      }

      updateNearbyItem();
      drawWorld();
      animationFrameRef.current = requestAnimationFrame(tick);
    };

    drawWorld();
    animationFrameRef.current = requestAnimationFrame((time) => {
      lastTime = time;
      tick(time);
    });

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [config, tileColors, world]);

  const interactionHint = nearbyItem
    ? `Press Space or Enter to inspect the ${nearbyItem.name}.`
    : 'WASD or arrow keys to move. Explore and find something curious!';

  return (
    <div className="flex min-h-screen flex-col gap-6 bg-gradient-to-br from-sky-100 via-emerald-100 to-amber-100 p-6">
      <header className="flex flex-col gap-3 rounded-2xl bg-white/80 p-5 shadow">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{config?.title || 'Overworld Explorer'}</h1>
            <p className="text-sm text-slate-600">{config?.subtitle}</p>
          </div>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow"
            >
              Back to games
            </button>
          )}
        </div>
        <p className="text-sm text-slate-600">
          Use the keyboard to roam the glade. Placeholder sprites (triangles and rectangles) show direction while
          walking. Stand near glowing objects and interact to read flavour text.
        </p>
      </header>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex flex-1 flex-col gap-4">
          <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-white/60 shadow-inner">
            <canvas
              ref={canvasRef}
              className="h-full w-full"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
          <div className="rounded-2xl bg-white/80 p-4 text-sm text-slate-700 shadow">
            {interactionHint}
          </div>
        </div>

        <aside className="flex w-full flex-col gap-4 lg:w-80">
          <div className="rounded-2xl bg-white/80 p-4 shadow">
            <h2 className="text-lg font-semibold text-slate-900">World Guide</h2>
            <p className="mt-1 text-sm text-slate-600">
              You are exploring <span className="font-medium text-emerald-600">{world?.name || 'a mysterious grove'}</span>.
              Tile colours are derived from the configuration legend to keep visuals editable.
            </p>
            <ul className="mt-3 space-y-1 text-sm">
              {world?.legend &&
                Object.entries(world.legend).map(([key, info]) => (
                  <li key={key} className="flex items-center gap-2">
                    <span
                      className="inline-flex h-4 w-4 rounded border border-slate-300"
                      style={{ backgroundColor: info?.color || '#d1d5db' }}
                    />
                    <span className="text-slate-600">{info?.label || key}</span>
                    {isTileSolid(key, world.legend) && (
                      <span className="rounded-full bg-slate-900/80 px-2 text-xs text-white">solid</span>
                    )}
                  </li>
                ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-white/80 p-4 shadow">
            <h2 className="text-lg font-semibold text-slate-900">Recent interactions</h2>
            {eventLog.length === 0 ? (
              <p className="mt-2 text-sm text-slate-600">Nothing logged yet. Investigate the glowing props.</p>
            ) : (
              <ul className="mt-2 space-y-2 text-sm text-slate-700">
                {eventLog.map((entry) => (
                  <li key={entry.id} className="rounded-lg bg-emerald-50/80 p-2">
                    {entry.text}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default OverworldExplorerGame;
