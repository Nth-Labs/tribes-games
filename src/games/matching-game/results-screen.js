import React from 'react';
import { Link } from 'react-router-dom';

const ResultsScreen = ({ outcome, movesLeft, timeElapsed, gameId, gameTemplateId, distribution }) => {
  return (
    <div className="flex flex-col items-center justify-center">
      <h2 className="text-3xl p-3">Results</h2>
      {gameTemplateId && (
        <p className="text-lg text-gray-600">Template: {gameTemplateId}</p>
      )}
      <p className="text-xl p-3">Game ID: {gameId || 'N/A'}</p>
      <p className="text-xl p-3">Outcome: {outcome}</p>
      <p className="text-xl p-3">Moves Left: {movesLeft}</p>
      <p className="text-xl p-3">Time Elapsed: {timeElapsed}s</p>
      {distribution?.type && (
        <p className="text-sm text-gray-500">Distribution type: {distribution.type}</p>
      )}
      {distribution?.endpoint && (
        <p className="text-sm text-gray-500">Claim endpoint: {distribution.endpoint}</p>
      )}
      <Link to="/" className="p-3 text-blue-500">Back to Home</Link>
    </div>
  );
};

export default ResultsScreen;
