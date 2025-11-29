import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Please provide a valid email address',
      },
    },
    category: {
      type: String,
      required: function() {
        return !this.semanticQuery || !this.semanticQuery.trim();
      },
      trim: true,
      index: true,
    },
    semanticQuery: {
      type: String,
      required: function() {
        return !this.category || !this.category.trim();
      },
      trim: true,
    },
    minCredibility: {
      type: Number,
      min: 0,
      max: 100,
      default: null, // null means use system default
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);

export default User;

