import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import articleRoutes from './routes/articles.js';
import userRoutes from './routes/users.js';
import scheduler from './services/scheduler.js';
import logger from './utils/logger.js';
import User from './models/User.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/articles', articleRoutes);
app.use('/api/users', userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  if (err.errors) {
    // Validation errors from express-validator
    return res.status(400).json({
      error: 'Validation failed',
      details: err.errors.map(e => e.msg),
    });
  }

  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

/**
 * Creates default user on server start if it doesn't exist
 */
const createDefaultUser = async () => {
  try {
    const defaultEmail = 'luka.vukovic@mithril.eu';
    const defaultCategory = 'malware';

    const existingUser = await User.findOne({ email: defaultEmail });

    if (existingUser) {
      logger.info(`Default user already exists: ${defaultEmail}`);
      return;
    }

    const user = new User({
      email: defaultEmail,
      category: defaultCategory,
    });

    await user.save();
    logger.info(`Default user created: ${defaultEmail} with category: ${defaultCategory}`);
  } catch (error) {
    logger.error('Error creating default user:', error.message);
    // Don't fail server startup if user creation fails
  }
};

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Create default user
    await createDefaultUser();

    // Initialize scheduler
    scheduler.initializeScheduler();

    // Start Express server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();

