import OpenAI from 'openai';
import logger from '../utils/logger.js';

// Lazy initialization of AI client (supports both OpenAI and LM Studio)
let aiClient = null;

const getAIClient = () => {
  if (!aiClient) {
    // Check if using local model (LM Studio)
    if (process.env.USE_LOCAL_MODEL === 'true' || process.env.LM_STUDIO_BASE_URL) {
      const baseURL = process.env.LM_STUDIO_BASE_URL || 'http://localhost:1234/v1';
      aiClient = new OpenAI({
        baseURL: baseURL,
        apiKey: 'lm-studio', // LM Studio doesn't require a real API key
      });
      logger.info(`Using local model (LM Studio) for credibility assessment at ${baseURL}`);
    } else if (process.env.OPENAI_API_KEY) {
      aiClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      logger.info('Using OpenAI API for credibility assessment');
    }
  }
  return aiClient;
};

// Source reliability database
const RELIABLE_SOURCES = [
  'thehackernews.com',
  'krebsonsecurity.com',
  'arstechnica.com',
  'techcrunch.com',
  'wired.com',
  'zdnet.com',
  'csoonline.com',
  'darkreading.com',
  'securityweek.com',
  'threatpost.com',
  'bleepingcomputer.com',
  'cyberscoop.com',
  'therecord.media',
];

const UNRELIABLE_SOURCES = [
  // Can be populated with known unreliable sources
];

/**
 * Extracts domain from URL
 */
const extractDomain = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch (error) {
    logger.warn(`Failed to extract domain from URL: ${url}`);
    return null;
  }
};

/**
 * Gets source reliability score (0-20 points)
 */
const getSourceReliabilityScore = (url) => {
  const domain = extractDomain(url);
  if (!domain) {
    return 10; // Neutral score for unknown domain
  }

  const domainLower = domain.toLowerCase();

  // Check if it's a known reliable source
  if (RELIABLE_SOURCES.some(reliable => domainLower.includes(reliable))) {
    return 20; // Maximum score for reliable sources
  }

  // Check if it's a known unreliable source
  if (UNRELIABLE_SOURCES.some(unreliable => domainLower.includes(unreliable))) {
    return 0; // Minimum score for unreliable sources
  }

  // Default: neutral score for unknown sources
  return 10;
};

/**
 * Checks if article is recent (within last 30 days)
 */
const isRecent = (publishedDate) => {
  if (!publishedDate) return false;
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const published = new Date(publishedDate);
  return published >= thirtyDaysAgo;
};

/**
 * Assesses author credibility
 */
const assessAuthorCredibility = (author) => {
  if (!author || !author.trim()) {
    return 0; // No author = 0 points
  }

  // Check for common indicators of credible authors
  const authorLower = author.toLowerCase();

  // Known credible author patterns (can be expanded)
  const crediblePatterns = [
    /ph\.?d\.?/i,
    /professor/i,
    /researcher/i,
    /security expert/i,
    /cybersecurity/i,
  ];

  const hasCredibleIndicators = crediblePatterns.some(pattern => pattern.test(authorLower));

  return hasCredibleIndicators ? 5 : 2; // Small bonus for identified authors
};

/**
 * Assesses article credibility using AI analysis and source verification
 * Returns a score between 0-100
 */
