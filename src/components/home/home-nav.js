import React from 'react';
import { Link } from 'react-router-dom';

const HomeNav = () => {
  return (
    <div className="flex flex-col items-center justify-center">
      <h2 className="p-10 text-3xl">NthLabs' Game Library</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        <Link to="/game1">
          <div className="flex flex-col items-center justify-center">
            <img
              src="/images/matching-game-assets/matching-game-thumb.png"
              alt="Matching Game Thumbnail"
              className="h-48 w-48 rounded-md object-contain"
            />
            <p>Matching Game</p>
          </div>
        </Link>
        <Link to="/game2">
          <div className="flex flex-col items-center justify-center">
            <img
              src="/images/stw-game-thumb.png"
              alt="STW Game Thumbnail"
              className="h-48 w-48 rounded-md object-cover"
            />
            <p>Spin The Wheel</p>
          </div>
        </Link>
        <Link to="/game3">
          <div className="flex flex-col items-center justify-center">
            <img
              src="/images/mystery-manor-game-thumb.png"
              alt="Mystery Manor Game Thumbnail"
              className="h-48 w-48 rounded-md object-cover"
            />
            <p>Mystery Manor</p>
          </div>
        </Link>
        <Link to="/game4">
          <div className="flex flex-col items-center justify-center">
            <img
              src="/images/precision-timer-game-thumb.svg"
              alt="Precision Timer Game Thumbnail"
              className="h-48 w-48 rounded-md object-contain"
            />
            <p>Precision Timer</p>
          </div>
        </Link>
        <Link to="/game5">
          <div className="flex flex-col items-center justify-center">
            <img
              src="/images/shake-off-game-thumb.svg"
              alt="Shake Off Game Thumbnail"
              className="h-48 w-48 rounded-md object-contain"
            />
            <p>Shake Off Challenge</p>
          </div>
        </Link>
        <Link to="/game6">
          <div className="flex flex-col items-center justify-center">
            <img
              src="/images/gachapon-game-thumb.svg"
              alt="Gachapon Game Thumbnail"
              className="h-48 w-48 rounded-md object-contain"
            />
            <p>Celestial Capsule Gachapon</p>
          </div>
        </Link>
        <Link to="/game7">
          <div className="flex flex-col items-center justify-center">
            <img
              src="/images/scratch-card-game-thumb.svg"
              alt="Scratch Card Game Thumbnail"
              className="h-48 w-48 rounded-md object-contain"
            />
            <p>Radiant Scratch Card</p>
          </div>
        </Link>
        <Link to="/game8">
          <div className="flex flex-col items-center justify-center">
            <img
              src="/images/vocal-lift-game-thumb.svg"
              alt="Vocal Lift Game Thumbnail"
              className="h-48 w-48 rounded-md object-contain"
            />
            <p>Vocal Lift Challenge</p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default HomeNav;
