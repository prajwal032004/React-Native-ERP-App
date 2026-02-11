import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { messageService } from '../../services/messageService';
import Toast from 'react-native-toast-message';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function MessagesScreen() {
    const { theme } = useTheme();
    const [messages, setMessages] = useState([]);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [messageLoading, setMessageLoading] = useState(null);

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        try {
            setLoading(true);
            const response = await messageService.getMessages();

            if (Array.isArray(response.data.messages)) {
                setMessages(response.data.messages);
            } else {
                setMessages([]);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to load messages',
            });
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (messageId) => {
        try {
            setMessageLoading(messageId);
            await messageService.markAsRead(messageId);

            setMessages(messages.map(msg =>
                msg.id === messageId ? { ...msg, is_read: true } : msg
            ));
        } catch (error) {
            console.error('Mark as read error:', error);
        } finally {
            setMessageLoading(null);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme?.background || '#f8f9fa' }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#10B981" />
                    <Text style={styles.loadingText}>Loading messages...</Text>
                </View>
            </View>
        );
    }

    const MessageListItem = ({ msg, isSelected }) => (
        <TouchableOpacity
            style={[
                styles.messageItem,
                isSelected && styles.messageItemSelected,
                {
                    backgroundColor: isSelected ? '#F0FDF4' : 'transparent',
                    borderLeftColor: isSelected ? '#10B981' : 'transparent'
                }
            ]}
            onPress={() => {
                setSelectedMessage(msg);
                if (!msg.is_read) {
                    markAsRead(msg.id);
                }
            }}
            activeOpacity={0.7}
        >
            <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                    <Ionicons name="person" size={20} color="#10B981" />
                </View>
            </View>

            <View style={styles.messageContent}>
                <View style={styles.messageHeader}>
                    <Text style={[
                        styles.senderName,
                        { color: theme?.text || '#111827' }
                    ]}>
                        {msg.sender_name}
                    </Text>
                    <Text style={styles.messageTime}>
                        {new Date(msg.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                        })}
                    </Text>
                </View>

                <Text style={[
                    styles.subjectText,
                    { color: theme?.text || '#111827' }
                ]} numberOfLines={1}>
                    {msg.subject}
                </Text>

                <Text style={[
                    styles.previewText,
                    { color: theme?.textSecondary || '#6B7280' }
                ]} numberOfLines={2}>
                    {msg.content?.substring(0, 60)}...
                </Text>
            </View>

            {!msg.is_read && (
                <View style={styles.unreadIndicator}>
                    {messageLoading === msg.id ? (
                        <ActivityIndicator size="small" color="#10B981" />
                    ) : (
                        <View style={styles.unreadDot} />
                    )}
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme?.background || '#f8f9fa' }]}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={[
                        styles.headerTitle,
                        { color: theme?.text || '#111827' }
                    ]}>
                        📧 Messages
                    </Text>
                    <Text style={[
                        styles.headerSubtitle,
                        { color: theme?.textSecondary || '#6B7280' }
                    ]}>
                        {messages.length} new message{messages.length !== 1 ? 's' : ''}
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={fetchMessages}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="refresh-outline" size={22} color="#10B981" />
                </TouchableOpacity>
            </View>

            {selectedMessage ? (
                // Message Detail - FULL SCREEN READING MODE
                <View style={styles.detailContainer}>
                    {/* Back Header */}
                    <View style={styles.detailHeader}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => setSelectedMessage(null)}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="arrow-back" size={24} color="#10B981" />
                        </TouchableOpacity>
                        <View style={styles.detailHeaderContent}>
                            <Text style={[
                                styles.detailTitle,
                                { color: theme?.text || '#111827' }
                            ]}>
                                {selectedMessage.subject}
                            </Text>
                            <Text style={[
                                styles.detailSender,
                                { color: theme?.textSecondary || '#6B7280' }
                            ]}>
                                {selectedMessage.sender_name}
                            </Text>
                        </View>
                    </View>

                    {/* Message Content */}
                    <ScrollView
                        style={styles.detailScroll}
                        contentContainerStyle={styles.detailContent}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.messageCard}>
                            <View style={styles.messageMeta}>
                                <View style={styles.messageAvatarLarge}>
                                    <Ionicons name="person" size={28} color="#10B981" />
                                </View>
                                <View style={styles.messageMetaText}>
                                    <Text style={[
                                        styles.messageCardSender,
                                        { color: theme?.text || '#111827' }
                                    ]}>
                                        {selectedMessage.sender_name}
                                    </Text>
                                    <Text style={[
                                        styles.messageCardDate,
                                        { color: theme?.textSecondary || '#6B7280' }
                                    ]}>
                                        {new Date(selectedMessage.created_at).toLocaleString('en-US', {
                                            weekday: 'short',
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </Text>
                                </View>
                            </View>

                            <Text style={[
                                styles.messageCardTitle,
                                { color: theme?.text || '#111827' }
                            ]}>
                                {selectedMessage.subject}
                            </Text>

                            <Text style={[
                                styles.messageContentText,
                                { color: theme?.text || '#374151' }
                            ]}>
                                {selectedMessage.content}
                            </Text>

                            <View style={styles.messageStatus}>
                                <Ionicons
                                    name={selectedMessage.is_read ? "checkmark-done" : "time-outline"}
                                    size={20}
                                    color="#10B981"
                                />
                                <Text style={[
                                    styles.messageStatusText,
                                    { color: theme?.textSecondary || '#6B7280' }
                                ]}>
                                    {selectedMessage.is_read ? 'Read' : 'Marking as read...'}
                                </Text>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            ) : (
                // Messages List
                <ScrollView
                    style={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                >
                    {messages.length === 0 ? (
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIconContainer}>
                                <Ionicons name="mail-outline" size={80} color="#D1D5DB" />
                            </View>
                            <Text style={[
                                styles.emptyTitle,
                                { color: theme?.text || '#111827' }
                            ]}>
                                No messages yet
                            </Text>
                            <Text style={[
                                styles.emptySubtitle,
                                { color: theme?.textSecondary || '#6B7280' }
                            ]}>
                                Messages from your supervisors will appear here when they send you updates
                            </Text>
                        </View>
                    ) : (
                        messages.map((msg) => (
                            <MessageListItem
                                key={msg.id}
                                msg={msg}
                                isSelected={selectedMessage?.id === msg.id}
                            />
                        ))
                    )}
                </ScrollView>
            )}
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
        paddingHorizontal: 20,
        paddingVertical: 18,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        lineHeight: 26,
    },
    headerSubtitle: {
        fontSize: 14,
        fontWeight: '500',
        marginTop: 2,
    },
    refreshButton: {
        padding: 10,
    },

    listContainer: {
        flex: 1,
    },
    listContent: {
        padding: 8,
    },
    messageItem: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 18,
        borderRadius: 16,
        marginHorizontal: 8,
        marginBottom: 12,
        borderLeftWidth: 4,
        alignItems: 'center',
        backgroundColor: '#fff',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
    },
    messageItemSelected: {
        borderLeftWidth: 5,
        elevation: 4,
        shadowOpacity: 0.12,
    },
    avatarContainer: {
        marginRight: 16,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#ECFDF5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    messageContent: {
        flex: 1,
        paddingRight: 12,
    },
    messageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 6,
    },
    senderName: {
        fontSize: 16,
        fontWeight: '700',
        lineHeight: 20,
    },
    messageTime: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    subjectText: {
        fontSize: 15,
        fontWeight: '600',
        lineHeight: 20,
        marginBottom: 2,
    },
    previewText: {
        fontSize: 14,
        lineHeight: 18,
    },
    unreadIndicator: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#ECFDF5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#10B981',
    },

    detailContainer: {
        flex: 1,
    },
    detailHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        elevation: 2,
    },
    backButton: {
        padding: 8,
        marginRight: 16,
        borderRadius: 12,
    },
    detailHeaderContent: {
        flex: 1,
    },
    detailTitle: {
        fontSize: 18,
        fontWeight: '800',
        lineHeight: 24,
        marginBottom: 2,
    },
    detailSender: {
        fontSize: 15,
        fontWeight: '600',
    },
    detailScroll: {
        flex: 1,
    },
    detailContent: {
        padding: 24,
        paddingBottom: 40,
    },
    messageCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 28,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
    },
    messageMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    messageAvatarLarge: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#ECFDF5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    messageMetaText: {
        flex: 1,
    },
    messageCardSender: {
        fontSize: 17,
        fontWeight: '800',
        marginBottom: 4,
    },
    messageCardDate: {
        fontSize: 14,
        fontWeight: '500',
    },
    messageCardTitle: {
        fontSize: 20,
        fontWeight: '800',
        lineHeight: 26,
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    messageContentText: {
        fontSize: 16,
        lineHeight: 24,
        paddingVertical: 12,
    },
    messageStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    messageStatusText: {
        fontSize: 15,
        fontWeight: '600',
    },

    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingTop: 60,
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: '800',
        lineHeight: 28,
        textAlign: 'center',
        marginBottom: 12,
    },
    emptySubtitle: {
        fontSize: 16,
        lineHeight: 22,
        textAlign: 'center',
        opacity: 0.8,
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
        textAlign: 'center',
    },
});
