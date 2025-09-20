import React, { useEffect, useState } from 'react';
import FlipCardNewGame from './flip-card-new';
import flipCardNewConfig from './config';

const FlipCardNewGameInit = () => {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setConfig(flipCardNewConfig);
    }, 400);

    return () => clearTimeout(timeout);
  }, []);

  if (!config) {
    return <div className="flex items-center justify-center p-10 text-slate-600">Loading…</div>;
  }

  return <FlipCardNewGame config={config} />;
};

export default FlipCardNewGameInit;
