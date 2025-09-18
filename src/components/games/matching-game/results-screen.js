import React from 'react';
import { Link } from 'react-router-dom';

const ResultsScreen = ({ score, voucher }) => {
  return (
    <div className="flex flex-col items-center justify-center">
      <h2 className="text-3xl p-3">Results</h2>
      <p className="text-xl p-3">Score: {score}</p>
      <p className="text-xl p-3">Voucher Won: {voucher}</p>
      <Link to="/" className="p-3 text-blue-500">Back to Home</Link>
    </div>
  );
};

export default ResultsScreen;
