const { Sequelize } = require('sequelize');
require('dotenv').config();

const isServerless = Boolean(process.env.VERCEL);

const pool = {
  max: isServerless ? 1 : 5,
  min: 0,
  acquire: 30000,
  idle: 10000,
};

const sslOptions = {
  require: true,
  rejectUnauthorized: false,
};

const buildSequelize = () => {
  if (process.env.DATABASE_URL) {
    return new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
      pool,
      dialectOptions: { ssl: sslOptions },
    });
  }

  return new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: false,
      pool,
      dialectOptions: isServerless ? { ssl: sslOptions } : {},
    }
  );
};

const sequelize = buildSequelize();

module.exports = sequelize;
