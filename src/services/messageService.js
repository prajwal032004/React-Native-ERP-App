import api from '../config/api';

export const messageService = {
    getMessages: () => {
        return api.get('/api/intern/messages');
    },

    sendMessage: (recipientId, subject, content, parentId = null) => {
        return api.post('/api/intern/send-message', {
            recipient_id: recipientId,
            subject,
            content,
            parent_id: parentId,
        });
    },

    markAsRead: (messageId) => {
        return api.post(`/api/intern/message/${messageId}/read`);
    },
};