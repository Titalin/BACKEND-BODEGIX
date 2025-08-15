const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Rol = sequelize.define('Rol', {
    rol: { type: DataTypes.STRING, allowNull: false, unique: true },
}, { tableName: 'roles', timestamps: false });

module.exports = Rol;
