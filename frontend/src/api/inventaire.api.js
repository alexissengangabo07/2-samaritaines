import axios from './axios'; // Votre instance Axios configurée

export const getInventaires = () => axios.get('/inventaires');
export const getInventaireById = (id) => axios.get(`/inventaires/${id}`);
export const createInventaire = (data) => axios.post('/inventaires', data);