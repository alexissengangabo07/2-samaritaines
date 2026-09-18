module.exports = (err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Une erreur interne est survenue",
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
};