import api from '../config/api';

export const certificateService = {
    getCertificates: () => {
        return api.get('/api/intern/certificates');
    },

    getCertificate: (certId) => {
        return api.get(`/api/certificate/${certId}`);
    },

    verifyCertificate: (code) => {
        return api.get(`/api/verify/certificate/${code}`);
    },
};