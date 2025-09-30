import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MatchingGameInit from './games/matching-game/matching-game-init';
import FlipCardNewGameInit from './games/flip-card-new';
import HomeNav from './components/home/home-nav';
import StwGame from './games/stw-game/stw-game';
import MysteryManorGame from './games/mystery-manor-game/mystery-manor-game';
import PrecisionTimerGameInit from './games/precision-timer-game/precision-timer-game-init';
import ShakeOffGame from './games/shake-off-game/shake-off-game';
import GachaponGame from './games/gachapon-game/gachapon-game';
import ScratchCardGame from './games/scratch-card-game/scratch-card-game';
import ScratchCardClassicGameInit from './games/scratch-card-classic';
import GachaponClassicGameInit from './games/gachapon-classic';
import VocalLiftGameInit from './games/vocal-lift-game/vocal-lift-game-init';

function App() {
  return (
    <div>
      <header>
        <Router>
          <div>
            <Routes>
              <Route path="/" element={<HomeNav />} />
              <Route path="/game1" element={<MatchingGameInit />} />
              <Route path="/game8" element={<FlipCardNewGameInit />} />
              <Route path="/game2" element={<StwGame />} />
              <Route path="/game3" element={<MysteryManorGame />} />
              <Route path="/game4" element={<PrecisionTimerGameInit />} />
              <Route path="/game5" element={<ShakeOffGame />} />
              <Route path="/game6" element={<GachaponGame />} />
              <Route path="/game7" element={<ScratchCardGame />} />
              <Route path="/game8" element={<VocalLiftGameInit />} />
              <Route path="/scratch-classic" element={<ScratchCardClassicGameInit />} />
              <Route path="/gachapon-classic" element={<GachaponClassicGameInit />} />
            </Routes>
          </div>
        </Router>
      </header>
    </div>
  );
}

export default App;
