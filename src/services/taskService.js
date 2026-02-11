import api from '../config/api';

export const taskService = {
    getTasks: (status = 'all') => {
        return api.get('/api/intern/tasks', { params: { status } });
    },

    submitTask: (taskId, content, fileData = null, fileType = 'other') => {
        return api.post('/api/intern/submit', {
            task_id: taskId,
            content,
            file_data: fileData,
            file_type: fileType,
        });
    },

    getSubmissions: (status = 'all') => {
        return api.get('/api/intern/submissions', { params: { status } });
    },
};