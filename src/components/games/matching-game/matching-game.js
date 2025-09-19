import React, { useEffect, useRef, useState } from 'react';
import Card from './match-card';
import uniqueCardsArray from './unique-cards';
import ResultsScreen from './results-screen';

const GameStatusModal = ({ status, movesLeft, timeElapsed, onSubmit, isSubmitting }) => {
  const isWin = status === 'won';
  const title = isWin ? 'Great job!' : 'Game over';
  const description = isWin
    ? 'You matched all of the cards before running out of moves.'
    : 'You ran out of moves before matching all of the cards.';

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full text-center space-y-4">
        <div>
          <h3 className="text-2xl font-semibold mb-1">{title}</h3>
          <p className="text-gray-600">{description}</p>
        </div>
        <div className="space-y-1 text-sm text-gray-700">
          <p><span className="font-medium">Outcome:</span> {isWin ? 'Won' : 'Lost'}</p>
          <p><span className="font-medium">Moves left:</span> {movesLeft}</p>
          <p><span className="font-medium">Time elapsed:</span> {timeElapsed}s</p>
        </div>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="w-full py-2 px-4 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Results'}
        </button>
      </div>
    </div>
  );
};

const MatchingGame = ({ config }) => {
  const cardsFromConfig = config?.cards || uniqueCardsArray;
  const [cards] = useState(() => shuffleCards(cardsFromConfig.concat(cardsFromConfig)));
  const totalPairs = cards.length / 2;
  const moveLimit = config?.moveLimit || 5;
  const initialRevealDuration = config?.initialRevealSeconds ?? 0;
  const mismatchRevealSeconds = config?.cardUpflipSeconds ?? 0.5;
  const mismatchRevealDurationMs = Math.max(0, mismatchRevealSeconds * 1000);

  const [openCards, setOpenCards] = useState([]);
  const [clearedCards, setClearedCards] = useState({});
  const [moves, setMoves] = useState(0);
  const [result, setResult] = useState(null);
  const [gameStatus, setGameStatus] = useState('playing');
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialRevealActive, setIsInitialRevealActive] = useState(initialRevealDuration > 0);
  const [shouldDisableAllCards, setShouldDisableAllCards] = useState(initialRevealDuration > 0);
  const [elapsedTime, setElapsedTime] = useState(0);

  const gameStartTimeRef = useRef(Date.now());
  const gameStatusRef = useRef('playing');
  const evaluationTimeoutRef = useRef(null);
  const initialRevealTimeoutRef = useRef(null);

  const movesLeft = Math.max(moveLimit - moves, 0);

  const stopAllTimeouts = () => {
    if (initialRevealTimeoutRef.current) {
      clearTimeout(initialRevealTimeoutRef.current);
      initialRevealTimeoutRef.current = null;
    }
    if (evaluationTimeoutRef.current) {
      clearTimeout(evaluationTimeoutRef.current);
      evaluationTimeoutRef.current = null;
    }
  };

  useEffect(() => () => stopAllTimeouts(), []);

  useEffect(() => {
    gameStatusRef.current = gameStatus;
  }, [gameStatus]);

  useEffect(() => {
    if (initialRevealTimeoutRef.current) {
      clearTimeout(initialRevealTimeoutRef.current);
      initialRevealTimeoutRef.current = null;
    }

    if (initialRevealDuration > 0) {
      setIsInitialRevealActive(true);
      setShouldDisableAllCards(true);
      initialRevealTimeoutRef.current = setTimeout(() => {
        setIsInitialRevealActive(false);
        gameStartTimeRef.current = Date.now();
        if (gameStatusRef.current === 'playing') {
          setShouldDisableAllCards(false);
        }
        initialRevealTimeoutRef.current = null;
      }, initialRevealDuration * 1000);
    } else {
      setIsInitialRevealActive(false);
      gameStartTimeRef.current = Date.now();
      if (gameStatusRef.current === 'playing') {
        setShouldDisableAllCards(false);
      }
    }

    return () => {
      if (initialRevealTimeoutRef.current) {
        clearTimeout(initialRevealTimeoutRef.current);
        initialRevealTimeoutRef.current = null;
      }
    };
  }, [initialRevealDuration]);

  const finalizeGame = (status) => {
    if (gameStatusRef.current !== 'playing') {
      return;
    }
    stopAllTimeouts();
    setOpenCards([]);
    setElapsedTime(Math.floor((Date.now() - gameStartTimeRef.current) / 1000));
    setShowModal(true);
    setShouldDisableAllCards(true);
    setGameStatus(status);
  };

  useEffect(() => {
    if (moves >= moveLimit && gameStatusRef.current === 'playing') {
      finalizeGame('lost');
    }
  }, [moves, moveLimit]);

  const evaluate = () => {
    const [first, second] = openCards;
    if (first === undefined || second === undefined) {
      return;
    }

    if (cards[first].type === cards[second].type) {
      setClearedCards((prev) => {
        const updated = { ...prev, [cards[first].type]: true };
        if (Object.keys(updated).length === totalPairs) {
          finalizeGame('won');
        } else if (gameStatusRef.current === 'playing') {
          setShouldDisableAllCards(false);
        }
        return updated;
      });
    } else {
      if (gameStatusRef.current === 'playing') {
        setShouldDisableAllCards(false);
      }
    }
    setOpenCards([]);
  };

  useEffect(() => {
    if (openCards.length === 2) {
      evaluationTimeoutRef.current = setTimeout(() => {
        evaluate();
        evaluationTimeoutRef.current = null;
      }, mismatchRevealDurationMs);
    }

    return () => {
      if (evaluationTimeoutRef.current) {
        clearTimeout(evaluationTimeoutRef.current);
        evaluationTimeoutRef.current = null;
      }
    };
  }, [openCards, mismatchRevealDurationMs]);

  const handleCardClick = (index) => {
    if (shouldDisableAllCards || gameStatusRef.current !== 'playing' || isInitialRevealActive) {
      return;
    }

    if (openCards.includes(index)) {
      return;
    }

    if (openCards.length === 1) {
      setOpenCards((prev) => [...prev, index]);
      setMoves((prevMoves) => prevMoves + 1);
      setShouldDisableAllCards(true);
    } else {
      setOpenCards([index]);
    }
  };

  const checkIsFlipped = (index) => {
    return isInitialRevealActive || openCards.includes(index);
  };

  const checkIsInactive = (card) => {
    return Boolean(clearedCards[card.type]);
  };

  const handleSubmitResults = () => {
    if (isSubmitting || gameStatusRef.current === 'playing') {
      return;
    }

    setIsSubmitting(true);
    const finalElapsedTime = elapsedTime || Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
    const payload = {
      gameId: config?.gameId,
      gameType: config?.gameType,
      outcome: gameStatus === 'won' ? 'Won' : 'Lost',
      movesLeft,
      timeElapsed: finalElapsedTime,
    };
    const url = `/api/${config?.gameType}/${config?.gameId}`;

    mockSubmitResults(url, payload)
      .then((response) => {
        setResult(response);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  if (result) {
    return <ResultsScreen {...result} />;
  }

  return (
    <div className='flex flex-col items-center justify-center'>
      <header className='flex flex-col items-center justify-center'>
        <h2 className='text-3xl p-3'>Matching Game</h2>
        <p className='text-xl p-3'>Match the cards!</p>
        <p className='text-xl p-3'>You have {movesLeft} moves left!</p>
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
              cardBackImage={config?.cardBackImage}
            />
          );
        })}
      </div>
      {showModal && (
        <GameStatusModal
          status={gameStatus}
          movesLeft={movesLeft}
          timeElapsed={elapsedTime}
          onSubmit={handleSubmitResults}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
};

// Fisher Yates Shuffle
const swap = (array, i, j) => {
  const temp = array[i];
  array[i] = array[j];
  array[j] = temp;
};

const shuffleCards = (array) => {
  const length = array.length;
  for (let i = length; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * i);
    const currIndex = i - 1;
    swap(array, currIndex, randomIndex);
  }
  return array;
};

const mockSubmitResults = (url, payload) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(payload);
    }, 1000);
  });
};

export default MatchingGame;
