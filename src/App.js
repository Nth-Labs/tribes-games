import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MatchingGameInit from './games/matching-game/matching-game-init';
import HomeNav from './components/home/home-nav';
import StwGame from './games/stw-game/stw-game';
import MysteryManorGame from './games/mystery-manor-game/mystery-manor-game';
import PrecisionTimerGameInit from './games/precision-timer-game/precision-timer-game-init';
import ShakeOffGame from './games/shake-off-game/shake-off-game';
import GachaponGame from './games/gachapon-game/gachapon-game';
import ScratchCardGame from './games/scratch-card-game/scratch-card-game';

function App() {
  return (
    <div>
      <header>
        <Router>
          <div>
            <Routes>
              <Route path="/" element={<HomeNav />} />
              <Route path="/game1" element={<MatchingGameInit />} />
              <Route path="/game2" element={<StwGame />} />
              <Route path="/game3" element={<MysteryManorGame />} />
              <Route path="/game4" element={<PrecisionTimerGameInit />} />
              <Route path="/game5" element={<ShakeOffGame />} />
              <Route path="/game6" element={<GachaponGame />} />
              <Route path="/game7" element={<ScratchCardGame />} />
            </Routes>
          </div>
        </Router>
      </header>
    </div>
  );
}

export default App;
