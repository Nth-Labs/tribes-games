import React from "react";
import { IoCheckmarkCircle } from "react-icons/io5";
import "./flip-card.css";

const FlipCard = ({
  onClick,
  card,
  index,
  isInactive,
  isFlipped,
  isDisabled,
  cardBackImage,
  theme,
  flipDurationMs,
}) => {
  const isCardFaceVisible = isFlipped || isInactive;

  const handleClick = () => {
    if (!isCardFaceVisible && !isDisabled && !isInactive) {
      onClick(index);
    }
  };

  const buttonLabel = isInactive
    ? `${card?.type || "Card"} already matched`
    : isCardFaceVisible
    ? `Card showing ${card?.type || "card"}`
    : `Flip card ${index + 1}`;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled || isInactive}
      aria-label={buttonLabel}
      className="flip-card"
      style={{
        "--flip-accent": theme?.accentColor || "#60a5fa",
        borderColor: theme?.cardBorderColor || "rgba(191, 219, 254, 0.9)",
        boxShadow: isInactive
          ? `0 22px 55px -30px ${
              theme?.cardMatchedGlowColor || "rgba(96, 165, 250, 0.58)"
            }`
          : `0 26px 65px -38px ${
              theme?.cardShadowColor || "rgba(148, 163, 184, 0.4)"
            }`,
        background: isInactive
          ? theme?.cardMatchedBackgroundColor ||
            "rgba(191, 227, 255, 0.65)"
          : theme?.cardBackBackgroundColor || "rgba(226, 232, 240, 0.85)",
      }}
    >
      <div
        className={`flip-inner ${isCardFaceVisible ? "flipped" : ""}`}
        style={{ transitionDuration: `${flipDurationMs}ms` }}
      >
        {/* Back */}
        <div className="flip-face flip-back">
          {cardBackImage ? (
            <img
              src={cardBackImage}
              alt="Card back"
              className="flip-back-img"
            />
          ) : (
            <span
              style={{
                color: theme?.accentColor || "#60a5fa",
                fontSize: "0.65rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.38em",
              }}
            >
              Flip
            </span>
          )}
        </div>

        {/* Front */}
        <div className="flip-face flip-front">
          <img
            src={card.image}
            alt={card.altText || card.type || "Card front"}
            className="flip-img"
          />
        </div>
      </div>

      {isInactive && (
        <div
          className="flip-overlay"
          style={{
            background:
              theme?.cardMatchedBackgroundColor ||
              "rgba(191, 227, 255, 0.65)",
            color: theme?.titleColor || "#0f172a",
          }}
        >
          <IoCheckmarkCircle
            size={40}
            color={theme?.accentColor || "#60a5fa"}
          />
          <span
            className="flip-overlay-text"
            style={{
              color:
                theme?.subtleTextColor || "rgba(71, 85, 105, 0.75)",
            }}
          >
            Matched
          </span>
        </div>
      )}
    </button>
  );
};

export default FlipCard;
