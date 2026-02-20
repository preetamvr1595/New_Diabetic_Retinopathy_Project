import axios from 'axios';

// Use empty string to leverage the proxy configured in vercel.json/vite.config.js
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 60000, // 60 seconds for slow model loading
});

export default api;
