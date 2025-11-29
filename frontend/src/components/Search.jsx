import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { articleService } from '../services/api';
import { calculateRelevanceScore, getRelevanceColor, calculateAverageRelevance } from '../utils/relevance';
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

  // Calculate relevance scores based on search query or category
  const resultsWithRelevance = useMemo(() => {
    if (results.length === 0) return [];

    const relevanceCategory = category || query;
    if (!relevanceCategory || relevanceCategory.trim() === '') {
      return results.map(article => ({ ...article, relevanceScore: null }));
    }

    const articlesWithScores = results.map(article => ({
      ...article,
      relevanceScore: calculateRelevanceScore(article, relevanceCategory),
    }));

    // Sort by relevance (highest first)
    return articlesWithScores.sort((a, b) => {
      return (b.relevanceScore || 0) - (a.relevanceScore || 0);
    });
  }, [results, category, query]);

  // Calculate average relevance
  const avgRelevance = useMemo(() => {
    const relevanceCategory = category || query;
    return calculateAverageRelevance(results, relevanceCategory);
  }, [results, category, query]);

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
            {(category || query) && avgRelevance !== null && (
              <div className="avg-relevance-badge" style={{ '--relevance-color': getRelevanceColor(avgRelevance) }}>
                Avg Relevance: {avgRelevance}%
              </div>
            )}
          </div>

          <div className="articles-grid">
            {resultsWithRelevance.map((article) => {
              const relevanceScore = article.relevanceScore;
              const relevanceColor = relevanceScore !== null ? getRelevanceColor(relevanceScore) : null;

              return (
                <Link
                  key={article._id}
                  to={`/article/${article._id}`}
                  className="article-card"
                  style={relevanceColor ? { '--relevance-color': relevanceColor } : {}}
                >
                  <div className="article-header-row">
                    <div className="article-header-content">
                      <h3 className="article-title">{article.title || 'Untitled'}</h3>
                      <div className="article-meta">
                        <span className="article-date">
                          📅 {formatDate(article.publishedDate)}
                        </span>
                        {article.author && (
                          <span className="article-author">✍️ {article.author}</span>
                        )}
                      </div>
                    </div>
                    {relevanceScore !== null && (
                      <div className="relevance-indicator">
                        <div className="relevance-badge" style={{ backgroundColor: relevanceColor, color: '#000' }}>
                          {relevanceScore}% Match
                        </div>
                        <div className="relevance-bar">
                          <div
                            className="relevance-bar-fill"
                            style={{
                              width: `${relevanceScore}%`,
                              backgroundColor: relevanceColor
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="article-badges">
                    {article.sentiment && (
                      <span className={`sentiment sentiment-${article.sentiment}`}>
                        {article.sentiment === 'positive' ? '✓' : article.sentiment === 'negative' ? '⚠' : '—'} {article.sentiment}
                      </span>
                    )}
                    {article.tags && article.tags.length > 0 && (
                      <>
                        {article.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="tag">
                            #{tag}
                          </span>
                        ))}
                      </>
                    )}
                  </div>

                  {article.summary && (
                    <p className="article-summary">{article.summary}</p>
                  )}
                </Link>
              );
            })}
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

