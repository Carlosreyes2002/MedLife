const handleError = (res, error) => {
  console.error(error);
  res.status(500).json({ message: 'Error interno' });
};

module.exports = { handleError };
