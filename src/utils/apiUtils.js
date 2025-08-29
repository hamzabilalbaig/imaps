import apiClient from '../api/config';

/**
 * Generic API call function
 * @param {string} endpoint - API endpoint (e.g., '/users', '/categories')
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @param {Object} data - Request body data (for POST, PUT requests)
 * @param {Object} params - Query parameters
 * @returns {Promise} - API response data
 */
export const apiCall = async (endpoint, method = 'GET', data = null, params = null) => {
  try {
    const config = {
      method: method.toLowerCase(),
      url: endpoint,
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.data = data;
    }

    if (params) {
      config.params = params;
    }

    const response = await apiClient(config);
    return response.data;
  } catch (error) {
    console.error(`API call failed [${method} ${endpoint}]:`, error);
    
    // Extract meaningful error message
    const errorMessage = error.response?.data?.error || 
                        error.response?.data?.message || 
                        error.message || 
                        'An unexpected error occurred';
    
    throw new Error(errorMessage);
  }
};

export default apiCall;