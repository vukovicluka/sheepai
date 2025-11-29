/**
 * Calculates relevance score for an article based on a category keyword
 * Returns a score from 0-100
 */
export const calculateRelevanceScore = (article, category) => {
  if (!category || !category.trim()) return null;

  const categoryLower = category.toLowerCase().trim();
  const title = (article.title || '').toLowerCase();
  const content = (article.content || '').toLowerCase();
  const summary = (article.summary || '').toLowerCase();
  const tags = (article.tags || []).map(t => t.toLowerCase().trim());

  let score = 0;

  // Exact match in title (highest weight)
  if (title.includes(categoryLower)) {
    score += 40;
  }

  // Exact match in summary
  if (summary.includes(categoryLower)) {
    score += 30;
  }

  // Match in content
  const contentMatches = (content.match(new RegExp(categoryLower, 'g')) || []).length;
  score += Math.min(contentMatches * 5, 20);

  // Match in tags - check each tag individually
  let tagScore = 0;
  tags.forEach(tag => {
    // Exact tag match (highest weight for tags)
    if (tag === categoryLower) {
      tagScore += 15;
    }
    // Tag contains the category keyword
    else if (tag.includes(categoryLower)) {
      tagScore += 10;
    }
    // Category keyword contains the tag (partial match)
    else if (categoryLower.includes(tag) && tag.length > 2) {
      tagScore += 5;
    }
  });
  // Cap tag score at 25 to maintain balance
  score += Math.min(tagScore, 25);

  // Ensure score is between 0-100
  return Math.min(Math.max(score, 0), 100);
};

/**
 * Gets color for relevance score
 */
export const getRelevanceColor = (score) => {
  if (score >= 80) return '#4caf50'; // Green - High relevance
  if (score >= 60) return '#8bc34a'; // Light green - Medium-high
  if (score >= 40) return '#ffc107'; // Yellow - Medium
  if (score >= 20) return '#ff9800'; // Orange - Low-medium
  return '#f44336'; // Red - Low
};

/**
 * Calculates average relevance score for a list of articles
 */
export const calculateAverageRelevance = (articles, category) => {
  if (!articles || articles.length === 0 || !category) return null;

  const scores = articles
    .map(article => calculateRelevanceScore(article, category))
    .filter(score => score !== null);

  if (scores.length === 0) return null;

  const sum = scores.reduce((acc, score) => acc + score, 0);
  return Math.round(sum / scores.length);
};

