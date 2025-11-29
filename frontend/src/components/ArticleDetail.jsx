import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { articleService } from '../services/api';
import { getCredibilityColor, getCredibilityLabel, getCredibilityIcon } from '../utils/credibility';
import './ArticleDetail.css';

const ArticleDetail = () => {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchArticle();
  }, [id]);

  const fetchArticle = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await articleService.getArticleById(id);
      setArticle(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch article');
      console.error('Error fetching article:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <div className="loading">Loading article...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error">Error: {error}</div>
        <Link to="/" className="back-link">
          ← Back to Articles
        </Link>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="error-container">
        <div className="error">Article not found</div>
        <Link to="/" className="back-link">
          ← Back to Articles
        </Link>
      </div>
    );
  }

  return (
    <div className="article-detail-container">
      <Link to="/" className="back-link">
        ← Back to Articles
      </Link>

      <article className="article-detail">
        <header className="article-header">
          <h1 className="article-title">{article.title || 'Untitled'}</h1>
          <div className="article-meta-info">
            <div className="meta-row">
              <span className="meta-label">Published:</span>
              <span className="meta-value">
                {formatDate(article.publishedDate)}
              </span>
            </div>
            {article.category && (
              <div className="meta-row">
                <span className="meta-label">Category:</span>
                <span className="meta-value">{article.category}</span>
              </div>
            )}
            {article.sentiment && (
              <div className="meta-row">
                <span className="meta-label">Sentiment:</span>
                <span
                  className={`meta-value sentiment sentiment-${article.sentiment}`}
                >
                  {article.sentiment}
                </span>
              </div>
            )}
            {article.credibilityScore !== null && article.credibilityScore !== undefined && (
              <div className="meta-row">
                <span className="meta-label">Credibility:</span>
                <span
                  className="meta-value credibility-badge"
                  style={{
                    backgroundColor: getCredibilityColor(article.credibilityScore),
                    color: '#000'
                  }}
                  title={getCredibilityLabel(article.credibilityScore)}
                >
                  {getCredibilityIcon(article.credibilityScore)} {article.credibilityScore}% - {getCredibilityLabel(article.credibilityScore)}
                </span>
              </div>
            )}
            {article.url && (
              <div className="meta-row">
                <span className="meta-label">Source:</span>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="source-link"
                >
                  View Original
                </a>
              </div>
            )}
          </div>
        </header>

        {article.summary && (
          <div className="article-summary-section">
            <h2>Summary</h2>
            <p className="article-summary">{article.summary}</p>
          </div>
        )}

        {article.content && (
          <div className="article-content-section">
            <h2>Content</h2>
            <div
              className="article-content"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </div>
        )}

        {article.tags && article.tags.length > 0 && (
          <div className="article-tags-section">
            <h3>Tags</h3>
            <div className="tags-list">
              {article.tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {article.keyPoints && article.keyPoints.length > 0 && (
          <div className="article-keypoints-section">
            <h3>Key Points</h3>
            <ul className="keypoints-list">
              {article.keyPoints.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          </div>
        )}
      </article>
    </div>
  );
};

export default ArticleDetail;

