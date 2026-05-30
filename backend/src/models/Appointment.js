const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Patient = require('./Patient');
const User = require('./User');

const Appointment = sequelize.define('Appointment', {
  id:     { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  date:   { type: DataTypes.DATE, allowNull: false },
  reason: { type: DataTypes.STRING },
  status: {
    type: DataTypes.ENUM('scheduled', 'completed', 'cancelled'),
    defaultValue: 'scheduled',
  },
});

Appointment.belongsTo(Patient, { foreignKey: 'patient_id' });
Appointment.belongsTo(User, { foreignKey: 'doctor_id', as: 'doctor' });

module.exports = Appointment;
