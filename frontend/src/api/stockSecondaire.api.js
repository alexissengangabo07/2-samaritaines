import API from "./axios";

// Récupérer le stock secondaire disponible
export const getStockSecondaire = () => API.get("/stock-secondaire");

// Récupérer la liste des factures des patients internés en cours
export const getFacturesInternes = () => API.get("/stock-secondaire/internes");

// Première admission / facturation d'un patient interné
export const facturerInterné = (data) =>
  API.post("/stock-secondaire/facturer", data);

// Ajouter de nouveaux médicaments consommés (J+1, J+2...) à la facture d'un patient
export const ajouterArticlesInterne = (id, data) =>
  API.post(`/stock-secondaire/facturer-plus/${id}`, data);
