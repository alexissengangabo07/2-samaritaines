import API from './axios';

export const getFournisseurs = () => API.get('/fournisseurs');
export const createFournisseur = (data) => API.post('/fournisseurs', data);
export const updateFournisseur = (id, data) => API.put(`/fournisseurs/${id}`, data);
export const deleteFournisseur = (id) => API.delete(`/fournisseurs/${id}`);