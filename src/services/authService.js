import api from '../config/api';

export const authService = {
    // Login
    login: (email, password, remember = false) => {
        return api.post('/api/auth/login', { email, password, remember });
    },

    // Register - ✨ NEW
    register: (userData) => {
        return api.post('/api/auth/register', userData);
    },

    // Logout
    logout: () => {
        return api.post('/api/auth/logout');
    },

    // Get current authenticated user
    getCurrentUser: () => {
        return api.get('/api/auth/me');
    },

    // Check pending approval status
    checkPendingStatus: (email) => {
        return api.post('/api/auth/pending-status', { email });
    },
};