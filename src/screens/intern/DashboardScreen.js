import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    RefreshControl,
    TouchableOpacity,
    Image,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/common/Card';
import api from '../../config/api';
import Toast from 'react-native-toast-message';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function DashboardScreen({ navigation }) {
    const { theme } = useTheme();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        tasks: [],
        submissions: [],
        attendance_count: 0,
        marked_today: false,
        announcements: [],
        pending_tasks: 0,
        unread_notifications: 0,
        goals: [],
    });

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/intern/dashboard');
            setData(response.data || {});
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to load dashboard',
            });
        } finally {
            setLoading(false);
        }
    }, []);

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme?.background || '#f8f9fa' }]}
            refreshControl={
                <RefreshControl
                    refreshing={loading}
                    onRefresh={fetchDashboard}
                    tintColor={theme?.primary || '#10B981'}
                    colors={[theme?.primary || '#10B981']}
                />
            }
            showsVerticalScrollIndicator={false}
        >
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme?.primary || '#10B981' }]}>
                <View style={styles.headerContent}>
                    <Text style={styles.greeting}>Welcome back,</Text>
                    <Text style={styles.userName}>{user?.full_name || 'Intern'}</Text>
                    <Text style={styles.userId}>ID: {user?.intern_id || 'N/A'}</Text>
                </View>
                <TouchableOpacity
                    onPress={() => navigation.navigate('Profile')}
                    activeOpacity={0.8}
                    style={styles.avatarContainer}
                >
                    {user?.photo_url ? (
                        <Image
                            source={{ uri: `https://shramicerp.pythonanywhere.com/uploads/profiles/${user.photo_url}` }}
                            style={styles.avatar}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={[styles.avatar, { backgroundColor: (theme?.primary || '#10B981') + 'CC' }]}>
                            <Ionicons name="person" size={32} color="#FFF" />
                        </View>
                    )}
                    <TouchableOpacity
                        style={styles.uploadButton}
                        onPress={() => navigation.navigate('Profile')}
                    >
                        <Ionicons name="camera-outline" size={18} color="#FFF" />
                    </TouchableOpacity>
                </TouchableOpacity>
            </View>

            {/* Stats */}
            <View style={styles.statsGrid}>
                <StatCard
                    icon="calendar"
                    title="Attendance"
                    value={data.attendance_count || 0}
                    subtitle="days this month"
                    color="#10B981"
                    theme={theme}
                />
                <StatCard
                    icon="clipboard"
                    title="Pending Tasks"
                    value={data.pending_tasks || 0}
                    subtitle="assignments"
                    color="#F59E0B"
                    theme={theme}
                />
                <StatCard
                    icon="checkmark-circle"
                    title="Submissions"
                    value={data.submissions?.length || 0}
                    subtitle="total"
                    color="#3B82F6"
                    theme={theme}
                />
                <StatCard
                    icon="notifications"
                    title="Notifications"
                    value={data.unread_notifications || 0}
                    subtitle="unread"
                    color="#EF4444"
                    theme={theme}
                />
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme?.text || '#111827' }]}>Quick Actions</Text>
                <View style={styles.actionsGrid}>
                    <QuickAction
                        icon="checkmark-done"
                        title="Mark Attendance"
                        color="#10B981"
                        onPress={() => navigation.navigate('Attendance')}
                        theme={theme}
                    />
                    <QuickAction
                        icon="add-circle"
                        title="Submit Task"
                        color="#10B981"
                        onPress={() => navigation.navigate('Tasks')}
                        theme={theme}
                    />
                    <QuickAction
                        icon="calendar-outline"
                        title="Apply Leave"
                        color="#F59E0B"
                        onPress={() => navigation.navigate('More', { screen: 'Leave' })}
                        theme={theme}
                    />
                    <QuickAction
                        icon="mail-outline"
                        title="Messages"
                        color="#3B82F6"
                        onPress={() => navigation.navigate('More', { screen: 'Messages' })}
                        theme={theme}
                    />
                </View>
            </View>

            {/* Recent Tasks */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme?.text || '#111827' }]}>Recent Tasks</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Tasks')}>
                        <Text style={[styles.seeAll, { color: theme?.primary || '#10B981' }]}>See All</Text>
                    </TouchableOpacity>
                </View>
                {data.tasks?.slice(0, 3).map((task, index) => (
                    <TaskCard key={task.id || index} task={task} theme={theme} />
                )) || <Text>No tasks</Text>}
            </View>

            {/* 🔔 REAL Announcements - PERFECT DESIGN */}
            {data.announcements?.length > 0 && (
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: theme?.text || '#111827' }]}>
                            📢 Announcements ({data.announcements.length})
                        </Text>
                        <View style={styles.announcementActions}>
                            <TouchableOpacity
                                style={[styles.iconButton, { backgroundColor: '#10B98120' }]}
                                onPress={() => navigation.navigate('More', { screen: 'Announcements' })}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="notifications-outline" size={22} color="#10B981" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => navigation.navigate('More', { screen: 'Announcements' })}>
                                <Text style={[styles.seeAll, { color: theme?.primary || '#10B981' }]}>See All</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    {data.announcements.slice(0, 2).map((announcement, index) => (
                        <AnnouncementCard
                            key={announcement.id || index}
                            announcement={announcement}
                            theme={theme}
                            onPress={() => navigation.navigate('More', { screen: 'Announcements' })}
                        />
                    ))}
                </View>
            )}

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

