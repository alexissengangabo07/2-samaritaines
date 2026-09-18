const jwt = require('jsonwebtoken');

// Clé secrète JWT (à placer idéalement dans un fichier .env)
const JWT_SECRET = process.env.JWT_SECRET || 'votre_cle_secrete_super_securisee';

// Middleware pour vérifier la validité du Token JWT
exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  // Format attendu: "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Accès refusé. Aucun token fourni." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Injecte les infos de l'utilisateur (id, role) dans la requête
    next();
  } catch (error) {
    return res.status(403).json({ message: "Token invalide ou expiré." });
  }
};

// Middleware optionnel pour restreindre l'accès à certains rôles
exports.authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: "Accès refusé. Vous n'avez pas les autorisations nécessaires." 
      });
    }
    next();
  };
};