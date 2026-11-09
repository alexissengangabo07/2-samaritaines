import { createContext, useState, useEffect, useContext } from "react";
import API from "../api/axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Initialisation paresseuse : on récupère l'utilisateur et le token directement depuis le localStorage au démarrage
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          // Vérification silencieuse en arrière-plan
          const res = await API.get("/users/me");
          setUser(res.data);
          localStorage.setItem("user", JSON.stringify(res.data)); // Mise à jour du cache local
        } catch (err) {
          console.error("Session expirée ou invalide", err);
          // Sécurité : on ne déconnecte que si le serveur renvoie explicitement une erreur d'authentification (401/403)
          // Cela évite de déconnecter l'utilisateur en cas de simple coupure réseau temporaire
          if (
            err.response &&
            (err.response.status === 401 || err.response.status === 403)
          ) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setUser(null);
          }
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await API.post("/users/login", { email, password });
    const { token, user: userData } = res.data;

    // Sauvegarde sécurisée du token et de l'utilisateur dans le stockage local
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);

    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500 font-medium">
              Chargement de la session...
            </p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
