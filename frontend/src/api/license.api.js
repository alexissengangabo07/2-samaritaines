import API from './axios';

// Cette requête doit fonctionner même si la licence a expiré
// (elle sert justement à le détecter), donc pas de gestion d'erreur
// spécifique ici — le composant appelant gère les cas.
export const getLicenseStatus = () => API.get('/license/status');