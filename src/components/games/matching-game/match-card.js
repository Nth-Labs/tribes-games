import React from 'react';
import { IoCheckmarkCircle } from "react-icons/io5";


const Card = ({
    onClick,
    card,
    index,
    isInactive,
    isFlipped,
    isDisabled,
    cardBackImage
}) => {
    const handleClick = () => {
        !isFlipped && !isDisabled && onClick(index);
    };

    if (isInactive) {
        return (
            <div className='relative w-20 h-20 rounded-lg shadow-md bg-green-100'>
                <div className='absolute inset-0 flex items-center justify-center'>
                    <IoCheckmarkCircle size={30} color='green' />
                </div>
            </div>
        );
    } else {
        return (
            <div onClick={handleClick} className={`relative w-20 h-20 rounded-lg shadow-md 
            bg-white transform transition-transform duration-100`}
            >
                {!isFlipped ? (
                    <div className='absolute inset-0 flex items-center justify-center'>
                        <img
                            src={cardBackImage}
                            alt="cardBack"
                            className='w-15 h-15'
                        />
                    </div>
                ) : (
                    <div className='absolute inset-0 flex items-center justify-center'>
                        <img
                            src={card.image}
                            alt="pokemon"
                            className='w-18 h-18'
                        />
                    </div>
                )}
            </div>
        );
    }
}

export default Card