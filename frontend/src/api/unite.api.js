import API from './axios';

export const getUnites = () => API.get('/unites');
export const createUnite = (data) => API.post('/unites', data);
export const deleteUnite = (id) => API.delete(`/unites/${id}`);