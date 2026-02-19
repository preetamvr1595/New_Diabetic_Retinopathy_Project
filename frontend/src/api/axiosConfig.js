import axios from 'axios';

// Use empty string to leverage Vite's proxy configured in vite.config.js
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
    baseURL: API_BASE_URL,
});

export default api;
