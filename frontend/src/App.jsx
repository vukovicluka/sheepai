import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ArticleList from './components/ArticleList';
import ArticleDetail from './components/ArticleDetail';
import Search from './components/Search';
import Stats from './components/Stats';
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
              <Link to="/" className="nav-link">Articles</Link>
              <Link to="/latest" className="nav-link">Latest</Link>
              <Link to="/search" className="nav-link">Search</Link>
              <Link to="/stats" className="nav-link">Stats</Link>
              <Link to="/signup" className="nav-link">Sign Up</Link>
            </div>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<ArticleList />} />
            <Route path="/latest" element={<ArticleList latest />} />
            <Route path="/article/:id" element={<ArticleDetail />} />
            <Route path="/search" element={<Search />} />
            <Route path="/stats" element={<Stats />} />
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

