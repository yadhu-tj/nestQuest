import api from './api';

export const propertyService = {
  getProperties: async () => {
    const response = await api.get('/properties');
    return response.data;
  },
  getProperty: async (id) => {
    const response = await api.get(`/properties/${id}`);
    return response.data;
  }
};
