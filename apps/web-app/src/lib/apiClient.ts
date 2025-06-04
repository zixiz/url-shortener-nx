import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const MANAGEMENT_SERVICE_BASE_URL = 
  process.env.NEXT_PUBLIC_MANAGEMENT_API_URL || 'http://localhost:3001/api';

const apiClient: AxiosInstance = axios.create({
  baseURL: MANAGEMENT_SERVICE_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT token to requests
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Only attempt to get token if running in the browser
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken'); // Key where token is stored
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized errors, e.g., redirect to login, clear token
      if (typeof window !== 'undefined') {
         localStorage.removeItem('authToken');
         localStorage.removeItem('authUser');
         // Potentially trigger a logout state in your AuthContext
         // window.location.href = '/login'; // Force redirect
      }
      console.error('API Client: Unauthorized request or token expired.', error.response);
    }
    return Promise.reject(error);
  }
);

export default apiClient;