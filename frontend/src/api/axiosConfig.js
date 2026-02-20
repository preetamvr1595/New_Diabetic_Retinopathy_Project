import axios from 'axios';

// Use empty string to leverage the proxy configured in vercel.json/vite.config.js
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
    baseURL: 'https://newdiabeticretinopathyproject-production.up.railway.app',
    timeout: 90000, // 90 seconds for heavy model loading
});

export default api;
