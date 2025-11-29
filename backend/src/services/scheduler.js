import cron from 'node-cron';
import logger from '../utils/logger.js';
import scraper from './scraper.js';
import aiProcessor from './aiProcessor.js';
import emailService from './emailService.js';
import Article from '../models/Article.js';

/**
 * Fetches, processes, and stores new articles
 */
const fetchAndProcessArticles = async () => {
  try {
    logger.info('Starting scheduled article fetch and process...');

    // Get category filter from environment variable (optional)
    const categoryFilter = process.env.CATEGORY_FILTER?.trim() || undefined;
    if (categoryFilter) {
      logger.info(`Category filter configured: "${categoryFilter}"`);
    }

    // Scrape articles with optional category filter
    const scrapedArticles = await scraper.scrapeArticles(categoryFilter);

    if (scrapedArticles.length === 0) {
      logger.warn('No articles scraped');
      return;
    }

    // Check for existing articles by URL before processing (more efficient)
    const scrapedUrls = scrapedArticles.map(article => article.url);
    const existingArticles = await Article.find({ url: { $in: scrapedUrls } }).select('url').lean();
    const existingUrls = new Set(existingArticles.map(article => article.url));

    // Filter out articles that already exist
    const newArticles = scrapedArticles.filter(article => !existingUrls.has(article.url));

    if (newArticles.length === 0) {
      logger.info(`All ${scrapedArticles.length} articles already exist in database. Skipping processing.`);
      return;
    }

    logger.info(`Found ${newArticles.length} new articles out of ${scrapedArticles.length} total. Processing...`);

    // Process only new articles with AI
    logger.info('Processing new articles with AI...');
    const processedArticles = await aiProcessor.processArticles(newArticles);

    // Store articles in database (avoid duplicates with additional check)
    let savedCount = 0;
    let skippedCount = 0;
    const savedArticles = []; // Collect all successfully saved articles

    for (const articleData of processedArticles) {
      try {
        // Double-check if article already exists by URL (race condition protection)
        const existingArticle = await Article.findOne({ url: articleData.url });

        if (existingArticle) {
          logger.debug(`Article already exists (duplicate check): ${articleData.url}`);
          skippedCount++;
          continue;
        }

        // Create new article
        const article = new Article(articleData);
        await article.save();
        savedCount++;
        savedArticles.push(articleData); // Add to saved articles list
        logger.info(`✓ Saved article: ${articleData.title}`);
      } catch (error) {
        if (error.code === 11000) {
          // Duplicate key error (MongoDB unique constraint violation)
          skippedCount++;
          logger.debug(`Duplicate article skipped (unique constraint): ${articleData.url}`);
        } else {
          logger.error(`Error saving article "${articleData.title}":`, error.message);
        }
      }
    }

    logger.info(`Article processing complete. Saved: ${savedCount}, Skipped: ${skippedCount}`);

    // Send batch email notifications after all articles are saved
    if (savedArticles.length > 0) {
      try {
        await emailService.notifyUsersAboutBatchArticles(savedArticles);
      } catch (emailError) {
        // Don't fail the process if email fails
        logger.error('Error sending batch email notifications:', emailError.message);
      }
    }
  } catch (error) {
    logger.error('Error in fetchAndProcessArticles:', error.message);
  }
};

/**
 * Initializes the cron scheduler
 */
const initializeScheduler = () => {
  const cronSchedule = process.env.CRON_SCHEDULE || '* * * * *'; // Default: every minute

  logger.info(`Initializing scheduler with cron: ${cronSchedule}`);

  // Validate cron expression
  if (!cron.validate(cronSchedule)) {
    logger.error(`Invalid cron schedule: ${cronSchedule}`);
    return;
  }

  // Schedule the job
  cron.schedule(cronSchedule, async () => {
    logger.info('Cron job triggered');
    await fetchAndProcessArticles();
  });

  logger.info('Scheduler initialized successfully');

  // Optionally run immediately on startup (for testing)
  if (process.env.RUN_ON_STARTUP === 'true') {
    logger.info('Running initial fetch on startup...');
    fetchAndProcessArticles();
  }
};

export default {
  initializeScheduler,
  fetchAndProcessArticles,
};

