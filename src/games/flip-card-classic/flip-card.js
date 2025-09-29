import React from 'react';
import { IoCheckmarkCircle } from 'react-icons/io5';
import './flip-card-classic.css';

const FlipCardClassic = ({
  onClick,
  card,
  index,
  isInactive,
  isFlipped,
  isDisabled,
  cardBackImage,
  theme,
  flipDurationMs
}) => {
  const isCardFaceVisible = isFlipped || isInactive;

  const handleClick = () => {
    if (!isCardFaceVisible && !isDisabled && !isInactive) {
      onClick(index);
    }
  };

  const buttonLabel = isInactive
    ? `${card?.type || 'Card'} already matched`
    : isCardFaceVisible
      ? `Card showing ${card?.type || 'card'}`
      : `Flip card ${index + 1}`;

  const buttonStyle = {
    '--flip-accent': theme?.accentColor || '#60a5fa',
    '--flip-card-border': theme?.cardBorderColor || 'rgba(191, 219, 254, 0.9)',
    '--flip-card-back-bg': theme?.cardBackBackgroundColor || 'rgba(226, 232, 240, 0.85)',
    '--flip-card-face-bg': theme?.cardFaceBackgroundColor || 'rgba(239, 246, 255, 0.92)',
    '--flip-card-match-bg': theme?.cardMatchedBackgroundColor || 'rgba(191, 227, 255, 0.65)',
    '--flip-duration': `${flipDurationMs}ms`
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled || isInactive}
      aria-label={buttonLabel}
      className="flip-classic-card-button"
      style={buttonStyle}
      data-face-visible={isCardFaceVisible}
    >
      <div className="flip-classic-card-inner">
        <div className="flip-classic-card-face flip-classic-card-back">
          {cardBackImage ? (
            <img src={cardBackImage} alt="Card back" />
          ) : (
            <span className="flip-classic-card-label">Flip</span>
          )}
        </div>
        <div className="flip-classic-card-face flip-classic-card-front">
          <img
            src={card.image}
            alt={card.altText || card.type || 'Card front'}
          />
        </div>
      </div>
      {isInactive && (
        <div className="flip-classic-card-matched">
          <IoCheckmarkCircle size={40} color={theme?.accentColor || '#60a5fa'} />
          <span>Matched</span>
        </div>
      )}
    </button>
  );
};

export default FlipCardClassic;
