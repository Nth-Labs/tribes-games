import React, { useMemo } from 'react';
import DinoRunGame from './dino-run-game';
import sampleDinoRunGameDocument from './sample-game-document';

const ErrorState = ({ onBack }) => (
  <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
    <div>
      <h3 className="text-lg font-semibold text-slate-900">Unable to load Blocky Runner</h3>
      <p className="mt-1 max-w-md text-sm text-slate-500">
        The configuration for this minigame is missing a template identifier. Please update the payload and try again.
      </p>
    </div>
    {onBack && (
      <button
        type="button"
        onClick={onBack}
        className="rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white shadow hover:bg-slate-800"
      >
        Back to games
      </button>
    )}
  </div>
);

const DinoRunGameInit = ({ config, onBack }) => {
  const activeConfig = useMemo(
    () => config || sampleDinoRunGameDocument,
    [config],
  );

  if (!activeConfig?.game_template_id) {
    return <ErrorState onBack={onBack} />;
  }

  return <DinoRunGame config={activeConfig} onBack={onBack} />;
};

export default DinoRunGameInit;
export { default as sampleDinoRunGameDocument } from './sample-game-document';
