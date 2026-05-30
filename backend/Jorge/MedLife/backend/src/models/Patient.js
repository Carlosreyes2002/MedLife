const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Patient = sequelize.define('Patient', {
  id:      { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name:    { type: DataTypes.STRING, allowNull: false },
  dob:     { type: DataTypes.DATEONLY, allowNull: false },
  phone:   { type: DataTypes.STRING },
  address: { type: DataTypes.STRING },
  email:   { type: DataTypes.STRING },
});

module.exports = Patient;
