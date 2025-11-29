import mongoose from 'mongoose';

const articleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      index: true,
    },
    url: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    author: {
      type: String,
      default: '',
    },
    publishedDate: {
      type: Date,
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
    summary: {
      type: String,
      default: '',
    },
    keyPoints: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
      default: 'neutral',
    },
    scrapedAt: {
      type: Date,
      default: Date.now,
    },
    processedAt: {
      type: Date,
    },
    source: {
      type: String,
      default: 'thehackernews.com',
    },
    credibilityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
      index: true,
    },
    embedding: {
      type: [Number],
      default: null,
      select: false, // Don't include by default in queries (saves bandwidth)
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
articleSchema.index({ publishedDate: -1, createdAt: -1 });
articleSchema.index({ tags: 1, publishedDate: -1 });

const Article = mongoose.model('Article', articleSchema);

export default Article;

