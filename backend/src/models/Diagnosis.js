const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Patient = require('./Patient');
const User = require('./User');

const Diagnosis = sequelize.define('Diagnosis', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  chief_complaint: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'description',
  },
  diagnosis: { type: DataTypes.TEXT, allowNull: false },
  treatment: { type: DataTypes.TEXT, allowNull: false },
  medications: { type: DataTypes.TEXT },
  next_appointment: { type: DataTypes.DATEONLY },
  notes: { type: DataTypes.TEXT },
  date: { type: DataTypes.DATEONLY, allowNull: false },
});

Diagnosis.belongsTo(Patient, { foreignKey: 'patient_id' });
Diagnosis.belongsTo(User, { foreignKey: 'doctor_id', as: 'doctor' });

module.exports = Diagnosis;
