import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Browse from './components/Browse';
import ArticleDetail from './components/ArticleDetail';
import Signup from './components/Signup';
import './App.css';

const App = () => {
  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="nav-container">
            <Link to="/" className="nav-logo">
              <h1>CyberPulse</h1>
            </Link>
            <div className="nav-links">
              <Link to="/" className="nav-link">Browse</Link>
              <Link to="/signup" className="nav-link">Sign Up</Link>
            </div>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Browse />} />
            <Route path="/article/:id" element={<ArticleDetail />} />
            <Route path="/signup" element={<Signup />} />
          </Routes>
        </main>

        <footer className="footer">
          <p>&copy; 2025 CyberPulse</p>
        </footer>
      </div>
    </Router>
  );
};

export default App;

