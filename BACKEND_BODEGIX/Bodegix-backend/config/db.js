// config/db.js
const { Sequelize } = require('sequelize');
const fs = require('fs');
require('dotenv').config();

// Carga CA de Aiven (recomendado)
let ssl = undefined;
try {
  const ca = fs.readFileSync('/etc/secrets/ca.pem');
  // SNI explícito ayuda con algunos proxies
  ssl = { ca, servername: process.env.DB_HOST };
  console.log('🔐 SSL con CA cargado');
} catch (e) {
  console.warn('⚠️ No se encontró /etc/secrets/ca.pem, usando TLS laxo');
  // fallback laxo (no ideal en producción)
  ssl = { rejectUnauthorized: false, minVersion: 'TLSv1.2' };
}

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    dialectModule: require('mysql2'),
    logging: false,
    timezone: process.env.DB_TIMEZONE || '+00:00',
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },

    // Pasa las opciones tal cual a mysql2
    dialectOptions: {
      ssl,
      connectTimeout: 15000, // 15s; evita colgarse demasiado
    },
  }
);

module.exports = sequelize;
