import { pipeline } from '@xenova/transformers';
import logger from '../utils/logger.js';

// Lazy initialization of embedding model
let embeddingModel = null;
let isInitializing = false;

/**
 * Initialize the embedding model
 */
const initializeModel = async () => {
  if (embeddingModel) {
    return embeddingModel;
  }

  if (isInitializing) {
    // Wait for ongoing initialization
    while (isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return embeddingModel;
  }

  try {
    isInitializing = true;
    const modelName = process.env.EMBEDDING_MODEL || 'Xenova/all-MiniLM-L6-v2';
    logger.info(`Loading embedding model: ${modelName}`);

    embeddingModel = await pipeline('feature-extraction', modelName, {
      quantized: true, // Use quantized model for faster loading
    });

    logger.info('Embedding model loaded successfully');
    isInitializing = false;
    return embeddingModel;
  } catch (error) {
    isInitializing = false;
    logger.error('Error loading embedding model:', error.message);
    throw error;
  }
};

/**
 * Calculate cosine similarity between two vectors
 */
const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    return 0;
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
};

/**
 * Generate embedding for text
 */
const generateEmbedding = async (text) => {
  try {
    if (!text || !text.trim()) {
      logger.warn('Empty text provided for embedding generation');
      return null;
    }

    const model = await initializeModel();
    if (!model) {
      logger.error('Embedding model not available');
      return null;
    }

    // Generate embedding
    const output = await model(text, {
      pooling: 'mean',
      normalize: true,
    });

    // Convert tensor to array
    const embedding = Array.from(output.data);
    return embedding;
  } catch (error) {
    logger.error('Error generating embedding:', error.message);
    return null;
  }
};

/**
 * Generate embedding for an article
 * Combines title, summary, and tags with weighted importance
 */
const generateArticleEmbedding = async (article) => {
  try {
    if (!article) {
      return null;
    }

    // Combine article fields for embedding
    // Title (40%), Summary (40%), Tags (20%)
    const title = (article.title || '').trim();
    const summary = (article.summary || '').trim();
    const tags = (article.tags || []).filter(t => t && t.trim()).join(', ');

    // Build text for embedding
    const parts = [];
    if (title) parts.push(title);
    if (summary) parts.push(summary);
    if (tags) parts.push(`Tags: ${tags}`);

    const combinedText = parts.join('\n\n');

    if (!combinedText.trim()) {
      logger.warn('Article has no text content for embedding');
      return null;
    }

    return await generateEmbedding(combinedText);
  } catch (error) {
    logger.error('Error generating article embedding:', error.message);
    return null;
  }
};

export default {
  initializeModel,
  generateEmbedding,
  generateArticleEmbedding,
  cosineSimilarity,
};

