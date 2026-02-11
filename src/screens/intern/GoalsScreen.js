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
import { goalService } from '../../services/goalService';
import Toast from 'react-native-toast-message';

export default function GoalsScreen() {
    const { theme } = useTheme();
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchGoals();
    }, []);

    const fetchGoals = async () => {
        try {
            const response = await goalService.getGoals();
            setGoals(response.data.goals || []); // ✅ Fixed for your API
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to load goals'
            });
            setGoals([]);
        } finally {
            setLoading(false);
        }
    };

    const updateGoalProgress = async (goalId, progress) => {
        try {
            await goalService.updateGoal(goalId, progress, progress === 100 ? 'completed' : 'inprogress');
            fetchGoals();
            Toast.show({
                type: 'success',
                text1: 'Success!',
                text2: 'Goal updated'
            });
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to update goal'
            });
        }
    };

    if (loading) {
        return (
            <View style={{
                flex: 1, justifyContent: 'center', alignItems: 'center',
                backgroundColor: theme.background
            }}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: theme.background }}
            contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
        >
            <Text style={{
                fontSize: 28, fontWeight: '800', marginBottom: 8, color: theme.text
            }}>
                My Goals
            </Text>
            <Text style={{
                fontSize: 16, color: theme.textSecondary, marginBottom: 32
            }}>
                Track your progress
            </Text>

            {goals.map((goal) => (
                <View
                    key={goal.id}
                    style={{
                        backgroundColor: theme.card,
                        borderRadius: 20,
                        padding: 24,
                        marginBottom: 20,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 6 },
                        shadowOpacity: 0.12,
                        shadowRadius: 16,
                        elevation: 6,
                        borderLeftWidth: 4,
                        borderLeftColor: goal.status === 'COMPLETED' ? '#10B981' : theme.primary
                    }}
                >
                    {/* Header */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <Text style={{ fontSize: 20, fontWeight: '800', color: theme.text }}>
                            {goal.title}
                        </Text>
                        <View style={{
                            backgroundColor: goal.status === 'COMPLETED' ? '#10B98115' : theme.primary + '15',
                            paddingHorizontal: 16,
                            paddingVertical: 8,
                            borderRadius: 20,
                            borderWidth: 1,
                            borderColor: goal.status === 'COMPLETED' ? '#10B98130' : theme.primary + '30'
                        }}>
                            <Text style={{
                                fontSize: 13, fontWeight: '700',
                                color: goal.status === 'COMPLETED' ? '#10B981' : theme.primary
                            }}>
                                {goal.status}
                            </Text>
                        </View>
                    </View>

                    {/* Description */}
                    <Text style={{
                        fontSize: 15, color: theme.textSecondary,
                        marginBottom: 20, lineHeight: 22
                    }}>
                        {goal.description}
                    </Text>

                    {/* Target Date */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
                        <Ionicons name="calendar-outline" size={20} color={theme.textSecondary} style={{ marginRight: 10 }} />
                        <Text style={{ fontSize: 15, color: theme.text, fontWeight: '600' }}>
                            {goal.target_date}
                        </Text>
                    </View>

                    {/* ✨ CUSTOM PROGRESS BAR */}
                    <View style={{ marginBottom: 24 }}>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text, marginBottom: 12 }}>
                            Progress
                        </Text>
                        <View style={{
                            backgroundColor: theme.surface,
                            borderRadius: 12,
                            height: 12,
                            overflow: 'hidden'
                        }}>
                            <View style={{
                                backgroundColor: goal.status === 'COMPLETED' ? '#10B981' : theme.primary,
                                height: '100%',
                                width: `${goal.progress}%`,
                                borderRadius: 12,
                                shadowColor: goal.status === 'COMPLETED' ? '#10B981' : theme.primary,
                                shadowOffset: { width: 0, height: 0 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                                elevation: 3
                            }} />
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.primary }}>
                                {goal.progress}%
                            </Text>
                            <TouchableOpacity
                                onPress={() => updateGoalProgress(goal.id, goal.status === 'COMPLETED' ? 0 : 100)}
                                style={{
                                    backgroundColor: goal.status === 'COMPLETED' ? '#10B981' : theme.primary,
                                    paddingHorizontal: 20,
                                    paddingVertical: 8,
                                    borderRadius: 20
                                }}
                            >
                                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>
                                    {goal.status === 'COMPLETED' ? 'Reset' : 'Complete'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            ))}

            {goals.length === 0 && (
                <View style={{ alignItems: 'center', paddingVertical: 80 }}>
                    <View style={{
                        width: 120, height: 120, borderRadius: 60,
                        backgroundColor: theme.primary + '10',
                        justifyContent: 'center', alignItems: 'center', marginBottom: 24
                    }}>
                        <Ionicons name="trophy-outline" size={48} color={theme.primary} />
                    </View>
                    <Text style={{
                        fontSize: 24, fontWeight: '800', marginBottom: 12,
                        color: theme.text, textAlign: 'center'
                    }}>
                        No goals yet
                    </Text>
                    <Text style={{
                        fontSize: 16, textAlign: 'center', color: theme.textSecondary,
                        lineHeight: 22, paddingHorizontal: 20
                    }}>
                        Set personal goals to track your progress and celebrate achievements
                    </Text>
                </View>
            )}
        </ScrollView>
    );
}
