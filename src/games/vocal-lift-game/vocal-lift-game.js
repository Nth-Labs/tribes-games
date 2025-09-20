import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import vocalLiftConfig from './config';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const sanitizeTargetSeconds = (rawTarget) => {
  const parsed = Number(rawTarget);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 30;
  }

  return clamp(parsed, 5, 600);
};

const sanitizeThreshold = (rawThreshold) => {
  const parsed = Number(rawThreshold);
  if (!Number.isFinite(parsed)) {
    return 0.22;
  }

  return clamp(parsed, 0.05, 0.8);
};

const sanitizeTolerance = (rawTolerance) => {
  const parsed = Number(rawTolerance);
  if (!Number.isFinite(parsed) || parsed < 100) {
    return 400;
  }

  return clamp(parsed, 100, 2000);
};

const sanitizeBallAsset = (asset) => {
  if (asset && typeof asset === 'object') {
    const url = typeof asset.url === 'string' ? asset.url.trim() : '';
    if (url) {
      return {
        url,
        altText:
          typeof asset.altText === 'string' && asset.altText.trim()
            ? asset.altText
            : 'Floating orb hovering above the arena'
      };
    }
  }

  return {
    url: '/images/vocal-lift-game/levitating-orb.svg',
    altText: 'Floating orb hovering above the arena'
  };
};

const formatSeconds = (value) => {
  const safeValue = Number.isFinite(value) ? value : 0;
  const digits = safeValue >= 10 ? 1 : 2;
  return safeValue.toFixed(digits);
};

