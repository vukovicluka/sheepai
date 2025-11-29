import dotenv from 'dotenv';
import connectDB from '../src/config/database.js';
import Article from '../src/models/Article.js';
import embeddingService from '../src/services/embeddingService.js';
import logger from '../src/utils/logger.js';

// Load environment variables
dotenv.config();

/**
 * Generate embeddings for articles that don't have them
 */
const generateEmbeddingsForArticles = async () => {
  try {
    // Connect to database
    await connectDB();
    logger.info('Connected to database');

    // Find articles without embeddings
    const articlesWithoutEmbeddings = await Article.find({
      $or: [
        { embedding: { $exists: false } },
        { embedding: null },
        { embedding: { $size: 0 } },
      ],
    }).select('+embedding').lean();

    logger.info(`Found ${articlesWithoutEmbeddings.length} articles without embeddings`);

    if (articlesWithoutEmbeddings.length === 0) {
      logger.info('All articles already have embeddings');
      process.exit(0);
    }

    // Process articles in batches
    const batchSize = 10;
    let processed = 0;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < articlesWithoutEmbeddings.length; i += batchSize) {
      const batch = articlesWithoutEmbeddings.slice(i, i + batchSize);
      logger.info(`Processing batch ${Math.floor(i / batchSize) + 1} (${batch.length} articles)`);

      for (const article of batch) {
        try {
          // Generate embedding
          const embedding = await embeddingService.generateArticleEmbedding(article);

          if (embedding && embedding.length > 0) {
            // Update article with embedding
            await Article.updateOne(
              { _id: article._id },
              { $set: { embedding } }
            );
            successCount++;
            logger.info(`✓ Generated embedding for: ${article.title}`);
          } else {
            logger.warn(`Failed to generate embedding for: ${article.title}`);
            errorCount++;
          }

          processed++;

          // Small delay to avoid overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          logger.error(`Error processing article "${article.title}":`, error.message);
          errorCount++;
          processed++;
        }
      }

      logger.info(`Progress: ${processed}/${articlesWithoutEmbeddings.length} articles processed`);
    }

    logger.info(`\n=== Embedding Generation Complete ===`);
    logger.info(`Total articles: ${articlesWithoutEmbeddings.length}`);
    logger.info(`Successfully processed: ${successCount}`);
    logger.info(`Errors: ${errorCount}`);

    process.exit(0);
  } catch (error) {
    logger.error('Fatal error in embedding generation:', error.message);
    process.exit(1);
  }
};

// Run the script
generateEmbeddingsForArticles();

