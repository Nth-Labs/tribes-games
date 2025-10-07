import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import './dino-jump.css';

const STAGE_WIDTH = 640;
const DINO_WIDTH = 60;
const DINO_X = 90;
const GROUND_OFFSET = 40;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const randomInRange = (min, max) => Math.random() * (max - min) + min;

const formatScore = (value) => value.toLocaleString();

const findThresholdResult = (thresholds, score) => {
  if (!Array.isArray(thresholds) || thresholds.length === 0) {
    return {
      unlocked: null,
      next: null,
    };
  }

  const sorted = [...thresholds].sort((a, b) => a.threshold - b.threshold);
  let unlocked = null;
  let next = null;

  for (const tier of sorted) {
    if (score >= tier.threshold) {
      unlocked = tier;
      continue;
    }

    if (!next) {
      next = tier;
    }
  }

  return { unlocked, next, sorted };
};

const createRuntimeState = (physics) => ({
  dino: { y: 0, vy: 0 },
  obstacles: [],
  score: 0,
  spawnTimer: 0,
  nextSpawnIn: randomInRange(physics.spawnIntervalMin, physics.spawnIntervalMax),
});

const createObstacle = (stageWidth, baseHeight) => {
  const variantRoll = Math.random();
  const height = clamp(baseHeight * randomInRange(0.85, 1.35), 38, 110);
  const width = variantRoll > 0.66 ? 78 : variantRoll > 0.33 ? 64 : 52;
  const variant = variantRoll > 0.66 ? 'wide' : variantRoll > 0.33 ? 'tall' : 'slim';

  const now =
    typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.now()
      : Date.now();

  return {
    id: `${now.toFixed(2)}-${Math.random().toString(16).slice(2, 7)}`,
    x: stageWidth + width,
    width,
    height,
    variant,
  };
};

