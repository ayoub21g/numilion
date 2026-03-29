import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Game from './pages/Game';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Navbar from './components/Navbar';
import DynamicBackground from './components/DynamicBackground';

function App() {
  return (
    <Router>
      <DynamicBackground />
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/game/:id" element={<Game />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
