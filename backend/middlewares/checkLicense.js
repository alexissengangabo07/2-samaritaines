const { estExpire, DATE_EXPIRATION } = require('../config/license');

// Bloque toute requête si la date d'expiration est dépassée.
// Placé APRÈS l'authentification pour aussi couper l'accès aux sessions déjà ouvertes.
module.exports = function checkLicense(req, res, next) {
  if (estExpire()) {
    return res.status(403).json({
      code: 'LICENSE_EXPIRED',
      message: `L'accès à cette application a expiré le ${DATE_EXPIRATION.toLocaleDateString('fr-FR')}. Veuillez contacter l'administrateur.`
    });
  }
  next();
};