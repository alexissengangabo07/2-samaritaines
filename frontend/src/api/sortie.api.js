import API from './axios';

// Obtenir la liste de toutes les sorties internes
export const getSorties = () => API.get('/sorties');

// Obtenir les détails d'une sortie spécifique par son ID
export const getSortieById = (id) => API.get(`/sorties/${id}`);

// Enregistrer une nouvelle sortie interne (multi-produits)
export const createSortie = (data) => API.post('/sorties', data);

// Récupérer les statistiques globales et calculs par service
export const getSortieStats = () => API.get('/sorties/stats/summary');

// Supprimer une sortie (si la suppression est gérée côté backend)
export const deleteSortie = (id) => API.delete(`/sorties/${id}`);