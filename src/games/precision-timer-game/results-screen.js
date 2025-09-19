import React from 'react';
import { Link } from 'react-router-dom';

const formatSeconds = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—';
  }
  return Number(value).toFixed(3);
};

const ResultsScreen = ({
  gameId,
  gameType,
  gameTitle,
  outcome,
  countdownSeconds,
  pressedAtSeconds,
  timeRemainingSeconds,
  score,
  submittedAt
}) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-10 text-center">
      <h2 className="text-3xl font-semibold">Countdown Results</h2>
      {gameTitle && <p className="text-lg text-gray-600">{gameTitle}</p>}
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 text-left shadow-sm">
        <dl className="space-y-2 text-sm text-gray-700">
          {gameType && (
            <div className="flex justify-between">
              <dt className="font-medium text-gray-500">Game Type</dt>
              <dd className="text-gray-800">{gameType}</dd>
            </div>
          )}
          {gameId && (
            <div className="flex justify-between">
              <dt className="font-medium text-gray-500">Game ID</dt>
              <dd className="text-gray-800">{gameId}</dd>
            </div>
          )}
          {typeof countdownSeconds !== 'undefined' && (
            <div className="flex justify-between">
              <dt className="font-medium text-gray-500">Countdown Duration</dt>
              <dd className="text-gray-800">{formatSeconds(countdownSeconds)}s</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="font-medium text-gray-500">Outcome</dt>
            <dd className="text-gray-800">{outcome || 'Completed'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-medium text-gray-500">Pressed At</dt>
            <dd className="text-gray-800">{formatSeconds(pressedAtSeconds)}s</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-medium text-gray-500">Time Remaining</dt>
            <dd className="text-gray-800">{formatSeconds(timeRemainingSeconds)}s</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-medium text-gray-500">Accuracy Score</dt>
            <dd className="text-gray-800">{formatSeconds(score)}s</dd>
          </div>
          {submittedAt && (
            <div className="flex justify-between">
              <dt className="font-medium text-gray-500">Submitted At</dt>
              <dd className="text-gray-800">{new Date(submittedAt).toLocaleString()}</dd>
            </div>
          )}
        </dl>
        <p className="mt-4 text-xs text-gray-500">
          A lower accuracy score means you stopped the timer closer to zero.
        </p>
      </div>
      <Link to="/" className="text-blue-600 hover:underline">
        Back to Home
      </Link>
    </div>
  );
};

export default ResultsScreen;
