import axios from 'axios';

const apiClient = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/',
    timeout: 120000,
    headers: {
        'Content-Type': 'application/json',
        // Add other default headers here if needed
    },
});

export default apiClient;