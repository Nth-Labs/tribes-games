import React, { useEffect, useRef, useState } from 'react';

const GAME_DURATION_SECONDS = 15;
const SHAKE_THRESHOLD = 18;
const SHAKE_COOLDOWN_MS = 250;

const ShakeOffGame = () => {
  const [isSupported, setIsSupported] = useState(true);
  const [permissionState, setPermissionState] = useState('unknown');
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_SECONDS);
  const [score, setScore] = useState(0);
  const [statusMessage, setStatusMessage] = useState(
    'Press "Start Shaking" to begin and move your device with quick, sharp motions.'
  );

  const shakeCooldownRef = useRef(0);
  const intervalRef = useRef(null);
  const latestScoreRef = useRef(0);

  useEffect(() => {
    const supported = typeof window !== 'undefined' && 'DeviceMotionEvent' in window;
    setIsSupported(supported);

    if (!supported) {
      setStatusMessage('This device does not expose the motion sensors required for the Shake Off challenge.');
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    latestScoreRef.current = score;
  }, [score]);

  useEffect(() => {
    if (!isRunning) {
      return undefined;
    }

    const handleMotion = (event) => {
      const acceleration = event.accelerationIncludingGravity || event.acceleration;
      if (!acceleration) {
        return;
      }

      const magnitude = Math.sqrt(
        (acceleration.x || 0) ** 2 + (acceleration.y || 0) ** 2 + (acceleration.z || 0) ** 2
      );

      if (magnitude > SHAKE_THRESHOLD) {
        const now = Date.now();
        if (now - shakeCooldownRef.current > SHAKE_COOLDOWN_MS) {
          shakeCooldownRef.current = now;
          setScore((prev) => prev + 1);
        }
      }
    };

    window.addEventListener('devicemotion', handleMotion);

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning) {
      return undefined;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }

          setIsRunning(false);
          setStatusMessage(`Great work! Final score: ${latestScoreRef.current} shakes.`);
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  const handleStart = async () => {
    if (!isSupported || isRunning) {
      return;
    }

    setStatusMessage('Checking sensor permissions...');

    try {
      if (
        typeof DeviceMotionEvent !== 'undefined' &&
        typeof DeviceMotionEvent.requestPermission === 'function'
      ) {
        const permissionResult = await DeviceMotionEvent.requestPermission();

        if (permissionResult !== 'granted') {
          setPermissionState('denied');
          setStatusMessage(
            'We could not access the motion sensors. Please enable sensor access in your settings and reload the page.'
          );
          return;
        }
      }

      setPermissionState('granted');
      setScore(0);
      latestScoreRef.current = 0;
      setTimeLeft(GAME_DURATION_SECONDS);
      shakeCooldownRef.current = 0;
      setStatusMessage('Shake as fast as you can! Every burst counts.');
      setIsRunning(true);
    } catch (error) {
      setPermissionState('denied');
      setStatusMessage('This device blocked access to its motion sensors, so the Shake Off challenge cannot run.');
    }
  };

  const buttonLabel = (() => {
    if (isRunning) {
      return 'Keep Shaking!';
    }

    if (timeLeft === 0 && permissionState === 'granted') {
      return 'Play Again';
    }

    return 'Start Shaking';
  })();

  if (!isSupported) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-10 text-center">
        <h2 className="text-3xl font-semibold">Shake Off Challenge</h2>
        <p className="max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
          {statusMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-10 text-center">
      <h2 className="text-3xl font-semibold">Shake Off Challenge</h2>
      <p className="max-w-2xl text-gray-600">
        Race against the clock! Shake your device with quick, sharp motions to stack up points before the timer runs out.
      </p>

      <div className="flex flex-col items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Shake Count</span>
        <span className="text-6xl font-extrabold text-indigo-600">{score}</span>
      </div>

      <div className="rounded-full border border-indigo-200 px-6 py-2 text-indigo-700">
        Time Left: <span className="text-2xl font-semibold">{timeLeft}</span>s
      </div>

      <button
        type="button"
        onClick={handleStart}
        disabled={isRunning}
        className="rounded-full bg-indigo-600 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        {buttonLabel}
      </button>

      <p
        className={`max-w-lg text-sm ${permissionState === 'denied' ? 'text-red-600' : 'text-gray-600'}`}
      >
        {statusMessage}
      </p>

      {permissionState === 'denied' && (
        <p className="max-w-lg text-xs text-red-500">
          Motion-sensor access was denied. Adjust your browser settings to grant motion permissions and try again.
        </p>
      )}
    </div>
  );
};

export default ShakeOffGame;
