import React, { useState, useEffect, useCallback } from 'react';
import {
    createBottomTabNavigator
} from '@react-navigation/bottom-tabs';
import {
    createStackNavigator
} from '@react-navigation/stack';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
    Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import api from '../config/api';
import Announcement from '../screens/intern/AnnouncementsScreen';
import DashboardScreen from '../screens/intern/DashboardScreen';
import AttendanceScreen from '../screens/intern/AttendanceScreen';
import TasksScreen from '../screens/intern/TasksScreen';
import ProfileScreen from '../screens/intern/ProfileScreen';
import SubmissionsScreen from '../screens/intern/SubmissionsScreen';
import LeaveScreen from '../screens/intern/LeaveScreen';
import MessagesScreen from '../screens/intern/MessagesScreen';
import GoalsScreen from '../screens/intern/GoalsScreen';
import CertificatesScreen from '../screens/intern/CertificatesScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// 🔔 AnnouncementsScreen - MODAL STYLE (Bell + Dashboard only)
function AnnouncementsScreen({ navigation }) {
    const { theme } = useTheme();
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const getPriorityColor = (priority) => {
        switch (priority?.toUpperCase()) {
            case 'URGENT': return '#EF4444';
            case 'IMPORTANT': return '#F59E0B';
            case 'NORMAL': return '#10B981';
            default: return '#3B82F6';
        }
    };

    const fetchAnnouncements = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/intern/announcements');
            const data = Array.isArray(response.data)
                ? response.data
                : (response.data?.announcements || response.data?.data || []);

            setAnnouncements(data);
            const unread = data.filter(a => a.is_unread === true || !a.is_read).length;
            setUnreadCount(unread);
        } catch (error) {
            console.log('Error fetching announcements:', error);
            setAnnouncements([]);
            setUnreadCount(0);
        } finally {
            setLoading(false);
        }
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchAnnouncements();
        setRefreshing(false);
    }, [fetchAnnouncements]);

    useEffect(() => {
        fetchAnnouncements();
    }, [fetchAnnouncements]);

    if (loading && announcements.length === 0) {
        return (
            <ScrollView style={{ flex: 1, backgroundColor: theme?.background || '#f8f9fa' }}
                contentContainerStyle={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
                <ActivityIndicator size="large" color={theme?.primary || '#10B981'} />
            </ScrollView>
        );
    }

    return (
        <ScrollView style={{ flex: 1, backgroundColor: theme?.background || '#f8f9fa' }}
            contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />}>

            <Text style={{ fontSize: 28, fontWeight: '800', color: theme?.text || '#111827', marginBottom: 12 }}>
                Announcements ({unreadCount})
            </Text>

            {announcements.slice(0, 3).map((announcement, index) => (
                <TouchableOpacity key={announcement.id || index} style={{ marginBottom: 16 }}
                    onPress={() => {
                        // Mark as read locally
                        setAnnouncements(prev => prev.map((item, i) =>
                            i === index && item.is_unread ? { ...item, is_unread: false } : item
                        ));
                    }}>
                    <View style={{
                        backgroundColor: theme?.card || '#fff',
                        padding: 20,
                        borderRadius: 20,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.1,
                        shadowRadius: 12,
                        elevation: 4,
                    }}>
                        <Text style={{ fontSize: 18, fontWeight: '700', color: theme?.text || '#111827' }}>
                            {announcement.title || 'Untitled'}
                        </Text>
                        <Text style={{ fontSize: 15, color: theme?.textSecondary || '#6B7280', marginTop: 8 }} numberOfLines={2}>
                            {announcement.content || 'No content'}
                        </Text>
                        <Text style={{ fontSize: 14, color: theme?.textSecondary || '#9CA3AF', marginTop: 8 }}>
                            {announcement.created_at && new Date(announcement.created_at).toLocaleDateString()}
                        </Text>
                    </View>
                </TouchableOpacity>
            ))}

            {announcements.length === 0 && (
                <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                    <Ionicons name="megaphone-outline" size={64} color="#D1D5DB" />
                    <Text style={{ fontSize: 18, fontWeight: '600', color: theme?.textSecondary || '#6B7280', marginTop: 16 }}>
                        No announcements yet
                    </Text>
                </View>
            )}
        </ScrollView>
    );
}

function AnnouncementsStack() {
    const { theme } = useTheme();
    return (
        <Stack.Navigator screenOptions={{
            headerStyle: { backgroundColor: theme?.surface || '#fff' },
            headerTintColor: theme?.text || '#111827',
            headerTitleStyle: { fontWeight: 'bold' },
            headerShadowVisible: false,
        }}>
            <Stack.Screen
                name="AnnouncementsHome"
                component={AnnouncementsScreen}
                options={{ title: 'Announcements' }}
            />
        </Stack.Navigator>
    );
}

// ✨ CLEAN MoreStack
function MoreStack({ navigation }) {
    const { theme } = useTheme();
    return (
        <Stack.Navigator screenOptions={{
            headerStyle: { backgroundColor: theme?.surface || '#fff' },
            headerTintColor: theme?.text || '#111827',
            headerTitleStyle: { fontWeight: 'bold' },
            headerShadowVisible: false,
        }}>
            <Stack.Screen name="MoreHome" component={MoreHomeScreen} options={{ title: 'More' }} />
            <Stack.Screen name="Submissions" component={SubmissionsScreen} options={{ title: 'My Submissions' }} />
            <Stack.Screen name="Leave" component={LeaveScreen} options={{ title: 'Leave Requests' }} />
            <Stack.Screen name="Messages" component={MessagesScreen} options={{ title: 'Messages' }} />
            <Stack.Screen name="Goals" component={GoalsScreen} options={{ title: 'My Goals' }} />
            <Stack.Screen name="Certificates" component={CertificatesScreen} options={{ title: 'Certificates' }} />
        </Stack.Navigator>
    );
}

