import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const MANAGEMENT_SERVICE_BASE_URL = 
  process.env.NEXT_PUBLIC_MANAGEMENT_API_URL || 'http://localhost:3001/api';

const apiClient: AxiosInstance = axios.create({
  baseURL: MANAGEMENT_SERVICE_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
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
      if (typeof window !== 'undefined') {
         localStorage.removeItem('authToken');
         localStorage.removeItem('authUser');
      }
      console.error('API Client: Unauthorized request or token expired.', error.response);
    }
    return Promise.reject(error);
  }
);

export default apiClient;