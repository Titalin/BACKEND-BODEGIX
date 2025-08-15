const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Empresa = sequelize.define('Empresa', {
  nombre: { type: DataTypes.STRING, allowNull: false, unique: true },
  telefono: { type: DataTypes.STRING },
  direccion: { type: DataTypes.STRING },
}, {
  tableName: 'empresas',
  timestamps: false
});

module.exports = Empresa;
