import axios from 'axios';

const apiClient = axios.create({
    baseURL: process.env.API_BASE_URL || 'http://localhost:3000/',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        // Add other default headers here if needed
    },
});

export default apiClient;