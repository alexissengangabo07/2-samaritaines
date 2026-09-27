import API from './axios';

export const getVentes = () => API.get('/ventes');
export const getVenteById = (id) => API.get(`/ventes/${id}`);
export const createVente = (data) => API.post('/ventes', data);
export const deleteVente = (id) => API.delete(`/ventes/${id}`);
export const addItemsToVente = (id, payload) => API.post(`/ventes/${id}/items`, payload);
export const getVentesCredit = () => API.get('/ventes/credit');
export const addPaiement = (data) => API.post('/ventes/paiements', data);