// 🟢 StatCard Component
function StatCard({ icon, title, value, subtitle, color, theme }) {
    return (
        <Card style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon} size={24} color={color} />
            </View>
            <Text style={[styles.statValue, { color: theme?.text || '#111827' }]}>{value}</Text>
            <Text style={[styles.statTitle, { color: theme?.textSecondary || '#6B7280' }]}>
                {title}
            </Text>
            <Text style={[styles.statSubtitle, { color: theme?.textSecondary || '#9CA3AF' }]}>
                {subtitle}
            </Text>
        </Card>
    );
}

// ⚡ QuickAction Component
function QuickAction({ icon, title, color, onPress, theme }) {
    return (
        <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: theme?.card || '#fff' }]}
            onPress={onPress}
            activeOpacity={0.9}
        >
            <View style={[styles.actionIcon, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon} size={28} color={color} />
            </View>
            <Text style={[styles.actionTitle, { color: theme?.text || '#111827' }]}>
                {title}
            </Text>
        </TouchableOpacity>
    );
}

// 📋 TaskCard Component
function TaskCard({ task, theme }) {
    const getPriorityColor = (priority) => {
        switch (priority?.toUpperCase()) {
            case 'HIGH': return '#EF4444';
            case 'MEDIUM': return '#F59E0B';
            case 'LOW': return '#10B981';
            default: return theme?.textSecondary || '#6B7280';
        }
    };

    return (
        <Card style={styles.taskCard}>
            <View style={styles.taskHeader}>
                <Text style={[styles.taskTitle, { color: theme?.text || '#111827' }]}>
                    {task?.title || 'Untitled'}
                </Text>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task?.priority) + '20' }]}>
                    <Text style={[styles.priorityText, { color: getPriorityColor(task?.priority) }]}>
                        {task?.priority || 'LOW'}
                    </Text>
                </View>
            </View>
            {task?.description && (
                <Text style={[styles.taskDescription, { color: theme?.textSecondary || '#6B7280' }]} numberOfLines={2}>
                    {task.description}
                </Text>
            )}
            <View style={styles.taskFooter}>
                <View style={styles.taskMeta}>
                    <Ionicons name="calendar-outline" size={14} color={theme?.textSecondary || '#6B7280'} />
                    <Text style={[styles.taskDate, { color: theme?.textSecondary || '#6B7280' }]}>
                        {task?.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}
                    </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: '#10B98120' }]}>
                    <Text style={[styles.statusText, { color: '#10B981' }]}>{task?.status || 'PENDING'}</Text>
                </View>
            </View>
        </Card>
    );
}

