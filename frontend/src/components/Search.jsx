import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { articleService } from '../services/api';
import './Search.css';

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setPage(1);

    try {
      const params = {
        page: 1,
        limit: 10,
        ...(category && { category }),
      };

      const data = await articleService.searchArticles(query, params);
      setResults(data.articles || []);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to search articles');
      console.error('Error searching articles:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!query.trim() || loading) return;

    setLoading(true);
    try {
      const params = {
        page: page + 1,
        limit: 10,
        ...(category && { category }),
      };

      const data = await articleService.searchArticles(query, params);
      setResults((prev) => [...prev, ...(data.articles || [])]);
      setPagination(data.pagination);
      setPage((p) => p + 1);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load more results');
      console.error('Error loading more results:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="search-container">
      <h2>Search Articles</h2>

      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-group">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles by title, content, or summary..."
            className="search-input"
          />
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Filter by category (optional)"
            className="category-input"
          />
          <button type="submit" className="search-button" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {error && <div className="error-message">Error: {error}</div>}

      {results.length > 0 && (
        <div className="search-results">
          <div className="results-header">
            <p>
              Found {pagination?.total || results.length} result
              {pagination?.total !== 1 ? 's' : ''} for "{query}"
            </p>
          </div>

          <div className="articles-grid">
            {results.map((article) => (
              <Link
                key={article._id}
                to={`/article/${article._id}`}
                className="article-card"
              >
                <h3 className="article-title">{article.title || 'Untitled'}</h3>
                {article.summary && (
                  <p className="article-summary">{article.summary}</p>
                )}
                <div className="article-meta">
                  <span className="article-date">
                    {formatDate(article.publishedDate)}
                  </span>
                  {article.category && (
                    <span className="article-category">{article.category}</span>
                  )}
                  {article.sentiment && (
                    <span className={`sentiment sentiment-${article.sentiment}`}>
                      {article.sentiment}
                    </span>
                  )}
                </div>
                {article.tags && article.tags.length > 0 && (
                  <div className="article-tags">
                    {article.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>

          {pagination && page < pagination.pages && (
            <div className="load-more-container">
              <button onClick={loadMore} className="load-more-button" disabled={loading}>
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      )}

      {results.length === 0 && !loading && query && (
        <div className="no-results">No results found for "{query}"</div>
      )}
    </div>
  );
};

export default Search;

