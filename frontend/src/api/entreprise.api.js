import api from './axios'; // adaptez le nom de votre instance axios si différent

export const getEntreprises = (params = {}) => api.get('/entreprises', { params });
export const getEntrepriseById = (id) => api.get(`/entreprises/${id}`);
export const createEntreprise = (data) => api.post('/entreprises', data);
export const updateEntreprise = (id, data) => api.put(`/entreprises/${id}`, data);
export const deleteEntreprise = (id) => api.delete(`/entreprises/${id}`);