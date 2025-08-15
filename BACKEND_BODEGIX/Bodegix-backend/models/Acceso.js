const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Acceso = sequelize.define('Acceso', {
    usuario_id: { type: DataTypes.INTEGER, allowNull: false },
    fecha: { type: DataTypes.DATE, allowNull: false },
    accion: { type: DataTypes.STRING, allowNull: false },
}, { tableName: 'accesos', timestamps: false });
module.exports = Acceso;