import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://shramicerp.pythonanywhere.com';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// ============================================
// Request Interceptor
// ============================================

api.interceptors.request.use(
    async (config) => {
        try {
            // Add auth token if available
            const token = await AsyncStorage.getItem('auth_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }

            // Log request
            const method = config.method?.toUpperCase() || 'UNKNOWN';
            const url = config.url;
            const data = config.data ? `\n   Data: ${JSON.stringify(config.data)}` : '';

            console.log(`\n📤 ${method} ${url}${data}`);

            return config;
        } catch (error) {
            console.error('❌ Request interceptor error:', error);
            return Promise.reject(error);
        }
    },
    (error) => {
        console.error('❌ Request setup error:', error.message);
        return Promise.reject(error);
    }
);

// ============================================
// Response Interceptor
// ============================================

api.interceptors.response.use(
    (response) => {
        // Log successful response
        const method = response.config.method?.toUpperCase() || 'UNKNOWN';
        const url = response.config.url;
        const status = response.status;
        const dataSize = JSON.stringify(response.data).length;

        console.log(`✅ ${method} ${url} - ${status} (${dataSize} bytes)`);

        return response;
    },
    async (error) => {
        const status = error.response?.status;
        const message = error.response?.data?.error || error.message || 'Unknown error';
        const url = error.config?.url;
        const method = error.config?.method?.toUpperCase() || 'UNKNOWN';

        // Log error
        console.error(`\n❌ ${method} ${url}`);
        console.error(`   Status: ${status}`);
        console.error(`   Error: ${message}\n`);

        // Handle specific status codes
        if (status === 401) {
            // Unauthorized - token expired or invalid
            console.log('🔒 Unauthorized (401) - Session expired or invalid token');
            await AsyncStorage.multiRemove(['user', 'auth_token', 'isAuthenticated']);

            // You can dispatch a logout action here if using Redux/Context
            // window.location.href = '/login'; // or navigation.navigate('Login')
        } else if (status === 403) {
            // Forbidden - insufficient permissions
            console.log('🚫 Forbidden (403) - Insufficient permissions');
        } else if (status === 404) {
            // Not found
            console.log('🔍 Not Found (404) - Resource does not exist');
        } else if (status === 429) {
            // Too many requests
            console.log('⏱️  Too Many Requests (429) - Rate limited');
        } else if (status === 500) {
            // Server error
            console.log('🔥 Server Error (500) - Internal server error');
        } else if (status === 0 || !status) {
            // Network error
            console.log('🌐 Network Error - Check your internet connection');
        }

        return Promise.reject(error);
    }
);

// ============================================
// Export utilities
// ============================================

/**
 * Set auth token
 * @param {string} token - Auth token
 */
export const setAuthToken = async (token) => {
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        await AsyncStorage.setItem('auth_token', token);
    }
};

/**
 * Clear auth token
 */
export const clearAuthToken = async () => {
    delete api.defaults.headers.common['Authorization'];
    await AsyncStorage.removeItem('auth_token');
};

/**
 * Get API base URL
 */
export const getAPIBaseURL = () => API_BASE_URL;

/**
 * Check if API is reachable
 */
export const checkAPIHealth = async () => {
    try {
        const response = await api.get('/api/health', { timeout: 5000 });
        return { healthy: true, status: response.status };
    } catch (error) {
        return {
            healthy: false,
            error: error.message,
            status: error.response?.status
        };
    }
};

export default api;