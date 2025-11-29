import OpenAI from 'openai';
import logger from '../utils/logger.js';
import credibilityService from './credibilityService.js';

// Lazy initialization of OpenAI client
let openai = null;

const getOpenAIClient = () => {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
};

/**
 * Processes an article through OpenAI API
 */
const processArticle = async (article) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      logger.warn('OPENAI_API_KEY not set, skipping AI processing');
      // Still assess credibility based on source
      const credibilityScore = await credibilityService.assessCredibility(article).catch(() => null);
      return {
        summary: '',
        keyPoints: [],
        tags: [],
        sentiment: 'neutral',
        credibilityScore,
      };
    }

    const prompt = `Please analyze the following article and provide:
1. A concise summary (2-3 sentences)
2. 3-5 key points as a bulleted list
3. Relevant tags/categories (comma-separated)
4. Sentiment analysis (positive, neutral, or negative)

Article Title: ${article.title}
Article Content: ${article.content.substring(0, 4000)}

Please format your response as JSON:
{
  "summary": "summary text here",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "tags": ["tag1", "tag2", "tag3"],
  "sentiment": "positive|neutral|negative"
}`;

    const client = getOpenAIClient();
    if (!client) {
      logger.warn('OpenAI client not initialized, skipping AI processing');
      // Still assess credibility based on source
      const credibilityScore = await credibilityService.assessCredibility(article).catch(() => null);
      return {
        summary: '',
        keyPoints: [],
        tags: [],
        sentiment: 'neutral',
        credibilityScore,
      };
    }

    const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
    const response = await client.chat.completions.create({
      model: model,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = response.choices[0].message.content;

    // Try to parse JSON from the response
    let parsedResponse;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) ||
        responseText.match(/```\s*([\s\S]*?)\s*```/);
      const jsonText = jsonMatch ? jsonMatch[1] : responseText;
      parsedResponse = JSON.parse(jsonText);
    } catch (parseError) {
      // Fallback: try to extract information from text
      logger.warn('Failed to parse JSON response, using fallback parsing');
      const lines = responseText.split('\n');
      parsedResponse = {
        summary: lines.find(l => l.toLowerCase().includes('summary')) ||
          responseText.substring(0, 200),
        keyPoints: lines.filter(l => l.trim().startsWith('-') || l.trim().startsWith('•'))
          .map(l => l.replace(/^[-•]\s*/, '').trim())
          .slice(0, 5),
        tags: (responseText.match(/tags?[:\-]\s*([^\n]+)/i)?.[1] || '')
          .split(',')
          .map(t => t.trim())
          .filter(t => t),
        sentiment: responseText.match(/sentiment[:\-]\s*(positive|neutral|negative)/i)?.[1] || 'neutral',
      };
    }

    // Assess credibility
    let credibilityScore = null;
    try {
      credibilityScore = await credibilityService.assessCredibility(article);
    } catch (credError) {
      logger.warn('Error assessing credibility, continuing without score:', credError.message);
    }

    return {
      summary: parsedResponse.summary || '',
      keyPoints: Array.isArray(parsedResponse.keyPoints) ? parsedResponse.keyPoints : [],
      tags: Array.isArray(parsedResponse.tags) ? parsedResponse.tags : [],
      sentiment: ['positive', 'neutral', 'negative'].includes(parsedResponse.sentiment?.toLowerCase())
        ? parsedResponse.sentiment.toLowerCase()
        : 'neutral',
      credibilityScore,
    };
  } catch (error) {
    logger.error('Error processing article with AI:', error.message);
    // Return default values on error, but still try to assess credibility
    let credibilityScore = null;
    try {
      credibilityScore = await credibilityService.assessCredibility(article);
    } catch (credError) {
      // Ignore credibility errors if main processing failed
    }
    return {
      summary: '',
      keyPoints: [],
      tags: [],
      sentiment: 'neutral',
      credibilityScore,
    };
  }
};

/**
 * Processes multiple articles with rate limiting
 */
const processArticles = async (articles) => {
  const processedArticles = [];

  for (const article of articles) {
    try {
      const aiData = await processArticle(article);
      processedArticles.push({
        ...article,
        ...aiData,
        processedAt: new Date(),
      });

      // Rate limiting: wait 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      logger.error(`Error processing article "${article.title}":`, error.message);
      // Continue with next article even if one fails
      // Still try to assess credibility
      let credibilityScore = null;
      try {
        credibilityScore = await credibilityService.assessCredibility(article);
      } catch (credError) {
        // Ignore credibility errors
      }
      processedArticles.push({
        ...article,
        summary: '',
        keyPoints: [],
        tags: [],
        sentiment: 'neutral',
        credibilityScore,
        processedAt: new Date(),
      });
    }
  }

  return processedArticles;
};

export default {
  processArticle,
  processArticles,
};

