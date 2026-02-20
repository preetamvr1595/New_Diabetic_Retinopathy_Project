import axios from 'axios';

// Fallback to Railway production URL if VITE_API_URL is not set
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://newdiabeticretinopathyproject-production.up.railway.app';

const api = axios.create({
    baseURL: API_BASE_URL,
});

export default api;
