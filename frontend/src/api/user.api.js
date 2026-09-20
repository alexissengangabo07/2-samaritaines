import API from './axios';

// Obtenir la liste de tous les utilisateurs
export const getUsers = () => API.get('/users');

// Obtenir un utilisateur par son ID
export const getUserById = (id) => API.get(`/users/${id}`);

// Créer un nouvel utilisateur
export const createUser = (data) => API.post('/users', data);

// Modifier un utilisateur
export const updateUser = (id, data) => API.put(`/users/${id}`, data);

// Supprimer un utilisateur
export const deleteUser = (id) => API.delete(`/users/${id}`);