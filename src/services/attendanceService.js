import api from '../config/api';

export const attendanceService = {
    getAttendance: () => {
        return api.get('/api/intern/attendance');
    },

    markCheckIn: (location = '') => {
        return api.post('/api/intern/attendance/mark', { location });
    },

    markCheckOut: () => {
        return api.post('/api/intern/attendance/checkout');
    },
};