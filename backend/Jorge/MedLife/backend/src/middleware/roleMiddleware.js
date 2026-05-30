const requireRole = (...roles) => (req, res, next) => {
  if (!req.user?.role || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'No tienes permiso para realizar esta acción' });
  }
  next();
};

module.exports = { requireRole };
