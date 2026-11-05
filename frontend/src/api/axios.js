import axios from "axios";

// Liste des URLs à tester par ordre de priorité
const SERVEURS = ["http://192.168.0.150:5000/api", "http://localhost:5000/api"];

let activeBaseURL = SERVEURS[0]; // Par défaut, on tente l'IP fixe du poste serveur

const API = axios.create({
  baseURL: activeBaseURL,
  timeout: 4000, // Timeout court (4 secondes) pour éviter de figer l'application si le réseau est coupé
});

// Intercepteur pour ajouter le token JWT à chaque requête
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // S'assure d'utiliser l'URL active du moment
    config.baseURL = activeBaseURL;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Intercepteur de réponse pour gérer la bascule automatique (Fallback)
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si l'erreur est liée à une coupure réseau / timeout / serveur injoignable (ERR_CONNECTION_REFUSED, timeout, etc.)
    // et qu'on n'a pas encore essayé le fallback sur localhost
    if (
      (!error.response ||
        error.code === "ECONNABORTED" ||
        error.message.includes("Network Error")) &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      // Si on était sur l'IP du point d'accès, on bascule sur localhost
      if (activeBaseURL === SERVEURS[0]) {
        console.warn(
          "Point d'accès ou IP 192.168.0.150 inaccessible. Bascule sur localhost...",
        );
        activeBaseURL = SERVEURS[1];
        originalRequest.baseURL = activeBaseURL;

        // Relance la requête avec la nouvelle URL de secours
        return API(originalRequest);
      }
    }

    if (error.response?.data?.code === "LICENSE_EXPIRED") {
      window.location.href = "/expired";
    }

    return Promise.reject(error);
  },
);

export default API;
