import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { articleService } from '../services/api';
import { calculateRelevanceScore, getRelevanceColor, calculateAverageRelevance } from '../utils/relevance';
import './ArticleList.css';

const ArticleList = ({ latest = false }) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [category, setCategory] = useState('');
  const [tag, setTag] = useState('');
  const [tags, setTags] = useState([]);

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [page, category, tag, latest]);

  const fetchTags = async () => {
    try {
      const data = await articleService.getTags();
      setTags(data.tags || []);
    } catch (err) {
      console.error('Error fetching tags:', err);
    }
  };

  const fetchArticles = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 10,
        ...(category && { category }),
        ...(tag && { tag }),
      };

      const data = latest
        ? await articleService.getLatestArticles(params)
        : await articleService.getArticles(params);

      if (latest) {
        setArticles(data.articles || []);
      } else {
        setArticles(data.articles || []);
        setPagination(data.pagination);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch articles');
      console.error('Error fetching articles:', err);
    } finally {
      setLoading(false);
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Calculate relevance scores and sort articles when category filter is active
  const articlesWithRelevance = useMemo(() => {
    if (!category || category.trim() === '') {
      return articles.map(article => ({ ...article, relevanceScore: null }));
    }

    const articlesWithScores = articles.map(article => {
      const score = calculateRelevanceScore(article, category);
      return {
        ...article,
        relevanceScore: score,
      };
    });

    // Sort by relevance (highest first), then by date
    return articlesWithScores.sort((a, b) => {
      if (b.relevanceScore !== a.relevanceScore) {
        return (b.relevanceScore || 0) - (a.relevanceScore || 0);
      }
      return new Date(b.publishedDate || 0) - new Date(a.publishedDate || 0);
    });
  }, [articles, category]);

  // Calculate average relevance
  const avgRelevance = useMemo(() => {
    return calculateAverageRelevance(articles, category);
  }, [articles, category]);

  if (loading && articles.length === 0) {
    return <div className="loading">Loading articles...</div>;
  }

  if (error && articles.length === 0) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="article-list-container">
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
        {(category || tag) && (
          <button
            className="clear-filters"
            onClick={() => {
              setCategory('');
              setTag('');
              setPage(1);
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      <div className="header-section">
        <h2>{latest ? 'Latest Articles' : 'All Articles'}</h2>
        {category && avgRelevance !== null && (
          <div className="avg-relevance-badge" style={{ '--relevance-color': getRelevanceColor(avgRelevance) }}>
            Avg Relevance: {avgRelevance}%
          </div>
        )}
        {!category && (
          <div className="relevance-hint">
            💡 Enter a category to see relevance scores
          </div>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

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
                {relevanceScore !== null ? (
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
                ) : null}
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

      {!latest && pagination && pagination.pages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span>
            Page {pagination.page} of {pagination.pages} (Total: {pagination.total})
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
            disabled={page === pagination.pages}
          >
            Next
          </button>
        </div>
      )}

      {articles.length === 0 && !loading && (
        <div className="no-articles">No articles found.</div>
      )}
    </div>
  );
};

export default ArticleList;

