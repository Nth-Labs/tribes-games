import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomeNav from './components/home/home-nav';
import GameLauncher from './components/game-launcher';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeNav />} />
        <Route path="/games/:gameKey" element={<GameLauncher />} />
      </Routes>
    </Router>
  );
}

export default App;
