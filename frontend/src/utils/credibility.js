/**
 * Gets color for credibility score based on neon theme
 * @param {number} score - Credibility score (0-100)
 * @returns {string} Hex color code
 */
export const getCredibilityColor = (score) => {
  if (score === null || score === undefined) return '#00ffff'; // Default cyan for unknown

  if (score >= 80) return '#00ff00'; // Neon Green - Highly Credible
  if (score >= 50) return '#ffff00'; // Neon Yellow - Moderate Credibility
  return '#ff00ff'; // Neon Magenta - Low Credibility
};

/**
 * Gets label for credibility score
 * @param {number} score - Credibility score (0-100)
 * @returns {string} Human-readable label
 */
export const getCredibilityLabel = (score) => {
  if (score === null || score === undefined) return 'Unknown';

  if (score >= 80) return 'Highly Credible';
  if (score >= 50) return 'Moderate';
  return 'Low Credibility';
};

/**
 * Gets icon/emoji for credibility score
 * @param {number} score - Credibility score (0-100)
 * @returns {string} Icon/emoji
 */
export const getCredibilityIcon = (score) => {
  if (score === null || score === undefined) return '?';

  if (score >= 80) return '✓';
  if (score >= 50) return '~';
  return '⚠';
};

