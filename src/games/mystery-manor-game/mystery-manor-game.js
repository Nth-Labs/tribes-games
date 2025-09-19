import React from 'react';
import mysteryManorConfig from './config';

const MysteryManorGame = ({ config = mysteryManorConfig }) => {
  const { title, subtitle, description, items, timerSeconds } = config;

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-10 text-center">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <p className="text-lg text-gray-600">{subtitle}</p>
      <p className="max-w-2xl text-gray-500">{description}</p>
      <div className="max-w-xl text-sm text-gray-500">
        <p>
          This placeholder surface confirms the Mystery Manor configuration contract.
          The production build should render the interactive hidden-object scene.
        </p>
        <p className="mt-2">
          Players will have <strong>{timerSeconds}</strong> seconds to find
          <strong> {items.length}</strong> hidden artefacts defined in the config.
        </p>
      </div>
    </div>
  );
};

export default MysteryManorGame;
