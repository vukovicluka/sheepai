import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const articleService = {
  // Get all articles with optional filters
  getArticles: async (params = {}) => {
    const response = await api.get('/api/articles', { params });
    return response.data;
  },

  // Get article by ID
  getArticleById: async (id) => {
    const response = await api.get(`/api/articles/${id}`);
    return response.data;
  },

  // Get latest articles
  getLatestArticles: async (params = {}) => {
    const response = await api.get('/api/articles/latest', { params });
    return response.data;
  },

  // Search articles (keyword-based)
  searchArticles: async (query, params = {}) => {
    const response = await api.get('/api/articles/search', {
      params: { q: query, ...params },
    });
    return response.data;
  },

  // Semantic search articles (vector-based)
  semanticSearchArticles: async (query, params = {}) => {
    const response = await api.get('/api/articles/semantic-search', {
      params: { q: query, ...params },
    });
    return response.data;
  },

  // Get all tags
  getTags: async () => {
    const response = await api.get('/api/articles/tags');
    return response.data;
  },

  // Health check
  healthCheck: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

export const userService = {
  // Sign up a new user
  signup: async (userData) => {
    const response = await api.post('/api/users/signup', userData);
    return response.data;
  },
};

export default api;

