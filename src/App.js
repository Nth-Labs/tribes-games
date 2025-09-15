import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router, Route, Link, Routes } from 'react-router-dom';
import MatchingGameInit from './components/games/matching-game/matching-game-init';
import HomeNav from './components/home/home-nav';
import StwGame from './components/games/stw-game/stw-game';
import MysteryManorGame from './components/games/mystery-manor-game/mystery-manor-game';

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
            </Routes>
          </div>
        </Router>
      </header>
    </div>
  );
}

export default App;