const assessCredibility = async (article) => {
  try {
    const client = getAIClient();
    if (!client) {
      logger.warn('AI client not initialized, using default credibility score');
      const sourceScore = getSourceReliabilityScore(article.url || '');
      return Math.round(sourceScore * 5);
    }

    // Get source reliability score (0-20)
    const sourceScore = getSourceReliabilityScore(article.url || '');

    // Check temporal relevance (0-5 points)
    const temporalScore = isRecent(article.publishedDate) ? 5 : 2;

    // Assess author credibility (0-5 points)
    const authorScore = assessAuthorCredibility(article.author);

    // Enhanced AI analysis prompt with strict criteria
    const publishedDateStr = article.publishedDate
      ? new Date(article.publishedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : 'Unknown';

    const prompt = `Analyze the following article for credibility with STRICT criteria. Be conservative - only give high scores (80+) to articles that meet ALL high-quality standards.

STRICT MODE CRITERIA:
1. Factual accuracy (0-100): Are claims verifiable? Are there specific details, dates, names, numbers? Are statistics cited?
2. Sensationalism (0-100, lower is better): Is language exaggerated, clickbait-style, or alarmist? Avoid hyperbolic claims.
3. Bias detection (0-100, higher is better): Is the article balanced? Does it present multiple perspectives? Is it objective?
4. Citation quality (0-100): Are sources cited? Are they reputable and verifiable? Can claims be cross-referenced?
5. Temporal relevance: Is the information current? Is it outdated or still relevant?
6. Author credibility: Is the author identified? Do they have credentials or expertise in the field?

STRICT SCORING GUIDELINES:
- Only give 80+ scores to articles with verifiable claims, reputable citations, minimal bias, and credible authors
- Penalize articles with unverified claims, missing citations, or excessive sensationalism
- Be conservative - err on the side of lower scores for uncertain content

Article Title: ${article.title}
Article Content: ${article.content.substring(0, 4000)}
Article URL: ${article.url || 'N/A'}
Author: ${article.author || 'Unknown'}
Published: ${publishedDateStr}
Is Recent: ${isRecent(article.publishedDate) ? 'Yes (within 30 days)' : 'No (older than 30 days)'}

Please provide your analysis as JSON with scores for each factor (0-100 scale):
{
  "factualAccuracy": 0-100,
  "sensationalism": 0-100 (lower is better - penalize clickbait),
  "bias": 0-100 (higher is better - less bias),
  "citationQuality": 0-100,
  "temporalRelevance": 0-100,
  "authorCredibility": 0-100,
  "overallAssessment": "brief explanation of credibility and why this score was assigned"
}

Calculate the overall credibility score as:
- Factual accuracy: 30 points (scale 0-100 to 0-30)
- Sensationalism: 20 points (inverse: 100 - sensationalism score, then scale to 0-20)
- Bias: 15 points (scale 0-100 to 0-15)
- Citation quality: 15 points (scale 0-100 to 0-15)
Total AI score: 0-80 points`;

    // Use local model name if specified, otherwise OpenAI model
    const model = process.env.USE_LOCAL_MODEL === 'true' || process.env.LM_STUDIO_BASE_URL
      ? (process.env.LOCAL_MODEL_NAME || 'local-model')
      : (process.env.OPENAI_MODEL || 'gpt-3.5-turbo');

    const response = await client.chat.completions.create({
      model: model,
      max_tokens: 600,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = response.choices[0].message.content;

    // Parse JSON response
    let aiAnalysis;
    try {
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) ||
        responseText.match(/```\s*([\s\S]*?)\s*```/);
      const jsonText = jsonMatch ? jsonMatch[1] : responseText;
      aiAnalysis = JSON.parse(jsonText);
    } catch (parseError) {
      logger.warn('Failed to parse AI credibility response, using fallback');
      // Fallback: extract scores from text
      const factualMatch = responseText.match(/factual[^\d]*(\d+)/i);
      const sensationalMatch = responseText.match(/sensational[^\d]*(\d+)/i);
      const biasMatch = responseText.match(/bias[^\d]*(\d+)/i);
      const citationMatch = responseText.match(/citation[^\d]*(\d+)/i);
      const temporalMatch = responseText.match(/temporal[^\d]*(\d+)/i);
      const authorMatch = responseText.match(/author[^\d]*(\d+)/i);

      aiAnalysis = {
        factualAccuracy: factualMatch ? parseInt(factualMatch[1]) : 65,
        sensationalism: sensationalMatch ? parseInt(sensationalMatch[1]) : 35,
        bias: biasMatch ? parseInt(biasMatch[1]) : 65,
        citationQuality: citationMatch ? parseInt(citationMatch[1]) : 55,
        temporalRelevance: temporalMatch ? parseInt(temporalMatch[1]) : (isRecent(article.publishedDate) ? 80 : 50),
        authorCredibility: authorMatch ? parseInt(authorMatch[1]) : (article.author ? 60 : 30),
      };
    }

    // Calculate AI score (0-80 points) - using conservative defaults
    const factualScore = Math.min(Math.max((aiAnalysis.factualAccuracy || 65) * 0.3, 0), 30);
    const sensationalismScore = Math.min(Math.max((100 - (aiAnalysis.sensationalism || 35)) * 0.2, 0), 20);
    const biasScore = Math.min(Math.max((aiAnalysis.bias || 65) * 0.15, 0), 15);
    const citationScore = Math.min(Math.max((aiAnalysis.citationQuality || 55) * 0.15, 0), 15);

    const aiScore = Math.round(factualScore + sensationalismScore + biasScore + citationScore);

    // Combine all scores: AI (0-80) + Source (0-20) + Temporal (0-5) + Author (0-5) = 0-110, capped at 100
    const finalScore = Math.min(Math.max(aiScore + sourceScore + temporalScore + authorScore, 0), 100);

    logger.info(`Credibility assessment for "${article.title}": AI=${aiScore}, Source=${sourceScore}, Temporal=${temporalScore}, Author=${authorScore}, Final=${finalScore}`);
    return finalScore;
  } catch (error) {
    logger.error('Error assessing article credibility:', error.message);
    // Return default score based on source only
    const sourceScore = getSourceReliabilityScore(article.url || '');
    return Math.round(sourceScore * 5); // Scale 0-20 to 0-100
  }
};

export default {
  assessCredibility,
};

