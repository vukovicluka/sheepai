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

  // Search articles
  searchArticles: async (query, params = {}) => {
    const response = await api.get('/api/articles/search', {
      params: { q: query, ...params },
    });
    return response.data;
  },

  // Get statistics
  getStats: async (params = {}) => {
    const response = await api.get('/api/articles/stats', { params });
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

export default api;

