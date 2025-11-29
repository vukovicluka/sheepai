import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { articleService } from '../services/api';
import { calculateRelevanceScore, getRelevanceColor, calculateAverageRelevance } from '../utils/relevance';
import { getCredibilityColor, getCredibilityLabel, getCredibilityIcon } from '../utils/credibility';
import './Browse.css';

const Browse = () => {
  // Search state
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState('semantic'); // 'semantic' or 'keyword'
  const [isSearchMode, setIsSearchMode] = useState(false);

  // Article list state
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  // Filters
  const [category, setCategory] = useState('');
  const [tag, setTag] = useState('');
  const [tags, setTags] = useState([]);
  const [highConfidence, setHighConfidence] = useState(true);

  // Fetch tags on mount
  useEffect(() => {
    fetchTags();
  }, []);

  // Fetch articles when filters change (only in browse mode, not search mode)
  useEffect(() => {
    if (!isSearchMode) {
      fetchLatestArticles();
    }
  }, [page, category, tag, highConfidence, isSearchMode]);

  const fetchTags = async () => {
    try {
      const data = await articleService.getTags();
      setTags(data.tags || []);
    } catch (err) {
      console.error('Error fetching tags:', err);
    }
  };

  const fetchLatestArticles = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 10,
        ...(category && { category }),
        ...(tag && { tag }),
        ...(highConfidence && { highConfidence: 'true' }),
      };

      const data = await articleService.getLatestArticles(params);
      setArticles(data.articles || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch articles');
      console.error('Error fetching articles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      // If query is empty, switch back to browse mode
      setIsSearchMode(false);
      setPage(1);
      fetchLatestArticles();
      return;
    }

    setIsSearchMode(true);
    setLoading(true);
    setError(null);
    setPage(1);

    try {
      const params = {
        page: 1,
        limit: 10,
        ...(category && { category }),
        ...(highConfidence && { highConfidence: 'true' }),
      };

      const data = searchMode === 'semantic'
        ? await articleService.semanticSearchArticles(query, params)
        : await articleService.searchArticles(query, params);
      setArticles(data.articles || []);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to search articles');
      console.error('Error searching articles:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (loading) return;

    if (isSearchMode) {
      // Load more search results
      if (!query.trim()) return;
      setLoading(true);
      try {
        const params = {
          page: page + 1,
          limit: 10,
          ...(category && { category }),
          ...(highConfidence && { highConfidence: 'true' }),
        };

        const data = searchMode === 'semantic'
          ? await articleService.semanticSearchArticles(query, params)
          : await articleService.searchArticles(query, params);
        setArticles((prev) => [...prev, ...(data.articles || [])]);
        setPagination(data.pagination);
        setPage((p) => p + 1);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load more results');
        console.error('Error loading more results:', err);
      } finally {
        setLoading(false);
      }
    } else {
      // Load more latest articles
      setPage((p) => p + 1);
    }
  };

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setPage(1);
  };

  const handleTagChange = (e) => {
    setTag(e.target.value);
    setPage(1);
  };

  const clearSearch = () => {
    setQuery('');
    setIsSearchMode(false);
    setPage(1);
    fetchLatestArticles();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Calculate relevance scores
  const articlesWithRelevance = useMemo(() => {
    if (articles.length === 0) return [];

    // If semantic search, articles already have similarity scores
    if (isSearchMode && searchMode === 'semantic' && articles.some(a => a.similarity !== undefined)) {
      return articles.map(article => ({
        ...article,
        relevanceScore: article.similarity !== undefined ? article.similarity : null,
      }));
    }

    // For keyword search or browse mode with category
    const relevanceCategory = isSearchMode ? (category || query) : category;
    if (!relevanceCategory || relevanceCategory.trim() === '') {
      return articles.map(article => ({ ...article, relevanceScore: null }));
    }

    const articlesWithScores = articles.map(article => ({
      ...article,
      relevanceScore: calculateRelevanceScore(article, relevanceCategory),
    }));

    // Sort by relevance (highest first)
    return articlesWithScores.sort((a, b) => {
      return (b.relevanceScore || 0) - (a.relevanceScore || 0);
    });
  }, [articles, category, query, searchMode, isSearchMode]);

  // Calculate average relevance
  const avgRelevance = useMemo(() => {
    if (isSearchMode && searchMode === 'semantic' && articles.length > 0) {
      const similarities = articles
        .map(a => a.similarity !== undefined ? a.similarity : null)
        .filter(s => s !== null);
      if (similarities.length > 0) {
        const sum = similarities.reduce((acc, s) => acc + s, 0);
        return Math.round(sum / similarities.length);
      }
    }
    const relevanceCategory = isSearchMode ? (category || query) : category;
    return calculateAverageRelevance(articles, relevanceCategory);
  }, [articles, category, query, searchMode, isSearchMode]);

  if (loading && articles.length === 0) {
    return <div className="loading">Loading articles...</div>;
  }

  return (
    <div className="browse-container">
      {/* Search Form */}
      <div className="search-section">
        <h2>{isSearchMode ? 'Search Results' : 'Latest Articles'}</h2>
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-group">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchMode === 'semantic' ? 'Search by meaning (e.g., "supply chain attacks")...' : 'Search articles by title, content, or summary...'}
              className="search-input"
            />
            {isSearchMode && (
              <button type="button" onClick={clearSearch} className="clear-search-button">
                Clear
              </button>
            )}
            <button type="submit" className="search-button" disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
          {query.trim() && (
            <div className="search-mode-toggle">
              <label className="radio-label">
                <input
                  type="radio"
                  name="searchMode"
                  value="semantic"
                  checked={searchMode === 'semantic'}
                  onChange={(e) => setSearchMode(e.target.value)}
                />
                <span>Semantic Search</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="searchMode"
                  value="keyword"
                  checked={searchMode === 'keyword'}
                  onChange={(e) => setSearchMode(e.target.value)}
                />
                <span>Keyword Search</span>
              </label>
            </div>
          )}
        </form>
      </div>

      {/* Filters */}
      <div className="filters">
        <div className="filter-group">
          <label htmlFor="category">Category:</label>
          <input
            id="category"
            type="text"
            value={category}
            onChange={handleCategoryChange}
            placeholder="Filter by category..."
          />
        </div>
        <div className="filter-group">
          <label htmlFor="tag">Tag:</label>
          <select id="tag" value={tag} onChange={handleTagChange}>
            <option value="">All Tags</option>
            {tags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={highConfidence}
              onChange={(e) => {
                setHighConfidence(e.target.checked);
                setPage(1);
              }}
            />
            <span>High Confidence Only (≥70%)</span>
          </label>
        </div>
        {(category || tag || isSearchMode) && (
          <button
            className="clear-filters"
            onClick={() => {
              setCategory('');
              setTag('');
              if (isSearchMode) {
                clearSearch();
              } else {
                setPage(1);
              }
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Header with stats */}
      <div className="header-section">
        {isSearchMode ? (
          <>
            <p className="results-count">
              Found {pagination?.total || articles.length} result
              {pagination?.total !== 1 ? 's' : ''} for "{query}"
            </p>
            {(category || query) && avgRelevance !== null && (
              <div className="avg-relevance-badge" style={{ '--relevance-color': getRelevanceColor(avgRelevance) }}>
                Avg {searchMode === 'semantic' ? 'Similarity' : 'Relevance'}: {avgRelevance}%
              </div>
            )}
          </>
        ) : (
          <>
            {category && avgRelevance !== null && (
              <div className="avg-relevance-badge" style={{ '--relevance-color': getRelevanceColor(avgRelevance) }}>
                Avg Relevance: {avgRelevance}%
              </div>
            )}
            {!category && (
              <div className="relevance-hint">
                💡 Enter a category or search query to see relevance scores
              </div>
            )}
          </>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Articles Grid */}
      <div className="articles-grid">
        {articlesWithRelevance.map((article) => {
          const relevanceScore = article.relevanceScore;
          const relevanceColor = relevanceScore !== null ? getRelevanceColor(relevanceScore) : '#00ffff';

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
                      {isSearchMode && searchMode === 'semantic' ? `${relevanceScore}% Similar` : `${relevanceScore}% Match`}
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
              </div>

              <div className="article-badges">
                {article.credibilityScore !== null && article.credibilityScore !== undefined && (
                  <span
                    className="credibility-badge"
                    style={{
                      backgroundColor: getCredibilityColor(article.credibilityScore),
                      color: '#000'
                    }}
                    title={getCredibilityLabel(article.credibilityScore)}
                  >
                    {getCredibilityIcon(article.credibilityScore)} {article.credibilityScore}% Credible
                  </span>
                )}
              </div>

              <div className="article-badges">
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

              {/* {article.keyPoints && article.keyPoints.length > 0 && (
                <div className="article-keypoints-section">
                  <strong className="article-keypoints-label">Key Points:</strong>
                  <ul className="article-keypoints-list">
                    {article.keyPoints.slice(0, 3).map((point, idx) => (
                      <li key={idx}>{point}</li>
                    ))}
                  </ul>
                </div>
              )} */}

              <div className="article-read-more">
                Read Full Article →
              </div>
            </Link>
          );
        })}
      </div>

      {/* Pagination / Load More */}
      {isSearchMode && pagination && page < pagination.pages && (
        <div className="load-more-container">
          <button onClick={loadMore} className="load-more-button" disabled={loading}>
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}

      {articles.length === 0 && !loading && (
        <div className="no-articles">
          {isSearchMode ? `No results found for "${query}"` : 'No articles found.'}
        </div>
      )}
    </div>
  );
};

export default Browse;

