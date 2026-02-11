import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { taskService } from '../../services/taskService';
import Toast from 'react-native-toast-message';

export default function TasksScreen() {
    const { theme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('all');
    const [tasks, setTasks] = useState([]);

    useEffect(() => {
        fetchTasks(activeTab);
    }, [activeTab]);

    const fetchTasks = async (status) => {
        try {
            setLoading(true);
            const response = await taskService.getTasks(status);
            setTasks(response.data.tasks || []);
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to load tasks'
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchTasks(activeTab);
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
        <ScrollView
            style={{ flex: 1, backgroundColor: theme.background }}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            <View style={{ padding: 16 }}>
                {/* Tab Header */}
                <View style={{
                    flexDirection: 'row',
                    backgroundColor: theme.card,
                    borderRadius: 12,
                    padding: 4,
                    marginBottom: 16
                }}>
                    {['all', 'active', 'completed'].map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            style={{
                                flex: 1,
                                paddingVertical: 12,
                                paddingHorizontal: 16,
                                borderRadius: 8,
                                backgroundColor: activeTab === tab ? theme.primary : 'transparent',
                                marginHorizontal: 2
                            }}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Text style={{
                                textAlign: 'center',
                                fontWeight: '600',
                                color: activeTab === tab ? '#fff' : theme.text,
                                fontSize: 14
                            }}>
                                {tab.toUpperCase()}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Tasks List */}
                {tasks.map((task) => (
                    <TouchableOpacity
                        key={task.id}
                        style={{
                            backgroundColor: theme.card,
                            borderRadius: 12,
                            padding: 16,
                            marginBottom: 12,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 4,
                            elevation: 2
                        }}
                    >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <View style={{ flex: 1 }}>
                                <Text style={{
                                    fontSize: 16,
                                    fontWeight: '600',
                                    marginBottom: 6,
                                    color: theme.text
                                }}>
                                    {task.title}
                                </Text>
                                <Text style={{
                                    fontSize: 14,
                                    lineHeight: 20,
                                    marginBottom: 12,
                                    color: theme.textSecondary
                                }}>
                                    {task.description}
                                </Text>
                            </View>
                            <View style={{
                                width: 8,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: task.status === 'completed' ? theme.success :
                                    task.priority === 'HIGH' ? theme.danger :
                                        task.priority === 'MEDIUM' ? theme.warning : theme.primary,
                                marginLeft: 12
                            }} />
                        </View>

                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <Text style={{
                                fontSize: 12,
                                color: theme.textSecondary
                            }}>
                                Due: {task.deadline}
                            </Text>
                            <View style={{
                                backgroundColor: task.status === 'completed' ? theme.success + '20' :
                                    theme.primary + '20',
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                borderRadius: 20
                            }}>
                                <Text style={{
                                    fontSize: 12,
                                    fontWeight: '600',
                                    color: task.status === 'completed' ? theme.success : theme.primary
                                }}>
                                    {task.status}
                                </Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}

                {tasks.length === 0 && (
                    <View style={{
                        alignItems: 'center',
                        paddingVertical: 60
                    }}>
                        <Ionicons name="clipboard-outline" size={64} color={theme.textSecondary} />
                        <Text style={{
                            fontSize: 18,
                            fontWeight: '600',
                            marginTop: 16,
                            color: theme.text
                        }}>
                            No tasks found
                        </Text>
                        <Text style={{
                            fontSize: 14,
                            textAlign: 'center',
                            color: theme.textSecondary,
                            marginTop: 8
                        }}>
                            {activeTab === 'all' ? 'Check back later for new assignments' :
                                activeTab === 'active' ? 'All tasks completed!' : 'No completed tasks yet'}
                        </Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}