function MoreHomeScreen({ navigation }) {
    const { theme } = useTheme();
    const menuItems = [
        { title: 'Submissions', icon: 'document-text-outline', screen: 'Submissions', color: '#3B82F6', description: 'View all submissions' },
        { title: 'Leave Requests', icon: 'calendar-outline', screen: 'Leave', color: '#F59E0B', description: 'Apply & track leaves' },
        { title: 'Messages', icon: 'mail-outline', screen: 'Messages', color: '#10B981', description: 'Inbox & notifications' },
        { title: 'Goals', icon: 'trophy-outline', screen: 'Goals', color: '#8B5CF6', description: 'Track progress' },
        { title: 'Certificates', icon: 'ribbon-outline', screen: 'Certificates', color: '#EF4444', description: 'Your achievements' },
    ];

    return (
        <ScrollView style={{ flex: 1, backgroundColor: theme?.background || '#f8f9fa' }}
            contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
            <Text style={{ fontSize: 28, fontWeight: '800', color: theme?.text || '#111827', marginBottom: 32 }}>
                More
            </Text>
            <View style={{ gap: 16 }}>
                {menuItems.map((item) => (
                    <TouchableOpacity key={item.title} style={{
                        backgroundColor: theme?.card || '#fff',
                        borderRadius: 20,
                        padding: 24,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.1,
                        elevation: 4,
                        flexDirection: 'row',
                        alignItems: 'center',
                    }} onPress={() => navigation.navigate(item.screen)}>
                        <View style={{
                            width: 56, height: 56, borderRadius: 16,
                            backgroundColor: item.color + '12',
                            justifyContent: 'center', alignItems: 'center',
                            marginRight: 20, borderWidth: 1, borderColor: item.color + '20'
                        }}>
                            <Ionicons name={item.icon} size={24} color={item.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 18, fontWeight: '700', color: theme?.text || '#111827' }}>
                                {item.title}
                            </Text>
                            <Text style={{ fontSize: 14, color: theme?.textSecondary || '#6B7280' }}>
                                {item.description}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme?.textSecondary || '#9CA3AF'} />
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );
}

// 🎯 Main Tab Navigator with Announcements as hidden screen
function MainTabs() {
    const { theme } = useTheme();

    return (
        <Tab.Navigator
            screenOptions={({ route, navigation }) => ({
                headerTitle: () => (
                    <Text style={{
                        fontSize: 20,
                        fontWeight: 'bold',
                        color: theme?.text || '#111827',
                    }}>
                        {route.name}
                    </Text>
                ),
                headerLeft: () => (
                    <Image
                        source={require('../assets/favicon.png')}
                        style={{
                            width: 36,
                            height: 36,
                            marginLeft: 16,
                        }}
                        resizeMode="contain"
                    />
                ),
                headerRight: () => (
                    <TouchableOpacity
                        style={{
                            marginRight: 16,
                            padding: 8,
                            borderRadius: 20,
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        }}
                        onPress={() => navigation.navigate('AnnouncementsStack')}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="notifications-outline" size={24} color="#10B981" />
                    </TouchableOpacity>
                ),
                headerStyle: {
                    backgroundColor: theme?.surface || '#fff',
                    elevation: 0,
                    shadowOpacity: 0,
                },
                headerTintColor: theme?.text || '#111827',
                headerTitleStyle: { fontWeight: 'bold', fontSize: 20 },
                headerShadowVisible: false,

                tabBarIcon: ({ focused, color }) => {
                    let iconName;
                    if (route.name === 'Dashboard') iconName = focused ? 'home' : 'home-outline';
                    else if (route.name === 'Attendance') iconName = focused ? 'calendar' : 'calendar-outline';
                    else if (route.name === 'Tasks') iconName = focused ? 'clipboard' : 'clipboard-outline';
                    else if (route.name === 'More') iconName = focused ? 'grid' : 'grid-outline';
                    else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
                    return <Ionicons name={iconName} size={22} color={color} />;
                },
                tabBarActiveTintColor: theme?.primary || '#10B981',
                tabBarInactiveTintColor: theme?.textSecondary || '#9CA3AF',
                tabBarStyle: {
                    backgroundColor: theme?.surface || '#fff',
                    borderTopWidth: 0,
                    paddingBottom: 4,
                    paddingTop: 4,
                    height: 60,
                    paddingHorizontal: 12,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                    marginTop: 2,
                },
            })}
        >
            {/* 🎯 EXACT 5 TABS: Dashboard, Attendance, Tasks, More, Profile */}
            <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: true }} />
            <Tab.Screen name="Attendance" component={AttendanceScreen} options={{ headerShown: true }} />
            <Tab.Screen name="Tasks" component={TasksScreen} options={{ headerShown: true }} />
            <Tab.Screen name="More" component={MoreStack} options={{ headerShown: true, tabBarLabel: 'More' }} />
            <Tab.Screen name="Profile" component={ProfileScreen} options={{ headerShown: true }} />

            {/* Hidden tab - accessible via bell icon */}
            <Tab.Screen
                name="AnnouncementsStack"
                component={AnnouncementsStack}
                options={{
                    tabBarButton: () => null,  // Hide from tab bar
                    headerShown: false
                }}
            />
        </Tab.Navigator>
    );
}

// 🎯 Export the main component
export default function InternTabNavigator() {
    return <MainTabs />;
}