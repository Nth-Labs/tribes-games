import React from 'react'
import { Link } from 'react-router-dom';

const HomeNav = () => {
    return (
        <div className='flex flex-col items-center justify-center'>
            <h2 className='p-10 text-3xl'>NthLabs' Game Library</h2>
            <div className='grid grid-cols-2 gap-4'>
                <Link to="/game1">
                    <div className='flex flex-col items-center justify-center'>
                        <img
                            src="/images/matching-game-assets/matching-game-thumb.png"
                            alt="Matching Game Thumbnail"
                            className="w-48 h-48 object-contain rounded-md"
                        />
                        <p>Matching Game</p>
                    </div>
                </Link>
                <Link to="/game2">
                    <div className='flex flex-col items-center justify-center'>
                        <img
                            src="/images/stw-game-thumb.png"
                            alt="STW Game Thumbnail"
                            className="w-48 h-48 object-cover rounded-md"
                        />
                        <p>Spin The Wheel</p>
                    </div>
                </Link>
                <Link to="/game3">
                    <div className='flex flex-col items-center justify-center'>
                        <img
                            src="/images/mystery-manor-game-thumb.png"
                            alt="Mystery Manor Game Thumbnail"
                            className="w-48 h-48 object-cover rounded-md"
                        />
                        <p>Mystery Manor</p>
                    </div>
                </Link>
            </div>
        </div>
    )
}

export default HomeNav