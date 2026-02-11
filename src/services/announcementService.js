// services/announcementService.js
import api from '../config/api';

export const announcementService = {
    getAnnouncements: async () => {
        try {
            const response = await api.get('/api/intern/announcements');
            return response.data;
        } catch (error) {
            console.error('Announcement fetch error:', error);
            throw error;
        }
    }
};
