import api from './api';

export const searchService = {
  searchProperties: async (query) => {
    const response = await api.post('/search/', { query });
    return response.data;
  }
};
