require('dotenv').config();

const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db');

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

const dbReady = sequelize
  .sync({ alter: process.env.NODE_ENV !== 'production' })
  .catch((error) => {
    console.error('Error al conectar la base de datos:', error);
    throw error;
  });

app.use(async (req, res, next) => {
  try {
    await dbReady;
    next();
  } catch (error) {
    res.status(503).json({ message: 'Base de datos no disponible' });
  }
});

app.get('/', (req, res) => {
  res.json({ status: 'MedLife API running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/diagnoses', diagnosisRoutes);
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await dbReady;
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
