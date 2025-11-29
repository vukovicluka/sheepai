import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import {
  signup,
  getUsers,
  getUserById,
  getUserByEmail,
  updateUserCategory,
  deleteUser,
  getUsersByCategory,
} from '../controllers/userController.js';

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
const validateSignup = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('category')
    .optional({ checkFalsy: true })
    .trim()
    .notEmpty()
    .withMessage('Category must not be empty if provided')
    .isLength({ min: 1, max: 100 })
    .withMessage('Category must be between 1 and 100 characters'),
  body('semanticQuery')
    .optional({ checkFalsy: true })
    .trim()
    .notEmpty()
    .withMessage('Semantic query must not be empty if provided')
    .isLength({ min: 3, max: 200 })
    .withMessage('Semantic query must be between 3 and 200 characters'),
  body().custom((value) => {
    // At least one of category or semanticQuery must be provided
    if ((!value.category || !value.category.trim()) && (!value.semanticQuery || !value.semanticQuery.trim())) {
      throw new Error('Either category or semantic query must be provided');
    }
    return true;
  }),
  handleValidationErrors,
];

const validateId = [
  param('id').isMongoId().withMessage('Invalid user ID'),
  handleValidationErrors,
];

const validateEmail = [
  param('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  handleValidationErrors,
];

const validateCategory = [
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Category must be between 1 and 100 characters'),
  handleValidationErrors,
];

const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().trim().notEmpty().withMessage('Category must not be empty if provided'),
  handleValidationErrors,
];

// Routes
router.post('/signup', validateSignup, signup);
router.get('/', validatePagination, getUsers);
router.get('/category/:category', getUsersByCategory);
router.get('/email/:email', validateEmail, getUserByEmail);
router.get('/:id', validateId, getUserById);
router.patch('/:id/category', validateId, validateCategory, updateUserCategory);
router.delete('/:id', validateId, deleteUser);

export default router;

