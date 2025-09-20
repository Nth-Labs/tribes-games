import React from 'react';
import { IoCheckmarkCircle } from 'react-icons/io5';

const FlipCard = ({
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

  const flipStyles = {
    transitionDuration: `${flipDurationMs}ms`
  };

  const outerStyle = {
    '--flip-accent': theme?.accentColor || '#60a5fa',
    borderColor: theme?.cardBorderColor || 'rgba(191, 219, 254, 0.9)',
    boxShadow: isInactive
      ? `0 22px 55px -30px ${theme?.cardMatchedGlowColor || 'rgba(96, 165, 250, 0.58)'}`
      : `0 26px 65px -38px ${theme?.cardShadowColor || 'rgba(148, 163, 184, 0.4)'}`,
    background: isInactive
      ? theme?.cardMatchedBackgroundColor || 'rgba(191, 227, 255, 0.65)'
      : theme?.cardBackBackgroundColor || 'rgba(226, 232, 240, 0.85)'
  };

  const faceSharedStyles = {
    background: theme?.cardFaceBackgroundColor || 'rgba(239, 246, 255, 0.92)'
  };

  const backFaceStyles = {
    background: theme?.cardBackBackgroundColor || 'rgba(226, 232, 240, 0.85)'
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled || isInactive}
      aria-label={buttonLabel}
      className="group relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-3xl border transition-transform duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-200 disabled:cursor-not-allowed"
      style={outerStyle}
    >
      <div
        className={`absolute inset-0 transition-transform [transform-style:preserve-3d] ${
          isCardFaceVisible ? '[transform:rotateY(180deg)]' : '[transform:rotateY(0deg)]'
        }`}
        style={flipStyles}
      >
        <div
          className="absolute inset-0 flex items-center justify-center backface-hidden"
          style={backFaceStyles}
        >
          {cardBackImage ? (
            <img
              src={cardBackImage}
              alt="Card back"
              className="max-h-[75%] max-w-[75%] object-contain drop-shadow-[0_16px_35px_rgba(148,163,184,0.35)]"
            />
          ) : (
            <span
              className="text-[0.65rem] font-semibold uppercase tracking-[0.38em]"
              style={{ color: theme?.accentColor || '#60a5fa' }}
            >
              Flip
            </span>
          )}
        </div>
        <div
          className="absolute inset-0 flex items-center justify-center backface-hidden [transform:rotateY(180deg)]"
          style={faceSharedStyles}
        >
          <img
            src={card.image}
            alt={card.altText || card.type || 'Card front'}
            className="max-h-[78%] max-w-[78%] object-contain drop-shadow-[0_18px_45px_rgba(148,163,184,0.35)]"
          />
        </div>
      </div>
      {isInactive && (
        <div
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center rounded-3xl text-center backdrop-blur-sm"
          style={{
            background: theme?.cardMatchedBackgroundColor || 'rgba(191, 227, 255, 0.65)',
            color: theme?.titleColor || '#0f172a'
          }}
        >
          <IoCheckmarkCircle size={40} color={theme?.accentColor || '#60a5fa'} />
          <span
            className="mt-1 text-[0.6rem] font-semibold uppercase tracking-[0.32em]"
            style={{ color: theme?.subtleTextColor || 'rgba(71, 85, 105, 0.75)' }}
          >
            Matched
          </span>
        </div>
      )}
    </button>
  );
};

export default FlipCard;
