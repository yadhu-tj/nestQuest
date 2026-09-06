import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5000/api/v1';
const BACKEND_BASE_URL = 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRedirecting = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response: errResponse } = error;

    if (errResponse) {
      if (errResponse.status === 401) {
        if (!isRedirecting) {
          isRedirecting = true;
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      } else if (errResponse.status === 403) {
        console.error('Access denied: insufficient permissions');
      }
    }

    return Promise.reject(error);
  }
);

// Convert relative image paths from backend to absolute URLs
// Backend returns paths like '/static/uploads/...' or 'uploads/properties/...'
export const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  // Already absolute URL
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  // Paths starting with /static/ are served directly at backend root
  if (imagePath.startsWith('/static/')) {
    return `${BACKEND_BASE_URL}${imagePath}`;
  }
  // Other relative paths are under /static/
  return `${BACKEND_BASE_URL}/static/${imagePath.replace(/^\//, '')}`;
};

// Saved Properties API
export const savedPropertiesApi = {
  // Save a property
  save: (propertyId) => api.post('/saved-properties/', { property_id: propertyId }),
  
  // Remove saved property
  unsave: (propertyId) => api.delete(`/saved-properties/${propertyId}`),
  
  // Get all saved properties
  getAll: () => api.get('/saved-properties/'),
  
  // Check if property is saved
  checkStatus: (propertyId) => api.get(`/saved-properties/check/${propertyId}`),
};

export default api;