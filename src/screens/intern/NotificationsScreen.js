import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    RefreshControl,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../config/api';
import Toast from 'react-native-toast-message';

export default function NotificationsScreen({ navigation }) {
    const { theme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/api/intern/notifications');
            setNotifications(response.data.notifications || []);
        } catch (error) {
            console.error('Fetch notifications error:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to load notifications',
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'success':
                return { name: 'check-circle', color: '#10B981' };
            case 'warning':
                return { name: 'warning', color: '#F59E0B' };
            case 'error':
                return { name: 'error', color: '#EF4444' };
            default:
                return { name: 'info', color: '#3B82F6' };
        }
    };

    const NotificationCard = ({ notification }) => {
        const icon = getNotificationIcon(notification.type);
        const isNew = !notification.is_read;

        return (
            <View
                style={[
                    styles.notificationCard,
                    { backgroundColor: theme.surface },
                    isNew && { backgroundColor: theme.primary + '10' },
                ]}
            >
                <View style={[styles.iconContainer, { backgroundColor: icon.color + '20' }]}>
                    <MaterialIcons name={icon.name} size={24} color={icon.color} />
                </View>

                <View style={styles.notificationContent}>
                    <Text style={[styles.notificationTitle, { color: theme.text }]}>
                        {notification.title}
                    </Text>
                    <Text style={[styles.notificationMessage, { color: theme.textSecondary }]}>
                        {notification.message}
                    </Text>
                    <Text style={[styles.notificationTime, { color: theme.textSecondary }]}>
                        {formatTime(notification.created_at)}
                    </Text>
                </View>

                {isNew && (
                    <View style={[styles.newBadge, { backgroundColor: theme.primary }]}>
                        <Text style={styles.newBadgeText}>NEW</Text>
                    </View>
                )}
            </View>
        );
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <MaterialIcons name="arrow-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Notifications</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Notifications</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.primary}
                        colors={[theme.primary]}
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                {notifications.length > 0 ? (
                    notifications.map((notification) => (
                        <NotificationCard key={notification.id} notification={notification} />
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <MaterialIcons name="notifications-none" size={64} color={theme.textSecondary} />
                        <Text style={[styles.emptyText, { color: theme.text }]}>No notifications</Text>
                        <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
                            You're all caught up!
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    notificationCard: {
        flexDirection: 'row',
        padding: 14,
        borderRadius: 12,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    notificationContent: {
        flex: 1,
    },
    notificationTitle: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 4,
    },
    notificationMessage: {
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 6,
    },
    notificationTime: {
        fontSize: 11,
        fontWeight: '500',
    },
    newBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    newBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '700',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        marginTop: 4,
    },
});