import React, { useEffect, useState } from 'react';
import MatchingGame from './matching-game';
import flipCardConfig from '../../../config/flip-card-config';

const MatchingGameInit = () => {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    // Simulate fetching configuration from API
    const timeout = setTimeout(() => {
      setConfig(flipCardConfig);
    }, 500);
    return () => clearTimeout(timeout);
  }, []);

  if (!config) {
    return <div className="flex items-center justify-center p-10">Loading...</div>;
  }

  return <MatchingGame config={config} />;
};

export default MatchingGameInit;
