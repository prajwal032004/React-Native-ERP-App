import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { taskService } from '../../services/taskService';
import Toast from 'react-native-toast-message';

export default function SubmissionsScreen() {
    const { theme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [submissions, setSubmissions] = useState([]);

    useEffect(() => {
        fetchSubmissions();
    }, []);

    const fetchSubmissions = async () => {
        try {
            const response = await taskService.getSubmissions();
            console.log('API Response:', response.data); // 🔍 DEBUG

            // ✅ BULLETPROOF ARRAY HANDLING
            if (Array.isArray(response.data)) {
                setSubmissions(response.data);
            } else if (response.data?.submissions && Array.isArray(response.data.submissions)) {
                setSubmissions(response.data.submissions);
            } else if (response.data?.data && Array.isArray(response.data.data)) {
                setSubmissions(response.data.data);
            } else {
                console.warn('No submissions array found:', response.data);
                setSubmissions([]); // Always array!
            }
        } catch (error) {
            console.error('Fetch error:', error);
            setSubmissions([]);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to load submissions'
            });
        } finally {
            setLoading(false);
        }
    };


    if (loading) {
        return (
            <View style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: theme.background
            }}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <ScrollView style={{ flex: 1, backgroundColor: theme.background }}>
            <View style={{ padding: 16 }}>
                <Text style={{
                    fontSize: 24,
                    fontWeight: 'bold',
                    marginBottom: 16,
                    color: theme.text
                }}>
                    My Submissions
                </Text>

                {submissions.map((submission) => (
                    <View
                        key={submission.id}
                        style={{
                            backgroundColor: theme.card,
                            borderRadius: 12,
                            padding: 16,
                            marginBottom: 12,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 4,
                            elevation: 2,
                            borderLeftWidth: 4,
                            borderLeftColor: submission.status === 'approved' ? theme.success :
                                submission.status === 'rejected' ? theme.danger : theme.warning
                        }}
                    >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{
                                fontSize: 16,
                                fontWeight: '600',
                                color: theme.text
                            }}>
                                {submission.task_title || 'Task Submission'}
                            </Text>
                            <View style={{
                                backgroundColor: submission.status === 'approved' ? theme.success + '20' :
                                    submission.status === 'rejected' ? theme.danger + '20' :
                                        theme.warning + '20',
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                borderRadius: 20
                            }}>
                                <Text style={{
                                    fontSize: 12,
                                    fontWeight: '600',
                                    color: submission.status === 'approved' ? theme.success :
                                        submission.status === 'rejected' ? theme.danger : theme.warning
                                }}>
                                    {submission.status.toUpperCase()}
                                </Text>
                            </View>
                        </View>

                        {submission.feedback && (
                            <Text style={{
                                fontSize: 14,
                                marginTop: 8,
                                color: theme.textSecondary,
                                lineHeight: 20
                            }}>
                                💡 {submission.feedback}
                            </Text>
                        )}

                        {submission.grade && (
                            <View style={{
                                marginTop: 12,
                                padding: 12,
                                backgroundColor: theme.primary + '20',
                                borderRadius: 8
                            }}>
                                <Text style={{
                                    fontSize: 16,
                                    fontWeight: '600',
                                    color: theme.primary,
                                    textAlign: 'center'
                                }}>
                                    Grade: {submission.grade}
                                </Text>
                            </View>
                        )}

                        <Text style={{
                            fontSize: 12,
                            color: theme.textSecondary,
                            marginTop: 12
                        }}>
                            Submitted: {new Date(submission.submitted_at).toLocaleDateString()}
                        </Text>
                    </View>
                ))}

                {submissions.length === 0 && (
                    <View style={{
                        alignItems: 'center',
                        paddingVertical: 80
                    }}>
                        <Ionicons name="document-outline" size={64} color={theme.textSecondary} />
                        <Text style={{
                            fontSize: 18,
                            fontWeight: '600',
                            marginTop: 16,
                            color: theme.text
                        }}>
                            No submissions yet
                        </Text>
                        <Text style={{
                            fontSize: 14,
                            textAlign: 'center',
                            color: theme.textSecondary,
                            marginTop: 8
                        }}>
                            Complete your tasks and submit your work to see it here
                        </Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}
