require('dotenv').config();

const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db');
const getSequelize = sequelize.getSequelize || (() => sequelize);
const { seedDefaultUsers } = require('./utils/seed');

require('./models/User');
require('./models/Patient');
require('./models/Appointment');
require('./models/Diagnosis');

const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patientRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const diagnosisRoutes = require('./routes/diagnoses');
const userRoutes = require('./routes/userRoutes');

const app = express();

app.use(cors());
app.use(express.json());

const getConfigErrors = () => {
  const errors = [];

  if (!process.env.JWT_SECRET) {
    errors.push('JWT_SECRET no está configurado');
  }

  if (!process.env.DATABASE_URL) {
    const required = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
    required.forEach((key) => {
      if (!process.env[key]) errors.push(`${key} no está configurado`);
    });
  }

  return errors;
};

app.get('/', (req, res) => {
  const configErrors = getConfigErrors();
  res.json({
    status: 'MedLife API running',
    configErrors: configErrors.length ? configErrors : undefined,
  });
});

app.get('/api/health', async (req, res) => {
  const configErrors = getConfigErrors();
  if (configErrors.length) {
    return res.status(503).json({ ok: false, configErrors });
  }

  try {
    await getSequelize().authenticate();
    res.json({ ok: true, database: 'connected' });
  } catch (error) {
    res.status(503).json({
      ok: false,
      message: 'No se pudo conectar a la base de datos',
      detail: error.message,
    });
  }
});

let dbInitPromise = null;

const initDatabase = () => {
  if (!dbInitPromise) {
    dbInitPromise = (async () => {
      const configErrors = getConfigErrors();
      if (configErrors.length) {
        throw new Error(configErrors.join(', '));
      }

      await getSequelize().authenticate();
      await getSequelize().sync({ alter: !process.env.VERCEL });
      await seedDefaultUsers();
    })().catch((error) => {
      dbInitPromise = null;
      console.error('Error al inicializar la base de datos:', error);
      throw error;
    });
  }

  return dbInitPromise;
};

app.use(async (req, res, next) => {
  if (req.path === '/' || req.path === '/api/health') {
    return next();
  }

  try {
    await initDatabase();
    next();
  } catch (error) {
    res.status(503).json({
      message: 'Base de datos no disponible',
      detail: error.message,
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/diagnoses', diagnosisRoutes);
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en puerto ${PORT}`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

module.exports = app;

if (!process.env.VERCEL) {
  startServer();
}
