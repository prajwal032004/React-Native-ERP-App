// screens/AnnouncementsScreen.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    Dimensions,
    RefreshControl,
    Modal,
    Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { announcementService } from '../../services/announcementService';
import Toast from 'react-native-toast-message';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function AnnouncementsScreen() {
    const { theme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [announcements, setAnnouncements] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const response = await announcementService.getAnnouncements();
            setAnnouncements(response.announcements || []);
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to load announcements'
            });
            setAnnouncements([]);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchAnnouncements();
        setRefreshing(false);
    };

    const getPriorityColor = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'high': return '#EF4444';
            case 'medium': return '#F59E0B';
            case 'low': return '#10B981';
            default: return '#6B7280';
        }
    };

    const getPriorityBgColor = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'high': return '#FEE2E2';
            case 'medium': return '#FEF3C7';
            case 'low': return '#D1FAE5';
            default: return '#E5E7EB';
        }
    };

    const openModal = (announcement) => {
        console.log('Opening modal for:', announcement.title);
        setSelectedAnnouncement(announcement);
        setModalVisible(true);
    };

    const closeModal = () => {
        console.log('Closing modal');
        setModalVisible(false);
        setTimeout(() => setSelectedAnnouncement(null), 300);
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme?.background || '#f8f9fa' }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#10B981" />
                    <Text style={styles.loadingText}>Loading announcements...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme?.background || '#f8f9fa' }]}>
            <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#10B981"
                        colors={['#10B981']}
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={[styles.headerTitle, { color: theme?.text || '#111827' }]}>
                            📢 Announcements
                        </Text>
                        <Text style={[styles.headerSubtitle, { color: theme?.textSecondary || '#6B7280' }]}>
                            {announcements.length} active announcement{announcements.length !== 1 ? 's' : ''}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.refreshButton}
                        onPress={fetchAnnouncements}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="refresh-outline" size={24} color="#10B981" />
                    </TouchableOpacity>
                </View>

                {/* Announcements List */}
                {announcements.length === 0 ? (
                    <View style={styles.emptyState}>
                        <View style={[styles.emptyIconContainer, { backgroundColor: '#F3F4F6' }]}>
                            <Ionicons name="megaphone-outline" size={64} color="#D1D5DB" />
                        </View>
                        <Text style={[styles.emptyTitle, { color: theme?.text || '#111827' }]}>
                            No announcements
                        </Text>
                        <Text style={[styles.emptySubtitle, { color: theme?.textSecondary || '#6B7280' }]}>
                            Stay tuned for company updates and important news
                        </Text>
                    </View>
                ) : (
                    announcements.map((announcement, index) => (
                        <TouchableOpacity
                            key={announcement.id || index}
                            style={[
                                styles.announcementCard,
                                {
                                    backgroundColor: theme?.card || '#fff',
                                    borderLeftColor: getPriorityColor(announcement.priority)
                                }
                            ]}
                            activeOpacity={0.7}
                            onPress={() => openModal(announcement)}
                        >
                            {/* Priority Badge */}
                            <View style={[
                                styles.priorityBadge,
                                {
                                    backgroundColor: getPriorityBgColor(announcement.priority),
                                }
                            ]}>
                                <Text style={[
                                    styles.priorityText,
                                    { color: getPriorityColor(announcement.priority) }
                                ]}>
                                    {announcement.priority?.toUpperCase() || 'MEDIUM'}
                                </Text>
                            </View>

                            {/* Header */}
                            <View style={styles.announcementHeader}>
                                <Ionicons name="megaphone" size={24} color="#10B981" />
                                <View style={styles.headerContent}>
                                    <Text style={[styles.announcementTitle, { color: theme?.text || '#111827' }]} numberOfLines={2}>
                                        {announcement.title}
                                    </Text>
                                    <Text style={[styles.createdBy, { color: theme?.textSecondary || '#6B7280' }]}>
                                        by {announcement.created_by_name} • {new Date(announcement.created_at).toLocaleDateString()}
                                    </Text>
                                </View>
                            </View>

                            {/* Content Preview */}
                            <Text style={[styles.announcementContent, { color: theme?.text || '#374151' }]} numberOfLines={3}>
                                {announcement.content}
                            </Text>

                            {/* View More Button */}
                            <View style={styles.viewMoreButton}>
                                <Text style={styles.viewMoreText}>View Full Message</Text>
                                <Ionicons name="arrow-forward" size={16} color="#10B981" />
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>

            {/* Announcement Detail Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={closeModal}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={closeModal}
                >
                    <Pressable
                        style={[styles.modalContainer, { backgroundColor: theme?.card || '#fff' }]}
                        onPress={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <View style={styles.modalHeader}>
                            <View style={styles.modalHeaderLeft}>
                                <Ionicons name="megaphone" size={28} color="#10B981" />
                                <Text style={[styles.modalHeaderTitle, { color: theme?.text || '#111827' }]}>
                                    Announcement
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={closeModal}
                                style={styles.closeButton}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons name="close-circle" size={32} color={theme?.textSecondary || '#6B7280'} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            style={styles.modalScroll}
                            contentContainerStyle={styles.modalScrollContent}
                            showsVerticalScrollIndicator={false}
                        >
                            {selectedAnnouncement && (
                                <>
                                    {/* Priority Badge */}
                                    <View style={[
                                        styles.modalPriorityBadge,
                                        {
                                            backgroundColor: getPriorityBgColor(selectedAnnouncement.priority),
                                        }
                                    ]}>
                                        <Text style={[
                                            styles.modalPriorityText,
                                            { color: getPriorityColor(selectedAnnouncement.priority) }
                                        ]}>
                                            {selectedAnnouncement.priority?.toUpperCase() || 'MEDIUM'} PRIORITY
                                        </Text>
                                    </View>

                                    {/* Title */}
                                    <Text style={[styles.modalTitle, { color: theme?.text || '#111827' }]}>
                                        {selectedAnnouncement.title}
                                    </Text>

                                    {/* Meta Info */}
                                    <View style={styles.metaContainer}>
                                        <View style={styles.metaRow}>
                                            <Ionicons name="person-outline" size={18} color={theme?.textSecondary || '#6B7280'} />
                                            <Text style={[styles.metaText, { color: theme?.textSecondary || '#6B7280' }]}>
                                                {selectedAnnouncement.created_by_name}
                                            </Text>
                                        </View>
                                        <View style={styles.metaRow}>
                                            <Ionicons name="calendar-outline" size={18} color={theme?.textSecondary || '#6B7280'} />
                                            <Text style={[styles.metaText, { color: theme?.textSecondary || '#6B7280' }]}>
                                                {new Date(selectedAnnouncement.created_at).toLocaleDateString('en-US', {
                                                    month: 'long',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Divider */}
                                    <View style={styles.divider} />

                                    {/* Full Content */}
                                    <Text style={[styles.fullContent, { color: theme?.text || '#374151' }]}>
                                        {selectedAnnouncement.content}
                                    </Text>

                                    {/* Expiry Info */}
                                    {selectedAnnouncement.expires_at && (
                                        <View style={[styles.expiryContainer, { backgroundColor: getPriorityBgColor('low') }]}>
                                            <Ionicons name="time-outline" size={20} color="#10B981" />
                                            <Text style={[styles.expiryText, { color: '#10B981' }]}>
                                                Expires on {new Date(selectedAnnouncement.expires_at).toLocaleDateString('en-US', {
                                                    month: 'long',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </Text>
                                        </View>
                                    )}
                                </>
                            )}
                        </ScrollView>

                        {/* Close Button */}
                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.closeButtonBottom}
                                onPress={closeModal}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.closeButtonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 28,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '900',
        lineHeight: 32,
    },
    headerSubtitle: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 4,
    },
    refreshButton: {
        padding: 12,
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
    },
    announcementCard: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        borderLeftWidth: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
        position: 'relative',
    },
    priorityBadge: {
        position: 'absolute',
        top: 16,
        right: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        minWidth: 80,
        alignItems: 'center',
    },
    priorityText: {
        fontSize: 11,
        fontWeight: '800',
        textAlign: 'center',
    },
    announcementHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 12,
    },
    headerContent: {
        flex: 1,
        paddingRight: 80,
    },
    announcementTitle: {
        fontSize: 18,
        fontWeight: '800',
        lineHeight: 24,
        marginBottom: 4,
    },
    createdBy: {
        fontSize: 13,
        fontWeight: '500',
    },
    announcementContent: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 12,
    },
    viewMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        marginTop: 4,
    },
    viewMoreText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#10B981',
        marginRight: 4,
    },
    emptyState: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 80,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: '900',
        lineHeight: 28,
        textAlign: 'center',
        marginBottom: 12,
    },
    emptySubtitle: {
        fontSize: 16,
        lineHeight: 22,
        textAlign: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 60,
    },
    loadingText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
        marginTop: 16,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        maxHeight: SCREEN_HEIGHT * 0.9,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    modalHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    modalHeaderTitle: {
        fontSize: 20,
        fontWeight: '800',
    },
    closeButton: {
        padding: 4,
    },
    modalScroll: {
        flex: 1,
    },
    modalScrollContent: {
        padding: 24,
        paddingBottom: 32,
    },
    modalPriorityBadge: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 24,
        alignSelf: 'flex-start',
        marginBottom: 20,
    },
    modalPriorityText: {
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '900',
        lineHeight: 32,
        marginBottom: 20,
    },
    metaContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 20,
        marginBottom: 20,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    metaText: {
        fontSize: 14,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 20,
    },
    fullContent: {
        fontSize: 16,
        lineHeight: 26,
        marginBottom: 20,
    },
    expiryContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        borderRadius: 16,
        marginTop: 12,
    },
    expiryText: {
        fontSize: 14,
        fontWeight: '700',
    },
    modalFooter: {
        padding: 24,
        paddingBottom: 32,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    closeButtonBottom: {
        backgroundColor: '#10B981',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    closeButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '800',
    },
});