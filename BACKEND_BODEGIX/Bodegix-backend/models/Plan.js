const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Plan = sequelize.define('Plan', {
  nombre: { type: DataTypes.STRING, allowNull: false, unique: true },
  limite_usuarios: { type: DataTypes.INTEGER, allowNull: false },
  costo: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  lockers: { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName: 'planes',
  timestamps: false
});

module.exports = Plan;
