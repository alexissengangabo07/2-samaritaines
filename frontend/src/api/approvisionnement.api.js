import API from './axios';

export const getApprovisionnements = () => API.get('/approvisionnements');
export const createApprovisionnement = (data) => API.post('/approvisionnements', data);
export const deleteApprovisionnement = (id) => API.delete(`/approvisionnements/${id}`);