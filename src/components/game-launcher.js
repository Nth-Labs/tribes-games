import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GAME_LIBRARY, pickModuleFor } from '../game_modules/registry';

const NotFound = ({ onBack }) => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
    <div>
      <h2 className="text-2xl font-semibold text-slate-900">Game not found</h2>
      <p className="mt-2 max-w-md text-slate-600">
        We could not find a module registered for this identifier. Update the registry with the
        new template id and try again.
      </p>
    </div>
    <button
      type="button"
      onClick={onBack}
      className="rounded-full bg-slate-900 px-5 py-2 text-white shadow"
    >
      Back to games
    </button>
  </div>
);

const GameLauncher = () => {
  const { gameKey } = useParams();
  const navigate = useNavigate();

  const libraryEntry = useMemo(
    () => GAME_LIBRARY.find((entry) => entry.slug === gameKey),
    [gameKey],
  );

  const Module = useMemo(() => {
    if (!libraryEntry) {
      return null;
    }
    return pickModuleFor(libraryEntry.launchPayload);
  }, [libraryEntry]);

  if (!Module) {
    return <NotFound onBack={() => navigate('/')} />;
  }

  return (
    <Module
      config={libraryEntry.sampleConfig}
      onBack={() => navigate('/')}
    />
  );
};

export default GameLauncher;
