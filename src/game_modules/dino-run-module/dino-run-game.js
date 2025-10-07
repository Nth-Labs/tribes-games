import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 260;
const GROUND_HEIGHT = 36;
const PLAYER_WIDTH = 44;
const PLAYER_HEIGHT = 52;
const GRAVITY = 2000;
const JUMP_VELOCITY = 760;
const MAX_DELTA = 0.035;

const DEFAULT_THEME = {
  backgroundColor: '#f8fafc',
  groundColor: '#e2e8f0',
  playerColor: '#2563eb',
  obstacleColor: '#f97316',
  scoreColor: '#0f172a',
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const hexToRgb = (hex) => {
  if (typeof hex !== 'string') {
    return null;
  }
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) {
    return null;
  }
  const value = parseInt(normalized, 16);
  if (Number.isNaN(value)) {
    return null;
  }
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
};

const lighten = (hex, amount) => {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return hex;
  }
  const mix = (channel) => Math.round(channel + (255 - channel) * clamp(amount, 0, 1));
  const r = mix(rgb.r);
  const g = mix(rgb.g);
  const b = mix(rgb.b);
  return `rgb(${r}, ${g}, ${b})`;
};

const drawStackedPlayer = (ctx, player, color) => {
  const tiers = 3;
  const blockHeight = player.height / tiers;
  for (let i = 0; i < tiers; i += 1) {
    const shade = lighten(color, i * 0.18);
    const y = player.y + player.height - blockHeight * (i + 1);
    ctx.fillStyle = shade;
    ctx.fillRect(player.x, y, player.width, blockHeight);
  }
  ctx.fillStyle = lighten(color, 0.35);
  ctx.fillRect(
    player.x + player.width * 0.55,
    player.y + blockHeight * 0.2,
    player.width * 0.28,
    blockHeight * 0.6,
  );
};

const drawPlayer = (ctx, player, theme, shape = 'block') => {
  if (shape === 'stacked-blocks') {
    drawStackedPlayer(ctx, player, theme.playerColor);
    return;
  }
  ctx.fillStyle = theme.playerColor;
  ctx.fillRect(player.x, player.y, player.width, player.height);
};

const createObstacle = (speed, difficultyScale) => {
  const minWidth = 26;
  const maxWidth = 54;
  const baseHeight = 42;
  const heightBoost = Math.random() * 22 * clamp(difficultyScale, 1, 1.7);
  const width = minWidth + Math.random() * (maxWidth - minWidth);
  const height = baseHeight + heightBoost;
  const y = GAME_HEIGHT - GROUND_HEIGHT - height;
  const offset = Math.random() * clamp(220 - speed * 0.25, 120, 220);
  return {
    x: GAME_WIDTH + offset,
    y,
    width,
    height,
  };
};

