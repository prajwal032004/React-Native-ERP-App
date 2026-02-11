import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    StyleSheet,
    Dimensions,
    Platform,
    Animated,
    TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { leaveService } from '../../services/leaveService';
import Toast from 'react-native-toast-message';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function LeaveScreen() {
    const { theme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [formData, setFormData] = useState({
        leave_type: 'Sick',
        start_date: '',
        end_date: '',
        reason: ''
    });

    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const leaveTypes = ['Sick', 'Casual', 'Emergency', 'Personal'];

    useEffect(() => {
        fetchLeaveRequests();
    }, []);

    useEffect(() => {
        if (showForm) {
            // Animate modal in from bottom
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            // Animate modal out
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: SCREEN_HEIGHT,
                    duration: 350,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [showForm]);

    const fetchLeaveRequests = async () => {
        try {
            setLoading(true);
            const response = await leaveService.getLeaveRequests();
            const requests = response.data?.leave_requests || [];
            setLeaveRequests(Array.isArray(requests) ? requests : []);
        } catch (error) {
            console.error('Leave fetch error:', error);
            setLeaveRequests([]);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to load leave requests'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            await leaveService.applyLeave(
                formData.leave_type,
                formData.start_date,
                formData.end_date,
                formData.reason
            );
            Toast.show({
                type: 'success',
                text1: 'Success ✅',
                text1: 'Leave request submitted successfully'
            });
            setShowForm(false);
            setFormData({ leave_type: 'Sick', start_date: '', end_date: '', reason: '' });
            fetchLeaveRequests();
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.response?.data?.error || 'Failed to submit request'
            });
        } finally {
            setLoading(false);
        }
    };

    const closeModal = () => {
        setShowForm(false);
    };

    if (loading && leaveRequests.length === 0) {
        return (
            <View style={[styles.container, { backgroundColor: theme?.background || '#f8f9fa' }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#10B981" />
                    <Text style={styles.loadingText}>Loading leave requests...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme?.background || '#f8f9fa' }]}>
            <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerTextContainer}>
                        <Text style={[styles.headerTitle, { color: theme?.text || '#111827' }]}>
                            📅 Leave Requests
                        </Text>
                        <Text style={[styles.headerSubtitle, { color: theme?.textSecondary || '#6B7280' }]}>
                            {leaveRequests.length} request{leaveRequests.length !== 1 ? 's' : ''}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.refreshButton}
                        onPress={fetchLeaveRequests}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="refresh-outline" size={SCREEN_WIDTH * 0.055} color="#10B981" />
                    </TouchableOpacity>
                </View>

                {/* New Request Button */}
                <TouchableOpacity
                    style={[styles.newRequestButton, { backgroundColor: '#10B981' }]}
                    onPress={() => setShowForm(true)}
                    activeOpacity={0.85}
                >
                    <Ionicons name="add-circle-outline" size={SCREEN_WIDTH * 0.06} color="#fff" />
                    <Text style={styles.newRequestText}>New Leave Request</Text>
                </TouchableOpacity>

                {/* Leave Requests List */}
                {leaveRequests.length === 0 ? (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconContainer}>
                            <Ionicons name="calendar-outline" size={SCREEN_WIDTH * 0.16} color="#D1D5DB" />
                        </View>
                        <Text style={[styles.emptyTitle, { color: theme?.text || '#111827' }]}>
                            No leave requests
                        </Text>
                        <Text style={[styles.emptySubtitle, { color: theme?.textSecondary || '#6B7280' }]}>
                            Tap "New Leave Request" to create your first request
                        </Text>
                    </View>
                ) : (
                    leaveRequests.map((request, index) => (
                        <View
                            key={request.id || index}
                            style={[
                                styles.leaveCard,
                                {
                                    backgroundColor: theme?.card || '#fff',
                                    borderLeftColor: getStatusColor(request.status)
                                }
                            ]}
                        >
                            <View style={styles.leaveHeader}>
                                <Text style={[styles.leaveType, { color: theme?.text || '#111827' }]}>
                                    {request.leave_type}
                                </Text>
                                <View style={[
                                    styles.statusBadge,
                                    { backgroundColor: getStatusBgColor(request.status) }
                                ]}>
                                    <Text style={[
                                        styles.statusText,
                                        { color: getStatusColor(request.status) }
                                    ]}>
                                        {request.status?.toUpperCase() || 'PENDING'}
                                    </Text>
                                </View>
                            </View>

                            <Text style={[styles.dateRange, { color: theme?.textSecondary || '#6B7280' }]}>
                                {formatDate(request.start_date)} - {formatDate(request.end_date)}
                                {request.total_days && ` (${request.total_days} days)`}
                            </Text>

                            {request.reason && (
                                <View style={styles.reasonContainer}>
                                    <Text style={[styles.reasonText, { color: theme?.text || '#374151' }]}>
                                        {request.reason}
                                    </Text>
                                </View>
                            )}

                            {request.admin_comment && (
                                <View style={styles.adminComment}>
                                    <Ionicons name="person-outline" size={SCREEN_WIDTH * 0.04} color="#10B981" />
                                    <Text style={[styles.adminText, { color: theme?.primary || '#10B981' }]}>
                                        {request.reviewer_name || 'Admin'}: {request.admin_comment}
                                    </Text>
                                </View>
                            )}
                        </View>
                    ))
                )}
            </ScrollView>

            {/* 🚀 LARGER FULLSCREEN MODAL - 95% HEIGHT */}
            {showForm && (
                <Animated.View
                    style={[
                        styles.modalOverlay,
                        {
                            opacity: fadeAnim,
                        }
                    ]}
                >
                    <TouchableWithoutFeedback onPress={closeModal}>
                        <View style={styles.overlayTouchable} />
                    </TouchableWithoutFeedback>

                    <Animated.View
                        style={[
                            styles.modalContainer,
                            {
                                backgroundColor: theme?.background || '#fff',
                                transform: [{ translateY: slideAnim }]
                            }
                        ]}
                    >
                        {/* Premium Gradient Header */}
                        <View style={styles.modalGradientHeader}>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={closeModal}
                                activeOpacity={0.7}
                            >
                                <View style={styles.closeIconBg}>
                                    <Ionicons name="close-outline" size={SCREEN_WIDTH * 0.07} color="#FFFFFF" />
                                </View>
                            </TouchableOpacity>
                            <View style={styles.modalHeaderContent}>
                                <View style={styles.modalIconContainer}>
                                    <Ionicons name="calendar-edit-outline" size={SCREEN_WIDTH * 0.08} color="#FFFFFF" />
                                </View>
                                <Text style={styles.modalTitle}>New Leave Request</Text>
                            </View>
                        </View>

                        <ScrollView
                            style={styles.formScroll}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            {/* Leave Type Selection */}
                            <Text style={[styles.formLabel, { color: theme?.text || '#111827' }]}>
                                Leave Type *
                            </Text>
                            <View style={styles.chipContainer}>
                                {leaveTypes.map((type) => (
                                    <TouchableOpacity
                                        key={type}
                                        style={[
                                            styles.chip,
                                            formData.leave_type === type && styles.chipActive
                                        ]}
                                        onPress={() => setFormData({ ...formData, leave_type: type })}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[
                                            styles.chipText,
                                            formData.leave_type === type && styles.chipTextActive
                                        ]}>
                                            {type}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Date Inputs */}
                            <Text style={[styles.formLabel, { color: theme?.text || '#111827' }]}>
                                Date Range *
                            </Text>
                            <View style={styles.dateInputsContainer}>
                                <TextInput
                                    style={[
                                        styles.dateInput,
                                        {
                                            backgroundColor: theme?.card || '#F9FAFB',
                                            color: theme?.text || '#111827'
                                        }
                                    ]}
                                    placeholder="Start Date (YYYY-MM-DD)"
                                    placeholderTextColor="#9CA3AF"
                                    value={formData.start_date}
                                    onChangeText={(text) => setFormData({ ...formData, start_date: text })}
                                />
                                <View style={styles.dateArrow}>
                                    <Ionicons name="arrow-forward" size={20} color="#10B981" />
                                </View>
                                <TextInput
                                    style={[
                                        styles.dateInput,
                                        {
                                            backgroundColor: theme?.card || '#F9FAFB',
                                            color: theme?.text || '#111827'
                                        }
                                    ]}
                                    placeholder="End Date (YYYY-MM-DD)"
                                    placeholderTextColor="#9CA3AF"
                                    value={formData.end_date}
                                    onChangeText={(text) => setFormData({ ...formData, end_date: text })}
                                />
                            </View>

                            {/* Reason */}
                            <Text style={[styles.formLabel, { color: theme?.text || '#111827' }]}>
                                Reason (optional)
                            </Text>
                            <TextInput
                                style={[
                                    styles.textArea,
                                    {
                                        backgroundColor: theme?.card || '#F9FAFB',
                                        color: theme?.text || '#111827'
                                    }
                                ]}
                                placeholder="Enter reason for leave..."
                                placeholderTextColor="#9CA3AF"
                                value={formData.reason}
                                onChangeText={(text) => setFormData({ ...formData, reason: text })}
                                multiline
                                textAlignVertical="top"
                            />

                            {/* Submit Button */}
                            <TouchableOpacity
                                style={[
                                    styles.submitButton,
                                    {
                                        backgroundColor: '#10B981',
                                        opacity: loading ? 0.7 : 1
                                    }
                                ]}
                                onPress={handleSubmit}
                                disabled={loading}
                                activeOpacity={0.85}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <>
                                        <Ionicons name="send-outline" size={20} color="#fff" />
                                        <Text style={styles.submitButtonText}>Submit Request</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </Animated.View>
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    // ... (keep all existing styles exactly the same until modalContainer)

    // FIXED: LARGER MODAL - 95% SCREEN HEIGHT
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.65)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SCREEN_WIDTH * 0.03,
    },
    overlayTouchable: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    modalContainer: {
        width: '100%',
        height: SCREEN_HEIGHT * 0.95,  // 🚀 95% FULLSCREEN
        borderRadius: SCREEN_WIDTH * 0.065,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -12 },
        shadowOpacity: 0.35,
        shadowRadius: 24,
        elevation: 24,
    },

    // NEW: Premium Gradient Header
    modalGradientHeader: {
        height: SCREEN_HEIGHT * 0.18,
        backgroundColor: '#10B981',
        paddingTop: Platform.OS === 'ios' ? SCREEN_HEIGHT * 0.06 : SCREEN_HEIGHT * 0.05,
        paddingHorizontal: SCREEN_WIDTH * 0.05,
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    closeButton: {
        position: 'absolute',
        top: SCREEN_HEIGHT * 0.055,
        left: SCREEN_WIDTH * 0.04,
        padding: SCREEN_WIDTH * 0.015,
        zIndex: 10,
    },
    closeIconBg: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        backdropFilter: 'blur(10px)',
    },
    modalHeaderContent: {
        flex: 1,
        alignItems: 'center',
        marginLeft: SCREEN_WIDTH * 0.02,
    },
    modalIconContainer: {
        width: SCREEN_WIDTH * 0.16,
        height: SCREEN_WIDTH * 0.16,
        borderRadius: SCREEN_WIDTH * 0.08,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SCREEN_HEIGHT * 0.008,
    },
    modalTitle: {
        fontSize: Math.min(SCREEN_WIDTH * 0.06, 24),
        fontWeight: '900',
        color: '#FFFFFF',
        lineHeight: Math.min(SCREEN_WIDTH * 0.072, 29),
        textAlign: 'center',
    },

    // Enhanced Form Styles
    formScroll: {
        flex: 1,
    },
    formLabel: {
        fontSize: Math.min(SCREEN_WIDTH * 0.042, 17),
        fontWeight: '800',
        marginBottom: SCREEN_HEIGHT * 0.012,
        lineHeight: Math.min(SCREEN_WIDTH * 0.052, 21),
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SCREEN_WIDTH * 0.03,
        marginBottom: SCREEN_HEIGHT * 0.03,
    },
    chip: {
        flex: 1,
        paddingVertical: SCREEN_HEIGHT * 0.016,
        paddingHorizontal: SCREEN_WIDTH * 0.05,
        borderRadius: SCREEN_WIDTH * 0.06,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        backgroundColor: '#F9FAFB',
        minWidth: SCREEN_WIDTH * 0.22,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    chipActive: {
        backgroundColor: '#10B981',
        borderColor: '#10B981',
        shadowColor: '#10B981',
        shadowOpacity: 0.3,
        elevation: 8,
    },
    chipText: {
        fontSize: Math.min(SCREEN_WIDTH * 0.04, 16),
        fontWeight: '800',
        color: '#374151',
    },
    chipTextActive: {
        color: '#FFFFFF',
    },
    dateInputsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SCREEN_WIDTH * 0.035,
        marginBottom: SCREEN_HEIGHT * 0.03,
    },
    dateInput: {
        flex: 1,
        borderRadius: SCREEN_WIDTH * 0.04,
        paddingHorizontal: SCREEN_WIDTH * 0.048,
        paddingVertical: SCREEN_HEIGHT * 0.018,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        fontSize: Math.min(SCREEN_WIDTH * 0.04, 16),
        minHeight: 60,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    dateArrow: {
        paddingHorizontal: 8,
        paddingVertical: 20,
    },
    textArea: {
        borderRadius: SCREEN_WIDTH * 0.04,
        paddingHorizontal: SCREEN_WIDTH * 0.048,
        paddingVertical: SCREEN_HEIGHT * 0.018,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        fontSize: Math.min(SCREEN_WIDTH * 0.04, 16),
        height: SCREEN_HEIGHT * 0.18,
        textAlignVertical: 'top',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 6,
        marginBottom: SCREEN_HEIGHT * 0.035,
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SCREEN_HEIGHT * 0.025,
        borderRadius: SCREEN_WIDTH * 0.04,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 12,
        marginBottom: SCREEN_HEIGHT * 0.04,
        minHeight: 64,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: Math.min(SCREEN_WIDTH * 0.048, 19),
        fontWeight: '900',
        marginLeft: SCREEN_WIDTH * 0.02,
    },

    // ... (keep all other existing styles unchanged)
});

const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
        case 'approved': return '#10B981';
        case 'rejected': return '#EF4444';
        default: return '#F59E0B';
    }
};

const getStatusBgColor = (status) => {
    switch (status?.toLowerCase()) {
        case 'approved': return '#10B98115';
        case 'rejected': return '#EF444415';
        default: return '#F59E0B15';
    }
};

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });
};
