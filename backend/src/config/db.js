const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelizeInstance = null;

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

const createSequelize = () => {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (databaseUrl) {
    if (!/^postgres(ql)?:\/\//i.test(databaseUrl)) {
      throw new Error(
        'DATABASE_URL inválida. Copia la connection string completa de Neon (postgresql://...)'
      );
    }

    return new Sequelize(databaseUrl, {
      dialect: 'postgres',
      logging: false,
      pool,
      dialectOptions: { ssl: sslOptions },
    });
  }

  const { DB_NAME, DB_USER, DB_PASSWORD, DB_HOST } = process.env;

  if (DB_NAME && DB_USER && DB_PASSWORD && DB_HOST) {
    return new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
      host: DB_HOST,
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: false,
      pool,
      dialectOptions: isServerless ? { ssl: sslOptions } : {},
    });
  }

  // Permite arrancar la app y responder /api/health aunque falte configuración.
  return new Sequelize('postgres://localhost:5432/placeholder', {
    dialect: 'postgres',
    logging: false,
    pool: { max: 1, min: 0 },
  });
};

const getSequelize = () => {
  if (!sequelizeInstance) {
    sequelizeInstance = createSequelize();
  }
  return sequelizeInstance;
};

module.exports = new Proxy(
  {},
  {
    get(_target, prop) {
      const sequelize = getSequelize();
      const value = sequelize[prop];
      return typeof value === 'function' ? value.bind(sequelize) : value;
    },
  }
);

module.exports.getSequelize = getSequelize;
