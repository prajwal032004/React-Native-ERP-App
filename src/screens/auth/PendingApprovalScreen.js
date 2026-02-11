import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ActivityIndicator,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { authService } from '../../services/authService';
import Toast from 'react-native-toast-message';

export default function PendingApprovalScreen({ route, navigation }) {
    const { email } = route.params;
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(null);
    const { theme } = useTheme();

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        try {
            const response = await authService.checkPendingStatus(email);
            setStatus(response.data);
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to check status',
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={{
                flex: 1,
                backgroundColor: theme.background
            }}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <View style={{
            flex: 1,
            backgroundColor: theme.background
        }}>
            <View style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                padding: 24,
            }}>
                <View style={{
                    width: 120,
                    height: 120,
                    borderRadius: 60,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 24,
                    backgroundColor: theme.warning + '20'
                }}>
                    <Ionicons name="time-outline" size={64} color={theme.warning} />
                </View>

                <Text style={{
                    fontSize: 24,
                    fontWeight: 'bold',
                    marginBottom: 12,
                    textAlign: 'center',
                    color: theme.text
                }}>
                    Pending Approval
                </Text>

                <Text style={{
                    fontSize: 16,
                    textAlign: 'center',
                    marginBottom: 32,
                    lineHeight: 24,
                    color: theme.textSecondary
                }}>
                    {status?.message || 'Your account is awaiting admin approval'}
                </Text>

                {status?.user && (
                    <View style={{
                        width: '100%',
                        padding: 20,
                        borderRadius: 12,
                        marginBottom: 24,
                        backgroundColor: theme.card
                    }}>
                        <Text style={{
                            fontSize: 14,
                            marginTop: 12,
                            color: theme.textSecondary
                        }}>
                            Intern ID
                        </Text>
                        <Text style={{
                            fontSize: 18,
                            fontWeight: '600',
                            marginTop: 4,
                            color: theme.text
                        }}>
                            {status.user.intern_id}
                        </Text>

                        <Text style={{
                            fontSize: 14,
                            marginTop: 12,
                            color: theme.textSecondary
                        }}>
                            Role
                        </Text>
                        <Text style={{
                            fontSize: 18,
                            fontWeight: '600',
                            marginTop: 4,
                            color: theme.text
                        }}>
                            {status.user.role}
                        </Text>
                    </View>
                )}

                <TouchableOpacity
                    style={{
                        width: '100%',
                        height: 56,
                        borderRadius: 12,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 16,
                        backgroundColor: theme.primary
                    }}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={{
                        color: '#FFFFFF',
                        fontSize: 18,
                        fontWeight: '600'
                    }}>
                        Back to Login
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 24,
                        paddingVertical: 12,
                        borderWidth: 2,
                        borderRadius: 12,
                        borderColor: theme.primary
                    }}
                    onPress={checkStatus}
                >
                    <Ionicons name="refresh" size={20} color={theme.primary} />
                    <Text style={{
                        fontSize: 16,
                        fontWeight: '600',
                        marginLeft: 8,
                        color: theme.primary
                    }}>
                        Refresh Status
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
