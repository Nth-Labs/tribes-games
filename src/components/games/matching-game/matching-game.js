import React, { useEffect, useRef, useState } from 'react'
import Card from './match-card';
import uniqueCardsArray from './unique-cards';

const MatchingGame = () => {
  const [cards, setCards] = useState(
    () => shuffleCards(uniqueCardsArray.concat(uniqueCardsArray))
  );
  const [openCards, setOpenCards] = useState([]);
  const [clearedCards, setClearedCards] = useState({});
  const [moves, setMoves] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [shouldDisableAllCards, setShouldDisableAllCards] = useState(false);
  const timeout = useRef(null);

  // Check if both the cards have same type. If they do, mark them inactive
  const evaluate = () => {
    const [first, second] = openCards;
    if (cards[first].type === cards[second].type) {
      setClearedCards((prev) => ({ ...prev, [cards[first].type]: true }));
      setOpenCards([]);
      return;
    }
    // Flip cards after a 500ms duration
    timeout.current = setTimeout(() => {
      setOpenCards([]);
    }, 500);
  };

  const handleCardClick = (index) => {
    // Have a maximum of 2 items in array at once.
    if (openCards.length === 1) {
      setOpenCards((prev) => [...prev, index]);
      // increase the moves once we opened a pair
      setMoves((moves) => moves + 1);
    } else {
      // If two cards are already open, we cancel timeout set for flipping cards back
      clearTimeout(timeout.current);
      setOpenCards([index]);
    }
  };

  useEffect(() => {
    if (openCards.length === 2) {
      setTimeout(evaluate, 500);
    }
  }, [openCards]);

  const checkIsFlipped = (index) => {
    return openCards.includes(index);
  };

  const checkIsInactive = (card) => {
    return Boolean(clearedCards[card.type]);
  };

  return (
    <div className='flex flex-col items-center justify-center'>
      <header className='flex flex-col items-center justify-center'>
        <h2 className='text-3xl p-3'>Matching Game</h2>
        <p className='text-xl p-3'>Match the cards!</p>
        <p className='text-xl p-3'>You have {5 - moves} moves left!</p>
        {moves === 5 && (
          <p className='text-xl p-3'>
            Game Over! You scored {Object.keys(clearedCards).length} points!
          </p>
        )}
      </header>
      <div className="grid grid-cols-3 gap-4">
        {cards.map((card, index) => {
          return (
            <Card
              key={index}
              card={card}
              index={index}
              isDisabled={shouldDisableAllCards}
              isInactive={checkIsInactive(card)}
              isFlipped={checkIsFlipped(index)}
              onClick={handleCardClick}
            />
          );
        })}
      </div>
    </div>
  );
}

// Fisher Yates Shuffle
const swap = (array, i, j) => {
  const temp = array[i];
  array[i] = array[j];
  array[j] = temp;
}

const shuffleCards = (array) => {
  const length = array.length;
  for (let i = length; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * i);
    const currIndex = i - 1;
    swap(array, currIndex, randomIndex)
  }
  return array;
}

export default MatchingGame