// 🔔 PERFECT AnnouncementCard Component
function AnnouncementCard({ announcement, theme, onPress }) {
    const getPriorityColor = (priority) => {
        switch (priority?.toUpperCase()) {
            case 'URGENT': return '#EF4444';
            case 'IMPORTANT': return '#F59E0B';
            case 'NORMAL': return '#10B981';
            default: return '#3B82F6';
        }
    };

    const safeTheme = theme || {};
    const cardBackground = safeTheme.card || '#fff';

    return (
        <TouchableOpacity
            style={[styles.announcementCard, { backgroundColor: cardBackground }]}
            activeOpacity={0.95}
            onPress={onPress}
        >
            <View style={styles.announcementHeader}>
                <View style={[
                    styles.announcementIcon,
                    { backgroundColor: getPriorityColor(announcement?.priority) + '20' }
                ]}>
                    <Ionicons
                        name="megaphone"
                        size={22}
                        color={getPriorityColor(announcement?.priority)}
                    />
                </View>
                <View style={styles.announcementContentWrapper}>
                    <View style={styles.announcementTitleRow}>
                        <Text style={[styles.announcementTitle, { color: safeTheme.text || '#111827' }]}>
                            {announcement?.title || 'Untitled Announcement'}
                        </Text>
                        {announcement?.is_unread && (
                            <View style={styles.unreadDot} />
                        )}
                    </View>
                    <Text style={[styles.announcementContent, { color: safeTheme.textSecondary || '#6B7280' }]} numberOfLines={2}>
                        {announcement?.content || 'No content available'}
                    </Text>
                </View>
            </View>
            <View style={styles.announcementFooter}>
                <Text style={[styles.announcementDate, { color: safeTheme.textSecondary || '#9CA3AF' }]}>
                    {announcement?.created_at
                        ? new Date(announcement.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })
                        : 'Just now'
                    }
                </Text>
                {announcement?.priority && (
                    <View style={[
                        styles.priorityBadge,
                        { backgroundColor: getPriorityColor(announcement.priority) + '15' }
                    ]}>
                        <Text style={[
                            styles.priorityText,
                            { color: getPriorityColor(announcement.priority) }
                        ]}>
                            {announcement.priority}
                        </Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 24,
        paddingTop: 60,
        paddingBottom: 32,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerContent: {
        flex: 1,
        marginRight: 16,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadButton: {
        position: 'absolute',
        bottom: -6,
        right: -8,
        width: 25,
        height: 25,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFF',
        backgroundColor: '#534ad6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    greeting: {
        fontSize: 16,
        color: '#FFFFFF',
        opacity: 0.9,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginTop: 4,
    },
    userId: {
        fontSize: 14,
        color: '#FFFFFF',
        opacity: 0.8,
        marginTop: 4,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 16,
        marginTop: -16,
        gap: 12,
    },
    statCard: {
        width: '48%',
        padding: 16,
        alignItems: 'center',
    },
    statIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 4,
    },
    statTitle: {
        fontSize: 12,
        marginTop: 4,
    },
    statSubtitle: {
        fontSize: 10,
        marginTop: 2,
    },
    section: {
        padding: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    announcementActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconButton: {
        padding: 12,
        borderRadius: 20,
        minWidth: 44,
        minHeight: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    seeAll: {
        fontSize: 14,
        fontWeight: '600',
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    actionCard: {
        width: '48%',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    actionIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionTitle: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    taskCard: {
        marginBottom: 12,
    },
    taskHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    taskTitle: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    priorityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginLeft: 8,
    },
    priorityText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    taskDescription: {
        fontSize: 14,
        marginBottom: 12,
        lineHeight: 20,
    },
    taskFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    taskMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    taskDate: {
        fontSize: 12,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
    },
    // 🔔 PERFECT Announcement Styles
    announcementCard: {
        padding: 20,
        marginBottom: 16,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    announcementHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 16,
        marginBottom: 12,
    },
    announcementIcon: {
        width: 52,
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    announcementContentWrapper: {
        flex: 1,
    },
    announcementTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    announcementTitle: {
        fontSize: 18,
        fontWeight: '800',
        lineHeight: 24,
        flex: 1,
    },
    announcementContent: {
        fontSize: 15,
        lineHeight: 22,
    },
    announcementFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    announcementDate: {
        fontSize: 14,
        fontWeight: '600',
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10B981',
    },
});
