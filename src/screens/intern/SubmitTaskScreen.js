import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { taskService } from '../../services/taskService';
import Toast from 'react-native-toast-message';

export default function SubmitTaskScreen({ route, navigation }) {
    const { task } = route.params || {};
    const { theme } = useTheme();
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!content.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Please enter submission content',
            });
            return;
        }

        setLoading(true);
        try {
            await taskService.submitTask(task?.id, content);
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Task submitted successfully',
            });
            navigation.goBack();
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.response?.data?.error || 'Failed to submit task',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Submit Task</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content}>
                {/* Task Info */}
                {task && (
                    <View style={[styles.taskCard, { backgroundColor: theme.surface }]}>
                        <Text style={[styles.taskTitle, { color: theme.text }]}>{task.title}</Text>
                        {task.description && (
                            <Text style={[styles.taskDescription, { color: theme.textSecondary }]}>
                                {task.description}
                            </Text>
                        )}
                        <View style={styles.taskMeta}>
                            <View style={styles.metaItem}>
                                <MaterialIcons name="schedule" size={16} color={theme.textSecondary} />
                                <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                                    Due: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'N/A'}
                                </Text>
                            </View>
                            {task.priority && (
                                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) + '20' }]}>
                                    <Text style={[styles.priorityText, { color: getPriorityColor(task.priority) }]}>
                                        {task.priority}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* Submission Form */}
                <View style={[styles.formCard, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.label, { color: theme.text }]}>Your Submission</Text>
                    <TextInput
                        style={[
                            styles.textArea,
                            {
                                backgroundColor: theme.background,
                                color: theme.text,
                                borderColor: theme.border,
                            },
                        ]}
                        placeholder="Describe your work, provide links, or paste your solution here..."
                        placeholderTextColor={theme.textSecondary}
                        multiline
                        numberOfLines={10}
                        value={content}
                        onChangeText={setContent}
                        textAlignVertical="top"
                    />
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        { backgroundColor: theme.primary },
                        loading && styles.submitButtonDisabled,
                    ]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <>
                            <MaterialIcons name="send" size={20} color="#FFFFFF" />
                            <Text style={styles.submitButtonText}>Submit Task</Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const getPriorityColor = (priority) => {
    switch (priority) {
        case 'HIGH':
            return '#EF4444';
        case 'MEDIUM':
            return '#F59E0B';
        case 'LOW':
            return '#10B981';
        default:
            return '#3B82F6';
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        paddingTop: Platform.OS === 'ios' ? 50 : 14,
        borderBottomWidth: 1,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    taskCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    taskTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
    },
    taskDescription: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 12,
    },
    taskMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        fontSize: 13,
        fontWeight: '500',
    },
    priorityBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
    },
    priorityText: {
        fontSize: 12,
        fontWeight: '700',
    },
    formCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    label: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 10,
    },
    textArea: {
        borderWidth: 1,
        borderRadius: 10,
        padding: 14,
        fontSize: 14,
        minHeight: 200,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
        borderRadius: 12,
        marginBottom: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});