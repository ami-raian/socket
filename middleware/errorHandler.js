const errorHandler = (err, req, res, next) => {
  console.error(`[error] ${req.method} ${req.path} —`, err.message);

  const status  = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({ success: false, message });
};

module.exports = errorHandler;