const VocalLiftGame = ({ config = vocalLiftConfig }) => {
  const ballAsset = useMemo(() => sanitizeBallAsset(config?.ballAsset), [config?.ballAsset]);
  const targetSeconds = useMemo(() => sanitizeTargetSeconds(config?.targetSeconds), [config?.targetSeconds]);
  const soundThreshold = useMemo(() => sanitizeThreshold(config?.soundThreshold), [config?.soundThreshold]);
  const silenceToleranceMs = useMemo(
    () => sanitizeTolerance(config?.silenceToleranceMs),
    [config?.silenceToleranceMs]
  );
  const defaultStatusMessage = useMemo(() => {
    if (typeof config?.instructions === 'string' && config.instructions.trim()) {
      return config.instructions.trim();
    }

    return `Press "Start Challenge" to begin. Keep the orb suspended for ${targetSeconds} seconds by sustaining your voice.`;
  }, [config?.instructions, targetSeconds]);

  const [isSupported, setIsSupported] = useState(true);
  const [permissionState, setPermissionState] = useState('idle');
  const [isRunning, setIsRunning] = useState(false);
  const [holdTime, setHoldTime] = useState(0);
  const [bestHoldTime, setBestHoldTime] = useState(0);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [statusMessage, setStatusMessage] = useState(defaultStatusMessage);
  const [targetReached, setTargetReached] = useState(false);
  const [isFloating, setIsFloating] = useState(false);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const sourceRef = useRef(null);
  const animationRef = useRef(null);
  const startTimestampRef = useRef(null);
  const lastVoiceTimestampRef = useRef(null);
  const lastHoldRef = useRef(0);
  const displayedHoldRef = useRef(0);
  const volumeRef = useRef(0);
  const isRunningRef = useRef(false);
  const targetReachedRef = useRef(false);
  const dropNotifiedRef = useRef(false);

  useEffect(() => {
    if (!isRunningRef.current && !targetReachedRef.current) {
      setStatusMessage(defaultStatusMessage);
    }
  }, [defaultStatusMessage]);

  const stopChallenge = useCallback(
    ({ resetHold = true } = {}) => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }

      isRunningRef.current = false;

      if (sourceRef.current) {
        try {
          sourceRef.current.disconnect();
        } catch (error) {
          // Ignore disconnect errors during teardown.
        }
        sourceRef.current = null;
      }

      analyserRef.current = null;

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }

      if (audioContextRef.current) {
        const context = audioContextRef.current;
        audioContextRef.current = null;

        try {
          if (context.state !== 'closed') {
            context.close();
          }
        } catch (error) {
          // Some browsers throw if the context is already closing; ignore.
        }
      }

      dataArrayRef.current = null;
      startTimestampRef.current = null;
      lastVoiceTimestampRef.current = null;
      lastHoldRef.current = 0;
      displayedHoldRef.current = 0;
      volumeRef.current = 0;
      dropNotifiedRef.current = false;

      setIsRunning(false);
      setVolumeLevel(0);

      if (resetHold) {
        targetReachedRef.current = false;
        setTargetReached(false);
        setHoldTime(0);
        setIsFloating(false);
      }
    },
    []
  );

  useEffect(() => {
    const audioContextClass =
      typeof window !== 'undefined' ? window.AudioContext || window.webkitAudioContext : null;
    const supported =
      typeof navigator !== 'undefined' &&
      !!navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function' &&
      !!audioContextClass;

    setIsSupported(supported);

    if (!supported) {
      setStatusMessage(
        'This experience requires microphone access and the Web Audio API, which are not available on this device.'
      );
    }

    return () => {
      stopChallenge();
    };
  }, [stopChallenge]);

  const startChallenge = useCallback(async () => {
    if (!isSupported || isRunningRef.current) {
      return;
    }

    stopChallenge();

    isRunningRef.current = true;
    setPermissionState('prompting');
    setStatusMessage('Requesting microphone access...');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContextClass = window.AudioContext || window.webkitAudioContext;

      if (!audioContextClass) {
        throw new Error('AudioContext is not supported in this browser');
      }

      const audioContext = new audioContextClass();
      audioContextRef.current = audioContext;
      mediaStreamRef.current = stream;

      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      source.connect(analyser);
      dataArrayRef.current = new Uint8Array(analyser.fftSize);

      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      targetReachedRef.current = false;
      dropNotifiedRef.current = false;
      setTargetReached(false);
      setIsRunning(true);
      setIsFloating(false);
      setHoldTime(0);
      setVolumeLevel(0);
      setPermissionState('granted');
      setStatusMessage('Hold a steady note to keep the relic airborne.');

      startTimestampRef.current = null;
      lastVoiceTimestampRef.current = null;
      lastHoldRef.current = 0;
      displayedHoldRef.current = 0;
      volumeRef.current = 0;

      const analyze = () => {
        if (!analyserRef.current || !isRunningRef.current) {
          return;
        }

        const dataArray = dataArrayRef.current;
        if (!dataArray) {
          return;
        }

        analyserRef.current.getByteTimeDomainData(dataArray);

        let sum = 0;
        for (let index = 0; index < dataArray.length; index += 1) {
          sum += Math.abs(dataArray[index] - 128);
        }

        const average = sum / dataArray.length;
        const normalizedVolume = clamp(average / 64, 0, 1);

        if (Math.abs(normalizedVolume - volumeRef.current) > 0.02) {
          volumeRef.current = normalizedVolume;
          setVolumeLevel(Number(normalizedVolume.toFixed(2)));
        }

        const now = performance.now();
        const loudEnough = normalizedVolume >= soundThreshold;

        if (loudEnough) {
          dropNotifiedRef.current = false;

          if (!startTimestampRef.current) {
            startTimestampRef.current = now;
          }

          lastVoiceTimestampRef.current = now;

          const holdSeconds = (now - startTimestampRef.current) / 1000;
          lastHoldRef.current = holdSeconds;

          const holdRounded = Number(holdSeconds.toFixed(2));

          if (!targetReachedRef.current) {
            if (holdRounded - displayedHoldRef.current >= 0.05) {
              displayedHoldRef.current = holdRounded;
              setHoldTime(holdRounded);
            }

            setIsFloating(true);

            if (holdSeconds >= targetSeconds) {
              targetReachedRef.current = true;
              const finalHold = Number(holdSeconds.toFixed(2));
              displayedHoldRef.current = finalHold;
              lastHoldRef.current = finalHold;

              setTargetReached(true);
              setHoldTime(finalHold);
              setBestHoldTime((previous) => Math.max(previous, finalHold));
              setStatusMessage(
                `Incredible lung power! You held the orb aloft for ${formatSeconds(finalHold)} seconds.`
              );
              stopChallenge({ resetHold: false });
              setIsFloating(true);
              return;
            }
          }
        } else if (startTimestampRef.current && lastVoiceTimestampRef.current) {
          const silentDuration = now - lastVoiceTimestampRef.current;

          if (silentDuration >= silenceToleranceMs) {
            const attemptDuration = lastHoldRef.current;

            if (!targetReachedRef.current && attemptDuration > 0) {
              const normalizedAttempt = Number(attemptDuration.toFixed(2));
              setBestHoldTime((previous) => Math.max(previous, normalizedAttempt));

              if (!dropNotifiedRef.current) {
                dropNotifiedRef.current = true;
                setStatusMessage('The orb slipped! Keep a strong, steady sound to lift it again.');
              }

              setHoldTime(0);
              setIsFloating(false);
            }

            startTimestampRef.current = null;
            lastVoiceTimestampRef.current = null;
            lastHoldRef.current = 0;
            displayedHoldRef.current = 0;
          }
        }

        if (isRunningRef.current) {
          animationRef.current = requestAnimationFrame(analyze);
        }
      };

      animationRef.current = requestAnimationFrame(analyze);
    } catch (error) {
      console.error('Microphone access error', error);
      setPermissionState('denied');
      setStatusMessage('We could not access your microphone. Enable microphone permissions and try again.');
      stopChallenge();
    }
  }, [isSupported, silenceToleranceMs, soundThreshold, stopChallenge, targetSeconds]);

  useEffect(() => {
    return () => {
      stopChallenge();
    };
  }, [stopChallenge]);

  const handlePrimaryAction = useCallback(() => {
    if (isRunningRef.current) {
      if (!targetReachedRef.current && holdTime > 0) {
        setBestHoldTime((previous) => Math.max(previous, holdTime));
      }

      stopChallenge();
      setStatusMessage(defaultStatusMessage);
      setPermissionState('idle');
      return;
    }

    startChallenge();
  }, [defaultStatusMessage, holdTime, startChallenge, stopChallenge]);

  const handleResetBest = useCallback(() => {
    setBestHoldTime(0);

    if (!isRunningRef.current && !targetReachedRef.current) {
      setHoldTime(0);
      setIsFloating(false);
      setStatusMessage(defaultStatusMessage);
    }
  }, [defaultStatusMessage]);

  if (!isSupported) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-10 text-center">
        <h2 className="text-3xl font-semibold">{config?.title || 'Vocal Lift Challenge'}</h2>
        {config?.description && <p className="max-w-xl text-gray-600">{config.description}</p>}
        <p className="max-w-xl rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">{statusMessage}</p>
      </div>
    );
  }

  const buttonLabel = (() => {
    if (isRunning) {
      return config?.stopButtonLabel || 'Stop & Reset';
    }

    if (targetReached) {
      return 'Play Again';
    }

    return config?.startButtonLabel || 'Start Challenge';
  })();

  const floatRatio = Math.min(holdTime / targetSeconds, 1);
  const ballBottomPercent = 12 + floatRatio * 68;
  const glowRadius = targetReached || isFloating ? '2.6rem' : '1.1rem';

  const progressPercent = Math.min((holdTime / targetSeconds) * 100, 100);

  return (
    <div className="flex flex-col items-center gap-6 p-6 text-center md:p-10">
      <h2 className="text-3xl font-semibold text-slate-900">{config?.title || 'Vocal Lift Challenge'}</h2>
      {config?.subtitle && <p className="text-lg text-slate-600">{config.subtitle}</p>}
      {config?.description && <p className="max-w-2xl text-slate-500">{config.description}</p>}

      <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="relative mx-auto h-72 w-full max-w-xl overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(129,140,248,0.35),transparent_65%)]" />
          <div className="pointer-events-none absolute inset-x-16 bottom-12 h-6 rounded-full bg-indigo-500/40 blur-2xl" />
          <img
            src={ballAsset.url}
            alt={ballAsset.altText}
            draggable="false"
            className="absolute left-1/2 w-36 max-w-[45%] -translate-x-1/2 select-none transition-[bottom,filter] duration-300 ease-out"
            style={{
              bottom: `${ballBottomPercent}%`,
              filter: `drop-shadow(0 0 ${glowRadius} rgba(99, 102, 241, 0.7))`
            }}
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-indigo-500/30 to-transparent" />
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500/60 via-indigo-400 to-indigo-500/60 blur-md" />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 text-left sm:grid-cols-3">
          <div className="rounded-xl bg-slate-100/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current Hold</p>
            <p className="text-3xl font-semibold text-slate-900">{formatSeconds(holdTime)}s</p>
          </div>
          <div className="rounded-xl bg-slate-100/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Longest Hold</p>
            <p className="text-3xl font-semibold text-slate-900">{formatSeconds(bestHoldTime)}s</p>
          </div>
          <div className="rounded-xl bg-slate-100/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Target</p>
            <p className="text-3xl font-semibold text-slate-900">{formatSeconds(targetSeconds)}s</p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full ${targetReached ? 'bg-emerald-400' : 'bg-indigo-400'}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {targetReached ? 'Goal reached!' : `${Math.round(progressPercent)}% complete`}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span>Live Mic Level</span>
            <span>
              {Math.round(volumeLevel * 100)}% • Threshold {Math.round(soundThreshold * 100)}%
            </span>
          </div>
          <div className="relative mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-indigo-500 transition-all duration-150"
              style={{ width: `${Math.min(volumeLevel * 100, 100)}%` }}
            />
            <div
              className="pointer-events-none absolute inset-y-0 w-[2px] bg-slate-500"
              style={{ left: `${Math.min(soundThreshold * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handlePrimaryAction}
            disabled={permissionState === 'prompting'}
            className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-400"
          >
            {permissionState === 'prompting' ? 'Preparing…' : buttonLabel}
          </button>
          <button
            type="button"
            onClick={handleResetBest}
            className="text-sm font-medium text-slate-500 underline decoration-dotted underline-offset-4 transition hover:text-indigo-600"
          >
            Reset longest hold
          </button>
        </div>

        <p
          className={`mt-4 text-sm ${permissionState === 'denied' ? 'text-red-600' : 'text-slate-600'}`}
          aria-live="polite"
        >
          {statusMessage}
        </p>
        {permissionState === 'denied' && (
          <p className="mt-1 text-xs text-red-500">
            Microphone access was blocked. Update your browser permissions and press “Start Challenge” again.
          </p>
        )}
      </div>
    </div>
  );
};

export default VocalLiftGame;
