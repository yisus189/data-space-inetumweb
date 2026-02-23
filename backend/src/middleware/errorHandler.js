function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  if (res.headersSent) {
    return next(err);
  }

  const isCorsDenied = err && err.message === 'Origen no permitido por CORS';
  const status = err.status || (isCorsDenied ? 403 : 500);
  const message = err.message || 'Error interno del servidor';

  res.status(status).json({ error: message });
}

module.exports = errorHandler;
