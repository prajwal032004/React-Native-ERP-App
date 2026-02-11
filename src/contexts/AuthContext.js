import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            const storedUser = await AsyncStorage.getItem('user');
            if (storedUser) {
                const userData = JSON.parse(storedUser);

                // Verify session is still valid
                try {
                    const response = await authService.getCurrentUser();
                    setUser(response.data);
                    setIsAuthenticated(true);
                } catch (error) {
                    // Session expired
                    console.log('Session expired, clearing local data');
                    await AsyncStorage.removeItem('user');
                    setUser(null);
                    setIsAuthenticated(false);
                }
            }
        } catch (error) {
            console.error('Auth check error:', error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password, remember) => {
        try {
            console.log('🔐 AuthContext: Starting login...');
            const response = await authService.login(email, password, remember);

            console.log('🔐 AuthContext: Response received:', response);

            // ✨ FIXED: Handle both response formats
            // Backend returns: { message, user, success? }
            // Axios wraps it as: { data: { message, user, success? }, status, ... }

            const data = response.data || response;
            console.log('🔐 AuthContext: Extracted data:', data);

            // Check if user exists in response (this is the actual indicator of success)
            const hasUser = data && data.user;
            console.log('🔐 AuthContext: Has user?', hasUser);

            if (hasUser) {
                const userData = data.user;
                console.log('🔐 AuthContext: Login successful, user:', userData);

                setUser(userData);
                setIsAuthenticated(true);
                await AsyncStorage.setItem('user', JSON.stringify(userData));

                return {
                    success: true,
                    user: userData,
                };
            } else {
                // Handle error response
                console.log('🔐 AuthContext: Login failed - no user in response');
                console.log('   - status:', data.status);
                console.log('   - error:', data.error);

                return {
                    success: false,
                    error: data.error || 'Login failed',
                    status: data.status,
                };
            }
        } catch (error) {
            console.error('🔐 AuthContext: Login error:', error);

            // Extract error info
            const errorData = error.response?.data || {};
            const errorMessage = errorData.error || error.message || 'Login failed. Please try again.';
            const errorStatus = errorData.status;

            console.log('   - error:', errorMessage);
            console.log('   - status:', errorStatus);

            return {
                success: false,
                error: errorMessage,
                status: errorStatus,
            };
        }
    };

    const register = async (userData) => {
        try {
            const response = await authService.register(userData);

            return {
                success: true,
                message: response.data.message,
                intern_id: response.data.intern_id,
            };
        } catch (error) {
            console.error('Registration error:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Registration failed. Please try again.';

            return {
                success: false,
                error: errorMessage,
            };
        }
    };

    const logout = async () => {
        try {
            await authService.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setUser(null);
            setIsAuthenticated(false);
            await AsyncStorage.removeItem('user');
        }
    };

    const updateUser = async (userData) => {
        setUser(userData);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                isAuthenticated,
                login,
                register,
                logout,
                updateUser,
                refreshUser: checkAuthStatus,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};