import * as cheerio from 'cheerio';
import logger from '../utils/logger.js';

const BASE_URL = 'https://thehackernews.com';

/**
 * Fetches HTML content from a URL
 */
const fetchHTML = async (url) => {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    logger.error(`Error fetching ${url}:`, error.message);
    throw error;
  }
};

/**
 * Extracts article links from the homepage
 */
const extractArticleLinks = async () => {
  try {
    const html = await fetchHTML(BASE_URL);
    const $ = cheerio.load(html);
    const articleLinks = [];

    // The Hacker News uses specific selectors for article links
    // Common patterns: .story-link, .post-link, article a, etc.
    $('article a, .story-link, .post-link, .home-title a').each((i, element) => {
      const href = $(element).attr('href');
      if (href && !articleLinks.includes(href)) {
        // Handle relative URLs
        const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
        articleLinks.push(fullUrl);
      }
    });

    // Alternative: Look for common article patterns
    if (articleLinks.length === 0) {
      $('a[href*="/202"]').each((i, element) => {
        const href = $(element).attr('href');
        if (href && href.includes('/202') && !articleLinks.includes(href)) {
          const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
          articleLinks.push(fullUrl);
        }
      });
    }

    logger.info(`Found ${articleLinks.length} article links`);
    return articleLinks.slice(0, 20); // Limit to 20 articles per scrape
  } catch (error) {
    logger.error('Error extracting article links:', error.message);
    throw error;
  }
};

/**
 * Scrapes a single article page
 */
const scrapeArticle = async (articleUrl) => {
  try {
    const html = await fetchHTML(articleUrl);
    const $ = cheerio.load(html);

    // Extract title
    const title = $('h1.post-title, h1.entry-title, h1.title, article h1').first().text().trim() ||
      $('title').text().split('|')[0].trim();

    // Extract author
    const author = $('.author-name, .post-author, .author, [rel="author"]').first().text().trim() ||
      $('meta[property="article:author"]').attr('content') || '';

    // Extract published date
    let publishedDate = null;
    const dateText = $('.post-date, .entry-date, .published, time[datetime]').first().attr('datetime') ||
      $('.post-date, .entry-date, .published').first().text().trim() ||
      $('meta[property="article:published_time"]').attr('content');

    if (dateText) {
      publishedDate = new Date(dateText);
      if (isNaN(publishedDate.getTime())) {
        publishedDate = null;
      }
    }

    // Extract content
    const content = $('.articlebody, .post-content, .entry-content, article .content, .article-content')
      .first()
      .text()
      .trim()
      .replace(/\s+/g, ' ')
      .substring(0, 10000); // Limit content length

    // Extract tags from span elements with class="p-tags"
    const tags = [];
    $('span.p-tags').each((i, element) => {
      const tagText = $(element).text().trim();
      if (tagText) {
        tags.push(tagText);
      }
    });

    if (!title || !content) {
      logger.warn(`Incomplete article data for ${articleUrl}`);
      return null;
    }

    return {
      title,
      url: articleUrl,
      author,
      publishedDate: publishedDate || new Date(),
      content,
      tags,
    };
  } catch (error) {
    logger.error(`Error scraping article ${articleUrl}:`, error.message);
    return null;
  }
};

/**
 * Filters articles by category keyword (case-insensitive search in title or content)
 * @param {Array} articles - Array of articles to filter
 * @param {string|undefined} category - Optional category keyword to filter by
 */
const filterByCategory = (articles, category) => {
  if (!category || !category.trim()) {
    return articles;
  }

  const categoryLower = category.toLowerCase().trim();
  const filtered = articles.filter(article => {
    const titleMatch = article.title?.toLowerCase().includes(categoryLower);
    const contentMatch = article.content?.toLowerCase().includes(categoryLower);
    return titleMatch || contentMatch;
  });

  logger.info(`Filtered ${filtered.length} articles matching category "${category}" out of ${articles.length} total`);
  return filtered;
};

/**
 * Main scraper function - fetches and scrapes all articles
 * @param {string|undefined} category - Optional category keyword to filter articles
 */
const scrapeArticles = async (category = undefined) => {
  try {
    logger.info('Starting article scraping...');
    if (category) {
      logger.info(`Category filter active: "${category}"`);
    }

    const articleLinks = await extractArticleLinks();

    const articles = [];
    for (const link of articleLinks) {
      const article = await scrapeArticle(link);
      if (article) {
        articles.push(article);
      }
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Filter by category if provided
    const filteredArticles = filterByCategory(articles, category);

    logger.info(`Successfully scraped ${filteredArticles.length} articles${category ? ` (filtered by category: ${category})` : ''}`);
    return filteredArticles;
  } catch (error) {
    logger.error('Error in scrapeArticles:', error.message);
    throw error;
  }
};

export default {
  scrapeArticles,
  scrapeArticle,
  filterByCategory,
};

