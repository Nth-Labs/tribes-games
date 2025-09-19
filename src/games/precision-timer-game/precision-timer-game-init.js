import React, { useEffect, useState } from 'react';
import PrecisionTimerGame from './precision-timer-game';
import precisionTimerConfig from './config';

const PrecisionTimerGameInit = () => {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setConfig(precisionTimerConfig);
    }, 400);

    return () => clearTimeout(timeout);
  }, []);

  if (!config) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center" role="status" aria-live="polite">
        <span className="text-lg font-medium text-gray-700">Loading countdown challenge...</span>
      </div>
    );
  }

  return <PrecisionTimerGame config={config} />;
};

export default PrecisionTimerGameInit;
