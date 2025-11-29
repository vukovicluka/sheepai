import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      logger.error('MONGODB_URI is not defined in environment variables.');
      logger.error('Please create a .env file in the backend directory with MONGODB_URI=mongodb://localhost:27017/hacker-news-scraper');
      process.exit(1);
    }

    const conn = await mongoose.connect(mongoUri);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

export default connectDB;

