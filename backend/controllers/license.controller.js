const { estExpire, DATE_EXPIRATION } = require('../config/license');

// Route publique : renvoie l'état de la licence calculé par le serveur.
// Ne nécessite aucune authentification, car elle doit être accessible
// même quand l'utilisateur n'est pas connecté (page /expired, écran de login).
exports.getStatus = (req, res) => {
  res.status(200).json({
    expire: estExpire(),
    dateExpiration: DATE_EXPIRATION.toISOString()
  });
};