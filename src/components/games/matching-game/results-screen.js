import React from 'react';
import { Link } from 'react-router-dom';

const ResultsScreen = ({ outcome, movesLeft, timeElapsed, gameId, gameType }) => {
  return (
    <div className="flex flex-col items-center justify-center">
      <h2 className="text-3xl p-3">Results</h2>
      {gameType && <p className="text-lg text-gray-600">Game Type: {gameType}</p>}
      <p className="text-xl p-3">Game ID: {gameId}</p>
      <p className="text-xl p-3">Outcome: {outcome}</p>
      <p className="text-xl p-3">Moves Left: {movesLeft}</p>
      <p className="text-xl p-3">Time Elapsed: {timeElapsed}s</p>
      <Link to="/" className="p-3 text-blue-500">Back to Home</Link>
    </div>
  );
};

export default ResultsScreen;
