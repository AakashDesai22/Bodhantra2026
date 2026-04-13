import axios from 'axios';

// Centralized API base URL — Environment dynamic loader
export const API_URL = import.meta.env.VITE_API_URL || 'https://bodhantra2026-y4yj.onrender.com';
const api = axios.create({
    baseURL: API_URL,
});

// Automatically include the Authorization header if a token exists
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;
