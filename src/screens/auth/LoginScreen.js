import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Switch,
    Image,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import Toast from 'react-native-toast-message';

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const { login } = useAuth();
    const { theme } = useTheme();

    const validateForm = () => {
        const newErrors = {};

        if (!email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'Invalid email format';
        }

        if (!password.trim()) {
            newErrors.password = 'Password is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async () => {
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        const result = await login(email.toLowerCase().trim(), password, remember);
        setLoading(false);

        if (result.success) {
            Toast.show({
                type: 'success',
                text1: 'Welcome!',
                text2: `Logged in as ${result.user.full_name}`,
            });
        } else {
            if (result.status === 'PENDING') {
                Toast.show({
                    type: 'info',
                    text1: 'Pending Approval',
                    text2: 'Your account is awaiting admin approval',
                });
                navigation.navigate('PendingApproval', { email });
            } else if (result.status === 'REJECTED') {
                Toast.show({
                    type: 'error',
                    text1: 'Account Rejected',
                    text2: result.error,
                });
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Login Failed',
                    text2: result.error || 'Invalid email or password',
                });
            }
        }
    };

    const clearError = (field) => {
        if (errors[field]) {
            setErrors({ ...errors, [field]: '' });
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{
                flex: 1,
                backgroundColor: theme.background
            }}
        >
            <View style={{
                flex: 1,
                justifyContent: 'center',
                padding: 24,
            }}>
                {/* Logo */}
                <View style={{
                    alignItems: 'center',
                    marginBottom: 24,
                }}>
                    <Image
                        source={require('../../assets/favicon.png')}
                        style={{
                            width: 100,
                            height: 100,
                            marginBottom: 16,
                        }}
                        resizeMode="contain"
                    />
                </View>

                <Text style={{
                    fontSize: 32,
                    fontWeight: 'bold',
                    textAlign: 'center',
                    marginBottom: 8,
                    color: theme.text
                }}>Shramic ERP</Text>
                <Text style={{
                    fontSize: 16,
                    textAlign: 'center',
                    marginBottom: 48,
                    color: theme.textSecondary
                }}>
                    Intern Management System
                </Text>

                <View style={{ gap: 16 }}>
                    {/* Email Input */}
                    <View style={{ marginBottom: 8 }}>
                        <TextInput
                            style={{
                                height: 56,
                                borderWidth: 1,
                                borderRadius: 12,
                                paddingHorizontal: 16,
                                fontSize: 16,
                                backgroundColor: theme.surface,
                                color: theme.text,
                                borderColor: errors.email ? '#EF4444' : theme.border,
                            }}
                            placeholder="Email"
                            placeholderTextColor={theme.textSecondary}
                            value={email}
                            onChangeText={(text) => {
                                setEmail(text);
                                clearError('email');
                            }}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!loading}
                        />
                        {errors.email && (
                            <Text style={{
                                fontSize: 12,
                                color: '#EF4444',
                                marginTop: 6,
                                marginLeft: 8,
                                fontWeight: '500',
                            }}>{errors.email}</Text>
                        )}
                    </View>

                    {/* Password Input */}
                    <View style={{ marginBottom: 8 }}>
                        <TextInput
                            style={{
                                height: 56,
                                borderWidth: 1,
                                borderRadius: 12,
                                paddingHorizontal: 16,
                                fontSize: 16,
                                backgroundColor: theme.surface,
                                color: theme.text,
                                borderColor: errors.password ? '#EF4444' : theme.border,
                            }}
                            placeholder="Password"
                            placeholderTextColor={theme.textSecondary}
                            value={password}
                            onChangeText={(text) => {
                                setPassword(text);
                                clearError('password');
                            }}
                            secureTextEntry
                            editable={!loading}
                        />
                        {errors.password && (
                            <Text style={{
                                fontSize: 12,
                                color: '#EF4444',
                                marginTop: 6,
                                marginLeft: 8,
                                fontWeight: '500',
                            }}>{errors.password}</Text>
                        )}
                    </View>

                    {/* Remember Me */}
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginVertical: 8,
                    }}>
                        <Text style={{
                            fontSize: 16,
                            fontWeight: '500',
                            color: theme.text
                        }}>
                            Remember me
                        </Text>
                        <Switch
                            value={remember}
                            onValueChange={setRemember}
                            trackColor={{ false: theme.border, true: theme.primary }}
                            thumbColor={remember ? theme.primary : theme.disabled}
                            disabled={loading}
                        />
                    </View>

                    {/* Login Button */}
                    <TouchableOpacity
                        style={{
                            height: 56,
                            borderRadius: 12,
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginTop: 8,
                            backgroundColor: theme.primary
                        }}
                        onPress={handleLogin}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={{
                                color: '#FFFFFF',
                                fontSize: 18,
                                fontWeight: '600',
                            }}>Login</Text>
                        )}
                    </TouchableOpacity>

                    {/* Register Link */}
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginTop: 16,
                    }}>
                        <Text style={{
                            fontSize: 14,
                            fontWeight: '500',
                            color: theme.textSecondary
                        }}>
                            Don't have an account?{' '}
                        </Text>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Register')}
                            disabled={loading}
                        >
                            <Text style={{
                                fontSize: 14,
                                fontWeight: '700',
                                color: theme.primary
                            }}>
                                Register here
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}