const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Suscripcion = sequelize.define('Suscripcion', {
  empresa_id: { type: DataTypes.INTEGER, allowNull: false },
  plan_id: { type: DataTypes.INTEGER },
  fecha_inicio: { type: DataTypes.DATEONLY, allowNull: false },
  fecha_fin: { type: DataTypes.DATEONLY, allowNull: false },
  estado: {
    type: DataTypes.ENUM('activa', 'inactiva', 'cancelada'),
    allowNull: false
  }
}, {
  tableName: 'suscripciones',
  timestamps: false
});

module.exports = Suscripcion;
