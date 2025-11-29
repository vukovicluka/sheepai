import express from 'express';
import { query, param, validationResult } from 'express-validator';
import {
  getArticles,
  getArticleById,
  getLatestArticles,
  searchArticles,
  getStats,
  getTags,
} from '../controllers/articleController.js';

const router = express.Router();

// Validation result handler middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(e => ({ field: e.path || e.param, message: e.msg })),
    });
  }
  next();
};

// Validation middleware
const validateId = [
  param('id').isMongoId().withMessage('Invalid article ID'),
  handleValidationErrors,
];

const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().trim().notEmpty().withMessage('Category must not be empty if provided'),
  handleValidationErrors,
];

const validateSearch = [
  query('q').notEmpty().withMessage('Search query is required'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().trim().notEmpty().withMessage('Category must not be empty if provided'),
  handleValidationErrors,
];

const validateStats = [
  query('category').optional().trim().notEmpty().withMessage('Category must not be empty if provided'),
  handleValidationErrors,
];

// Routes
router.get('/', validatePagination, getArticles);
router.get('/latest', validatePagination, getLatestArticles);
router.get('/search', validateSearch, searchArticles);
router.get('/stats', validateStats, getStats);
router.get('/tags', getTags);
router.get('/:id', validateId, getArticleById);

export default router;

