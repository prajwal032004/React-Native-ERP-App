import api from '../config/api';

export const goalService = {
    getGoals: () => {
        return api.get('/api/intern/goals');
    },

    createGoal: (title, description, targetDate) => {
        return api.post('/api/intern/goals', {
            title,
            description,
            target_date: targetDate,
        });
    },

    updateGoal: (goalId, progress, status) => {
        return api.put(`/api/intern/goal/${goalId}`, {
            progress,
            status,
        });
    },
};