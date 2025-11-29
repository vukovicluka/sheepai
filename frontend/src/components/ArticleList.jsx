import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { articleService } from '../services/api';
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

      <h2>{latest ? 'Latest Articles' : 'All Articles'}</h2>

      {error && <div className="error-message">{error}</div>}

      <div className="articles-grid">
        {articles.map((article) => (
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

