import User from '../models/User.js';
import logger from '../utils/logger.js';

/**
 * Sign up a new user
 */
export const signup = async (req, res) => {
  try {
    const { email, category, semanticQuery } = req.body;

    // Validate that at least one of category or semanticQuery is provided
    if ((!category || !category.trim()) && (!semanticQuery || !semanticQuery.trim())) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Either category or semantic query must be provided',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'A user with this email is already registered',
      });
    }

    // Create new user
    const userData = {
      email: email.toLowerCase().trim(),
    };

    if (category && category.trim()) {
      userData.category = category.trim();
    }

    if (semanticQuery && semanticQuery.trim()) {
      userData.semanticQuery = semanticQuery.trim();
    }

    const user = new User(userData);
    await user.save();

    logger.info(`New user signed up: ${user.email} with category: ${user.category || 'N/A'}, semanticQuery: ${user.semanticQuery || 'N/A'}`);

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        email: user.email,
        category: user.category,
        semanticQuery: user.semanticQuery,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        error: 'Validation failed',
        details: errors,
      });
    }

    logger.error('Error creating user:', error.message);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

/**
 * Get all users
 */
export const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.category) {
      filter.category = { $regex: req.query.category.trim(), $options: 'i' };
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-__v')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Error fetching users:', error.message);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-__v');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    logger.error('Error fetching user:', error.message);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

/**
 * Get user by email
 */
export const getUserByEmail = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email.toLowerCase() }).select('-__v');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    logger.error('Error fetching user:', error.message);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

/**
 * Update user category
 */
export const updateUserCategory = async (req, res) => {
  try {
    const { category } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.category = category.trim();
    await user.save();

    logger.info(`User ${user.email} category updated to: ${user.category}`);

    res.json({
      message: 'User category updated successfully',
      user: {
        id: user._id,
        email: user.email,
        category: user.category,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    logger.error('Error updating user category:', error.message);
    res.status(500).json({ error: 'Failed to update user category' });
  }
};

/**
 * Delete user
 */
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    logger.info(`User deleted: ${user.email}`);

    res.json({
      message: 'User deleted successfully',
      user: {
        id: user._id,
        email: user.email,
      },
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    logger.error('Error deleting user:', error.message);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

/**
 * Get users by category
 */
export const getUsersByCategory = async (req, res) => {
  try {
    const category = req.params.category;
    const users = await User.find({ category: { $regex: category, $options: 'i' } })
      .select('-__v')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      category,
      users,
      count: users.length,
    });
  } catch (error) {
    logger.error('Error fetching users by category:', error.message);
    res.status(500).json({ error: 'Failed to fetch users by category' });
  }
};

