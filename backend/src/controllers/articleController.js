import Article from '../models/Article.js';
import logger from '../utils/logger.js';

/**
 * Helper function to build category filter
 */
const buildCategoryFilter = (category) => {
  if (!category || !category.trim()) {
    return {};
  }

  const categoryRegex = new RegExp(category.trim(), 'i');
  return {
    $or: [
      { title: { $regex: categoryRegex } },
      { content: { $regex: categoryRegex } },
    ],
  };
};

/**
 * Get all articles with pagination, filtering, and sorting
 */
export const getArticles = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};

    // Add category filter if provided
    if (req.query.category) {
      Object.assign(filter, buildCategoryFilter(req.query.category));
    }

    if (req.query.tag) {
      filter.tags = { $in: [req.query.tag] };
    }

    if (req.query.startDate || req.query.endDate) {
      filter.publishedDate = {};
      if (req.query.startDate) {
        filter.publishedDate.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.publishedDate.$lte = new Date(req.query.endDate);
      }
    }

    // Add credibility threshold filter
    if (req.query.minCredibility !== undefined) {
      const minCred = parseInt(req.query.minCredibility);
      if (!isNaN(minCred)) {
        filter.credibilityScore = { $gte: minCred };
      }
    } else if (req.query.highConfidence === 'true' || req.query.highConfidence === '1') {
      // Default to environment threshold if highConfidence is requested
      const defaultThreshold = parseInt(process.env.MIN_CREDIBILITY_THRESHOLD) || 70;
      filter.credibilityScore = { $gte: defaultThreshold };
    }

    // Build sort object
    const sort = {};
    const sortBy = req.query.sortBy || 'publishedDate';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    sort[sortBy] = sortOrder;

    // Execute query
    const [articles, total] = await Promise.all([
      Article.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Article.countDocuments(filter),
    ]);

    res.json({
      articles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Error fetching articles:', error.message);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
};

/**
 * Get a single article by ID
 */
export const getArticleById = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json(article);
  } catch (error) {
    logger.error('Error fetching article:', error.message);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
};

/**
 * Get latest articles
 */
export const getLatestArticles = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Build filter with category if provided
    const filter = {};
    if (req.query.category) {
      Object.assign(filter, buildCategoryFilter(req.query.category));
    }

    // Add credibility threshold filter
    if (req.query.minCredibility !== undefined) {
      const minCred = parseInt(req.query.minCredibility);
      if (!isNaN(minCred)) {
        filter.credibilityScore = { $gte: minCred };
      }
    } else if (req.query.highConfidence === 'true' || req.query.highConfidence === '1') {
      // Default to environment threshold if highConfidence is requested
      const defaultThreshold = parseInt(process.env.MIN_CREDIBILITY_THRESHOLD) || 70;
      filter.credibilityScore = { $gte: defaultThreshold };
    }

    const articles = await Article.find(filter)
      .sort({ publishedDate: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({ articles, count: articles.length });
  } catch (error) {
    logger.error('Error fetching latest articles:', error.message);
    res.status(500).json({ error: 'Failed to fetch latest articles' });
  }
};

/**
 * Search articles by title or content
 */
export const searchArticles = async (req, res) => {
  try {
    const query = req.query.q;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build search filter
    const searchConditions = [
      { title: { $regex: query, $options: 'i' } },
      { content: { $regex: query, $options: 'i' } },
      { summary: { $regex: query, $options: 'i' } },
    ];

    // Combine with category filter if provided
    let searchFilter = {
      $or: searchConditions,
    };

    if (req.query.category) {
      // If category is provided, combine search and category filters using $and
      const categoryFilter = buildCategoryFilter(req.query.category);
      searchFilter = {
        $and: [
          { $or: searchConditions },
          categoryFilter,
        ],
      };
    }

    // Add credibility threshold filter
    if (req.query.minCredibility !== undefined) {
      const minCred = parseInt(req.query.minCredibility);
      if (!isNaN(minCred)) {
        if (searchFilter.$and) {
          searchFilter.$and.push({ credibilityScore: { $gte: minCred } });
        } else {
          searchFilter.credibilityScore = { $gte: minCred };
        }
      }
    } else if (req.query.highConfidence === 'true' || req.query.highConfidence === '1') {
      // Default to environment threshold if highConfidence is requested
      const defaultThreshold = parseInt(process.env.MIN_CREDIBILITY_THRESHOLD) || 70;
      if (searchFilter.$and) {
        searchFilter.$and.push({ credibilityScore: { $gte: defaultThreshold } });
      } else {
        searchFilter.credibilityScore = { $gte: defaultThreshold };
      }
    }

    const [articles, total] = await Promise.all([
      Article.find(searchFilter)
        .sort({ publishedDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Article.countDocuments(searchFilter),
    ]);

    res.json({
      articles,
      query,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Error searching articles:', error.message);
    res.status(500).json({ error: 'Failed to search articles' });
  }
};

/**
 * Get statistics about articles
 */
export const getStats = async (req, res) => {
  try {
    // Build match filter for category if provided
    const matchFilter = {};
    if (req.query.category) {
      const categoryFilter = buildCategoryFilter(req.query.category);
      Object.assign(matchFilter, categoryFilter);
    }

    const matchStage = Object.keys(matchFilter).length > 0 ? [{ $match: matchFilter }] : [];

    const [
      totalArticles,
      articlesByDate,
      articlesByTag,
      articlesBySentiment,
    ] = await Promise.all([
      Article.countDocuments(matchFilter),
      Article.aggregate([
        ...matchStage,
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$publishedDate' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: -1 } },
        { $limit: 30 },
      ]),
      Article.aggregate([
        ...matchStage,
        { $unwind: '$tags' },
        {
          $group: {
            _id: '$tags',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),
      Article.aggregate([
        ...matchStage,
        {
          $group: {
            _id: '$sentiment',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    res.json({
      totalArticles,
      articlesByDate: articlesByDate.map(item => ({
        date: item._id,
        count: item.count,
      })),
      articlesByTag: articlesByTag.map(item => ({
        tag: item._id,
        count: item.count,
      })),
      articlesBySentiment: articlesBySentiment.map(item => ({
        sentiment: item._id,
        count: item.count,
      })),
    });
  } catch (error) {
    logger.error('Error fetching stats:', error.message);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};

/**
 * Get all unique tags
 */
export const getTags = async (req, res) => {
  try {
    const tags = await Article.distinct('tags');
    res.json({ tags: tags.filter(tag => tag && tag.trim()) });
  } catch (error) {
    logger.error('Error fetching tags:', error.message);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
};