const DinoJumpGame = ({ config, onBack }) => {
  const copy = config?.copy ?? {};
  const title = config?.title || 'Dino Jump';
  const subtitle = config?.subtitle;
  const thresholds = config?.metadata?.score_thresholds ?? [];

  const physics = useMemo(
    () => ({
      groundSpeed: config?.physics?.ground_speed ?? 250,
      gravity: config?.physics?.gravity ?? 1800,
      jumpVelocity: config?.physics?.jump_velocity ?? 720,
      spawnIntervalMin: config?.physics?.spawn_interval_min ?? 1.15,
      spawnIntervalMax: config?.physics?.spawn_interval_max ?? 2.25,
      scorePerSecond: config?.physics?.score_per_second ?? 60,
    }),
    [config?.physics],
  );

  const [gameState, setGameState] = useState('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => config?.metadata?.seed_high_score ?? 0);
  const [dinoY, setDinoY] = useState(0);
  const [obstacles, setObstacles] = useState([]);

  const animationRef = useRef(null);
  const runtimeRef = useRef(createRuntimeState(physics));
  const previousTimestampRef = useRef(null);
  const gameStateRef = useRef(gameState);
  const scoreRef = useRef(score);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  const resetRuntime = useCallback(() => {
    runtimeRef.current = createRuntimeState(physics);
    previousTimestampRef.current = null;
    setDinoY(0);
    setObstacles([]);
    setScore(0);
  }, [physics]);

  const stopAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    previousTimestampRef.current = null;
  }, []);

  const endRun = useCallback(() => {
    stopAnimation();
    const finalScore = Math.floor(runtimeRef.current.score);
    setScore(finalScore);
    setHighScore((prev) => (finalScore > prev ? finalScore : prev));
    setGameState('ended');
  }, [stopAnimation]);

  const runFrame = useCallback(
    (timestamp) => {
      if (gameStateRef.current !== 'playing') {
        return;
      }

      if (!previousTimestampRef.current) {
        previousTimestampRef.current = timestamp;
      }

      const deltaMs = clamp(timestamp - previousTimestampRef.current, 0, 48);
      const deltaSeconds = deltaMs / 1000;
      previousTimestampRef.current = timestamp;

      const runtime = runtimeRef.current;

      runtime.spawnTimer += deltaSeconds;
      runtime.score += physics.scorePerSecond * deltaSeconds;

      runtime.dino.vy = clamp(
        runtime.dino.vy - physics.gravity * deltaSeconds,
        -physics.jumpVelocity,
        physics.jumpVelocity,
      );
      runtime.dino.y = Math.max(0, runtime.dino.y + runtime.dino.vy * deltaSeconds);

      if (runtime.dino.y === 0 && runtime.dino.vy < 0) {
        runtime.dino.vy = 0;
      }

      if (runtime.spawnTimer >= runtime.nextSpawnIn) {
        runtime.spawnTimer = 0;
        runtime.nextSpawnIn = randomInRange(
          physics.spawnIntervalMin,
          physics.spawnIntervalMax,
        );
        runtime.obstacles.push(createObstacle(STAGE_WIDTH, GROUND_OFFSET * 2.2));
      }

      const movement = physics.groundSpeed * deltaSeconds;
      const remainingObstacles = [];
      let collided = false;

      for (const obstacle of runtime.obstacles) {
        obstacle.x -= movement;

        if (obstacle.x + obstacle.width < -40) {
          continue;
        }

        const intersectsHorizontally =
          obstacle.x < DINO_X + DINO_WIDTH && obstacle.x + obstacle.width > DINO_X;
        const intersectsVertically = runtime.dino.y < obstacle.height;

        if (intersectsHorizontally && intersectsVertically) {
          collided = true;
        }

        remainingObstacles.push(obstacle);
      }

      runtime.obstacles = remainingObstacles;

      const integerScore = Math.floor(runtime.score);
      if (integerScore !== scoreRef.current) {
        scoreRef.current = integerScore;
        setScore(integerScore);
      }

      setDinoY(runtime.dino.y);
      setObstacles([...runtime.obstacles]);

      if (collided) {
        endRun();
        return;
      }

      animationRef.current = requestAnimationFrame(runFrame);
    },
    [endRun, physics],
  );

  useEffect(() => {
    return () => {
      stopAnimation();
    };
  }, [stopAnimation]);

  const startRun = useCallback(() => {
    if (gameStateRef.current === 'playing') {
      return;
    }

    stopAnimation();
    resetRuntime();
    setGameState('playing');
    gameStateRef.current = 'playing';
    animationRef.current = requestAnimationFrame(runFrame);
  }, [resetRuntime, runFrame, stopAnimation]);

  const handleJump = useCallback(() => {
    if (gameStateRef.current !== 'playing') {
      return;
    }

    const runtime = runtimeRef.current;
    if (runtime.dino.y <= 1) {
      runtime.dino.vy = physics.jumpVelocity;
    }
  }, [physics.jumpVelocity]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === 'Space') {
        event.preventDefault();
        if (gameStateRef.current === 'idle' || gameStateRef.current === 'ended') {
          startRun();
          return;
        }
        handleJump();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleJump, startRun]);

  useEffect(() => {
    stopAnimation();
    resetRuntime();
    setGameState('idle');
  }, [physics, resetRuntime, stopAnimation]);

  const { unlocked, next, sorted = thresholds } = useMemo(
    () => findThresholdResult(thresholds, score),
    [score, thresholds],
  );

  const overlayLabel = useMemo(() => {
    if (gameState === 'idle') {
      return 'Tap Start Run to begin';
    }

    if (gameState === 'ended') {
      return `You reached ${formatScore(score)} points!`;
    }

    return null;
  }, [gameState, score]);

  return (
    <div className="dino-jump-shell">
      <div className="dino-jump-card">
        <header className="dino-jump-header">
          <div>
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <div className="dino-controls">
            {onBack && (
              <button
                type="button"
                className="dino-btn dino-btn--ghost"
                onClick={onBack}
              >
                Back to library
              </button>
            )}
            <button
              type="button"
              className="dino-btn dino-btn--primary"
              onClick={gameState === 'playing' ? handleJump : startRun}
            >
              {gameState === 'playing'
                ? copy.jump_button || 'Jump'
                : copy.play_button || 'Start Run'}
            </button>
          </div>
        </header>
        <div className="dino-jump-body">
          <section className="dino-stage">
            <div className="dino-stage__stars" aria-hidden />
            <div className="dino-sun" aria-hidden />
            <div
              className="dino-player"
              style={{ bottom: `${GROUND_OFFSET + dinoY}px` }}
            >
              <div className="dino-player__eye" aria-hidden />
            </div>
            {obstacles.map((obstacle) => (
              <div
                key={obstacle.id}
                className="dino-obstacle"
                data-variant={obstacle.variant}
                style={{
                  left: `${obstacle.x}px`,
                  height: `${obstacle.height}px`,
                }}
              />
            ))}
            <div className="dino-stage__ground" aria-hidden />
            {overlayLabel && (
              <div className="dino-stage__overlay">
                <div>
                  {overlayLabel}
                  {gameState === 'idle' && copy.instructions && (
                    <span>{copy.instructions}</span>
                  )}
                  {gameState === 'ended' && (
                    <span>
                      {unlocked
                        ? `Unlocked: ${unlocked.reward?.name ?? 'Mystery reward'}`
                        : 'No reward unlocked this run — try again!'}
                    </span>
                  )}
                </div>
              </div>
            )}
          </section>
          <aside className="dino-hud">
            <div className="dino-stat-panel">
              <div className="dino-stat-header">
                <h2>Run Stats</h2>
              </div>
              <div className="dino-score">
                <div className="dino-score-card">
                  <span>Current</span>
                  <strong>{formatScore(score)}</strong>
                </div>
                <div className="dino-score-card">
                  <span>High score</span>
                  <strong>{formatScore(highScore)}</strong>
                </div>
              </div>
              {gameState !== 'playing' && copy.instructions && (
                <p className="dino-instructions">{copy.instructions}</p>
              )}
            </div>
            <div className="dino-stat-panel">
              <div className="dino-stat-header">
                <h2>Score Thresholds</h2>
                <span style={{ fontSize: '0.85rem', color: 'rgba(148, 163, 184, 0.85)' }}>
                  {config?.metadata?.distribution_type === 'score_threshold'
                    ? 'Score based distribution'
                    : 'Custom distribution'}
                </span>
              </div>
              {sorted && sorted.length > 0 ? (
                <ul className="dino-thresholds">
                  {sorted.map((tier) => (
                    <li
                      key={tier.threshold}
                      className="dino-threshold"
                      data-achieved={score >= tier.threshold}
                    >
                      <strong>
                        {tier.reward?.name ?? `Tier ${tier.threshold}`}
                        <span>{formatScore(tier.threshold)} pts</span>
                      </strong>
                      {tier.reward?.description && (
                        <small>{tier.reward.description}</small>
                      )}
                      {score >= tier.threshold && tier === unlocked && (
                        <div className="dino-results">
                          Current run unlocked this reward!
                        </div>
                      )}
                      {tier === next && (
                        <small>
                          {`Reach ${formatScore(next.threshold)} points for this reward.`}
                        </small>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="dino-empty-thresholds">
                  Configure score thresholds to distribute prizes as players climb the
                  leaderboard.
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default DinoJumpGame;
