import React from 'react';
import spinTheWheelConfig from './config';

const StwGame = ({ config = spinTheWheelConfig }) => {
  const { title, description, prizeSegments } = config;

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-10 text-center">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <p className="max-w-2xl text-gray-600">{description}</p>
      <div className="max-w-xl text-sm text-gray-500">
        <p>This placeholder confirms the configuration contract for the Spin The Wheel module.</p>
        <p className="mt-2">
          The wheel currently defines <strong>{prizeSegments.length}</strong> prize segments. Replace this
          placeholder with production gameplay once the API is connected.
        </p>
      </div>
    </div>
  );
};

export default StwGame;
