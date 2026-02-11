import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    TextInput,
    Dimensions,
    StyleSheet,  // ✅ ADDED
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { attendanceService } from '../../services/attendanceService';
import Toast from 'react-native-toast-message';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 40;
const STAT_WIDTH = (SCREEN_WIDTH - 72) / 2;

export default function AttendanceScreen() {
    const { theme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [marking, setMarking] = useState(false);
    const [location, setLocation] = useState('');
    const [actionMsg, setActionMsg] = useState({ type: '', text: '' });

    const [data, setData] = useState({
        today_attendance: null,
        today_date: '',
        attendance_this_month: 0,
        total_hours: 0,
        average_hours: 0,
        working_days: 0,
        attendance_history: [],
    });

    useEffect(() => {
        fetchAttendance();
    }, []);

    const fetchAttendance = async () => {
        try {
            setLoading(true);
            setRefreshing(true);
            const response = await attendanceService.getAttendance();
            setData(response.data || {});
            setActionMsg({ type: '', text: '' });
        } catch (error) {
            console.error('Attendance fetch error:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to load attendance data',
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const isCheckedInToday = () => data.today_attendance && data.today_attendance.check_in_time;
    const isCheckedOutToday = () => data.today_attendance && data.today_attendance.check_out_time;

    const handleCheckIn = async () => {
        if (isCheckedInToday()) {
            setActionMsg({ type: 'info', text: 'Already checked in today ✅' });
            setTimeout(() => setActionMsg({ type: '', text: '' }), 3000);
            return;
        }

        if (!location.trim()) {
            setActionMsg({ type: 'error', text: 'Please enter your location' });
            setTimeout(() => setActionMsg({ type: '', text: '' }), 3000);
            return;
        }

        setMarking(true);
        try {
            const response = await attendanceService.markCheckIn(location);
            setActionMsg({
                type: 'success',
                text: response.data?.message || 'Checked in successfully!'
            });
            setLocation('');
            fetchAttendance();
        } catch (error) {
            if (error.response?.status === 400 && error.response?.data?.error === 'Attendance already marked today') {
                setActionMsg({ type: 'info', text: 'Already checked in today' });
                fetchAttendance();
            } else {
                setActionMsg({
                    type: 'error',
                    text: error.response?.data?.error || 'Failed to check in'
                });
            }
        } finally {
            setMarking(false);
            setTimeout(() => setActionMsg({ type: '', text: '' }), 4000);
        }
    };

    const handleCheckOut = async () => {
        if (!isCheckedInToday()) {
            setActionMsg({ type: 'error', text: 'Please check in first' });
            setTimeout(() => setActionMsg({ type: '', text: '' }), 3000);
            return;
        }

        if (isCheckedOutToday()) {
            setActionMsg({ type: 'info', text: 'Already checked out today ✅' });
            setTimeout(() => setActionMsg({ type: '', text: '' }), 3000);
            return;
        }

        setMarking(true);
        try {
            const response = await attendanceService.markCheckOut();
            setActionMsg({
                type: 'success',
                text: `${response.data?.message || 'Checked out successfully!'} (${response.data?.work_hours || 0}h)`
            });
            fetchAttendance();
        } catch (error) {
            if (error.response?.status === 400) {
                setActionMsg({ type: 'error', text: 'Please check in first' });
            } else {
                setActionMsg({
                    type: 'error',
                    text: error.response?.data?.error || 'Failed to check out'
                });
            }
        } finally {
            setMarking(false);
            setTimeout(() => setActionMsg({ type: '', text: '' }), 4000);
        }
    };

    const onRefresh = () => fetchAttendance();

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <View style={styles.loadingCard}>
                    <ActivityIndicator size="large" color={theme?.primary || '#10B981'} />
                    <Text style={styles.loadingText}>Loading attendance...</Text>
                </View>
            </View>
        );
    }

    const primaryColor = theme?.primary || '#10B981';
    const cardBg = theme?.card || '#fff';
    const bgColor = theme?.background || '#f8f9fa';
    const textColor = theme?.text || '#000';
    const textSecondary = theme?.textSecondary || '#666';

    const StatBox = ({ label, value, sublabel, icon, color, theme, width }) => {
        const textColor = theme?.text || '#000';
        const textSecondary = theme?.textSecondary || '#666';

        return (
            <View style={[
                styles.statBox,
                { width, backgroundColor: theme?.card || '#fff', shadowColor: color }
            ]}>
                <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
                    <Ionicons name={icon} size={24} color={color} />
                </View>
                <Text style={[styles.statValue, { color: textColor }]}>{value}</Text>
                <Text style={[styles.statLabel, { color: textSecondary }]}>{label}</Text>
                <Text style={styles.statSublabel}>{sublabel}</Text>
            </View>
        );
    };

    const TimeCard = ({ label, time, color, theme }) => (
        <View style={[
            styles.timeCard,
            {
                backgroundColor: color === '#10B981' ? '#DCFCE7' :
                    color === '#3B82F6' ? '#DBEAFE' : '#F9FAFB',
                borderColor: color === '#10B981' ? '#10B98140' :
                    color === '#3B82F6' ? '#3B82F640' : '#E5E7EB'
            }
        ]}>
            <Text style={[
                styles.timeLabel,
                { color: color === '#9CA3AF' ? '#9CA3AF' : color === '#10B981' ? '#166534' : '#1E40AF' }
            ]}>
                {label}
            </Text>
            <Text style={[styles.timeValue, { color }]}>{time}</Text>
        </View>
    );

    const HoursCard = ({ hours, theme }) => (
        <View style={styles.hoursCard}>
            <Text style={styles.hoursLabel}>Hours</Text>
            <Text style={styles.hoursValue}>{hours}h</Text>
        </View>
    );

    const HistoryItem = ({ record, primaryColor, theme }) => {
        const textColor = theme?.text || '#000';
        const textSecondary = theme?.textSecondary || '#666';

        return (
            <View style={[
                styles.historyItem,
                { backgroundColor: theme?.surface || '#F9FAFB', borderLeftColor: primaryColor + '40' }
            ]}>
                <View style={styles.historyContent}>
                    <Text style={[styles.historyDate, { color: textColor }]}>{record.date}</Text>
                    <Text style={[styles.historyTimes, { color: textSecondary }]}>
                        {record.check_in_time?.split(' ')[1] || '–'} - {record.check_out_time?.split(' ')[1] || 'Pending'}
                    </Text>
                    {record.location && (
                        <Text style={styles.historyLocation}>📍 {record.location}</Text>
                    )}
                </View>
                {record.work_hours && (
                    <View style={[styles.historyHours, {
                        backgroundColor: primaryColor + '20',
                        borderColor: primaryColor + '30'
                    }]}>
                        <Text style={[styles.historyHoursText, { color: primaryColor }]}>
                            {record.work_hours}h
                        </Text>
                    </View>
                )}
            </View>
        );
    };

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: bgColor }]}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={primaryColor}
                    colors={[primaryColor]}
                />
            }
            contentContainerStyle={styles.contentContainer}
        >
            {/* Action Message */}
            {actionMsg.text ? (
                <View style={[
                    styles.actionMsg,
                    {
                        backgroundColor: actionMsg.type === 'success' ? '#DCFCE7' : '#FECACA',
                        borderLeftColor: actionMsg.type === 'success' ? '#10B981' : '#EF4444'
                    }
                ]}>
                    <Text style={[
                        styles.actionMsgText,
                        { color: actionMsg.type === 'success' ? '#166534' : '#991B1B' }
                    ]}>
                        {actionMsg.text}
                    </Text>
                </View>
            ) : null}

            {/* Title Card */}
            <View style={[styles.heroCard, { backgroundColor: cardBg }]}>
                <Text style={[styles.heroTitle, { color: textColor }]}>Attendance Tracker</Text>
                <Text style={[styles.heroDate, { color: textSecondary }]}>{data.today_date || 'Loading...'}</Text>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsContainer}>
                <StatBox
                    label="Days Present"
                    value={data.attendance_this_month}
                    sublabel="This month"
                    icon="calendar-number"
                    color="#3B82F6"
                    theme={theme}
                    width={STAT_WIDTH}
                />
                <StatBox
                    label="Total Hours"
                    value={Number(data.total_hours || 0).toFixed(1)}
                    sublabel="All time"
                    icon="time"
                    color="#10B981"
                    theme={theme}
                    width={STAT_WIDTH}
                />
                <StatBox
                    label="Avg Hours"
                    value={Number(data.average_hours || 0).toFixed(1)}
                    sublabel="Per day"
                    icon="trending-up"
                    color="#8B5CF6"
                    theme={theme}
                    width={STAT_WIDTH}
                />
                <StatBox
                    label="Working Days"
                    value={data.working_days || 0}
                    sublabel="Recorded"
                    icon="briefcase"
                    color="#F59E0B"
                    theme={theme}
                    width={STAT_WIDTH}
                />
            </View>

            {/* Today's Status Card */}
            <View style={[styles.statusCard, {
                backgroundColor: cardBg,
                borderLeftColor: primaryColor
            }]}>
                <View style={styles.statusHeader}>
                    <View style={styles.statusIconContainer}>
                        <View style={[styles.iconCircle, { backgroundColor: primaryColor + '20' }]}>
                            <Ionicons name="today" size={28} color={primaryColor} />
                        </View>
                        <Text style={[styles.statusTitle, { color: textColor }]}>Today's Status</Text>
                    </View>
                    <View style={[
                        styles.statusBadge,
                        {
                            backgroundColor: isCheckedInToday() ? '#DCFCE7' : '#F3F4F6',
                            borderColor: isCheckedInToday() ? '#10B98140' : '#D1D5DB40'
                        }
                    ]}>
                        <Text style={[
                            styles.statusBadgeText,
                            { color: isCheckedInToday() ? '#166534' : '#6B7280' }
                        ]}>
                            {isCheckedInToday() ? 'Present' : 'Not Marked'}
                        </Text>
                    </View>
                </View>

                {isCheckedInToday() ? (
                    <View style={styles.checkedInContent}>
                        <View style={styles.timeRow}>
                            <TimeCard
                                label="Check-in"
                                time={data.today_attendance.check_in_time?.split(' ')[1] || '--:--'}
                                color="#10B981"
                                theme={theme}
                            />
                            <TimeCard
                                label="Check-out"
                                time={data.today_attendance.check_out_time ?
                                    data.today_attendance.check_out_time.split(' ')[1] : '--:--'}
                                color={isCheckedOutToday() ? '#3B82F6' : '#9CA3AF'}
                                theme={theme}
                            />
                        </View>

                        {data.today_attendance.work_hours && (
                            <HoursCard
                                hours={data.today_attendance.work_hours}
                                theme={theme}
                            />
                        )}

                        {!isCheckedOutToday() && (
                            <TouchableOpacity
                                style={[styles.checkoutButton, {
                                    backgroundColor: '#EF4444',
                                    shadowColor: '#EF4444',
                                    opacity: marking ? 0.7 : 1
                                }]}
                                onPress={handleCheckOut}
                                disabled={marking}
                                activeOpacity={0.9}
                            >
                                {marking ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <View style={styles.buttonContent}>  {/* ✅ FIXED */}
                                        <Ionicons name="log-out-outline" size={28} color="#fff" />
                                        <Text style={styles.checkoutButtonText}>Check Out Now</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    <View style={styles.checkinForm}>
                        <Text style={[styles.checkinPrompt, { color: textSecondary }]}>
                            Mark your attendance with current location
                        </Text>

                        <View style={styles.locationContainer}>
                            <View style={styles.locationHeader}>
                                <Ionicons name="map-pin-outline" size={20} color="#6B7280" />
                                <Text style={styles.locationLabel}>Current Location</Text>
                            </View>
                            <TextInput
                                style={styles.locationInput}
                                placeholder="e.g. Office, Shramic HQ, Client Site"
                                placeholderTextColor="#9CA3AF"
                                value={location}
                                onChangeText={setLocation}
                                autoCapitalize="words"
                                returnKeyType="done"
                                editable={!marking}
                            />
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.checkinButton,
                                {
                                    backgroundColor: primaryColor,
                                    shadowColor: primaryColor,
                                    opacity: marking || !location.trim() ? 0.7 : 1
                                }
                            ]}
                            onPress={handleCheckIn}
                            disabled={marking || !location.trim()}
                            activeOpacity={0.9}
                        >
                            {marking ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <View style={styles.buttonContent}>  {/* ✅ FIXED */}
                                    <Ionicons name="time-outline" size={24} color="#fff" />
                                    <Text style={styles.checkinButtonText}>Mark Check-In</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* History Card */}
            <View style={[styles.historyCard, { backgroundColor: cardBg }]}>
                <View style={styles.historyHeader}>
                    <View style={styles.historyIconContainer}>
                        <View style={[styles.iconCircle, { backgroundColor: primaryColor + '20' }]}>
                            <Ionicons name="time" size={28} color={primaryColor} />
                        </View>
                        <Text style={[styles.historyTitle, { color: textColor }]}>Recent History</Text>
                    </View>
                </View>

                {data.attendance_history?.length > 0 ? (
                    data.attendance_history.slice(0, 10).map((record, index) => (
                        <HistoryItem
                            key={record.id || record.date || index}
                            record={record}
                            primaryColor={primaryColor}
                            theme={theme}
                        />
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <Ionicons name="time-outline" size={72} color="#9CA3AF" />
                        <Text style={styles.emptyTitle}>No attendance records yet</Text>
                        <Text style={styles.emptySubtitle}>Your first check-in will appear here</Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}

// ✅ PERFECT StyleSheet.create() - YOUR CSS EXACTLY SAME
const styles = StyleSheet.create({  // ✅ CHANGED FROM plain object
    container: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingCard: {
        backgroundColor: '#fff',
        padding: 40,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
        textAlign: 'center',
    },
    buttonContent: {  // ✅ NEW - Fixes TouchableOpacity fragments
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    actionMsg: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        borderLeftWidth: 4,
    },
    actionMsgText: {
        fontSize: 16,
        fontWeight: '600',
    },
    heroCard: {
        borderRadius: 28,
        padding: 32,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 12,
        alignItems: 'center',
    },
    heroTitle: {
        fontSize: 34,
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: 8,
    },
    heroDate: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
    },
    statsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 28,
    },
    statBox: {
        borderRadius: 20,
        padding: 24,
        marginBottom: 16,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 12,
        alignItems: 'center',
    },
    statIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    statValue: {
        fontSize: 28,
        fontWeight: '900',
        marginBottom: 4,
        textAlign: 'center',
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 2,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    statSublabel: {
        fontSize: 12,
        textAlign: 'center',
        color: '#9CA3AF',
    },
    statusCard: {
        borderRadius: 28,
        padding: 28,
        marginBottom: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 12,
        borderLeftWidth: 5,
    },
    statusHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    statusIconContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    statusTitle: {
        fontSize: 24,
        fontWeight: '900',
    },
    statusBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    statusBadgeText: {
        fontSize: 14,
        fontWeight: '700',
    },
    checkedInContent: {
        gap: 20,
    },
    timeRow: {
        flexDirection: 'row',
        gap: 12,
    },
    timeCard: {
        flex: 1,
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
    },
    timeLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    timeValue: {
        fontSize: 22,
        fontWeight: '800',
        fontFamily: 'monospace',
    },
    hoursCard: {
        flex: 1,
        backgroundColor: '#F3E8FF',
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#8B5CF640',
    },
    hoursLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B21A8',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    hoursValue: {
        fontSize: 22,
        fontWeight: '800',
        color: '#6B21A8',
    },
    checkoutButton: {
        paddingVertical: 20,
        paddingHorizontal: 32,
        borderRadius: 20,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 12,
        justifyContent: 'center',
    },
    checkoutButtonText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '900',
    },
    checkinForm: {
        alignItems: 'center',
        padding: 20,
    },
    checkinPrompt: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    locationContainer: {
        backgroundColor: '#F9FAFB',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    locationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    locationLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginLeft: 8,
    },
    locationInput: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        color: '#000',
    },
    checkinButton: {
        paddingVertical: 20,
        paddingHorizontal: 40,
        borderRadius: 20,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 12,
        justifyContent: 'center',
        width: '100%',
    },
    checkinButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '900',
    },
    historyCard: {
        borderRadius: 28,
        padding: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 12,
    },
    historyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    historyIconContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    historyTitle: {
        fontSize: 24,
        fontWeight: '900',
    },
    historyItem: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 12,
        borderLeftWidth: 4,
    },
    historyContent: {
        flex: 1,
    },
    historyDate: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 4,
    },
    historyTimes: {
        fontSize: 16,
        fontFamily: 'monospace',
    },
    historyLocation: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
    },
    historyHours: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        borderWidth: 1,
    },
    historyHoursText: {
        fontSize: 16,
        fontWeight: '800',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
        opacity: 0.6,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginTop: 20,
        textAlign: 'center',
        color: '#9CA3AF',
    },
    emptySubtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 8,
        color: '#9CA3AF',
    },
});
