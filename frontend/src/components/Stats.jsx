import { useState, useEffect } from 'react';
import { articleService } from '../services/api';
import './Stats.css';

const Stats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState('');

  useEffect(() => {
    fetchStats();
  }, [category]);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = category ? { category } : {};
      const data = await articleService.getStats(params);
      setStats(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch statistics');
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading statistics...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (!stats) {
    return <div className="error">No statistics available</div>;
  }

  return (
    <div className="stats-container">
      <h2>Article Statistics</h2>

      <div className="stats-filters">
        <label htmlFor="category-filter">Filter by Category:</label>
        <input
          id="category-filter"
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Enter category..."
        />
        {category && (
          <button
            className="clear-filter"
            onClick={() => setCategory('')}
          >
            Clear
          </button>
        )}
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Articles</h3>
          <p className="stat-value">{stats.totalArticles || 0}</p>
        </div>

        {stats.articlesBySentiment && stats.articlesBySentiment.length > 0 && (
          <div className="stat-card">
            <h3>Sentiment Distribution</h3>
            <div className="sentiment-stats">
              {stats.articlesBySentiment.map((item) => (
                <div key={item.sentiment} className="sentiment-item">
                  <span className="sentiment-label">{item.sentiment || 'Unknown'}:</span>
                  <span className="sentiment-count">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {stats.articlesByTag && stats.articlesByTag.length > 0 && (
          <div className="stat-card stat-card-wide">
            <h3>Top Tags</h3>
            <div className="tags-stats">
              {stats.articlesByTag.slice(0, 10).map((item) => (
                <div key={item.tag} className="tag-stat-item">
                  <span className="tag-name">{item.tag}</span>
                  <span className="tag-count">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {stats.articlesByDate && stats.articlesByDate.length > 0 && (
          <div className="stat-card stat-card-wide">
            <h3>Articles by Date (Last 30 Days)</h3>
            <div className="date-stats">
              {stats.articlesByDate.map((item) => (
                <div key={item.date} className="date-stat-item">
                  <span className="date-label">{item.date}</span>
                  <span className="date-count">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Stats;

