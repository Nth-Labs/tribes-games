import React, { useEffect, useState } from 'react';
import VocalLiftGame from './vocal-lift-game';
import vocalLiftConfig from './config';

const VocalLiftGameInit = () => {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setConfig(vocalLiftConfig);
    }, 400);

    return () => clearTimeout(timeout);
  }, []);

  if (!config) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center" role="status" aria-live="polite">
        <span className="text-lg font-medium text-gray-700">Loading vocal lift challenge...</span>
      </div>
    );
  }

  return <VocalLiftGame config={config} />;
};

export default VocalLiftGameInit;
