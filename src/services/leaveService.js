import api from '../config/api';

export const leaveService = {
    getLeaveRequests: () => {
        return api.get('/api/intern/leave');
    },

    applyLeave: (leaveType, startDate, endDate, reason) => {
        return api.post('/api/intern/leave', {
            leave_type: leaveType,
            start_date: startDate,
            end_date: endDate,
            reason,
        });
    },
};