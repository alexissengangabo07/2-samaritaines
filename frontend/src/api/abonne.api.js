import api from './axios'; // adaptez le nom de votre instance axios si différent

export const getAbonnes = (params = {}) => api.get('/abonnes', { params });
export const getAbonneById = (id) => api.get(`/abonnes/${id}`);
export const createAbonne = (data) => api.post('/abonnes', data);
export const updateAbonne = (id, data) => api.put(`/abonnes/${id}`, data);
export const deleteAbonne = (id) => api.delete(`/abonnes/${id}`);