const DinoRunGame = ({ config, onBack }) => {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastTimestampRef = useRef(performance.now());
  const stateRef = useRef({
    player: {
      x: 120,
      y: GAME_HEIGHT - GROUND_HEIGHT - PLAYER_HEIGHT,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      velocityY: 0,
      onGround: true,
    },
    obstacles: [],
    spawnTimer: 1.1,
    speed: 0,
    score: 0,
    gameOver: false,
  });
  const scoreRef = useRef(0);

  const [score, setScore] = useState(0);
  const [, setGameOver] = useState(false);

  const theme = useMemo(
    () => ({
      ...DEFAULT_THEME,
      ...(config?.theme || {}),
    }),
    [config?.theme],
  );

  const difficulty = useMemo(
    () => ({
      baseSpeed: config?.difficulty?.baseSpeed || 300,
      maxSpeed: config?.difficulty?.maxSpeed || 540,
    }),
    [config?.difficulty?.baseSpeed, config?.difficulty?.maxSpeed],
  );

  const createInitialState = useCallback(
    () => ({
      player: {
        x: 120,
        y: GAME_HEIGHT - GROUND_HEIGHT - PLAYER_HEIGHT,
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
        velocityY: 0,
        onGround: true,
      },
      obstacles: [],
      spawnTimer: 0.9,
      speed: difficulty.baseSpeed,
      score: 0,
      gameOver: false,
    }),
    [difficulty.baseSpeed],
  );

  const resetGame = useCallback(() => {
    stateRef.current = createInitialState();
    scoreRef.current = 0;
    setScore(0);
    setGameOver(false);
  }, [createInitialState]);

  const attemptJump = useCallback(() => {
    const state = stateRef.current;
    if (state.gameOver) {
      return;
    }
    const player = state.player;
    if (!player.onGround) {
      return;
    }
    player.velocityY = -JUMP_VELOCITY;
    player.onGround = false;
  }, []);

  const handleJumpButtonPointerDown = useCallback((event) => {
    event.preventDefault();
    attemptJump();
  }, [attemptJump]);

  const handleJumpButtonKeyDown = useCallback(
    (event) => {
      if (event.code === 'Space' || event.code === 'Enter') {
        event.preventDefault();
        attemptJump();
      }
    },
    [attemptJump],
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext('2d');
    const state = stateRef.current;

    ctx.fillStyle = theme.backgroundColor;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.fillStyle = theme.groundColor;
    ctx.fillRect(0, GAME_HEIGHT - GROUND_HEIGHT, GAME_WIDTH, GROUND_HEIGHT);

    ctx.fillStyle = theme.obstacleColor;
    state.obstacles.forEach((obstacle) => {
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });

    drawPlayer(ctx, state.player, theme, config?.assets?.playerShape);

    ctx.fillStyle = theme.scoreColor;
    ctx.font = '16px "JetBrains Mono", "Fira Mono", ui-monospace, monospace';
    ctx.textBaseline = 'top';
    ctx.fillText(`Score: ${scoreRef.current}`, 12, 12);

    if (state.gameOver) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '28px "JetBrains Mono", "Fira Mono", ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Game Over', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 18);
      ctx.font = '18px "JetBrains Mono", "Fira Mono", ui-monospace, monospace';
      ctx.fillText('Press R or tap Restart', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 14);
      ctx.textAlign = 'left';
    }
  }, [config?.assets?.playerShape, theme]);

  const updateGame = useCallback(
    (delta) => {
      const state = stateRef.current;
      if (state.gameOver) {
        return;
      }
      state.player.velocityY += GRAVITY * delta;
      state.player.y += state.player.velocityY * delta;
      const groundLevel = GAME_HEIGHT - GROUND_HEIGHT - state.player.height;
      if (state.player.y >= groundLevel) {
        state.player.y = groundLevel;
        state.player.velocityY = 0;
        state.player.onGround = true;
      }

      state.spawnTimer -= delta;
      if (state.spawnTimer <= 0) {
        const difficultyScale = clamp(state.speed / difficulty.baseSpeed, 1, 2.2);
        state.obstacles.push(createObstacle(state.speed, difficultyScale));
        state.spawnTimer = Math.max(0.55, 1.1 - (state.speed - difficulty.baseSpeed) / 550);
        if (Math.random() < 0.3) {
          const twin = createObstacle(state.speed, difficultyScale + 0.4);
          twin.x += twin.width + 18;
          twin.height *= 0.85;
          twin.y = GAME_HEIGHT - GROUND_HEIGHT - twin.height;
          state.obstacles.push(twin);
        }
      }

      state.obstacles.forEach((obstacle) => {
        obstacle.x -= state.speed * delta;
      });
      state.obstacles = state.obstacles.filter((obstacle) => obstacle.x + obstacle.width > -60);

      for (let i = 0; i < state.obstacles.length; i += 1) {
        const obstacle = state.obstacles[i];
        const intersects =
          state.player.x < obstacle.x + obstacle.width &&
          state.player.x + state.player.width > obstacle.x &&
          state.player.y < obstacle.y + obstacle.height &&
          state.player.y + state.player.height > obstacle.y;
        if (intersects) {
          state.gameOver = true;
          setGameOver(true);
          break;
        }
      }

      state.score += delta * state.speed * 0.12;
      const roundedScore = Math.floor(state.score);
      if (roundedScore !== scoreRef.current) {
        scoreRef.current = roundedScore;
        setScore(roundedScore);
      }

      state.speed = clamp(state.speed + delta * 28, difficulty.baseSpeed, difficulty.maxSpeed);
    },
    [difficulty.baseSpeed, difficulty.maxSpeed],
  );

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      switch (event.code) {
        case 'ArrowUp':
        case 'Space':
        case 'KeyW':
          attemptJump();
          event.preventDefault();
          break;
        case 'KeyR':
          resetGame();
          event.preventDefault();
          break;
        default:
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [attemptJump, resetGame]);

  useEffect(() => {
    let cancelled = false;
    lastTimestampRef.current = performance.now();

    const tick = (timestamp) => {
      if (cancelled) {
        return;
      }
      const delta = clamp((timestamp - lastTimestampRef.current) / 1000, 0, MAX_DELTA);
      lastTimestampRef.current = timestamp;
      updateGame(delta);
      draw();
      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [draw, updateGame]);

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 bg-slate-100 px-4 py-6">
      <div className="flex w-full max-w-4xl flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-white"
        >
          ← Back to games
        </button>
        <div className="text-sm font-medium text-slate-600">
          Score: <span className="text-lg text-slate-900">{score}</span>
        </div>
        <button
          type="button"
          onClick={resetGame}
          className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-slate-800"
        >
          Restart
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-inner"
      />

      <div className="flex w-full max-w-4xl flex-wrap items-start justify-between gap-6">
        <div className="max-w-lg text-sm leading-relaxed text-slate-600">
          <p className="font-semibold text-slate-700">How to play</p>
          <p className="mt-1">
            Tap the jump button or press space/↑ to hop over spikes. Avoid the obstacles for as long as
            you can—the game speeds up the longer you survive!
          </p>
          {config?.description && (
            <p className="mt-3 text-xs text-slate-500">{config.description}</p>
          )}
        </div>
        <button
          type="button"
          onPointerDown={handleJumpButtonPointerDown}
          onKeyDown={handleJumpButtonKeyDown}
          className="relative flex h-32 w-32 items-center justify-center rounded-full border-2 border-slate-400/80 bg-white/90 text-lg font-semibold text-slate-800 shadow transition active:scale-95"
        >
          Jump
          <span className="pointer-events-none absolute -bottom-10 left-1/2 w-max -translate-x-1/2 text-center text-xs text-slate-500">
            Tap to jump
          </span>
        </button>
      </div>
    </div>
  );
};

export default DinoRunGame;
