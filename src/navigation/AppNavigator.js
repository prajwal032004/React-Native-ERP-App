import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

// Auth screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';  // ✨ NEW
import PendingApprovalScreen from '../screens/auth/PendingApprovalScreen';

// Intern screens
import InternTabNavigator from './InternTabNavigator';
import LoadingScreen from '../components/common/LoadingScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
    const { isAuthenticated, loading, user } = useAuth();
    const { theme } = useTheme();

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: {
                    backgroundColor: theme.surface,
                },
                headerTintColor: theme.text,
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
            }}
        >
            {!isAuthenticated ? (
                <>
                    <Stack.Screen
                        name="Login"
                        component={LoginScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="Register"
                        component={RegisterScreen}
                        options={{
                            title: 'Create Account',
                            headerBackTitle: 'Back',
                        }}
                    />
                    <Stack.Screen
                        name="PendingApproval"
                        component={PendingApprovalScreen}
                        options={{
                            title: 'Pending Approval',
                            headerLeft: null, // Prevent going back
                        }}
                    />
                </>
            ) : (
                <Stack.Screen
                    name="Main"
                    component={InternTabNavigator}
                    options={{ headerShown: false }}
                />
            )}
        </Stack.Navigator>
    );
}